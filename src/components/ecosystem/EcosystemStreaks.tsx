import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, differenceInCalendarDays } from 'date-fns';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

/**
 * Shared streaks tracker — tracks combined activity across EvoFinz + Fokuspark.
 * A "combined day" = any day where the user logged expenses/income AND had a focus session.
 */
export const EcosystemStreaks = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEs = language === 'es';

  // Fetch/compute streak data
  const { data: streakData, isLoading, isError, refetch } = useQuery({
    queryKey: ['ecosystem-streaks', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get stored streak
      const { data: stored } = await supabase
        .from('ecosystem_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Compute this week's activity
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekStartIso = weekStart.toISOString();

      const [expensesDays, focusDays] = await Promise.all([
        supabase.from('expenses').select('date')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', weekStartStr),
        supabase.from('financial_focus_sessions').select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', weekStartIso),
      ]);

      const financeDaySet = new Set(
        (expensesDays.data || []).map(e => e.date)
      );
      const focusDaySet = new Set(
        (focusDays.data || []).map(f => format(new Date(f.created_at), 'yyyy-MM-dd'))
      );

      // Combined days = intersection
      const combinedDays = [...financeDaySet].filter(d => focusDaySet.has(d)).length;

      const today = format(new Date(), 'yyyy-MM-dd');
      const hadActivityToday = financeDaySet.has(today) || focusDaySet.has(today);

      // Calculate streak
      let currentStreak = stored?.current_streak || 0;
      let bestStreak = stored?.best_streak || 0;
      const lastActivity = stored?.last_activity_date;

      if (hadActivityToday && lastActivity !== today) {
        if (lastActivity) {
          const daysSinceLast = differenceInCalendarDays(new Date(today), new Date(lastActivity));
          if (daysSinceLast === 1) {
            currentStreak += 1;
          } else if (daysSinceLast > 1) {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (!hadActivityToday && lastActivity) {
        const daysSinceLast = differenceInCalendarDays(new Date(today), new Date(lastActivity));
        if (daysSinceLast > 1) {
          currentStreak = 0;
        }
      }

      return {
        currentStreak,
        bestStreak,
        focusDaysThisWeek: focusDaySet.size,
        financeDaysThisWeek: financeDaySet.size,
        combinedDaysThisWeek: combinedDays,
        hadActivityToday,
        lastActivity: hadActivityToday ? today : lastActivity,
        needsUpdate: hadActivityToday && lastActivity !== today,
      };
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 5,
  });

  // Persist streak updates
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !streakData?.needsUpdate) return;
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: existing } = await supabase
        .from('ecosystem_streaks')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('ecosystem_streaks')
          .update({
            current_streak: streakData.currentStreak,
            best_streak: streakData.bestStreak,
            last_activity_date: today,
            focus_days_this_week: streakData.focusDaysThisWeek,
            finance_days_this_week: streakData.financeDaysThisWeek,
            combined_days_this_week: streakData.combinedDaysThisWeek,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase.from('ecosystem_streaks')
          .insert({
            user_id: user.id,
            current_streak: streakData.currentStreak,
            best_streak: streakData.bestStreak,
            last_activity_date: today,
            focus_days_this_week: streakData.focusDaysThisWeek,
            finance_days_this_week: streakData.financeDaysThisWeek,
            combined_days_this_week: streakData.combinedDaysThisWeek,
          });
      }
    },
  });

  useEffect(() => {
    if (streakData?.needsUpdate) {
      updateMutation.mutate();
    }
  }, [streakData?.needsUpdate]);

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={() => refetch()} compact />;
  if (isLoading || !streakData) return null;

  // Week dots (Mon-Sun)
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const focusActive = i < streakData.focusDaysThisWeek;
    const financeActive = i < streakData.financeDaysThisWeek;
    const combined = i < streakData.combinedDaysThisWeek;
    return { focusActive, financeActive, combined };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            {isEs ? 'Racha del Ecosistema' : 'Ecosystem Streak'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4">
            {/* Current streak */}
            <div className="text-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-foreground">{streakData.currentStreak}</span>
                <span className="text-[10px] text-muted-foreground">{isEs ? 'días' : 'days'}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{isEs ? 'Racha actual' : 'Current'}</p>
            </div>

            {/* Best streak */}
            <div className="text-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-amber-500">{streakData.bestStreak}</span>
                <span className="text-[9px] text-muted-foreground">🏆</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{isEs ? 'Mejor' : 'Best'}</p>
            </div>

            {/* This week summary */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-foreground">{streakData.focusDaysThisWeek}d {isEs ? 'enfoque' : 'focus'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] text-foreground">{streakData.financeDaysThisWeek}d {isEs ? 'finanzas' : 'finance'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-3 w-3 text-orange-500" />
                <span className="text-[10px] text-foreground">{streakData.combinedDaysThisWeek}d {isEs ? 'combo' : 'combo'}</span>
              </div>
            </div>
          </div>

          {/* Week progress bar */}
          <div className="flex gap-1 mt-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={`h-2 rounded-full ${
                  weekDots[i].combined
                    ? 'bg-gradient-to-r from-primary to-orange-500'
                    : weekDots[i].focusActive || weekDots[i].financeActive
                    ? 'bg-primary/40'
                    : 'bg-muted'
                }`} />
                <span className="text-[8px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemStreaks.displayName = 'EcosystemStreaks';
