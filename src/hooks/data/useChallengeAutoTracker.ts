import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getWeekKey } from '@/lib/constants/mentorship-challenges';

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
  };
}

export function useChallengeAutoTracker() {
  const { user } = useAuth();
  const weekKey = getWeekKey();
  const { start, end } = useMemo(() => getWeekBounds(), [weekKey]);

  const { data: counts = {}, refetch } = useQuery({
    queryKey: ['challenge-auto-track', weekKey, user?.id],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!user?.id) return {};
      const results: Record<string, number> = {};

      // Journal entries this week
      const { count: journalCount } = await supabase
        .from('financial_journal')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', end);
      results['journal_entry'] = journalCount || 0;
      results['log_lesson'] = journalCount || 0;

      // Habits created this week
      const { count: habitsCreated } = await supabase
        .from('financial_habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', end);
      results['create_habit'] = habitsCreated || 0;

      // Habit logs this week (for streaks / daily habits)
      const { count: habitLogs } = await supabase
        .from('financial_habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('completed_at', start)
        .lte('completed_at', end);
      results['daily_habits'] = habitLogs || 0;
      results['daily_1percent'] = habitLogs || 0;
      results['habit_streak'] = habitLogs || 0;
      results['pay_yourself'] = habitLogs || 0;
      results['pay_first_log'] = habitLogs || 0;

      // Income entries this week
      const { count: incomeCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', end);
      results['log_income'] = incomeCount || 0;

      // Assets registered this week
      const { count: assetsCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', end);
      results['register_asset'] = assetsCount || 0;

      // Education resources
      const { count: eduCount } = await supabase
        .from('financial_education')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      results['complete_resource'] = eduCount || 0;

      // Education daily logs this week (reading sessions)
      const { count: readLogs } = await supabase
        .from('education_daily_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('log_date', start.split('T')[0])
        .lte('log_date', end.split('T')[0]);
      results['read_session'] = readLogs || 0;

      // Savings goals (SMART goals)
      const { count: goalsCount } = await supabase
        .from('financial_habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      results['create_smart_goal'] = goalsCount || 0;
      results['review_goals'] = goalsCount || 0;

      // Focus sessions this week
      const { count: focusCount } = await supabase
        .from('financial_focus_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('created_at', start)
        .lte('created_at', end);
      results['analyze_quadrant'] = focusCount || 0;
      results['freedom_plan'] = focusCount || 0;
      results['complete_7steps'] = focusCount || 0;

      // Debts classified (use expenses with category)
      results['classify_debt'] = assetsCount || 0;
      results['prioritize_task'] = habitLogs || 0;
      results['stack_habits'] = Math.min(habitsCreated || 0, 2);

      return results;
    },
    enabled: !!user?.id,
    staleTime: 60_000, // refresh every minute
    refetchInterval: 120_000,
  });

  return { counts, refetch };
}
