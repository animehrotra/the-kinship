import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function localNow(timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = (key: string) => parts.find((part) => part.type === key)?.value ?? "";
    return { hour: Number(get("hour")) % 24, minute: Number(get("minute")), date: `${get("year")}-${get("month")}-${get("day")}` };
  } catch {
    return localNow("UTC");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key || req.headers.get("apikey") !== Deno.env.get("SUPABASE_ANON_KEY")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    if (!url) throw new Error("Missing backend URL");
    const db = createClient(url, key);
    const { data: profiles, error } = await db.from("profiles").select("id, notify_hour, notify_minute, notify_timezone, last_nudge_notified_on");
    if (error) throw error;
    let initial = 0;
    let repeated = 0;
    for (const profile of profiles ?? []) {
      const { hour, minute, date } = localNow(profile.notify_timezone || "UTC");
      const slot = (profile.notify_minute ?? 30) >= 30 ? 30 : 0;
      if (hour !== (profile.notify_hour ?? 8) || (minute >= 30 ? 30 : 0) !== slot) continue;
      // Repeat nudges are processed by the same scheduled invocation and at the same local time.
      const repeatResponse = await fetch(`${url}/functions/v1/re-nudge-contacts`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ user_id: profile.id }),
      });
      if (repeatResponse.ok) repeated += (await repeatResponse.json()).renudged ?? 0;
      else console.error("Repeat check failed", repeatResponse.status);

      if (profile.last_nudge_notified_on === date) continue;
      const { data: contacts, error: contactError } = await db.from("contacts")
        .select("id, name, next_nudge_at, last_notified_for_nudge_at, renudge_count")
        .eq("user_id", profile.id).eq("archived", false).not("next_nudge_at", "is", null)
        .lte("next_nudge_at", new Date().toISOString());
      if (contactError) { console.error("Initial check failed", contactError); continue; }
      const claimed: string[] = [];
      for (const contact of contacts ?? []) {
        if (contact.last_notified_for_nudge_at === contact.next_nudge_at) continue;
        const { data: didClaim, error: claimError } = await db.rpc("claim_contact_nudge", {
          p_contact_id: contact.id, p_expected_at: contact.next_nudge_at,
          p_expected_count: contact.renudge_count, p_type: "notified",
        });
        if (claimError) console.error("Initial claim failed", claimError);
        if (didClaim) claimed.push(contact.name);
      }
      if (!claimed.length) continue;
      const count = claimed.length;
      const names = claimed.slice(0, 3);
      const title = `Kinship: ${count} nudge${count > 1 ? "s" : ""} due today`;
      const body = `Time to reach out to ${names.join(", ")}${count > 3 ? ` and ${count - 3} more` : ""}`;
      const response = await fetch(`${url}/functions/v1/send-push`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ user_id: profile.id, title, body, url: "/dashboard" }),
      });
      if (!response.ok) console.error("Initial push failed", response.status);
      else {
        initial += count;
        await db.from("profiles").update({ last_nudge_notified_on: date }).eq("id", profile.id);
      }
    }
    return new Response(JSON.stringify({ initial, renudged: repeated }), { headers });
  } catch (error) {
    console.error("check-nudges error", error);
    return new Response(JSON.stringify({ error: "Notification check failed" }), { status: 500, headers });
  }
});
