import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEducationStats } from '@/hooks/data/useFinancialEducation';
import { useHabitStats } from '@/hooks/data/useFinancialHabits';
import { useJournalStats } from '@/hooks/data/useFinancialJournal';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Suggestion {
  priority: number;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  tab: string;
  icon: string;
  color: string;
}

export function LearningPathCard() {
  const { language } = useLanguage();
  const es = language === 'es';
  const [, setSearchParams] = useSearchParams();

  const { data: eduStats } = useEducationStats();
  const { data: habitStats } = useHabitStats();
  const { data: journalStats } = useJournalStats();
  const { data: goals } = useSavingsGoals();

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    // No journal entries at all
    if (!journalStats || journalStats.totalEntries === 0) {
      items.push({
        priority: 1,
        titleEs: 'Empieza tu journal financiero',
        titleEn: 'Start your financial journal',
        descEs: 'Reflexiona sobre tus decisiones financieras diarias',
        descEn: 'Reflect on your daily financial decisions',
        tab: 'rohn',
        icon: '📝',
        color: 'border-amber-500/30 bg-amber-500/5',
      });
    } else if (journalStats.streak === 0) {
      items.push({
        priority: 3,
        titleEs: 'Retoma tu racha de journal',
        titleEn: 'Resume your journal streak',
        descEs: 'Escribe hoy para reiniciar tu racha',
        descEn: 'Write today to restart your streak',
        tab: 'rohn',
        icon: '🔥',
        color: 'border-orange-500/30 bg-orange-500/5',
      });
    }

    // No savings goals
    const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
    if (activeGoals === 0) {
      items.push({
        priority: 1,
        titleEs: 'Crea tu primera meta SMART',
        titleEn: 'Create your first SMART goal',
        descEs: 'Define una meta específica, medible y con plazo',
        descEn: 'Define a specific, measurable goal with deadline',
        tab: 'tracy',
        icon: '🎯',
        color: 'border-blue-500/30 bg-blue-500/5',
      });
    }

    // No education resources
    const totalResources = (eduStats?.completed || 0) + (eduStats?.inProgress || 0) + (eduStats?.wishlist || 0);
    if (totalResources === 0) {
      items.push({
        priority: 2,
        titleEs: 'Explora la biblioteca financiera',
        titleEn: 'Explore the financial library',
        descEs: '100+ recursos curados para tu educación',
        descEn: '100+ curated resources for your education',
        tab: 'library',
        icon: '📚',
        color: 'border-purple-500/30 bg-purple-500/5',
      });
    }

    // No habits
    if (!habitStats || habitStats.totalHabits === 0) {
      items.push({
        priority: 1,
        titleEs: 'Crea tu primer hábito atómico',
        titleEn: 'Create your first atomic habit',
        descEs: 'Pequeños cambios, grandes resultados',
        descEn: 'Small changes, big results',
        tab: 'atomic',
        icon: '⚛️',
        color: 'border-cyan-500/30 bg-cyan-500/5',
      });
    } else if (habitStats.currentStreakTotal === 0 && habitStats.totalHabits > 0) {
      items.push({
        priority: 2,
        titleEs: 'Retoma tu racha de hábitos',
        titleEn: 'Resume your habit streak',
        descEs: 'Completa tus hábitos hoy para reiniciar',
        descEn: 'Complete your habits today to restart',
        tab: 'atomic',
        icon: '🔥',
        color: 'border-orange-500/30 bg-orange-500/5',
      });
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [eduStats, habitStats, journalStats, goals]);

  if (suggestions.length === 0) return null;

  const navigateToTab = (tab: string) => {
    if (tab === 'library') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {es ? 'Tu Ruta de Aprendizaje' : 'Your Learning Path'}
          </h3>
          <Badge variant="secondary" className="text-[10px] h-5 ml-auto">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            {es ? 'Personalizada' : 'Personalized'}
          </Badge>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {suggestions.map((s, i) => (
              <motion.div
                key={s.tab + s.titleEn}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn('flex items-center gap-3 rounded-lg border p-2.5 sm:p-3 cursor-pointer transition-all hover:shadow-sm group', s.color)}
                onClick={() => navigateToTab(s.tab)}
              >
                <span className="text-lg sm:text-xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{es ? s.titleEs : s.titleEn}</p>
                  <p className="text-xs text-muted-foreground truncate">{es ? s.descEs : s.descEn}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
