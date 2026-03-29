import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChallengeAutoTracker } from '@/hooks/data/useChallengeAutoTracker';
import { useJournalStats } from '@/hooks/data/useFinancialJournal';
import { useHabitStats } from '@/hooks/data/useFinancialHabits';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, PenLine, Flame, TrendingUp } from 'lucide-react';

function getWeekRange(): { startLabel: string; endLabel: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { startLabel: fmt(monday), endLabel: fmt(sunday) };
}

function getScoreDelta(): number | null {
  try {
    const stored = localStorage.getItem('mentorship-score-history');
    if (!stored) return null;
    const history = JSON.parse(stored);
    if (history.previousScore !== undefined && history.lastScore !== undefined) {
      return history.lastScore - history.previousScore;
    }
  } catch {}
  return null;
}

export function WeeklySummaryBadge() {
  const { language } = useLanguage();
  const es = language === 'es';
  const { counts } = useChallengeAutoTracker();
  const { data: journalStats } = useJournalStats();
  const { data: habitStats } = useHabitStats();
  const { startLabel, endLabel } = getWeekRange();

  const journalThisMonth = journalStats?.entriesThisMonth || 0;
  const streak = habitStats?.longestStreak || 0;

  const activeKeys = Object.values(counts).filter(v => v > 0).length;
  const scoreDelta = useMemo(() => getScoreDelta(), []);

  const items = [
    {
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      label: es ? 'Retos activos' : 'Active challenges',
      value: activeKeys,
    },
    {
      icon: <PenLine className="h-4 w-4 text-amber-500" />,
      label: es ? 'Journal este mes' : 'Journal this month',
      value: journalThisMonth,
    },
    {
      icon: <Flame className="h-4 w-4 text-orange-500" />,
      label: es ? 'Mejor racha' : 'Best streak',
      value: `${streak}d`,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-muted">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {startLabel} — {endLabel}
              </span>
              {new Date().getDay() <= 2 && new Date().getDay() >= 1 && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {es ? '🆕 Semana nueva' : '🆕 New week'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {item.icon}
                  <span className="text-sm font-bold tabular-nums">{item.value}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{item.label}</span>
                </div>
              ))}
              {scoreDelta !== null && scoreDelta !== 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className={`text-xs font-bold ${scoreDelta > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
