import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Users,
  Calculator,
  Building2,
  PiggyBank,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
  PartyPopper
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkflowProgress } from "@/hooks/data/useWorkflowProgress";
import { useCelebrationSound } from "@/hooks/utils/useCelebrationSound";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface WorkflowConfig {
  id: string;
  title: { es: string; en: string };
  icon: React.ElementType;
  path: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const WORKFLOW_CONFIGS: WorkflowConfig[] = [
  {
    id: 'expense-capture',
    title: { es: 'Gastos', en: 'Expenses' },
    icon: Camera,
    path: '/expenses',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  {
    id: 'client-billing',
    title: { es: 'Clientes', en: 'Clients' },
    icon: Users,
    path: '/clients',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    borderColor: 'border-purple-300 dark:border-purple-700'
  },
  {
    id: 'tax-preparation',
    title: { es: 'Impuestos', en: 'Taxes' },
    icon: Calculator,
    path: '/dashboard',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    borderColor: 'border-emerald-300 dark:border-emerald-700'
  },
  {
    id: 'bank-reconciliation',
    title: { es: 'Banco', en: 'Banking' },
    icon: Building2,
    path: '/reconciliation',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    borderColor: 'border-indigo-300 dark:border-indigo-700'
  },
  {
    id: 'wealth-building',
    title: { es: 'Riqueza', en: 'Wealth' },
    icon: PiggyBank,
    path: '/net-worth',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    borderColor: 'border-amber-300 dark:border-amber-700'
  }
];

function WorkflowMiniCard({ 
  config, 
  onComplete 
}: { 
  config: WorkflowConfig;
  onComplete?: (workflowId: string) => void;
}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: progress, isLoading } = useWorkflowProgress(config.id);
  const previousProgressRef = React.useRef<number | null>(null);
  
  const Icon = config.icon;
  const progressPercent = progress 
    ? Math.round((progress.currentStep / (progress.totalSteps - 1)) * 100)
    : 0;

  // Detect when workflow reaches 100%
  React.useEffect(() => {
    if (previousProgressRef.current !== null && 
        previousProgressRef.current < 100 && 
        progressPercent === 100) {
      onComplete?.(config.id);
    }
    previousProgressRef.current = progressPercent;
  }, [progressPercent, config.id, onComplete]);

  // Determine status
  const getStatus = () => {
    if (!progress) return 'loading';
    if (progressPercent === 100) return 'complete';
    if (progressPercent > 0) return 'in-progress';
    return 'not-started';
  };

  const status = getStatus();

  // Get action items count
  const actionItems = progress?.stats.find(s => s.value > 0 && s.type === 'count')?.value || 0;

  return (
    <button
      onClick={() => navigate(config.path)}
      className={cn(
        "relative p-3 rounded-xl border-2 transition-all text-left group",
        "hover:shadow-md hover:scale-[1.02]",
        config.borderColor,
        status === 'complete' && "bg-success/5 border-success/30",
        status === 'in-progress' && "bg-primary/5",
        status === 'not-started' && "bg-muted/30"
      )}
    >
      {/* Status indicator */}
      <div className="absolute -top-1.5 -right-1.5">
        {status === 'complete' && (
          <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-success-foreground" />
          </div>
        )}
        {status === 'in-progress' && actionItems > 0 && (
          <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center shadow-sm">
            <span className="text-[10px] font-bold text-warning-foreground">{actionItems > 9 ? '9+' : actionItems}</span>
          </div>
        )}
        {status === 'not-started' && (
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
          "group-hover:scale-110",
          config.bgColor
        )}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
            {config.title[language]}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <span className={cn(
              "text-[10px] font-bold",
              status === 'complete' ? "text-success" : "text-muted-foreground"
            )}>
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function WorkflowSummaryWidget({ className }: { className?: string }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { playCelebrationSound, playFullCelebration } = useCelebrationSound();
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [celebratedWorkflow, setCelebratedWorkflow] = React.useState<string | null>(null);

  // Get all workflow progress data
  const workflows = WORKFLOW_CONFIGS.map(config => {
    const { data: progress } = useWorkflowProgress(config.id);
    return { config, progress };
  });

  // Calculate overall stats
  const totalProgress = workflows.reduce((sum, w) => {
    if (!w.progress) return sum;
    return sum + Math.round((w.progress.currentStep / (w.progress.totalSteps - 1)) * 100);
  }, 0);
  const averageProgress = Math.round(totalProgress / workflows.length);

  const completedWorkflows = workflows.filter(w => 
    w.progress && (w.progress.currentStep / (w.progress.totalSteps - 1)) === 1
  ).length;

  const totalActionItems = workflows.reduce((sum, w) => {
    if (!w.progress) return sum;
    const actionCount = w.progress.stats.find(s => s.value > 0 && s.type === 'count')?.value || 0;
    return sum + actionCount;
  }, 0);

  // Handle workflow completion celebration
  const handleWorkflowComplete = React.useCallback((workflowId: string) => {
    setCelebratedWorkflow(workflowId);
    setShowCelebration(true);
    
    // Play celebration sound
    playFullCelebration();
    
    // Fire confetti from both sides
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Confetti from left
      confetti({
        particleCount: Math.floor(particleCount / 2),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']
      });
      
      // Confetti from right  
      confetti({
        particleCount: Math.floor(particleCount / 2),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']
      });
    }, 250);
    
    // Hide celebration message after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setCelebratedWorkflow(null);
    }, 5000);
  }, [playFullCelebration]);

  // Get workflow name for celebration message
  const getCelebratedWorkflowName = () => {
    const workflow = WORKFLOW_CONFIGS.find(w => w.id === celebratedWorkflow);
    return workflow?.title[language] || '';
  };

  return (
    <Card className={cn(
      "overflow-hidden border-2",
      "bg-gradient-to-br from-background via-muted/20 to-background",
      className
    )}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'es' ? 'Estado de Flujos' : 'Workflow Status'}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {language === 'es' 
                  ? `${completedWorkflows}/${workflows.length} completados`
                  : `${completedWorkflows}/${workflows.length} complete`
                }
              </p>
            </div>
          </div>
          
          {/* Overall progress circle */}
          <div className="flex items-center gap-3">
            {totalActionItems > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {totalActionItems} {language === 'es' ? 'pendientes' : 'pending'}
              </Badge>
            )}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  className="text-muted"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="24"
                  cy="24"
                />
                <circle
                  className="text-primary transition-all duration-500"
                  strokeWidth="3"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (averageProgress / 100) * 125.6}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="24"
                  cy="24"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {averageProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Celebration banner */}
        {showCelebration && (
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-success/20 via-primary/20 to-warning/20 border-2 border-success/40 animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="h-5 w-5 text-success animate-bounce" />
              <span className="font-bold text-success">
                {language === 'es' 
                  ? `¡Felicidades! Completaste el flujo de ${getCelebratedWorkflowName()}!`
                  : `Congratulations! You completed the ${getCelebratedWorkflowName()} workflow!`
                }
              </span>
              <PartyPopper className="h-5 w-5 text-success animate-bounce" />
            </div>
          </div>
        )}

        {/* Workflow grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {WORKFLOW_CONFIGS.map(config => (
            <WorkflowMiniCard 
              key={config.id} 
              config={config} 
              onComplete={handleWorkflowComplete}
            />
          ))}
        </div>

        {/* Quick insight */}
        {totalActionItems > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs">
                  {language === 'es' 
                    ? `Tienes ${totalActionItems} items que requieren atención`
                    : `You have ${totalActionItems} items requiring attention`
                  }
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => navigate('/expenses?incomplete=true')}
              >
                {language === 'es' ? 'Ver' : 'View'}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
