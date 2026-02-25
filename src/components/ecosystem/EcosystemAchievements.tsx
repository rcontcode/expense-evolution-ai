import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';

interface Achievement {
  id: string;
  emoji: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  unlocked: boolean;
}

export const EcosystemAchievements = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ecosystem-achievements-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const oneMonthAgo = subMonths(new Date(), 1).toISOString();
      const threeMonthsAgo = subMonths(new Date(), 3).toISOString();

      const [focusRes, worriesRes, expensesRes, incomeRes, journalRes] = await Promise.all([
        supabase.from('financial_focus_sessions').select('duration_minutes, created_at')
          .eq('user_id', user.id).gte('created_at', threeMonthsAgo),
        supabase.from('financial_worry_entries').select('id, released')
          .eq('user_id', user.id).gte('created_at', threeMonthsAgo),
        supabase.from('expenses').select('amount, date')
          .eq('user_id', user.id).is('deleted_at', null).gte('date', oneMonthAgo.slice(0, 10)),
        supabase.from('income').select('amount')
          .eq('user_id', user.id).is('deleted_at', null).gte('date', oneMonthAgo.slice(0, 10)),
        supabase.from('financial_journal').select('id')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo),
      ]);

      const focusSessions = focusRes.data || [];
      const totalFocusMinutes = focusSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const totalIncome = (incomeRes.data || []).reduce((a, i) => a + (i.amount || 0), 0);
      const totalExpenses = (expensesRes.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      const worriesReleased = (worriesRes.data || []).filter(w => w.released).length;
      const journalEntries = (journalRes.data || []).length;

      return {
        totalFocusMinutes,
        focusSessionCount: focusSessions.length,
        savingsRate,
        worriesReleased,
        totalWorries: (worriesRes.data || []).length,
        journalEntries,
        hasSavings: totalIncome > totalExpenses,
      };
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 10,
  });

  const achievements = useMemo((): Achievement[] => {
    if (!stats) return [];

    return [
      {
        id: 'first-sync',
        emoji: '🔗',
        titleEs: 'Conexión Establecida',
        titleEn: 'Connection Established',
        descEs: 'Activaste el Evo Bundle',
        descEn: 'You activated the Evo Bundle',
        unlocked: true, // Always unlocked for bundle users
      },
      {
        id: 'focus-master',
        emoji: '⏱️',
        titleEs: 'Maestro del Enfoque',
        titleEn: 'Focus Master',
        descEs: '60+ minutos de enfoque este mes',
        descEn: '60+ focus minutes this month',
        unlocked: stats.totalFocusMinutes >= 60,
      },
      {
        id: 'zen-saver',
        emoji: '🧘',
        titleEs: 'Ahorrador Zen',
        titleEn: 'Zen Saver',
        descEs: 'Tasa de ahorro > 20% este mes',
        descEn: 'Savings rate > 20% this month',
        unlocked: stats.savingsRate > 20,
      },
      {
        id: 'worry-free',
        emoji: '☁️',
        titleEs: 'Libre de Preocupaciones',
        titleEn: 'Worry Free',
        descEs: 'Liberaste 5+ preocupaciones',
        descEn: 'Released 5+ worries',
        unlocked: stats.worriesReleased >= 5,
      },
      {
        id: 'reflector',
        emoji: '📓',
        titleEs: 'Reflexivo Financiero',
        titleEn: 'Financial Reflector',
        descEs: '3+ entradas de diario este mes',
        descEn: '3+ journal entries this month',
        unlocked: stats.journalEntries >= 3,
      },
      {
        id: 'harmony',
        emoji: '✨',
        titleEs: 'Armonía Total',
        titleEn: 'Total Harmony',
        descEs: 'Enfoque + ahorro + journal en un mes',
        descEn: 'Focus + savings + journal in one month',
        unlocked: stats.totalFocusMinutes >= 30 && stats.hasSavings && stats.journalEntries >= 1,
      },
    ];
  }, [stats]);

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isLoading || !stats) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            {isEs ? 'Logros del Ecosistema' : 'Ecosystem Achievements'}
            <span className="text-[10px] font-normal text-muted-foreground ml-auto">
              {unlockedCount}/{achievements.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-1.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`flex flex-col items-center p-2 rounded-lg text-center transition-colors ${
                  ach.unlocked
                    ? 'bg-primary/5'
                    : 'bg-muted/30 opacity-50'
                }`}
              >
                <span className="text-lg">{ach.unlocked ? ach.emoji : '🔒'}</span>
                <p className="text-[9px] font-medium text-foreground mt-1 leading-tight">
                  {isEs ? ach.titleEs : ach.titleEn}
                </p>
                <p className="text-[8px] text-muted-foreground leading-tight mt-0.5">
                  {isEs ? ach.descEs : ach.descEn}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemAchievements.displayName = 'EcosystemAchievements';
