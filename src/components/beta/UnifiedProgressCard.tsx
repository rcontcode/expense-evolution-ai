import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star, TrendingUp, Gift, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserLevel, LEVELS } from '@/hooks/data/useGamification';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const BETA_TO_XP_RATIO = 2; // 2 beta points = 1 XP

export const UnifiedProgressCard = memo(function UnifiedProgressCard() {
  const { language } = useLanguage();
  const { data: userLevel, isLoading: levelLoading } = useUserLevel();
  
  // Fetch beta points
  const { data: betaPoints, isLoading: betaLoading } = useQuery({
    queryKey: ['beta-points-unified'],
    queryFn: async () => {
      const { data } = await supabase
        .from('beta_tester_points')
        .select('total_points, tier, streak_days, best_streak')
        .maybeSingle();
      return data;
    }
  });

  if (levelLoading || betaLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 bg-slate-700" />
            <Skeleton className="h-24 w-full bg-slate-700" />
            <Skeleton className="h-4 w-full bg-slate-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const financialXP = userLevel?.experience_points || 0;
  const betaXP = Math.floor((betaPoints?.total_points || 0) / BETA_TO_XP_RATIO);
  const combinedXP = financialXP + betaXP;
  
  // Calculate combined level
  const currentLevel = LEVELS.filter(l => l.minXP <= combinedXP).pop() || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.minXP > combinedXP) || LEVELS[LEVELS.length - 1];
  const progressToNext = nextLevel.minXP > currentLevel.minXP 
    ? ((combinedXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  const xpToNextLevel = nextLevel.minXP - combinedXP;
  const streakDays = Math.max(userLevel?.streak_days || 0, betaPoints?.streak_days || 0);

  const tierColors: Record<string, string> = {
    bronze: 'from-amber-700 to-amber-600',
    silver: 'from-slate-400 to-slate-300',
    gold: 'from-yellow-500 to-amber-400',
    platinum: 'from-cyan-300 to-teal-200',
    diamond: 'from-violet-400 to-purple-300'
  };

  const tier = betaPoints?.tier || 'bronze';

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-xl">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
      
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2 text-white">
          <Crown className="h-5 w-5 text-amber-400" />
          {language === 'es' ? 'Tu Progreso Total' : 'Your Total Progress'}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Combined Level Display */}
        <div className="flex items-center gap-4">
          {/* Level Circle */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 blur-md opacity-50"
            />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl">{currentLevel.icon}</div>
                <div className="text-xs text-amber-400 font-bold">Lvl {currentLevel.level}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{combinedXP.toLocaleString()}</span>
              <span className="text-sm text-slate-400">XP</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-slate-400">Financial:</span>
                <span className="text-white font-medium">{financialXP}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gift className="h-3 w-3 text-purple-400" />
                <span className="text-slate-400">Beta:</span>
                <span className="text-white font-medium">{betaXP}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to Next Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {language === 'es' ? 'Próximo nivel' : 'Next level'}: {nextLevel.name}
            </span>
            <span className="text-amber-400 font-medium">
              {xpToNextLevel > 0 ? `${xpToNextLevel} XP` : '✓'}
            </span>
          </div>
          <div className="relative">
            <Progress value={progressToNext} className="h-3 bg-slate-700" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{streakDays}</div>
            <div className="text-[10px] text-slate-400">
              {language === 'es' ? 'días racha' : 'day streak'}
            </div>
          </div>

          {/* Level */}
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{currentLevel.level}</div>
            <div className="text-[10px] text-slate-400">
              {language === 'es' ? 'nivel' : 'level'}
            </div>
          </div>

          {/* Tier */}
          <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
            <div className={`w-5 h-5 mx-auto mb-1 rounded-full bg-gradient-to-br ${tierColors[tier]}`} />
            <div className="text-lg font-bold text-white capitalize">{tier}</div>
            <div className="text-[10px] text-slate-400">
              {language === 'es' ? 'tier beta' : 'beta tier'}
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20">
          <p className="text-xs text-amber-300/90 text-center">
            {language === 'es' 
              ? `🎯 ${xpToNextLevel > 0 ? `Solo ${xpToNextLevel} XP para "${nextLevel.name}"` : '¡Eres un maestro financiero!'}`
              : `🎯 ${xpToNextLevel > 0 ? `Just ${xpToNextLevel} XP to "${nextLevel.name}"` : 'You are a financial master!'}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
