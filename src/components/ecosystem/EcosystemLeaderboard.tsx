import { memo, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format, subMonths } from 'date-fns';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

function getCurrentWeekKey(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export const EcosystemLeaderboard = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';
  const weekKey = getCurrentWeekKey();

  // Compute and submit own score
  const { data: myScore } = useQuery({
    queryKey: ['ecosystem-my-score', user?.id, weekKey],
    queryFn: async () => {
      if (!user?.id) return null;
      const oneMonthAgo = subMonths(new Date(), 1).toISOString();

      const [focusRes, streakRes, incomeRes, expenseRes] = await Promise.all([
        supabase.from('financial_focus_sessions').select('duration_minutes')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo),
        supabase.from('ecosystem_streaks').select('current_streak')
          .eq('user_id', user.id).maybeSingle(),
        supabase.from('income').select('amount')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', oneMonthAgo.slice(0, 10)),
        supabase.from('expenses').select('amount')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', oneMonthAgo.slice(0, 10)),
      ]);

      const focusMinutes = (focusRes.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const streak = streakRes.data?.current_streak || 0;
      const totalIncome = (incomeRes.data || []).reduce((a, i) => a + (i.amount || 0), 0);
      const totalExpenses = (expenseRes.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

      const healthScore = Math.min(100, Math.round(
        Math.min(30, savingsRate) +
        Math.min(25, (focusMinutes / 120) * 25) +
        Math.min(25, streak * 5) +
        20 // base
      ));

      const totalScore = healthScore + Math.min(50, focusMinutes) + streak * 10;

      return { healthScore, focusMinutes, streak, totalScore };
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 10,
  });

  // Submit score to leaderboard
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !myScore) return;

      const { data: existing } = await supabase
        .from('ecosystem_leaderboard')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_key', weekKey)
        .maybeSingle();

      const profile = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      const displayName = profile.data?.full_name
        ? `${profile.data.full_name.charAt(0)}***`
        : 'Evo User';

      const payload = {
        health_score: myScore.healthScore,
        focus_minutes: Math.min(999, myScore.focusMinutes),
        streak_days: myScore.streak,
        total_score: myScore.totalScore,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('ecosystem_leaderboard')
          .update(payload)
          .eq('id', existing.id);
      } else {
        await supabase.from('ecosystem_leaderboard')
          .insert({ user_id: user.id, week_key: weekKey, ...payload });
      }
    },
  });

  useEffect(() => {
    if (myScore && user?.id) {
      submitMutation.mutate();
    }
  }, [myScore?.totalScore]);

  // Fetch leaderboard via secure function (no user_id exposed)
  const { data: leaderboard, isLoading, isError, refetch: refetchLb } = useQuery({
    queryKey: ['ecosystem-leaderboard', weekKey],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_ecosystem_leaderboard', {
        p_week_key: weekKey,
      });
      return data || [];
    },
    enabled: hasBundleAccess,
    staleTime: 1000 * 60 * 5,
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={() => refetchLb()} compact />;
  if (isLoading || !leaderboard || leaderboard.length === 0) return null;

  const myRank = leaderboard.findIndex(e => e.display_name === (user?.email ? `${user.email.charAt(0).toUpperCase()}***` : '')) + 1;
  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-3.5 w-3.5 text-amber-500" />;
    if (rank === 2) return <Medal className="h-3.5 w-3.5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-3.5 w-3.5 text-amber-700" />;
    return <span className="text-[10px] text-muted-foreground w-3.5 text-center">{rank}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-amber-500/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            {isEs ? 'Ranking Semanal' : 'Weekly Ranking'}
            {myRank > 0 && (
              <span className="text-[10px] font-normal text-muted-foreground ml-auto">
                #{myRank}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-1">
            {leaderboard.slice(0, 5).map((entry, i) => {
              const isMe = entry.rank === myRank && myRank > 0;
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                    isMe ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <RankIcon rank={i + 1} />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className={`text-[11px] truncate ${isMe ? 'font-bold text-foreground' : 'text-foreground'}`}>
                      {isMe ? (isEs ? 'Tú' : 'You') : entry.display_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-muted-foreground">{entry.health_score}hp</span>
                    <span className="text-[9px] text-muted-foreground">{entry.focus_minutes}m</span>
                    <span className="text-[10px] font-bold text-foreground">{entry.total_score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemLeaderboard.displayName = 'EcosystemLeaderboard';
