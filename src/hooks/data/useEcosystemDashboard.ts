import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';

export interface EcosystemDashboardData {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  spendingChange: number;
  topCategories: { category: string; amount: number }[];
  focusMinutes: number;
  focusMinutesOlder: number;
  focusSessionCount: number;
  worryCount: number;
  worryCountOlder: number;
  journalCount: number;
  habitsThisWeek: number;
  healthScore: number;
  streaks: {
    currentStreak: number;
    bestStreak: number;
    focusDaysThisWeek: number;
    financeDaysThisWeek: number;
    combinedDaysThisWeek: number;
    hadActivityToday: boolean;
    lastActivity: string | null;
    needsUpdate: boolean;
  };
  weeklyDigest: {
    focusMinutes: number;
    focusMinutesLast: number;
    worryCount: number;
    spendingThis: number;
    spendingDelta: number;
  };
  insights: {
    totalFocus: number;
    totalWorries: number;
    chartData: { month: string; focus: number; expenses: number }[];
  };
  achievements: {
    totalFocusMinutes: number;
    focusSessionCount: number;
    savingsRate: number;
    worriesReleased: number;
    totalWorries: number;
    journalEntries: number;
    hasSavings: boolean;
  };
  notifications: any[];
}

export function useEcosystemDashboard() {
  const { user } = useAuth();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();

  const enabled = !!user?.id && hasBundleAccess && !flagsLoading && isEnabled('ecosystem_insights');

  const query = useQuery({
    queryKey: ['ecosystem-dashboard', user?.id],
    queryFn: async (): Promise<EcosystemDashboardData | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('ecosystem-dashboard', {
        body: { language: 'es' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    ...query,
    enabled,
  };
}
