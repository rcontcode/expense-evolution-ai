import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useEcosystemData } from '@/contexts/EcosystemContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

export const EcosystemStreaks = memo(() => {
  const { language } = useLanguage();
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const { data: dashData, isLoading, isError, refetch } = useEcosystemData();
  const isEs = language === 'es';

  const streakData = dashData?.streaks;

  // Persist streak updates
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !streakData?.needsUpdate) return;
      const today = new Date().toISOString().slice(0, 10);

      const { data: existing } = await supabase
        .from('ecosystem_streaks')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload = {
        current_streak: streakData.currentStreak,
        best_streak: streakData.bestStreak,
        last_activity_date: today,
        focus_days_this_week: streakData.focusDaysThisWeek,
        finance_days_this_week: streakData.financeDaysThisWeek,
        combined_days_this_week: streakData.combinedDaysThisWeek,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('ecosystem_streaks').update(payload).eq('user_id', user.id);
      } else {
        await supabase.from('ecosystem_streaks').insert({ user_id: user.id, ...payload });
      }
    },
  });

  useEffect(() => {
    if (streakData?.needsUpdate) {
      updateMutation.mutate();
    }
  }, [streakData?.needsUpdate]);

  if (flagsLoading || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={refetch} compact />;
  if (isLoading || !streakData) return null;

  const weekDots = Array.from({ length: 7 }, (_, i) => ({
    focusActive: i < streakData.focusDaysThisWeek,
    financeActive: i < streakData.financeDaysThisWeek,
    combined: i < streakData.combinedDaysThisWeek,
  }));

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
            <div className="text-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-foreground">{streakData.currentStreak}</span>
                <span className="text-[10px] text-muted-foreground">{isEs ? 'días' : 'days'}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{isEs ? 'Racha actual' : 'Current'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-amber-500">{streakData.bestStreak}</span>
                <span className="text-[9px] text-muted-foreground">🏆</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{isEs ? 'Mejor' : 'Best'}</p>
            </div>
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
                <span className="text-[10px] text-foreground">{streakData.combinedDaysThisWeek}d combo</span>
              </div>
            </div>
          </div>
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
