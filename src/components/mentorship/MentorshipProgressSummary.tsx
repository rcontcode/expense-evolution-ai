import { useLanguage } from '@/contexts/LanguageContext';
import { useEducationStats } from '@/hooks/data/useFinancialEducation';
import { useHabitStats } from '@/hooks/data/useFinancialHabits';
import { useJournalStats } from '@/hooks/data/useFinancialJournal';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BookOpen, Flame, PenLine, Target, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {es ? 'Tu Progreso de Mentoría' : 'Your Mentorship Progress'}
          </h3>
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
