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
  Brain,
  ChevronRight,
  Rocket,
  TrendingUp,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  Wallet,
  PiggyBank,
  Building2,
  Plane
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  isMostImportant: boolean;
  tasks: Task[];
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
  timeframe?: 'short' | 'medium' | 'long';
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
    icon: Target,
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    number: 2, 
    title: { es: 'Elige la más importante', en: 'Choose the most important' },
    description: { es: 'Selecciona LA meta que más impactaría tu vida', en: 'Select THE goal that would most impact your life' },
    icon: Star,
    color: 'from-amber-500 to-yellow-500'
  },
  { 
    number: 3, 
    title: { es: 'Establece fecha límite', en: 'Set a deadline' },
    description: { es: 'Una fecha crea urgencia y compromiso', en: 'A date creates urgency and commitment' },
    icon: Calendar,
    color: 'from-green-500 to-emerald-500'
  },
  { 
    number: 4, 
    title: { es: 'Lista todas las tareas', en: 'List all tasks' },
    description: { es: 'Todo lo que necesitas hacer para lograrlo', en: 'Everything you need to do to achieve it' },
    icon: ListTodo,
    color: 'from-purple-500 to-violet-500'
  },
  { 
    number: 5, 
    title: { es: 'Prioriza con ABCDE', en: 'Prioritize with ABCDE' },
    description: { es: 'Asigna prioridad a cada tarea', en: 'Assign priority to each task' },
    icon: Zap,
    color: 'from-orange-500 to-red-500'
  },
  { 
    number: 6, 
    title: { es: 'Actúa ahora', en: 'Take action now' },
    description: { es: 'Haz algo hoy, no mañana', en: 'Do something today, not tomorrow' },
    icon: Rocket,
    color: 'from-pink-500 to-rose-500'
  },
  { 
    number: 7, 
    title: { es: 'Algo cada día', en: 'Something every day' },
    description: { es: '365 días de progreso = resultados extraordinarios', en: '365 days of progress = extraordinary results' },
    icon: Trophy,
    color: 'from-indigo-500 to-blue-500'
  },
];

// Goal suggestions by timeframe based on financial expert recommendations
const GOAL_SUGGESTIONS = {
  short: {
    label: { es: 'Corto Plazo (0-1 año)', en: 'Short Term (0-1 year)' },
    icon: Rocket,
    color: 'from-green-500 to-emerald-500',
    suggestions: [
      { es: 'Crear un fondo de emergencia de 3 meses de gastos', en: 'Build a 3-month emergency fund', icon: PiggyBank },
      { es: 'Eliminar una deuda de tarjeta de crédito', en: 'Pay off one credit card debt', icon: Wallet },
      { es: 'Ahorrar para unas vacaciones familiares', en: 'Save for a family vacation', icon: Plane },
      { es: 'Automatizar mis ahorros mensuales', en: 'Automate my monthly savings', icon: TrendingUp },
      { es: 'Leer 3 libros de finanzas personales', en: 'Read 3 personal finance books', icon: GraduationCap },
      { es: 'Aumentar mis ingresos un 10%', en: 'Increase my income by 10%', icon: Briefcase },
      { es: 'Negociar una reducción en mis gastos fijos', en: 'Negotiate lower fixed expenses', icon: Home },
      { es: 'Iniciar un side hustle o proyecto paralelo', en: 'Start a side hustle or side project', icon: Rocket },
    ]
  },
  medium: {
    label: { es: 'Mediano Plazo (1-5 años)', en: 'Medium Term (1-5 years)' },
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    suggestions: [
      { es: 'Comprar mi primera propiedad de inversión', en: 'Buy my first investment property', icon: Building2 },
      { es: 'Alcanzar $50,000 en inversiones', en: 'Reach $50,000 in investments', icon: TrendingUp },
      { es: 'Crear un negocio que genere ingresos pasivos', en: 'Create a business generating passive income', icon: Briefcase },
      { es: 'Pagar completamente mi hipoteca del auto', en: 'Pay off my car loan completely', icon: Wallet },
      { es: 'Duplicar mis ingresos actuales', en: 'Double my current income', icon: Rocket },
      { es: 'Tener 6 meses de gastos en fondo de emergencia', en: 'Have 6 months expenses in emergency fund', icon: PiggyBank },
      { es: 'Obtener una certificación profesional', en: 'Get a professional certification', icon: GraduationCap },
      { es: 'Iniciar inversiones en bienes raíces', en: 'Start real estate investments', icon: Home },
    ]
  },
  long: {
    label: { es: 'Largo Plazo (5-20+ años)', en: 'Long Term (5-20+ years)' },
    icon: Trophy,
    color: 'from-purple-500 to-violet-500',
    suggestions: [
      { es: 'Alcanzar la independencia financiera (FIRE)', en: 'Achieve financial independence (FIRE)', icon: Trophy },
      { es: 'Tener $1,000,000 en patrimonio neto', en: 'Have $1,000,000 in net worth', icon: TrendingUp },
      { es: 'Retirarme antes de los 55 años', en: 'Retire before age 55', icon: Heart },
      { es: 'Generar $5,000/mes en ingresos pasivos', en: 'Generate $5,000/month in passive income', icon: Wallet },
      { es: 'Pagar mi casa completamente', en: 'Pay off my house completely', icon: Home },
      { es: 'Crear un legado financiero para mi familia', en: 'Create a financial legacy for my family', icon: Heart },
      { es: 'Tener 10 propiedades de inversión', en: 'Own 10 investment properties', icon: Building2 },
      { es: 'Fundar una fundación benéfica', en: 'Start a charitable foundation', icon: Star },
    ]
  }
};

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

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTimeframe, setSuggestionTimeframe] = useState<'short' | 'medium' | 'long'>('short');

  const handleAddSuggestion = (suggestion: string) => {
    const newGoal: Goal = {
      id: `temp-${Date.now()}`,
      title: suggestion,
      description: '',
      deadline: null,
      isMostImportant: false,
      tasks: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    saveGoal.mutate(newGoal);
    toast.success(language === 'es' ? 'Meta agregada' : 'Goal added');
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Brain className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {language === 'es' ? 'Sistema de Metas Brian Tracy' : 'Brian Tracy Goal System'}
            </CardTitle>
            <CardDescription className="text-white/80">
              {language === 'es' 
                ? 'Los 7 pasos + Método ABCDE para lograr cualquier meta'
                : 'The 7 steps + ABCDE Method to achieve any goal'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Progress Steps with Arrows */}
        <div className="relative">
          <div className="flex items-center justify-between overflow-x-auto pb-4 gap-1">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isLast = index === STEPS.length - 1;
              
              return (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[85px] relative group',
                      isActive && 'bg-gradient-to-br from-primary/20 to-primary/5 scale-105 shadow-lg',
                      isCompleted && 'opacity-80 hover:opacity-100'
                    )}
                  >
                    {/* Step Number Badge */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {step.number}
                    </div>
                    
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md',
                      isActive && `bg-gradient-to-br ${step.color} text-white shadow-lg`,
                      isCompleted && 'bg-gradient-to-br from-green-500 to-emerald-500 text-white',
                      !isActive && !isCompleted && 'bg-muted/80 text-muted-foreground'
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium text-center leading-tight max-w-[70px]',
                      isActive && 'text-primary font-semibold',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-muted-foreground'
                    )}>
                      {step.title[language === 'es' ? 'es' : 'en']}
                    </span>
                  </button>
                  
                  {/* Arrow connector */}
                  {!isLast && (
                    <div className={cn(
                      'flex items-center mx-1',
                      isCompleted ? 'text-green-500' : 'text-muted-foreground/30'
                    )}>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Current Step Description */}
          <div className={cn(
            'mt-2 p-3 rounded-xl border-2 border-dashed',
            `bg-gradient-to-r ${STEPS[currentStep - 1].color} bg-opacity-10`
          )}>
            <p className="text-sm font-medium text-center">
              <span className="font-bold">{language === 'es' ? 'Paso' : 'Step'} {currentStep}:</span>{' '}
              {STEPS[currentStep - 1].description[language === 'es' ? 'es' : 'en']}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[450px]">
          {/* Step 1: Define Goals */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Suggestions Panel */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-amber-800 dark:text-amber-400">
                        {language === 'es' ? '💡 Ejercicio de las 10 Metas' : '💡 10 Goals Exercise'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {language === 'es' ? 'Ideas de metas' : 'Goal ideas'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'No sabes qué escribir? Usa las sugerencias o escribe libremente. ¡No te censures!'
                        : "Not sure what to write? Use suggestions or write freely. Don't censor yourself!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goal Suggestions by Timeframe */}
              {showSuggestions && (
                <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      {language === 'es' ? 'Elige metas según tu horizonte de tiempo:' : 'Choose goals by time horizon:'}
                    </span>
                  </div>
                  
                  {/* Timeframe Tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {(['short', 'medium', 'long'] as const).map((tf) => {
                      const config = GOAL_SUGGESTIONS[tf];
                      const TfIcon = config.icon;
                      return (
                        <Button
                          key={tf}
                          variant={suggestionTimeframe === tf ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSuggestionTimeframe(tf)}
                          className={cn(
                            suggestionTimeframe === tf && `bg-gradient-to-r ${config.color} border-0`
                          )}
                        >
                          <TfIcon className="h-4 w-4 mr-1" />
                          {config.label[language === 'es' ? 'es' : 'en']}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Suggestions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {GOAL_SUGGESTIONS[suggestionTimeframe].suggestions.map((suggestion, idx) => {
                      const SugIcon = suggestion.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAddSuggestion(suggestion[language === 'es' ? 'es' : 'en'])}
                          className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                        >
                          <div className={cn(
                            'p-1.5 rounded-lg',
                            `bg-gradient-to-r ${GOAL_SUGGESTIONS[suggestionTimeframe].color} bg-opacity-20`
                          )}>
                            <SugIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm flex-1">{suggestion[language === 'es' ? 'es' : 'en']}</span>
                          <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual Goal Input */}
              <div className="flex gap-2">
                <Input
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder={language === 'es' ? '✍️ Escribe tu propia meta...' : '✍️ Write your own goal...'}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                  className="border-2 focus:border-primary"
                />
                <Button 
                  onClick={handleAddGoal} 
                  disabled={!newGoalTitle.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </div>

              {/* Goals List */}
              <div className="space-y-2">
                {savedGoals?.map((goal, index) => (
                  <div
                    key={goal.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-md',
                      goal.isMostImportant 
                        ? 'border-amber-500 bg-gradient-to-r from-amber-500/10 to-yellow-500/10' 
                        : 'border-border/50 hover:border-primary/30'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="flex-1 font-medium">{goal.title}</span>
                    {goal.isMostImportant && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                        <Star className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Principal' : 'Main'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal.mutate(goal.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {(!savedGoals || savedGoals.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Target className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="font-medium">{language === 'es' ? 'Agrega tu primera meta' : 'Add your first goal'}</p>
                    <p className="text-sm mt-1">
                      {language === 'es' 
                        ? 'Usa las sugerencias arriba o escribe la tuya' 
                        : 'Use the suggestions above or write your own'}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {savedGoals?.length || 0}/10 {language === 'es' ? 'metas' : 'goals'}
                </span>
                <Button 
                  onClick={() => setCurrentStep(2)} 
                  disabled={!savedGoals || savedGoals.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-400">
                      ⭐ {language === 'es' ? '¿Cuál meta cambiaría MÁS tu vida?' : 'Which goal would MOST change your life?'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Elige LA meta que, si la lograras, tendría el mayor impacto positivo. Solo puede haber una.'
                        : 'Choose THE goal that, if achieved, would have the greatest positive impact. There can only be one.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {savedGoals?.map((goal, index) => (
                  <button
                    key={goal.id}
                    onClick={() => handleSetMostImportant(goal.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group',
                      goal.isMostImportant 
                        ? 'border-amber-500 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 ring-2 ring-amber-500/50 shadow-lg' 
                        : 'border-border/50 hover:border-amber-500/50 hover:bg-amber-500/5'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                      goal.isMostImportant 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500' 
                        : 'bg-muted group-hover:bg-amber-500/20'
                    )}>
                      {goal.isMostImportant ? (
                        <Star className="h-4 w-4 text-white fill-white" />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <span className="flex-1 font-medium">{goal.title}</span>
                    {goal.isMostImportant && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                        🏆 {language === 'es' ? 'Meta Principal' : 'Main Goal'}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)} 
                  disabled={!mainGoal}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                >
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Set Deadline */}
          {currentStep === 3 && mainGoal && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-400">
                      📅 {language === 'es' ? 'Una meta sin fecha es solo un deseo' : 'A goal without a deadline is just a wish'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'La fecha límite crea urgencia y activa tu mente subconsciente para encontrar soluciones.'
                        : 'The deadline creates urgency and activates your subconscious mind to find solutions.'}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="p-5 border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </div>
                  <span className="font-semibold text-lg">{mainGoal.title}</span>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">{language === 'es' ? '📆 Fecha límite' : '📆 Deadline'}</Label>
                  <Input
                    type="date"
                    value={mainGoal.deadline || ''}
                    onChange={(e) => handleSetDeadline(mainGoal.id, e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="border-2 focus:border-green-500"
                  />

                  {mainGoal.deadline && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        ⏰ {language === 'es' ? 'Faltan' : 'Remaining'}: {' '}
                        <span className="text-lg font-bold">
                          {differenceInDays(new Date(mainGoal.deadline), new Date())} {language === 'es' ? 'días' : 'days'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button 
                  onClick={() => setCurrentStep(4)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 & 5: List Tasks with ABCDE */}
          {(currentStep === 4 || currentStep === 5) && mainGoal && (
            <div className="space-y-4">
              <div className={cn(
                'p-4 rounded-xl border-2',
                currentStep === 4 
                  ? 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/30'
                  : 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30'
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    currentStep === 4 ? 'bg-purple-500/20' : 'bg-orange-500/20'
                  )}>
                    {currentStep === 4 ? <ListTodo className="h-5 w-5 text-purple-600" /> : <Zap className="h-5 w-5 text-orange-600" />}
                  </div>
                  <div>
                    <p className={cn(
                      'font-semibold',
                      currentStep === 4 ? 'text-purple-800 dark:text-purple-400' : 'text-orange-800 dark:text-orange-400'
                    )}>
                      {currentStep === 4 
                        ? `📝 ${language === 'es' ? 'Lista todo lo necesario' : 'List everything needed'}`
                        : `⚡ ${language === 'es' ? 'Método ABCDE de priorización' : 'ABCDE Prioritization Method'}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
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

              <Card className={cn(
                'p-5 border-2',
                currentStep === 4 
                  ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-violet-500/5'
                  : 'border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5'
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </div>
                  <span className="font-semibold text-lg">{mainGoal.title}</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={language === 'es' ? '✍️ Nueva tarea...' : '✍️ New task...'}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(mainGoal.id)}
                    className="border-2"
                  />
                  <Button 
                    onClick={() => handleAddTask(mainGoal.id)} 
                    disabled={!newTaskTitle.trim()}
                    className={cn(
                      currentStep === 4 
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                        : 'bg-gradient-to-r from-orange-500 to-red-500'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mainGoal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        task.completed && 'opacity-50 bg-green-500/5 border-green-500/30',
                        !task.completed && 'border-border/50 hover:border-primary/30'
                      )}
                    >
                      <button 
                        onClick={() => handleToggleTask(mainGoal.id, task.id)}
                        className="transition-transform hover:scale-110"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      
                      <span className={cn('flex-1 font-medium', task.completed && 'line-through text-muted-foreground')}>
                        {task.title}
                      </span>

                      <Select
                        value={task.priority}
                        onValueChange={(v) => handleUpdateTaskPriority(mainGoal.id, task.id, v as any)}
                      >
                        <SelectTrigger className="w-28 border-2">
                          <div className="flex items-center gap-1.5">
                            <div className={cn('w-3 h-3 rounded-full', PRIORITY_CONFIG[task.priority].color)} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {(['A', 'B', 'C', 'D', 'E'] as const).map(p => (
                            <SelectItem key={p} value={p}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full', PRIORITY_CONFIG[p].color)} />
                                <span className="font-medium">{p}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(mainGoal.id, task.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Priority Legend */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(p => (
                    <div key={p} className={cn(
                      'flex items-center gap-1.5 p-2 rounded-lg text-xs',
                      `bg-${PRIORITY_CONFIG[p].color.replace('bg-', '')}/10`
                    )}>
                      <div className={cn('w-3 h-3 rounded-full', PRIORITY_CONFIG[p].color)} />
                      <span className={cn('font-semibold', PRIORITY_CONFIG[p].textColor)}>
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button 
                  onClick={() => setCurrentStep(currentStep === 4 ? 5 : 6)}
                  className={cn(
                    currentStep === 4 
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  )}
                >
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
