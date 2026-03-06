import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: only allow cron/admin calls with shared secret
    const cronSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== Deno.env.get("CRON_SECRET")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all bundle users
    const { data: bundleUsers } = await supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("has_bundle", true)
      .eq("is_active", true);

    if (!bundleUsers || bundleUsers.length === 0) {
      return new Response(JSON.stringify({ generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let generated = 0;

    for (const { user_id } of bundleUsers) {
      const notifications: Array<{
        user_id: string;
        notification_type: string;
        source_app: string;
        title_es: string;
        title_en: string;
        message_es: string;
        message_en: string;
        emoji: string;
        action_tool: string | null;
      }> = [];

      // Check 1: No focus sessions in last 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const { count: recentFocus } = await supabase
        .from("financial_focus_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("created_at", threeDaysAgo);

      if (recentFocus === 0) {
        // Check we haven't sent this recently
        const { count: existing } = await supabase
          .from("ecosystem_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id)
          .eq("notification_type", "focus_reminder")
          .gte("created_at", threeDaysAgo);

        if (existing === 0) {
          notifications.push({
            user_id,
            notification_type: "focus_reminder",
            source_app: "evofinz",
            title_es: "¿Necesitas enfocarte?",
            title_en: "Need to focus?",
            message_es:
              "Llevas 3 días sin sesiones de enfoque. Una sesión corta puede mejorar tu claridad financiera.",
            message_en:
              "You haven't focused in 3 days. A short session can improve your financial clarity.",
            emoji: "⏱️",
            action_tool: "focus-timer",
          });
        }
      }

      // Check 2: Spending spike — expenses this week vs last week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const [thisWeekRes, lastWeekRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user_id)
          .is("deleted_at", null)
          .gte("date", startOfWeek.toISOString().slice(0, 10)),
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user_id)
          .is("deleted_at", null)
          .gte("date", startOfLastWeek.toISOString().slice(0, 10))
          .lt("date", startOfWeek.toISOString().slice(0, 10)),
      ]);

      const thisWeekTotal = (thisWeekRes.data || []).reduce(
        (a, e) => a + (e.amount || 0),
        0
      );
      const lastWeekTotal = (lastWeekRes.data || []).reduce(
        (a, e) => a + (e.amount || 0),
        0
      );

      if (lastWeekTotal > 0 && thisWeekTotal > lastWeekTotal * 1.3) {
        const { count: existing } = await supabase
          .from("ecosystem_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id)
          .eq("notification_type", "spending_spike")
          .gte("created_at", startOfWeek.toISOString());

        if (existing === 0) {
          const pct = Math.round(
            ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
          );
          notifications.push({
            user_id,
            notification_type: "spending_spike",
            source_app: "evofinz",
            title_es: "📈 Gasto en aumento",
            title_en: "📈 Spending increase",
            message_es: `Tu gasto esta semana es ${pct}% mayor que la anterior. Considera una sesión de respiración para tomar mejores decisiones.`,
            message_en: `Your spending this week is ${pct}% higher than last week. Consider a breathing session for better decisions.`,
            emoji: "💸",
            action_tool: "breathing",
          });
        }
      }

      // Check 3: Streak milestone
      const { data: streak } = await supabase
        .from("ecosystem_streaks")
        .select("current_streak")
        .eq("user_id", user_id)
        .maybeSingle();

      if (streak && [7, 14, 30].includes(streak.current_streak)) {
        const { count: existing } = await supabase
          .from("ecosystem_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user_id)
          .eq("notification_type", `streak_${streak.current_streak}`)
          .gte("created_at", threeDaysAgo);

        if (existing === 0) {
          notifications.push({
            user_id,
            notification_type: `streak_${streak.current_streak}`,
            source_app: "evofinz",
            title_es: `🔥 ¡Racha de ${streak.current_streak} días!`,
            title_en: `🔥 ${streak.current_streak}-day streak!`,
            message_es: `Increíble. Llevas ${streak.current_streak} días activo en el ecosistema. ¡Sigue así!`,
            message_en: `Amazing. You've been active for ${streak.current_streak} days in the ecosystem. Keep going!`,
            emoji: "🔥",
            action_tool: null,
          });
        }
      }

      // Insert all notifications for this user
      if (notifications.length > 0) {
        await supabase.from("ecosystem_notifications").insert(notifications);
        generated += notifications.length;
      }
    }

    return new Response(JSON.stringify({ generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
