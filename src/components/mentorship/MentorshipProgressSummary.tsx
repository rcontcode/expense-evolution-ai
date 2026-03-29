import { useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEducationStats } from '@/hooks/data/useFinancialEducation';
import { useHabitStats } from '@/hooks/data/useFinancialHabits';
import { useJournalStats } from '@/hooks/data/useFinancialJournal';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { BookOpen, Flame, PenLine, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, sub, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.06 }}
      className={cn(
        'rounded-xl border p-3 sm:p-4 flex flex-col items-center text-center gap-1 transition-all hover:shadow-md',
        color
      )}
    >
      <div className="p-2 rounded-lg bg-background/60">{icon}</div>
      <span className="text-xl sm:text-2xl font-bold leading-none">{value}</span>
      <span className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-tight">{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground/70">{sub}</span>}
    </motion.div>
  );
}

function getScoreLevel(score: number, es: boolean) {
  if (score >= 80) return { label: es ? '🏆 Maestro' : '🏆 Master', color: 'text-yellow-500', bg: 'bg-yellow-500', barColor: 'bg-yellow-500' };
  if (score >= 60) return { label: es ? '🚀 Avanzado' : '🚀 Advanced', color: 'text-emerald-500', bg: 'bg-emerald-500', barColor: 'bg-emerald-500' };
  if (score >= 30) return { label: es ? '📈 En camino' : '📈 On track', color: 'text-blue-500', bg: 'bg-blue-500', barColor: 'bg-blue-500' };
  return { label: es ? '🌱 Comenzando' : '🌱 Starting', color: 'text-orange-500', bg: 'bg-orange-500', barColor: 'bg-orange-500' };
}

export function MentorshipProgressSummary() {
  const { language } = useLanguage();
  const es = language === 'es';

  const { data: eduStats } = useEducationStats();
  const { data: habitStats } = useHabitStats();
  const { data: journalStats } = useJournalStats();
  const { data: goals } = useSavingsGoals();

  const booksCompleted = eduStats?.completed || 0;
  const booksInProgress = eduStats?.inProgress || 0;
  const habitStreak = habitStats?.longestStreak || 0;
  const totalHabits = habitStats?.totalHabits || 0;
  const journalThisMonth = journalStats?.entriesThisMonth || 0;
  const journalStreak = journalStats?.streak || 0;
  const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
  const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;

  // Calculate unified mentorship score (0-100)
  const score = useMemo(() => {
    let s = 0;
    // Books: up to 25 pts (5 per completed, 2 per in-progress, max 25)
    s += Math.min(25, booksCompleted * 5 + booksInProgress * 2);
    // Habits: up to 25 pts (streak days * 2 + totalHabits * 3, max 25)
    s += Math.min(25, habitStreak * 2 + totalHabits * 3);
    // Journal: up to 25 pts (entries this month * 3 + streak * 2, max 25)
    s += Math.min(25, journalThisMonth * 3 + journalStreak * 2);
    // Goals: up to 25 pts (active * 5 + completed * 5, max 25)
    s += Math.min(25, activeGoals * 5 + completedGoals * 5);
    return Math.min(100, s);
  }, [booksCompleted, booksInProgress, habitStreak, totalHabits, journalThisMonth, journalStreak, activeGoals, completedGoals]);

  // Score persistence & milestones
  const prevScoreRef = useRef<number | null>(null);
  useEffect(() => {
    const STORAGE_KEY = 'mentorship-score-history';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const history = stored ? JSON.parse(stored) : {};
      const weekKey = new Date().toISOString().slice(0, 10);
      
      // Store previous score for delta
      if (history.lastScore !== undefined) {
        prevScoreRef.current = history.lastScore;
      }
      
      // Check milestone crossings
      const lastScore = history.lastScore || 0;
      const milestones = [30, 50, 80, 100];
      for (const m of milestones) {
        if (score >= m && lastScore < m) {
          toast.success(es ? `🏆 ¡Alcanzaste ${m} puntos de mentoría!` : `🏆 You reached ${m} mentorship points!`);
        }
      }
      
      history.lastScore = score;
      history.lastUpdated = weekKey;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {}
  }, [score, es]);

  const scoreDelta = prevScoreRef.current !== null ? score - prevScoreRef.current : null;

  const level = getScoreLevel(score, es);

  const stats = [
    {
      icon: <BookOpen className="h-5 w-5 text-purple-500" />,
      label: es ? 'Recursos completados' : 'Resources completed',
      value: booksCompleted,
      sub: es ? `${booksInProgress} en progreso` : `${booksInProgress} in progress`,
      color: 'bg-purple-500/5 border-purple-500/20',
    },
    {
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      label: es ? 'Mejor racha hábitos' : 'Best habit streak',
      value: `${habitStreak}d`,
      sub: es ? `${totalHabits} hábitos activos` : `${totalHabits} active habits`,
      color: 'bg-orange-500/5 border-orange-500/20',
    },
    {
      icon: <PenLine className="h-5 w-5 text-amber-500" />,
      label: es ? 'Journal este mes' : 'Journal this month',
      value: journalThisMonth,
      sub: es ? `Racha: ${journalStreak} días` : `Streak: ${journalStreak} days`,
      color: 'bg-amber-500/5 border-amber-500/20',
    },
    {
      icon: <Target className="h-5 w-5 text-blue-500" />,
      label: es ? 'Metas activas' : 'Active goals',
      value: activeGoals,
      sub: es ? `${completedGoals} completadas` : `${completedGoals} completed`,
      color: 'bg-blue-500/5 border-blue-500/20',
    },
  ];

  return (
    <Card className="border-primary/10">
      <CardContent className="p-3 sm:p-4">
        {/* Score header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">
              {es ? 'Tu Progreso de Mentoría' : 'Your Mentorship Progress'}
            </h3>
          </div>
          <Badge variant="outline" className={cn('text-xs font-semibold', level.color)}>
            {level.label}
          </Badge>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-3 mb-4">
          <Progress
            value={score}
            className="h-2.5 flex-1"
            indicatorClassName={level.barColor}
          />
          <span className={cn('text-sm font-bold tabular-nums min-w-[3ch]', level.color)}>
            {score}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} delay={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
