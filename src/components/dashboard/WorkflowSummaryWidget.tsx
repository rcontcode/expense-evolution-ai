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
import { useConfetti } from '@/hooks/utils/useConfetti';

interface WorkflowConfig {
  id: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
  hint: { es: string; en: string };
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
    description: { es: 'Captura y categoriza tus gastos', en: 'Capture and categorize expenses' },
    hint: { es: 'Revisa gastos sin categoría o pendientes de aprobación', en: 'Review uncategorized or pending expenses' },
    icon: Camera,
    path: '/expenses',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  {
    id: 'client-billing',
    title: { es: 'Clientes', en: 'Clients' },
    description: { es: 'Gestiona clientes y facturación', en: 'Manage clients and billing' },
    hint: { es: 'Asigna gastos a clientes para reportes y cobros', en: 'Assign expenses to clients for reports' },
    icon: Users,
    path: '/clients',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    borderColor: 'border-purple-300 dark:border-purple-700'
  },
  {
    id: 'tax-preparation',
    title: { es: 'Contador', en: 'Accountant' },
    description: { es: 'Prepara tu reporte fiscal', en: 'Prepare your tax report' },
    hint: { es: 'Captura, categoriza y exporta para CRA/SII', en: 'Capture, categorize and export for CRA/SII' },
    icon: Calculator,
    path: '/tax-report-flow',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    borderColor: 'border-emerald-300 dark:border-emerald-700'
  },
  {
    id: 'bank-reconciliation',
    title: { es: 'Banco', en: 'Banking' },
    description: { es: 'Concilia transacciones bancarias', en: 'Reconcile bank transactions' },
    hint: { es: 'Importa estados de cuenta y empareja con gastos', en: 'Import statements and match with expenses' },
    icon: Building2,
    path: '/banking',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    borderColor: 'border-indigo-300 dark:border-indigo-700'
  },
  {
    id: 'wealth-building',
    title: { es: 'Riqueza', en: 'Wealth' },
    description: { es: 'Haz crecer tu patrimonio neto', en: 'Grow your net worth' },
    hint: { es: 'Registra activos, pasivos y metas de inversión', en: 'Track assets, liabilities and goals' },
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
  const { fire: confetti } = useConfetti();
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
  const { fire: confetti } = useConfetti();
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
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 px-4 py-2.5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
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
          
          <div className="flex items-center gap-3">
            {totalActionItems > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {totalActionItems} {language === 'es' ? 'pendientes' : 'pending'}
              </Badge>
            )}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle
                  className="text-muted"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  fill="transparent"
                  r="16"
                  cx="20"
                  cy="20"
                />
                <circle
                  className="text-primary transition-all duration-500"
                  strokeWidth="2.5"
                  strokeDasharray={100.5}
                  strokeDashoffset={100.5 - (averageProgress / 100) * 100.5}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="16"
                  cx="20"
                  cy="20"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {averageProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-3">
        {/* Celebration banner */}
        {showCelebration && (
          <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-success/20 via-primary/20 to-warning/20 border-2 border-success/40 animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <PartyPopper className="h-4 w-4 text-success animate-bounce" />
              <span className="font-bold text-sm text-success">
                {language === 'es' 
                  ? `¡Completaste ${getCelebratedWorkflowName()}!`
                  : `Completed ${getCelebratedWorkflowName()}!`
                }
              </span>
              <PartyPopper className="h-4 w-4 text-success animate-bounce" />
            </div>
          </div>
        )}

        {/* Horizontal workflow cards */}
        <div className="grid grid-cols-5 gap-2">
          {workflows.map(({ config, progress }) => {
            const Icon = config.icon;
            const progressPercent = progress 
              ? Math.round((progress.currentStep / (progress.totalSteps - 1)) * 100)
              : 0;
            const actionItems = progress?.stats.find(s => s.value > 0 && s.type === 'count')?.value || 0;
            
            return (
              <button
                key={config.id}
                onClick={() => navigate(config.path)}
                className={cn(
                  "relative p-2.5 rounded-xl border-2 transition-all text-left group",
                  "hover:shadow-md hover:scale-[1.03]",
                  config.borderColor,
                  progressPercent === 100 && "bg-success/5 border-success/30",
                )}
              >
                {/* Status badge */}
                {actionItems > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-warning flex items-center justify-center shadow-sm z-10">
                    <span className="text-[10px] font-bold text-warning-foreground">{actionItems > 9 ? '9+' : actionItems}</span>
                  </div>
                )}
                {progressPercent === 100 && actionItems === 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-success flex items-center justify-center shadow-sm z-10">
                    <CheckCircle2 className="h-3 w-3 text-success-foreground" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    config.bgColor
                  )}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <span className="text-xs font-semibold truncate">{config.title[language]}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Progress value={progressPercent} className="h-1.5 flex-1" />
                  <span className={cn(
                    "text-[10px] font-bold shrink-0",
                    progressPercent === 100 ? "text-success" : "text-muted-foreground"
                  )}>
                    {progressPercent}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom insight bar */}
        <div className="mt-2.5">
          {totalActionItems > 0 ? (
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
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
                  className="h-6 text-xs px-2"
                  onClick={() => navigate('/expenses?incomplete=true')}
                >
                  {language === 'es' ? 'Ver' : 'View'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-gradient-to-r from-success/5 to-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <p className="text-xs text-success font-medium">
                  {language === 'es' 
                    ? '¡Todo al día! No hay acciones pendientes.'
                    : 'All caught up! No pending actions.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
