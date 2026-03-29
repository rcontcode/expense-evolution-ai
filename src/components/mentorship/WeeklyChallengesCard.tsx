import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Star, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getChallengesForWeek, 
  getWeekKey, 
  type ChallengeDifficulty, 
  type MentorshipChallenge 
} from '@/lib/constants/mentorship-challenges';
import { useChallengeAutoTracker } from '@/hooks/data/useChallengeAutoTracker';
import { toast } from 'sonner';

const STORAGE_KEY = 'mentorship-weekly-challenges';

interface ChallengeProgress {
  weekKey: string;
  difficulty: ChallengeDifficulty;
  completed: string[];
  xpEarned: number;
}

function loadProgress(): ChallengeProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChallengeProgress;
      if (parsed.weekKey === getWeekKey()) return parsed;
    }
  } catch {}
  return { weekKey: getWeekKey(), difficulty: 'beginner', completed: [], xpEarned: 0 };
}

function saveProgress(p: ChallengeProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const DIFFICULTY_LABELS = {
  beginner: { es: '🌱 Principiante', en: '🌱 Beginner' },
  intermediate: { es: '⚡ Intermedio', en: '⚡ Intermediate' },
  advanced: { es: '🔥 Avanzado', en: '🔥 Advanced' },
};

const MENTOR_NAMES: Record<string, { es: string; en: string }> = {
  kiyosaki: { es: 'Kiyosaki', en: 'Kiyosaki' },
  rohn: { es: 'Jim Rohn', en: 'Jim Rohn' },
  tracy: { es: 'Brian Tracy', en: 'Brian Tracy' },
  atomic: { es: 'Hábitos Atómicos', en: 'Atomic Habits' },
};

export function WeeklyChallengesCard() {
  const { language } = useLanguage();
  const es = language === 'es';
  const navigate = useNavigate();
  const [state, setState] = useState<ChallengeProgress>(loadProgress);
  const challenges = getChallengesForWeek(state.weekKey, state.difficulty);
  const { counts } = useChallengeAutoTracker();

  useEffect(() => { saveProgress(state); }, [state]);

  // Auto-complete challenges based on real data
  useEffect(() => {
    if (!counts || Object.keys(counts).length === 0) return;
    
    setState(prev => {
      let updated = { ...prev };
      let changed = false;

      for (const challenge of challenges) {
        const realCount = counts[challenge.actionKeyword] || 0;
        if (realCount >= challenge.targetCount && !prev.completed.includes(challenge.id)) {
          updated = {
            ...updated,
            completed: [...updated.completed, challenge.id],
            xpEarned: updated.xpEarned + challenge.xpReward,
          };
          changed = true;
          toast.success(
            es ? `🎉 ¡Reto completado! +${challenge.xpReward} XP` : `🎉 Challenge completed! +${challenge.xpReward} XP`
          );
        }
      }

      return changed ? updated : prev;
    });
  }, [counts, challenges, es]);

  const setDifficulty = (d: ChallengeDifficulty) => {
    setState(prev => ({ ...prev, difficulty: d, completed: [], xpEarned: 0 }));
  };

  const handleNavigate = (challenge: MentorshipChallenge) => {
    navigate(challenge.route);
  };

  const totalXPPossible = challenges.reduce((s, c) => s + c.xpReward, 0);
  const completedCount = state.completed.length;
  const allDone = completedCount === challenges.length && challenges.length > 0;

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {es ? 'Desafíos de la Semana' : 'Weekly Challenges'}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {(['beginner', 'intermediate', 'advanced'] as ChallengeDifficulty[]).map(d => (
              <Button
                key={d}
                variant={state.difficulty === d ? 'default' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setDifficulty(d)}
              >
                {DIFFICULTY_LABELS[d][es ? 'es' : 'en']}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={challenges.length ? (completedCount / challenges.length) * 100 : 0} className="h-2 flex-1" />
          <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
            <Zap className="h-3 w-3 mr-1" />
            {state.xpEarned}/{totalXPPossible} XP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <AnimatePresence mode="popLayout">
          {challenges.map((challenge, i) => {
            const realCount = counts[challenge.actionKeyword] || 0;
            const current = Math.min(realCount, challenge.targetCount);
            const isDone = state.completed.includes(challenge.id);
            const pct = (current / challenge.targetCount) * 100;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'rounded-lg border p-3 transition-all',
                  isDone ? 'bg-primary/5 border-primary/30' : 'hover:border-primary/20',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {es ? challenge.titleEs : challenge.titleEn}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {MENTOR_NAMES[challenge.mentor][es ? 'es' : 'en']}
                      </Badge>
                      {isDone && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {es ? challenge.descriptionEs : challenge.descriptionEn}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs font-mono text-muted-foreground">
                        {current}/{challenge.targetCount}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        {challenge.xpReward}
                      </Badge>
                    </div>
                  </div>
                  {!isDone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs h-8 gap-1"
                      onClick={() => handleNavigate(challenge)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="hidden sm:inline">
                        {es ? challenge.buttonLabelEs : challenge.buttonLabelEn}
                      </span>
                      <span className="sm:hidden">
                        {es ? 'Ir' : 'Go'}
                      </span>
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 rounded-lg bg-primary/10 border border-primary/20"
          >
            <Flame className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-sm font-semibold text-primary">
              {es ? '¡Todos los retos completados! 🎉' : 'All challenges completed! 🎉'}
            </p>
            <p className="text-xs text-muted-foreground">
              {es ? `Ganaste ${state.xpEarned} XP esta semana` : `You earned ${state.xpEarned} XP this week`}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
