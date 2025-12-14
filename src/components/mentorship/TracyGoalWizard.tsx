import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Target, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Star,
  Clock,
  ListTodo,
  Sparkles,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trophy,
  Zap,
  AlertCircle,
  Calendar,
  ArrowRight,
  Lightbulb,
  Brain
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  isMostImportant: boolean;
  tasks: Task[];
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

interface Task {
  id: string;
  title: string;
  priority: 'A' | 'B' | 'C' | 'D' | 'E';
  completed: boolean;
  order: number;
}

const PRIORITY_CONFIG = {
  A: { 
    label: { es: 'A - Debo hacer', en: 'A - Must do' },
    description: { es: 'Crítico con consecuencias serias', en: 'Critical with serious consequences' },
    color: 'bg-red-500',
    textColor: 'text-red-600'
  },
  B: { 
    label: { es: 'B - Debería hacer', en: 'B - Should do' },
    description: { es: 'Importante pero menos urgente', en: 'Important but less urgent' },
    color: 'bg-orange-500',
    textColor: 'text-orange-600'
  },
  C: { 
    label: { es: 'C - Sería bueno hacer', en: 'C - Nice to do' },
    description: { es: 'Sin consecuencias reales', en: 'No real consequences' },
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600'
  },
  D: { 
    label: { es: 'D - Delegar', en: 'D - Delegate' },
    description: { es: 'Otros pueden hacerlo', en: 'Others can do it' },
    color: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  E: { 
    label: { es: 'E - Eliminar', en: 'E - Eliminate' },
    description: { es: 'Pérdida de tiempo', en: 'Time waster' },
    color: 'bg-gray-500',
    textColor: 'text-gray-600'
  },
};

const STEPS = [
  { 
    number: 1, 
    title: { es: 'Define tus metas', en: 'Define your goals' },
    description: { es: 'Escribe hasta 10 metas que quieres lograr', en: 'Write up to 10 goals you want to achieve' },
    icon: Target
  },
  { 
    number: 2, 
    title: { es: 'Elige la más importante', en: 'Choose the most important' },
    description: { es: 'Selecciona LA meta que más impactaría tu vida', en: 'Select THE goal that would most impact your life' },
    icon: Star
  },
  { 
    number: 3, 
    title: { es: 'Establece fecha límite', en: 'Set a deadline' },
    description: { es: 'Una fecha crea urgencia y compromiso', en: 'A date creates urgency and commitment' },
    icon: Calendar
  },
  { 
    number: 4, 
    title: { es: 'Lista todas las tareas', en: 'List all tasks' },
    description: { es: 'Todo lo que necesitas hacer para lograrlo', en: 'Everything you need to do to achieve it' },
    icon: ListTodo
  },
  { 
    number: 5, 
    title: { es: 'Prioriza con ABCDE', en: 'Prioritize with ABCDE' },
    description: { es: 'Asigna prioridad a cada tarea', en: 'Assign priority to each task' },
    icon: Zap
  },
  { 
    number: 6, 
    title: { es: 'Actúa ahora', en: 'Take action now' },
    description: { es: 'Haz algo hoy, no mañana', en: 'Do something today, not tomorrow' },
    icon: ArrowRight
  },
  { 
    number: 7, 
    title: { es: 'Algo cada día', en: 'Something every day' },
    description: { es: '365 días de progreso = resultados extraordinarios', en: '365 days of progress = extraordinary results' },
    icon: Trophy
  },
];

export const TracyGoalWizard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const locale = language === 'es' ? es : enUS;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Fetch goals from savings_goals table (reusing for Tracy goals)
  const { data: savedGoals, isLoading } = useQuery({
    queryKey: ['tracy-goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Use investment_goals with a specific goal_type for Tracy method
      const { data, error } = await supabase
        .from('investment_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_type', 'tracy_method')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(g => ({
        id: g.id,
        title: g.name,
        description: g.notes || '',
        deadline: g.deadline,
        isMostImportant: g.is_specific || false,
        tasks: (g.asset_class ? JSON.parse(g.asset_class) : []) as Task[],
        createdAt: g.created_at || new Date().toISOString(),
        status: g.status as 'active' | 'completed' | 'archived',
      }));
    },
    enabled: !!user?.id,
  });

  // Save goal mutation
  const saveGoal = useMutation({
    mutationFn: async (goal: Goal) => {
      if (!user?.id) throw new Error('No user');

      const payload = {
        user_id: user.id,
        name: goal.title,
        notes: goal.description,
        deadline: goal.deadline,
        is_specific: goal.isMostImportant,
        asset_class: JSON.stringify(goal.tasks),
        goal_type: 'tracy_method',
        status: goal.status,
        target_amount: 0,
      };

      if (goal.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('investment_goals')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('investment_goals')
          .update(payload)
          .eq('id', goal.id);
        if (error) throw error;
        return goal;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracy-goals'] });
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('investment_goals')
        .delete()
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracy-goals'] });
      toast.success(language === 'es' ? 'Meta eliminada' : 'Goal deleted');
    },
  });

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    
    const newGoal: Goal = {
      id: `temp-${Date.now()}`,
      title: newGoalTitle.trim(),
      description: '',
      deadline: null,
      isMostImportant: false,
      tasks: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    saveGoal.mutate(newGoal);
    setNewGoalTitle('');
    setShowAddGoal(false);
    toast.success(language === 'es' ? 'Meta agregada' : 'Goal added');
  };

  const handleSetMostImportant = (goalId: string) => {
    const updatedGoals = (savedGoals || []).map(g => ({
      ...g,
      isMostImportant: g.id === goalId,
    }));

    updatedGoals.forEach(goal => {
      saveGoal.mutate(goal);
    });

    setSelectedGoal(updatedGoals.find(g => g.id === goalId) || null);
    toast.success(language === 'es' ? '¡Meta principal seleccionada!' : 'Main goal selected!');
  };

  const handleAddTask = (goalId: string) => {
    if (!newTaskTitle.trim()) return;

    const goal = savedGoals?.find(g => g.id === goalId);
    if (!goal) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      priority: 'B',
      completed: false,
      order: goal.tasks.length,
    };

    const updatedGoal = {
      ...goal,
      tasks: [...goal.tasks, newTask],
    };

    saveGoal.mutate(updatedGoal);
    setNewTaskTitle('');
  };

  const handleUpdateTaskPriority = (goalId: string, taskId: string, priority: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const goal = savedGoals?.find(g => g.id === goalId);
    if (!goal) return;

    const updatedGoal = {
      ...goal,
      tasks: goal.tasks.map(t => t.id === taskId ? { ...t, priority } : t),
    };

    saveGoal.mutate(updatedGoal);
  };

  const handleToggleTask = (goalId: string, taskId: string) => {
    const goal = savedGoals?.find(g => g.id === goalId);
    if (!goal) return;

    const updatedGoal = {
      ...goal,
      tasks: goal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
    };

    saveGoal.mutate(updatedGoal);
  };

  const handleDeleteTask = (goalId: string, taskId: string) => {
    const goal = savedGoals?.find(g => g.id === goalId);
    if (!goal) return;

    const updatedGoal = {
      ...goal,
      tasks: goal.tasks.filter(t => t.id !== taskId),
    };

    saveGoal.mutate(updatedGoal);
  };

  const handleSetDeadline = (goalId: string, deadline: string) => {
    const goal = savedGoals?.find(g => g.id === goalId);
    if (!goal) return;

    const updatedGoal = { ...goal, deadline };
    saveGoal.mutate(updatedGoal);
  };

  const mainGoal = savedGoals?.find(g => g.isMostImportant);
  const sortedTasks = mainGoal?.tasks
    .filter(t => t.priority !== 'E')
    .sort((a, b) => {
      const priorityOrder = { A: 0, B: 1, C: 2, D: 3, E: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }) || [];

  const completedTasks = mainGoal?.tasks.filter(t => t.completed).length || 0;
  const totalTasks = mainGoal?.tasks.filter(t => t.priority !== 'E').length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getNextAction = () => {
    const uncompletedA = sortedTasks.find(t => t.priority === 'A' && !t.completed);
    if (uncompletedA) return uncompletedA;
    
    const uncompletedB = sortedTasks.find(t => t.priority === 'B' && !t.completed);
    if (uncompletedB) return uncompletedB;
    
    return sortedTasks.find(t => !t.completed);
  };

  const nextAction = getNextAction();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-xl">
              {language === 'es' ? 'Sistema de Metas Brian Tracy' : 'Brian Tracy Goal System'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Los 7 pasos + Método ABCDE para lograr cualquier meta'
                : 'The 7 steps + ABCDE Method to achieve any goal'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[80px]',
                  isActive && 'bg-primary/10',
                  isCompleted && 'opacity-70'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-green-500 text-white',
                  !isActive && !isCompleted && 'bg-muted'
                )}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  'text-xs font-medium text-center',
                  isActive && 'text-primary',
                  !isActive && 'text-muted-foreground'
                )}>
                  {step.title[language === 'es' ? 'es' : 'en']}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Define Goals */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-400">
                      {language === 'es' ? 'Ejercicio de las 10 Metas' : '10 Goals Exercise'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? 'Escribe rápidamente todas las metas que quieres lograr. No te censures, solo escribe. Después las priorizaremos.'
                        : "Write down all the goals you want to achieve quickly. Don't censor yourself, just write. We'll prioritize later."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder={language === 'es' ? 'Escribe una meta...' : 'Write a goal...'}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                />
                <Button onClick={handleAddGoal} disabled={!newGoalTitle.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </div>

              <div className="space-y-2">
                {savedGoals?.map((goal, index) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      goal.isMostImportant && 'border-primary bg-primary/5'
                    )}
                  >
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <span className="flex-1">{goal.title}</span>
                    {goal.isMostImportant && (
                      <Badge className="bg-primary">
                        <Star className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Principal' : 'Main'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {(!savedGoals || savedGoals.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{language === 'es' ? 'Agrega tu primera meta' : 'Add your first goal'}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(2)} 
                  disabled={!savedGoals || savedGoals.length === 0}
                >
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Most Important */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Star className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {language === 'es' ? '¿Cuál meta cambiaría más tu vida?' : 'Which goal would most change your life?'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? 'Elige LA meta que, si la lograras, tendría el mayor impacto positivo. Solo puede haber una.'
                        : 'Choose THE goal that, if achieved, would have the greatest positive impact. There can only be one.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {savedGoals?.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleSetMostImportant(goal.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left',
                      goal.isMostImportant 
                        ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                        : 'hover:bg-muted/50'
                    )}
                  >
                    {goal.isMostImportant ? (
                      <Star className="h-5 w-5 text-primary fill-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="flex-1 font-medium">{goal.title}</span>
                    {goal.isMostImportant && (
                      <Badge className="bg-primary">
                        {language === 'es' ? 'Meta Principal' : 'Main Goal'}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button onClick={() => setCurrentStep(3)} disabled={!mainGoal}>
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Set Deadline */}
          {currentStep === 3 && mainGoal && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-400">
                      {language === 'es' ? 'Una meta sin fecha es solo un deseo' : 'A goal without a deadline is just a wish'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? 'La fecha límite crea urgencia y activa tu mente subconsciente para encontrar soluciones.'
                        : 'The deadline creates urgency and activates your subconscious mind to find solutions.'}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <span className="font-semibold">{mainGoal.title}</span>
                </div>

                <div className="space-y-3">
                  <Label>{language === 'es' ? 'Fecha límite' : 'Deadline'}</Label>
                  <Input
                    type="date"
                    value={mainGoal.deadline || ''}
                    onChange={(e) => handleSetDeadline(mainGoal.id, e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />

                  {mainGoal.deadline && (
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Faltan' : 'Remaining'}: {' '}
                      <span className="font-semibold text-foreground">
                        {differenceInDays(new Date(mainGoal.deadline), new Date())} {language === 'es' ? 'días' : 'days'}
                      </span>
                    </p>
                  )}
                </div>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 & 5: List Tasks with ABCDE */}
          {(currentStep === 4 || currentStep === 5) && mainGoal && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <ListTodo className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-400">
                      {currentStep === 4 
                        ? (language === 'es' ? 'Lista todo lo necesario' : 'List everything needed')
                        : (language === 'es' ? 'Método ABCDE de priorización' : 'ABCDE Prioritization Method')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentStep === 4 
                        ? (language === 'es' 
                            ? 'Escribe TODAS las tareas y acciones que necesitas para lograr tu meta. No te limites.'
                            : 'Write ALL the tasks and actions you need to achieve your goal. Don\'t hold back.')
                        : (language === 'es' 
                            ? 'A = Crítico, B = Importante, C = Bueno hacer, D = Delegar, E = Eliminar'
                            : 'A = Critical, B = Important, C = Nice to do, D = Delegate, E = Eliminate')}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <span className="font-semibold">{mainGoal.title}</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={language === 'es' ? 'Nueva tarea...' : 'New task...'}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(mainGoal.id)}
                  />
                  <Button onClick={() => handleAddTask(mainGoal.id)} disabled={!newTaskTitle.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mainGoal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border transition-all',
                        task.completed && 'opacity-50'
                      )}
                    >
                      <button onClick={() => handleToggleTask(mainGoal.id, task.id)}>
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      <span className={cn('flex-1', task.completed && 'line-through')}>
                        {task.title}
                      </span>

                      <Select
                        value={task.priority}
                        onValueChange={(v) => handleUpdateTaskPriority(mainGoal.id, task.id, v as any)}
                      >
                        <SelectTrigger className="w-24">
                          <div className="flex items-center gap-1">
                            <div className={cn('w-2 h-2 rounded-full', PRIORITY_CONFIG[task.priority].color)} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {(['A', 'B', 'C', 'D', 'E'] as const).map(p => (
                            <SelectItem key={p} value={p}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full', PRIORITY_CONFIG[p].color)} />
                                {p}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(mainGoal.id, task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Priority Legend */}
                <div className="mt-4 pt-4 border-t space-y-1">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs">
                      <div className={cn('w-3 h-3 rounded-full', PRIORITY_CONFIG[p].color)} />
                      <span className={PRIORITY_CONFIG[p].textColor}>
                        {PRIORITY_CONFIG[p].label[language === 'es' ? 'es' : 'en']}
                      </span>
                      <span className="text-muted-foreground">
                        - {PRIORITY_CONFIG[p].description[language === 'es' ? 'es' : 'en']}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button onClick={() => setCurrentStep(currentStep === 4 ? 5 : 6)}>
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6 & 7: Action Dashboard */}
          {(currentStep === 6 || currentStep === 7) && mainGoal && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400">
                      {language === 'es' ? '¡Es hora de actuar!' : "It's time to take action!"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' 
                        ? '"La disciplina es el puente entre metas y logros" - Jim Rohn'
                        : '"Discipline is the bridge between goals and accomplishment" - Jim Rohn'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{mainGoal.title}</h3>
                    {mainGoal.deadline && (
                      <p className="text-sm text-muted-foreground">
                        {differenceInDays(new Date(mainGoal.deadline), new Date())} {language === 'es' ? 'días restantes' : 'days remaining'}
                      </p>
                    )}
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {completedTasks}/{totalTasks} {language === 'es' ? 'tareas completadas' : 'tasks completed'} ({Math.round(progressPercentage)}%)
                </p>
              </Card>

              {/* Next Action */}
              {nextAction && (
                <Card className="p-4 border-2 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={PRIORITY_CONFIG[nextAction.priority].color}>
                      {nextAction.priority}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {language === 'es' ? '🐸 Come tu rana ahora:' : '🐸 Eat your frog now:'}
                    </span>
                  </div>
                  <p className="font-semibold text-lg">{nextAction.title}</p>
                  <Button 
                    className="w-full mt-3"
                    onClick={() => handleToggleTask(mainGoal.id, nextAction.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Marcar como completada' : 'Mark as completed'}
                  </Button>
                </Card>
              )}

              {/* Task List by Priority */}
              <div className="space-y-3">
                <h4 className="font-medium">
                  {language === 'es' ? 'Tareas ordenadas por prioridad' : 'Tasks sorted by priority'}
                </h4>
                {sortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      task.completed && 'opacity-50 bg-muted/50'
                    )}
                  >
                    <button onClick={() => handleToggleTask(mainGoal.id, task.id)}>
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <Badge className={cn(PRIORITY_CONFIG[task.priority].color, 'text-white')}>
                      {task.priority}
                    </Badge>
                    <span className={cn('flex-1', task.completed && 'line-through')}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Brian Tracy Quote */}
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="italic text-muted-foreground">
                  {language === 'es' 
                    ? '"Tu habilidad para disciplinarte a ti mismo para establecer metas claras y luego trabajar hacia ellas cada día, te garantizará más éxito que cualquier otro factor."'
                    : '"Your ability to discipline yourself to set clear goals and then work towards them every day will guarantee you more success than any other factor."'}
                </p>
                <p className="text-sm font-medium mt-2">— Brian Tracy</p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>
                  {language === 'es' ? 'Editar tareas' : 'Edit tasks'}
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  {language === 'es' ? 'Ver todas las metas' : 'View all goals'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
