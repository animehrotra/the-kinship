import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returns { hour, minute, date } in IANA tz for "now". Falls back to UTC on bad tz.
function localNow(timezone: string): { hour: number; minute: number; date: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const date = `${get("year")}-${get("month")}-${get("day")}`;
    const hourStr = get("hour");
    const hour = parseInt(hourStr === "24" ? "0" : hourStr, 10);
    const minute = parseInt(get("minute") || "0", 10);
    return { hour, minute, date };
  } catch {
    const d = new Date();
    return {
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      date: d.toISOString().slice(0, 10),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Pull all users with notification prefs. Push subs join filters to opted-in only.
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, notify_hour, notify_minute, notify_timezone, last_nudge_notified_on");
    if (profErr) throw profErr;

    let usersConsidered = 0;
    let usersDue = 0;
    let pushSent = 0;

    for (const p of profiles ?? []) {
      const tz = p.notify_timezone || "UTC";
      const { hour, minute, date } = localNow(tz);

      // Only fire within a 30-minute window of the user's preferred local time.
      // Cron runs every 30 min on the :00 / :30 — bucket "now" to the matching slot.
      const targetHour = p.notify_hour ?? 8;
      const targetMinute = (p.notify_minute ?? 30) >= 30 ? 30 : 0;
      const slotMinute = minute >= 30 ? 30 : 0;
      if (hour !== targetHour || slotMinute !== targetMinute) continue;
      usersConsidered++;

      // Dedupe — already notified today (in their local tz)?
      if (p.last_nudge_notified_on === date) continue;

      // Fetch contacts due today or earlier.
      const { data: dueContacts, error: contactsErr } = await supabase
        .from("contacts")
        .select("id, name, next_nudge_at")
        .eq("user_id", p.id)
        .eq("archived", false)
        .not("next_nudge_at", "is", null)
        .lte("next_nudge_at", `${date}T23:59:59.999Z`);
      if (contactsErr) {
        console.error(`contacts query failed for ${p.id}:`, contactsErr);
        continue;
      }
      if (!dueContacts || dueContacts.length === 0) continue;

      usersDue++;
      const count = dueContacts.length;
      const names = dueContacts.slice(0, 3).map((c) => c.name);
      const title = `Kinship: ${count} nudge${count > 1 ? "s" : ""} due today`;
      const body =
        count <= 3
          ? `Time to reach out to ${names.join(", ")}`
          : `Time to reach out to ${names.join(", ")} and ${count - 3} more`;

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ user_id: p.id, title, body, url: "/dashboard" }),
      });

      if (resp.ok) {
        const json = await resp.json();
        const sent = json.sent || 0;
        pushSent += sent;
        // Stamp dedupe regardless of subscription count — we don't want to retry next hour.
        await supabase
          .from("profiles")
          .update({ last_nudge_notified_on: date })
          .eq("id", p.id);
      }
    }

    return new Response(
      JSON.stringify({ usersConsidered, usersDue, pushSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("check-nudges error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
