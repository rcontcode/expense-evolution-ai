import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnboardingProgress, OnboardingGoal } from '@/hooks/utils/useOnboardingProgress';
import { CheckCircle2, Circle, ArrowRight, Sparkles, X, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface GoalCardProps {
  goal: OnboardingGoal;
  language: 'es' | 'en';
  onStart: () => void;
  isNext: boolean;
}

function GoalCard({ goal, language, onStart, isNext }: GoalCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all duration-200',
        goal.completed 
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
          : isNext 
            ? 'bg-primary/5 border-primary/30 shadow-sm'
            : 'bg-muted/30 border-border/50'
      )}
    >
      <div className="mt-0.5">
        {goal.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className={cn(
            'h-5 w-5',
            isNext ? 'text-primary' : 'text-muted-foreground/50'
          )} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-sm',
          goal.completed && 'text-emerald-700 dark:text-emerald-300 line-through'
        )}>
          {goal.label[language]}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {goal.description[language]}
        </p>
      </div>
      
      {!goal.completed && (
        <Button
          size="sm"
          variant={isNext ? 'default' : 'ghost'}
          onClick={onStart}
          className="shrink-0"
        >
          {language === 'es' ? 'Ir' : 'Go'}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function ProgressiveOnboarding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { goals, completedCount, totalCount, isComplete, isLoading, isDismissed, dismiss } = useOnboardingProgress();
  
  const [visible, setVisible] = useState(!isDismissed);
  const [celebrated, setCelebrated] = useState(false);

  // Listen for storage changes (dismiss)
  useEffect(() => {
    const handleStorage = () => {
      const dismissed = localStorage.getItem('onboarding-dismissed') === 'true';
      setVisible(!dismissed);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Celebrate when all goals are complete
  useEffect(() => {
    if (isComplete && !celebrated && !isLoading) {
      setCelebrated(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });
    }
  }, [isComplete, celebrated, isLoading]);

  // Don't show if dismissed, complete, or loading
  if (!visible || isLoading) return null;
  if (isComplete) return null;

  const progressPercent = (completedCount / totalCount) * 100;
  const nextGoal = goals.find(g => !g.completed);

  const handleStart = (goal: OnboardingGoal) => {
    navigate(goal.route);
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === 'es' ? '¡Bienvenido! Comienza aquí' : 'Welcome! Start here'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Completa estas 3 misiones para dominar EvoFinz' 
                  : 'Complete these 3 missions to master EvoFinz'}
              </CardDescription>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'es' ? 'Progreso' : 'Progress'}
            </span>
            <span className="font-medium text-primary">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 relative">
        {goals.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            language={language as 'es' | 'en'}
            onStart={() => handleStart(goal)}
            isNext={nextGoal?.id === goal.id}
          />
        ))}
        
        {/* Motivational message */}
        <div className="flex items-center gap-2 mt-4 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {language === 'es' 
              ? '¡Cada paso te acerca a tener control total de tus finanzas!'
              : 'Each step brings you closer to having total control of your finances!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
