import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returns { hour: 0-23, weekday: 0-6 (Sun=0), dateISO: YYYY-MM-DD } in the given IANA timezone
function nowInTz(tz: string): { hour: number; weekday: number; dateISO: string } {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      weekday: "short",
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    const hour = parseInt(get("hour"), 10) % 24;
    const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekday = wdMap[get("weekday")] ?? 0;
    const dateISO = `${get("year")}-${get("month")}-${get("day")}`;
    return { hour, weekday, dateISO };
  } catch {
    const d = new Date();
    return {
      hour: d.getUTCHours(),
      weekday: d.getUTCDay(),
      dateISO: d.toISOString().slice(0, 10),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Pull all due/overdue contacts, grouped by user
    const todayUtc = new Date().toISOString().slice(0, 10);
    const { data: dueContacts, error } = await supabase
      .from("contacts")
      .select("id, name, user_id, next_nudge_at")
      .eq("archived", false)
      .not("next_nudge_at", "is", null)
      .lte("next_nudge_at", `${todayUtc}T23:59:59.999Z`);
    if (error) throw error;

    const byUser: Record<string, typeof dueContacts> = {};
    for (const c of dueContacts ?? []) {
      (byUser[c.user_id] ||= []).push(c);
    }

    // Load all preferences in one shot
    const userIds = Object.keys(byUser);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefsList } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", userIds);
    const prefsByUser = new Map((prefsList ?? []).map((p: any) => [p.user_id, p]));

    // Load emails
    const emailsByUser = new Map<string, string>();
    for (const uid of userIds) {
      const { data: u } = await supabase.auth.admin.getUserById(uid);
      if (u?.user?.email) emailsByUser.set(uid, u.user.email);
    }

    let pushSent = 0;
    let emailSent = 0;
    const summary: any[] = [];

    for (const userId of userIds) {
      const contacts = byUser[userId];
      const prefs = prefsByUser.get(userId) || {
        email_enabled: true,
        frequency: "daily",
        preferred_hour: 8,
        preferred_weekday: 1,
        timezone: "UTC",
        last_daily_sent_on: null,
        last_weekly_sent_on: null,
      };
      const { hour, weekday, dateISO } = nowInTz(prefs.timezone || "UTC");

      // ---- PUSH (existing behavior): send once a day at 08:00 local ----
      if (hour === 8) {
        const count = contacts.length;
        const names = contacts.slice(0, 3).map((c) => c.name);
        const title = `Kinship: ${count} nudge${count > 1 ? "s" : ""} due today`;
        const body =
          count <= 3
            ? `Time to reach out to ${names.join(", ")}`
            : `Time to reach out to ${names.join(", ")} and ${count - 3} more`;
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({ user_id: userId, title, body, url: "/dashboard" }),
        });
        if (resp.ok) pushSent += (await resp.json()).sent || 0;
      }

      // ---- EMAIL: only at user's preferred hour ----
      if (!prefs.email_enabled || hour !== prefs.preferred_hour) {
        summary.push({ userId, skipped: "hour-mismatch-or-disabled" });
        continue;
      }
      const recipient = emailsByUser.get(userId);
      if (!recipient) continue;

      let templateName: string | null = null;
      let lastSentField: "last_daily_sent_on" | "last_weekly_sent_on" | null = null;

      if (prefs.frequency === "daily") {
        if (prefs.last_daily_sent_on === dateISO) {
          summary.push({ userId, skipped: "already-sent-today" });
          continue;
        }
        templateName = "nudge-due-today";
        lastSentField = "last_daily_sent_on";
      } else {
        // weekly
        if (weekday !== prefs.preferred_weekday) continue;
        if (prefs.last_weekly_sent_on === dateISO) continue;
        templateName = "nudge-weekly-overdue";
        lastSentField = "last_weekly_sent_on";
      }

      const contactList = contacts.map((c) => ({ id: c.id, name: c.name }));
      const idempotencyKey = `${templateName}-${userId}-${dateISO}`;

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({
            templateName,
            recipientEmail: recipient,
            idempotencyKey,
            templateData: {
              count: contactList.length,
              contacts: contactList,
              appUrl: supabaseUrl.replace(/^https:\/\/[^.]+\./, "https://"),
            },
          }),
        });
        if (resp.ok) {
          emailSent += 1;
          await supabase
            .from("notification_preferences")
            .update({ [lastSentField!]: dateISO })
            .eq("user_id", userId);
        } else {
          summary.push({ userId, emailError: await resp.text() });
        }
      } catch (e) {
        summary.push({ userId, emailError: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ processed: dueContacts?.length ?? 0, pushSent, emailSent, summary }),
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
