import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { useInvestmentGoals } from '@/hooks/data/useInvestmentGoals';
import { SMARTGoalWizard } from './SMARTGoalWizard';
import { Target, Plus, CheckCircle, Calendar, TrendingUp, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

interface GoalWithSMART {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  type: 'savings' | 'investment';
  is_specific?: boolean;
  is_measurable?: boolean;
  is_achievable?: boolean | null;
  is_relevant?: boolean;
  relevance_reason?: string;
  progress: number;
  daysRemaining: number | null;
}

export function SMARTGoalsCard() {
  const { language } = useLanguage();
  const [showWizard, setShowWizard] = useState(false);

  const { data: savingsGoals, isLoading: savingsLoading } = useSavingsGoals();
  const { data: investmentGoals, isLoading: investmentLoading } = useInvestmentGoals();

  const isLoading = savingsLoading || investmentLoading;

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

  // Combine and enrich goals with SMART data
  const allGoals: GoalWithSMART[] = [
    ...(savingsGoals || []).map(g => ({
      ...g,
      type: 'savings' as const,
      current_amount: g.current_amount || 0,
      color: g.color || '#10B981',
      progress: g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0,
      daysRemaining: g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null,
    })),
    ...(investmentGoals || []).map(g => ({
      ...g,
      type: 'investment' as const,
      current_amount: g.current_amount || 0,
      color: g.color || '#8B5CF6',
      progress: g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0,
      daysRemaining: g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null,
    })),
  ].sort((a, b) => {
    // Sort by deadline, closest first
    if (a.daysRemaining === null) return 1;
    if (b.daysRemaining === null) return -1;
    return a.daysRemaining - b.daysRemaining;
  });

  const activeGoals = allGoals.filter(g => g.progress < 100);
  const completedGoals = allGoals.filter(g => g.progress >= 100);

  const getSMARTScore = (goal: GoalWithSMART) => {
    let score = 0;
    if (goal.is_specific || goal.name.length >= 10) score++;
    if (goal.is_measurable !== false) score++; // Default true
    if (goal.is_achievable === true) score++;
    if (goal.is_relevant || (goal.relevance_reason && goal.relevance_reason.length > 10)) score++;
    if (goal.deadline) score++; // Time-bound
    return score;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              {language === 'es' ? 'Metas SMART' : 'SMART Goals'}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Brian Tracy
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground italic">
            "{language === 'es'
              ? 'Las metas son sueños con fecha límite'
              : 'Goals are dreams with deadlines'}"
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-around py-2 bg-muted/30 rounded-lg">
            <div className="text-center">
              <span className="text-xl font-bold">{activeGoals.length}</span>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'Activas' : 'Active'}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-xl font-bold text-green-600">{completedGoals.length}</span>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'Completadas' : 'Completed'}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-xl font-bold">
                {allGoals.length > 0
                  ? Math.round(allGoals.reduce((sum, g) => sum + getSMARTScore(g), 0) / allGoals.length * 20)
                  : 0}%
              </span>
              <p className="text-xs text-muted-foreground">SMART</p>
            </div>
          </div>

          {/* Goals List */}
          {activeGoals.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activeGoals.slice(0, 5).map((goal) => {
                const smartScore = getSMARTScore(goal);
                
                return (
                  <div
                    key={goal.id}
                    className="p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: goal.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{goal.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-[10px]">
                              {goal.type === 'savings'
                                ? (language === 'es' ? 'Ahorro' : 'Savings')
                                : (language === 'es' ? 'Inversión' : 'Investment')}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {smartScore}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      {goal.daysRemaining !== null && (
                        <Badge
                          variant={goal.daysRemaining < 30 ? 'destructive' : 'outline'}
                          className="text-[10px] flex-shrink-0"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {goal.daysRemaining > 0
                            ? `${goal.daysRemaining}d`
                            : (language === 'es' ? 'Vencida' : 'Overdue')}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                      </div>
                      <Progress
                        value={Math.min(goal.progress, 100)}
                        className="h-2"
                        style={{
                          ['--progress-background' as any]: goal.color,
                        }}
                      />
                      <p className="text-xs text-right text-muted-foreground">
                        {goal.progress.toFixed(1)}%
                      </p>
                    </div>

                    {/* SMART indicators */}
                    <div className="flex gap-1 mt-2">
                      {['S', 'M', 'A', 'R', 'T'].map((letter, i) => {
                        const isMet = i === 0 ? (goal.is_specific || goal.name.length >= 10)
                          : i === 1 ? goal.is_measurable !== false
                          : i === 2 ? goal.is_achievable === true
                          : i === 3 ? (goal.is_relevant || (goal.relevance_reason && goal.relevance_reason.length > 10))
                          : !!goal.deadline;
                        
                        return (
                          <span
                            key={letter}
                            className={cn(
                              'text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center',
                              isMet ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {letter}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === 'es'
                  ? 'No tienes metas activas. ¡Crea tu primera meta SMART!'
                  : 'No active goals. Create your first SMART goal!'}
              </p>
            </div>
          )}

          {/* Create Button */}
          <Button onClick={() => setShowWizard(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Crear Meta SMART' : 'Create SMART Goal'}
          </Button>

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {language === 'es'
                ? 'SMART = Específico, Medible, Alcanzable, Relevante, con Tiempo límite. Una meta 5/5 tiene 10x más probabilidades de éxito.'
                : 'SMART = Specific, Measurable, Achievable, Relevant, Time-bound. A 5/5 goal is 10x more likely to succeed.'}
            </p>
          </div>

          <LegalDisclaimer variant="education" size="compact" />
        </CardContent>
      </Card>

      <SMARTGoalWizard open={showWizard} onOpenChange={setShowWizard} />
    </>
  );
}
