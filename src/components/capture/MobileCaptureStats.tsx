import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Target, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

interface MobileCaptureStatsProps {
  todayCount: number;
  dailyGoal: number;
  currentStreak: number;
  goalProgress: number;
  goalReached: boolean;
}

export function MobileCaptureStats({
  todayCount,
  dailyGoal,
  currentStreak,
  goalProgress,
  goalReached,
}: MobileCaptureStatsProps) {
  const { language } = useLanguage();
  const prevGoalReached = useRef(goalReached);
  const celebrationTriggered = useRef(false);

  // Celebrate when goal is first reached
  useEffect(() => {
    if (goalReached && !prevGoalReached.current && !celebrationTriggered.current) {
      celebrationTriggered.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
      });
    }
    prevGoalReached.current = goalReached;
  }, [goalReached]);

  // Reset celebration flag when count goes back to 0
  useEffect(() => {
    if (todayCount === 0) {
      celebrationTriggered.current = false;
    }
  }, [todayCount]);

  const getProgressGradient = () => {
    if (goalProgress >= 100) return 'from-emerald-500 to-green-400';
    if (goalProgress >= 60) return 'from-blue-500 to-cyan-400';
    if (goalProgress >= 30) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-orange-400';
  };

  const getStreakIcon = () => {
    if (currentStreak >= 7) return <Flame className="h-5 w-5 text-orange-500 animate-pulse" />;
    if (currentStreak >= 3) return <Flame className="h-5 w-5 text-amber-500" />;
    return <Zap className="h-5 w-5 text-primary" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className={cn(
        "overflow-hidden border-2 transition-all duration-500",
        goalReached 
          ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10" 
          : "border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Today's Progress */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: goalReached ? [0, -10, 10, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: goalReached ? 2 : 0 }}
                >
                  {goalReached ? (
                    <Trophy className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Target className="h-5 w-5 text-primary" />
                  )}
                </motion.div>
                <span className="text-sm font-medium text-muted-foreground">
                  {language === 'es' ? 'Meta diaria' : 'Daily goal'}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={todayCount}
                    initial={{ opacity: 0, scale: 1.5, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className={cn(
                      "text-3xl font-bold",
                      goalReached ? "text-emerald-500" : "text-primary"
                    )}
                  >
                    {todayCount}
                  </motion.span>
                </AnimatePresence>
                <span className="text-lg text-muted-foreground">/ {dailyGoal}</span>
              </div>

              {/* Progress bar */}
              <div className="relative h-3 rounded-full bg-secondary/50 overflow-hidden">
                <motion.div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                    getProgressGradient()
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(goalProgress, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </div>
            </div>

            {/* Streak Counter */}
            <div className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
              currentStreak > 0 
                ? "bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30" 
                : "bg-secondary/30"
            )}>
              {getStreakIcon()}
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentStreak}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "text-2xl font-bold",
                    currentStreak >= 7 ? "text-orange-500" : 
                    currentStreak >= 3 ? "text-amber-500" : "text-foreground"
                  )}
                >
                  {currentStreak}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs text-muted-foreground">
                {language === 'es' ? 'días' : 'days'}
              </span>
            </div>
          </div>

          {/* Achievement badges */}
          {goalReached && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2"
            >
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {language === 'es' ? '¡Meta alcanzada!' : 'Goal reached!'}
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
