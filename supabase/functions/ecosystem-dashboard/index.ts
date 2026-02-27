import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { language = "es" } = await req.json().catch(() => ({}));
    const userId = user.id;
    const now = new Date();

    // Date boundaries
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const weekStart = getWeekStart(now);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const oneMonthStr = oneMonthAgo.toISOString().slice(0, 10);
    const twoMonthStr = twoMonthsAgo.toISOString().slice(0, 10);
    const threeMonthStr = threeMonthsAgo.toISOString().slice(0, 10);
    const sixMonthStr = sixMonthsAgo.toISOString().slice(0, 10);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekStartIso = weekStart.toISOString();
    const lastWeekIso = lastWeekStart.toISOString();

    // Fire ALL queries in parallel (single round-trip to DB)
    const [
      expensesRecent,
      expensesOlder,
      expensesSixMonth,
      incomeRecent,
      focusRecent,
      focusOlder,
      focusSixMonth,
      focusThisWeek,
      focusLastWeek,
      worriesRecent,
      worriesOlder,
      worriesSixMonth,
      worriesThisWeek,
      journalRecent,
      habitsThisWeek,
      streakRow,
      notifications,
      expensesThisWeek,
      expensesLastWeek,
      focusThreeMonth,
      worriesThreeMonth,
    ] = await Promise.all([
      // Recent expenses (1 month)
      supabase
        .from("expenses")
        .select("amount, category, date")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("date", oneMonthStr),
      // Older expenses (1-2 months)
      supabase
        .from("expenses")
        .select("amount, category")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("date", twoMonthStr)
        .lt("date", oneMonthStr),
      // 6 month expenses
      supabase
        .from("expenses")
        .select("date, amount")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("date", sixMonthStr),
      // Recent income
      supabase
        .from("income")
        .select("amount")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("date", oneMonthStr),
      // Focus sessions (1 month)
      supabase
        .from("financial_focus_sessions")
        .select("duration_minutes, created_at")
        .eq("user_id", userId)
        .gte("created_at", oneMonthAgo.toISOString()),
      // Focus sessions (1-2 months)
      supabase
        .from("financial_focus_sessions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .gte("created_at", twoMonthsAgo.toISOString())
        .lt("created_at", oneMonthAgo.toISOString()),
      // Focus sessions 6 months
      supabase
        .from("financial_focus_sessions")
        .select("created_at, duration_minutes")
        .eq("user_id", userId)
        .gte("created_at", sixMonthsAgo.toISOString()),
      // Focus this week
      supabase
        .from("financial_focus_sessions")
        .select("duration_minutes, created_at")
        .eq("user_id", userId)
        .gte("created_at", weekStartIso),
      // Focus last week
      supabase
        .from("financial_focus_sessions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .gte("created_at", lastWeekIso)
        .lt("created_at", weekStartIso),
      // Worries recent (1 month)
      supabase
        .from("financial_worry_entries")
        .select("id, released, worry_category, created_at")
        .eq("user_id", userId)
        .gte("created_at", oneMonthAgo.toISOString()),
      // Worries older (1-2 months)
      supabase
        .from("financial_worry_entries")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", twoMonthsAgo.toISOString())
        .lt("created_at", oneMonthAgo.toISOString()),
      // Worries 6 months
      supabase
        .from("financial_worry_entries")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", sixMonthsAgo.toISOString()),
      // Worries this week
      supabase
        .from("financial_worry_entries")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", weekStartIso),
      // Journal entries (1 month)
      supabase
        .from("financial_journal")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", oneMonthAgo.toISOString()),
      // Habits this week
      supabase
        .from("financial_habit_logs")
        .select("id")
        .eq("user_id", userId)
        .gte("completed_at", weekStartIso),
      // Stored streak
      supabase
        .from("ecosystem_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      // Notifications
      supabase
        .from("ecosystem_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      // Expenses this week
      supabase
        .from("expenses")
        .select("amount, date")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("date", weekStartStr),
      // Expenses last week
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("date", lastWeekStart.toISOString().slice(0, 10))
        .lt("date", weekStartStr),
      // Focus 3 months (for achievements)
      supabase
        .from("financial_focus_sessions")
        .select("duration_minutes, created_at")
        .eq("user_id", userId)
        .gte("created_at", threeMonthsAgo.toISOString()),
      // Worries 3 months (for achievements)
      supabase
        .from("financial_worry_entries")
        .select("id, released")
        .eq("user_id", userId)
        .gte("created_at", threeMonthsAgo.toISOString()),
    ]);

    // === COMPUTE ALL DERIVED DATA ===

    const recentExpenseData = expensesRecent.data || [];
    const olderExpenseData = expensesOlder.data || [];
    const incomeData = incomeRecent.data || [];
    const focusRecentData = focusRecent.data || [];
    const focusOlderData = focusOlder.data || [];
    const worriesRecentData = worriesRecent.data || [];
    const worriesOlderData = worriesOlder.data || [];

    const totalExpenses = recentExpenseData.reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const olderTotalExpenses = olderExpenseData.reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const totalIncome = incomeData.reduce((a: number, i: any) => a + (i.amount || 0), 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const focusMinutes = focusRecentData.reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const olderFocusMin = focusOlderData.reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const worryCount = worriesRecentData.length;
    const olderWorryCount = worriesOlderData.length;
    const journalCount = (journalRecent.data || []).length;
    const habitsCount = (habitsThisWeek.data || []).length;
    const spendingChange = olderTotalExpenses > 0 ? ((totalExpenses - olderTotalExpenses) / olderTotalExpenses) * 100 : 0;

    // --- Health Score ---
    const savingsScore = Math.min(30, Math.max(0, savingsRate));
    const focusScore = Math.min(25, (focusMinutes / 120) * 25);
    let worryScore = 10;
    if (olderWorryCount > 0 && worryCount < olderWorryCount) worryScore = 20;
    else if (worryCount === 0 && olderWorryCount === 0) worryScore = 15;
    else if (worryCount > olderWorryCount) worryScore = Math.max(0, 10 - (worryCount - olderWorryCount) * 2);
    const expenseChange = totalExpenses > 0 && totalIncome > 0
      ? Math.abs(totalExpenses - totalIncome) / totalIncome : 0.5;
    const stabilityScore = Math.min(25, Math.max(0, (1 - expenseChange) * 25));
    const healthScore = Math.min(100, Math.max(0, Math.round(savingsScore + focusScore + worryScore + stabilityScore)));

    // --- Streaks ---
    const expensesDays = (expensesThisWeek.data || []).map((e: any) => e.date);
    const focusThisWeekData = focusThisWeek.data || [];
    const financeDaySet = new Set(expensesDays);
    const focusDaySet = new Set(
      focusThisWeekData.map((f: any) => (f.created_at || "").slice(0, 10))
    );
    const combinedDays = [...financeDaySet].filter((d) => focusDaySet.has(d)).length;
    const today = now.toISOString().slice(0, 10);
    const hadActivityToday = financeDaySet.has(today) || focusDaySet.has(today);
    const stored = streakRow.data;
    let currentStreak = stored?.current_streak || 0;
    let bestStreak = stored?.best_streak || 0;
    const lastActivity = stored?.last_activity_date;
    if (hadActivityToday && lastActivity !== today) {
      if (lastActivity) {
        const daysSince = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        currentStreak = daysSince === 1 ? currentStreak + 1 : 1;
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (!hadActivityToday && lastActivity) {
      const daysSince = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
      if (daysSince > 1) currentStreak = 0;
    }

    // --- Weekly Digest ---
    const focusMinutesThisWeek = focusThisWeekData.reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const focusMinutesLastWeek = (focusLastWeek.data || []).reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const worryCountThisWeek = (worriesThisWeek.data || []).length;
    const spendingThisWeek = (expensesThisWeek.data || []).reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const spendingLastWeek = (expensesLastWeek.data || []).reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const spendingDelta = spendingLastWeek > 0 ? ((spendingThisWeek - spendingLastWeek) / spendingLastWeek) * 100 : 0;

    // --- Insights (6 month chart) ---
    const months: Record<string, { focus: number; worries: number; expenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months[key] = { focus: 0, worries: 0, expenses: 0 };
    }
    (focusSixMonth.data || []).forEach((s: any) => {
      const key = (s.created_at || "").slice(0, 7);
      if (months[key]) months[key].focus += s.duration_minutes || 0;
    });
    (worriesSixMonth.data || []).forEach((w: any) => {
      const key = (w.created_at || "").slice(0, 7);
      if (months[key]) months[key].worries += 1;
    });
    (expensesSixMonth.data || []).forEach((e: any) => {
      const key = (e.date || "").slice(0, 7);
      if (months[key]) months[key].expenses += e.amount || 0;
    });
    const totalFocus6m = Object.values(months).reduce((a, b) => a + b.focus, 0);
    const totalWorries6m = Object.values(months).reduce((a, b) => a + b.worries, 0);
    const chartData = Object.entries(months).map(([key, v]) => ({
      month: key,
      focus: v.focus,
      expenses: Math.round(v.expenses),
    }));

    // --- Achievements ---
    const focus3mData = focusThreeMonth.data || [];
    const worries3mData = worriesThreeMonth.data || [];
    const totalFocusMinutes3m = focus3mData.reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const worriesReleased = worries3mData.filter((w: any) => w.released).length;

    // --- Top categories ---
    const catMap = new Map<string, number>();
    for (const e of recentExpenseData) {
      const cat = (e as any).category || "other";
      catMap.set(cat, (catMap.get(cat) || 0) + ((e as any).amount || 0));
    }
    const topCategories = [...catMap.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const result = {
      // Core financial
      totalIncome,
      totalExpenses,
      savingsRate,
      spendingChange,
      topCategories,

      // Focus
      focusMinutes,
      focusMinutesOlder: olderFocusMin,
      focusSessionCount: focusRecentData.length,

      // Worries
      worryCount,
      worryCountOlder: olderWorryCount,

      // Journal & habits
      journalCount,
      habitsThisWeek: habitsCount,

      // Health score
      healthScore,

      // Streaks
      streaks: {
        currentStreak,
        bestStreak,
        focusDaysThisWeek: focusDaySet.size,
        financeDaysThisWeek: financeDaySet.size,
        combinedDaysThisWeek: combinedDays,
        hadActivityToday,
        lastActivity: hadActivityToday ? today : lastActivity,
        needsUpdate: hadActivityToday && lastActivity !== today,
      },

      // Weekly digest
      weeklyDigest: {
        focusMinutes: focusMinutesThisWeek,
        focusMinutesLast: focusMinutesLastWeek,
        worryCount: worryCountThisWeek,
        spendingThis: spendingThisWeek,
        spendingDelta,
      },

      // 6-month insights
      insights: {
        totalFocus: totalFocus6m,
        totalWorries: totalWorries6m,
        chartData,
      },

      // Achievements stats
      achievements: {
        totalFocusMinutes: totalFocusMinutes3m,
        focusSessionCount: focus3mData.length,
        savingsRate,
        worriesReleased,
        totalWorries: worries3mData.length,
        journalEntries: journalCount,
        hasSavings: totalIncome > totalExpenses,
      },

      // Notifications
      notifications: notifications.data || [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ecosystem-dashboard error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
