import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useFinancialHabits, 
  useHabitStats, 
  useCompleteHabit, 
  useCreateHabit,
  useInitializeDefaultHabits,
  DEFAULT_HABITS 
} from '@/hooks/data/useFinancialHabits';
import { useLanguage } from '@/contexts/LanguageContext';
import { ListChecks, Flame, Trophy, Plus, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FinancialHabitsCard() {
  const { language } = useLanguage();
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState('daily');

  const { data: habits, isLoading } = useFinancialHabits();
  const { data: stats } = useHabitStats();
  const completeHabit = useCompleteHabit();
  const createHabit = useCreateHabit();
  const initializeDefaults = useInitializeDefaultHabits();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleCreateHabit = () => {
    if (newHabitName.trim()) {
      createHabit.mutate({
        habit_name: newHabitName.trim(),
        frequency: newHabitFrequency as 'daily' | 'weekly',
      });
      setNewHabitName('');
      setNewHabitFrequency('daily');
      setShowNewHabit(false);
    }
  };

  const dailyHabits = habits?.filter(h => h.frequency === 'daily') || [];
  const weeklyHabits = habits?.filter(h => h.frequency === 'weekly') || [];
  const completedToday = habits?.filter(h => h.completedToday).length || 0;
  const totalDaily = dailyHabits.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Hábitos Financieros' : 'Financial Habits'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Brian Tracy
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground italic">
          "{language === 'es' 
            ? 'Los hábitos determinan tu destino financiero' 
            : 'Habits determine your financial destiny'}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-around py-2 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <span className="text-xl font-bold">{completedToday}/{totalDaily}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Hoy' : 'Today'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xl font-bold">{stats?.longestStreak || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Mejor racha' : 'Best streak'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-xl font-bold">{stats?.totalXP || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
        </div>

        {/* No habits - Initialize defaults */}
        {(!habits || habits.length === 0) && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {language === 'es' 
                ? 'Comienza con hábitos recomendados por expertos'
                : 'Start with expert-recommended habits'}
            </p>
            <Button onClick={() => initializeDefaults.mutate()}>
              <Sparkles className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Agregar hábitos recomendados' : 'Add recommended habits'}
            </Button>
          </div>
        )}

        {/* Habit Lists */}
        {habits && habits.length > 0 && (
          <div className="space-y-4">
            {/* Daily Habits */}
            {dailyHabits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  {language === 'es' ? 'Diarios' : 'Daily'}
                  <Badge variant="secondary" className="text-xs ml-1">
                    {dailyHabits.filter(h => h.completedToday).length}/{dailyHabits.length}
                  </Badge>
                </p>
                {dailyHabits.map((habit) => (
                  <div 
                    key={habit.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      habit.completedToday ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={habit.completedToday}
                      disabled={habit.completedToday}
                      onCheckedChange={() => completeHabit.mutate({ habitId: habit.id })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${habit.completedToday ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.habit_name}
                      </p>
                      {habit.current_streak > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {habit.current_streak} {language === 'es' ? 'días' : 'days'}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{habit.xp_reward} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Weekly Habits */}
            {weeklyHabits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {language === 'es' ? 'Semanales' : 'Weekly'}
                </p>
                {weeklyHabits.map((habit) => (
                  <div 
                    key={habit.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      habit.completedToday ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={habit.completedToday}
                      disabled={habit.completedToday}
                      onCheckedChange={() => completeHabit.mutate({ habitId: habit.id })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${habit.completedToday ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.habit_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{habit.xp_reward} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add New Habit */}
        <Dialog open={showNewHabit} onOpenChange={setShowNewHabit}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Agregar hábito' : 'Add habit'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Nuevo Hábito Financiero' : 'New Financial Habit'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Nombre del hábito' : 'Habit name'}
                </label>
                <Input
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder={language === 'es' ? 'Ej: Revisar inversiones' : 'Ex: Review investments'}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Frecuencia' : 'Frequency'}
                </label>
                <Select value={newHabitFrequency} onValueChange={setNewHabitFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{language === 'es' ? 'Diario' : 'Daily'}</SelectItem>
                    <SelectItem value="weekly">{language === 'es' ? 'Semanal' : 'Weekly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateHabit} disabled={!newHabitName.trim()} className="w-full">
                {language === 'es' ? 'Crear Hábito' : 'Create Habit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
