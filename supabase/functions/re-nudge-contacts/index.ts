import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function localDate(instant: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch { return instant.toISOString().slice(0, 10); }
}
function daysBetween(a: string, b: string) {
  return Math.floor((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key || req.headers.get("Authorization") !== `Bearer ${key}`) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  try {
    const body = await req.json();
    if (typeof body.user_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(body.user_id)) return new Response(JSON.stringify({ error: "Invalid user" }), { status: 400, headers });
    const url = Deno.env.get("SUPABASE_URL");
    if (!url) throw new Error("Missing backend URL");
    const db = createClient(url, key);
    const { data: profile, error: profileError } = await db.from("profiles").select("notify_timezone").eq("id", body.user_id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return new Response(JSON.stringify({ renudged: 0 }), { headers });
    const timezone = profile.notify_timezone || "UTC";
    const today = localDate(new Date(), timezone);
    const { data: contacts, error } = await db.from("contacts")
      .select("id, name, next_nudge_at, renudge_count, last_nudged_at, last_notified_for_nudge_at")
      .eq("user_id", body.user_id).eq("archived", false).lt("renudge_count", 2)
      .not("next_nudge_at", "is", null).lte("next_nudge_at", new Date().toISOString());
    if (error) throw error;
    const names: string[] = [];
    for (const contact of contacts ?? []) {
      if (!contact.next_nudge_at || contact.last_notified_for_nudge_at !== contact.next_nudge_at) continue;
      const elapsed = daysBetween(localDate(new Date(contact.next_nudge_at), timezone), today);
      // Fixed schedule from the ORIGINAL due date; no daily repeat after a missed window.
      if (elapsed < (contact.renudge_count === 0 ? 14 : 42)) continue;
      if (contact.renudge_count === 1 && contact.last_nudged_at && daysBetween(localDate(new Date(contact.last_nudged_at), timezone), today) < 28) continue;
      if (contact.last_nudged_at && localDate(new Date(contact.last_nudged_at), timezone) === today) continue;
      const { data: claimed, error: claimError } = await db.rpc("claim_contact_nudge", {
        p_contact_id: contact.id, p_expected_at: contact.next_nudge_at,
        p_expected_count: contact.renudge_count, p_type: "renudged",
      });
      if (claimError) console.error("Repeat claim failed", claimError);
      if (claimed) names.push(contact.name);
    }
    if (names.length) {
      const count = names.length;
      const title = `Kinship: ${count} nudge${count > 1 ? "s" : ""} due today`;
      const body = `Time to reach out to ${names.slice(0, 3).join(", ")}${count > 3 ? ` and ${count - 3} more` : ""}`;
      const response = await fetch(`${url}/functions/v1/send-push`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ user_id: body.user_id, title, body, url: "/dashboard" }),
      });
      if (!response.ok) console.error("Repeat push failed", response.status);
    }
    console.log("Re-nudged contacts:", names.length);
    return new Response(JSON.stringify({ renudged: names.length }), { headers });
  } catch (error) {
    console.error("re-nudge-contacts error", error);
    return new Response(JSON.stringify({ error: "Repeat check failed" }), { status: 500, headers });
  }
});
