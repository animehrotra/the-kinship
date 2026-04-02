import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find contacts whose next_nudge_at is today or overdue, not archived
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const { data: dueContacts, error } = await supabase
      .from("contacts")
      .select("id, name, user_id, next_nudge_at, circle")
      .eq("archived", false)
      .not("next_nudge_at", "is", null)
      .lte("next_nudge_at", `${today}T23:59:59.999Z`);

    if (error) throw error;
    if (!dueContacts || dueContacts.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user_id
    const byUser: Record<string, typeof dueContacts> = {};
    for (const c of dueContacts) {
      if (!byUser[c.user_id]) byUser[c.user_id] = [];
      byUser[c.user_id].push(c);
    }

    let totalSent = 0;

    for (const [userId, contacts] of Object.entries(byUser)) {
      const count = contacts.length;
      const names = contacts.slice(0, 3).map((c) => c.name);
      const title = `Kinship: ${count} nudge${count > 1 ? "s" : ""} due today`;
      const body =
        count <= 3
          ? `Time to reach out to ${names.join(", ")}`
          : `Time to reach out to ${names.join(", ")} and ${count - 3} more`;

      // Call send-push function
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          body,
          url: "/dashboard",
        }),
      });

      if (resp.ok) {
        const result = await resp.json();
        totalSent += result.sent || 0;
      }
    }

    return new Response(JSON.stringify({ processed: dueContacts.length, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-nudges error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
