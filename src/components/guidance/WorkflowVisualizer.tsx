import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Receipt,
  CheckCircle2,
  FileText,
  Users,
  DollarSign,
  ArrowRight,
  Sparkles,
  Building2,
  TrendingUp,
  Wallet,
  Car,
  Upload,
  Search,
  FileCheck,
  Send,
  Calculator,
  PiggyBank,
  Target,
  Award,
  Landmark,
  CreditCard,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Eye,
  Tag,
  ClipboardCheck,
  Download,
  ChevronRight,
  Play,
  Circle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useWorkflowProgress } from "@/hooks/data/useWorkflowProgress";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  icon: React.ElementType;
  title: { es: string; en: string };
  description: { es: string; en: string };
  color: string;
  bgColor: string;
  borderColor: string;
}

interface Workflow {
  id: string;
  title: { es: string; en: string };
  subtitle: { es: string; en: string };
  icon: React.ElementType;
  accentColor: string;
  bgGradient: string;
  steps: WorkflowStep[];
  ctaPath: string;
  ctaLabel: { es: string; en: string };
}

const WORKFLOWS: Workflow[] = [
  {
    id: 'expense-capture',
    title: { es: '📸 Captura de Gastos', en: '📸 Expense Capture' },
    subtitle: { 
      es: 'Del recibo al reporte en minutos', 
      en: 'From receipt to report in minutes' 
    },
    icon: Camera,
    accentColor: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    ctaPath: '/capture',
    ctaLabel: { es: 'Comenzar Captura', en: 'Start Capture' },
    steps: [
      {
        id: 'capture',
        icon: Camera,
        title: { es: 'Capturar', en: 'Capture' },
        description: { es: 'Foto, voz o texto', en: 'Photo, voice or text' },
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        borderColor: 'border-blue-300 dark:border-blue-700'
      },
      {
        id: 'extract',
        icon: Sparkles,
        title: { es: 'Extraer', en: 'Extract' },
        description: { es: 'IA lee el recibo', en: 'AI reads receipt' },
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        borderColor: 'border-purple-300 dark:border-purple-700'
      },
      {
        id: 'review',
        icon: Eye,
        title: { es: 'Revisar', en: 'Review' },
        description: { es: 'Verifica datos', en: 'Verify data' },
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        borderColor: 'border-amber-300 dark:border-amber-700'
      },
      {
        id: 'classify',
        icon: Tag,
        title: { es: 'Clasificar', en: 'Classify' },
        description: { es: 'Cliente + CRA', en: 'Client + CRA' },
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/40',
        borderColor: 'border-green-300 dark:border-green-700'
      },
      {
        id: 'done',
        icon: CheckCircle2,
        title: { es: '¡Listo!', en: 'Done!' },
        description: { es: 'Organizado', en: 'Organized' },
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
        borderColor: 'border-emerald-300 dark:border-emerald-700'
      }
    ]
  },
  {
    id: 'client-billing',
    title: { es: '💼 Facturación a Cliente', en: '💼 Client Billing' },
    subtitle: { 
      es: 'Genera reportes de reembolso profesionales', 
      en: 'Generate professional reimbursement reports' 
    },
    icon: Users,
    accentColor: 'text-purple-600 dark:text-purple-400',
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    ctaPath: '/clients',
    ctaLabel: { es: 'Ver Clientes', en: 'View Clients' },
    steps: [
      {
        id: 'client',
        icon: Users,
        title: { es: 'Cliente', en: 'Client' },
        description: { es: 'Crear perfil', en: 'Create profile' },
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        borderColor: 'border-purple-300 dark:border-purple-700'
      },
      {
        id: 'contract',
        icon: FileText,
        title: { es: 'Contrato', en: 'Contract' },
        description: { es: 'Subir términos', en: 'Upload terms' },
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
        borderColor: 'border-indigo-300 dark:border-indigo-700'
      },
      {
        id: 'assign',
        icon: Receipt,
        title: { es: 'Asignar', en: 'Assign' },
        description: { es: 'Vincular gastos', en: 'Link expenses' },
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        borderColor: 'border-blue-300 dark:border-blue-700'
      },
      {
        id: 'generate',
        icon: FileCheck,
        title: { es: 'Generar', en: 'Generate' },
        description: { es: 'Crear reporte', en: 'Create report' },
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        borderColor: 'border-amber-300 dark:border-amber-700'
      },
      {
        id: 'send',
        icon: Send,
        title: { es: 'Enviar', en: 'Send' },
        description: { es: 'Al cliente', en: 'To client' },
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/40',
        borderColor: 'border-green-300 dark:border-green-700'
      }
    ]
  },
  {
    id: 'tax-preparation',
    title: { es: '📊 Preparación CRA', en: '📊 CRA Preparation' },
    subtitle: { 
      es: 'Maximiza tus deducciones fiscales', 
      en: 'Maximize your tax deductions' 
    },
    icon: Calculator,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    ctaPath: '/dashboard',
    ctaLabel: { es: 'Ver Dashboard', en: 'View Dashboard' },
    steps: [
      {
        id: 'categorize',
        icon: Tag,
        title: { es: 'Categorizar', en: 'Categorize' },
        description: { es: 'Por tipo CRA', en: 'By CRA type' },
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        borderColor: 'border-blue-300 dark:border-blue-700'
      },
      {
        id: 'calculate',
        icon: Calculator,
        title: { es: 'Calcular', en: 'Calculate' },
        description: { es: 'Deducciones', en: 'Deductions' },
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        borderColor: 'border-purple-300 dark:border-purple-700'
      },
      {
        id: 'optimize',
        icon: TrendingUp,
        title: { es: 'Optimizar', en: 'Optimize' },
        description: { es: 'IA sugiere', en: 'AI suggests' },
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        borderColor: 'border-amber-300 dark:border-amber-700'
      },
      {
        id: 'export',
        icon: Download,
        title: { es: 'Exportar', en: 'Export' },
        description: { es: 'Formato T2125', en: 'T2125 format' },
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
        borderColor: 'border-emerald-300 dark:border-emerald-700'
      },
      {
        id: 'file',
        icon: Landmark,
        title: { es: 'Declarar', en: 'File' },
        description: { es: 'Con tu contador', en: 'With accountant' },
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/40',
        borderColor: 'border-green-300 dark:border-green-700'
      }
    ]
  },
  {
    id: 'bank-reconciliation',
    title: { es: '🏦 Conciliación Bancaria', en: '🏦 Bank Reconciliation' },
    subtitle: { 
      es: 'Empareja banco con tus registros', 
      en: 'Match bank with your records' 
    },
    icon: Building2,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    ctaPath: '/reconciliation',
    ctaLabel: { es: 'Iniciar Conciliación', en: 'Start Reconciliation' },
    steps: [
      {
        id: 'import',
        icon: Upload,
        title: { es: 'Importar', en: 'Import' },
        description: { es: 'Estado bancario', en: 'Bank statement' },
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
        borderColor: 'border-indigo-300 dark:border-indigo-700'
      },
      {
        id: 'analyze',
        icon: Search,
        title: { es: 'Analizar', en: 'Analyze' },
        description: { es: 'IA detecta', en: 'AI detects' },
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        borderColor: 'border-purple-300 dark:border-purple-700'
      },
      {
        id: 'match',
        icon: RefreshCw,
        title: { es: 'Emparejar', en: 'Match' },
        description: { es: 'Auto + manual', en: 'Auto + manual' },
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        borderColor: 'border-blue-300 dark:border-blue-700'
      },
      {
        id: 'review-unmatched',
        icon: AlertTriangle,
        title: { es: 'Revisar', en: 'Review' },
        description: { es: 'Sin emparejar', en: 'Unmatched' },
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        borderColor: 'border-amber-300 dark:border-amber-700'
      },
      {
        id: 'reconciled',
        icon: ClipboardCheck,
        title: { es: 'Conciliado', en: 'Reconciled' },
        description: { es: '100% preciso', en: '100% accurate' },
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/40',
        borderColor: 'border-green-300 dark:border-green-700'
      }
    ]
  },
  {
    id: 'wealth-building',
    title: { es: '💰 Construcción de Riqueza', en: '💰 Wealth Building' },
    subtitle: { 
      es: 'Sigue el camino hacia la libertad financiera', 
      en: 'Follow the path to financial freedom' 
    },
    icon: PiggyBank,
    accentColor: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    ctaPath: '/net-worth',
    ctaLabel: { es: 'Ver Patrimonio', en: 'View Net Worth' },
    steps: [
      {
        id: 'track',
        icon: BarChart3,
        title: { es: 'Registrar', en: 'Track' },
        description: { es: 'Ingresos/gastos', en: 'Income/expenses' },
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        borderColor: 'border-blue-300 dark:border-blue-700'
      },
      {
        id: 'save',
        icon: PiggyBank,
        title: { es: 'Ahorrar', en: 'Save' },
        description: { es: 'Págate primero', en: 'Pay yourself first' },
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        borderColor: 'border-purple-300 dark:border-purple-700'
      },
      {
        id: 'invest',
        icon: TrendingUp,
        title: { es: 'Invertir', en: 'Invest' },
        description: { es: 'RRSP/TFSA', en: 'RRSP/TFSA' },
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
        borderColor: 'border-emerald-300 dark:border-emerald-700'
      },
      {
        id: 'grow',
        icon: Wallet,
        title: { es: 'Crecer', en: 'Grow' },
        description: { es: 'Patrimonio neto', en: 'Net worth' },
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        borderColor: 'border-amber-300 dark:border-amber-700'
      },
      {
        id: 'freedom',
        icon: Award,
        title: { es: 'Libertad', en: 'Freedom' },
        description: { es: '¡FIRE!', en: 'FIRE!' },
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/40',
        borderColor: 'border-orange-300 dark:border-orange-700'
      }
    ]
  }
];

interface WorkflowCardProps {
  workflow: Workflow;
  isCompact?: boolean;
}

function WorkflowCard({ workflow, isCompact = false }: WorkflowCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const Icon = workflow.icon;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-lg border-2",
      "hover:border-primary/30"
    )}>
      <div className={cn("bg-gradient-to-r p-4", workflow.bgGradient)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-white/80 dark:bg-gray-900/80 shadow-sm"
          )}>
            <Icon className={cn("h-6 w-6", workflow.accentColor)} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{workflow.title[language]}</h3>
            <p className="text-sm text-muted-foreground">{workflow.subtitle[language]}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-5">
        {/* Steps visualization */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 dark:from-blue-800 dark:via-purple-800 dark:to-green-800 z-0" />
          
          <div className="relative z-10 flex justify-between">
            {workflow.steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center group">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "border-2 transition-all duration-200",
                    "group-hover:scale-110 group-hover:shadow-md",
                    step.bgColor,
                    step.borderColor
                  )}>
                    <StepIcon className={cn("h-5 w-5", step.color)} />
                  </div>
                  <div className="mt-2 text-center max-w-[70px]">
                    <p className={cn("text-xs font-semibold", step.color)}>
                      {step.title[language]}
                    </p>
                    {!isCompact && (
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {step.description[language]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Button 
          className="w-full mt-5"
          onClick={() => navigate(workflow.ctaPath)}
        >
          <Play className="h-4 w-4 mr-2" />
          {workflow.ctaLabel[language]}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface WorkflowVisualizerProps {
  showAll?: boolean;
  selectedWorkflows?: string[];
  className?: string;
  compact?: boolean;
}

export function WorkflowVisualizer({ 
  showAll = true, 
  selectedWorkflows,
  className,
  compact = false
}: WorkflowVisualizerProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || '';

  const displayedWorkflows = showAll 
    ? WORKFLOWS 
    : WORKFLOWS.filter(w => selectedWorkflows?.includes(w.id));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {language === 'es' 
            ? `${firstName ? `${firstName}, ` : ''}¿Qué flujo necesitas hoy?`
            : `${firstName ? `${firstName}, ` : ''}What workflow do you need today?`
          }
        </h2>
        <p className="text-muted-foreground">
          {language === 'es'
            ? 'Cada flujo te guía paso a paso hacia tu objetivo'
            : 'Each workflow guides you step by step to your goal'
          }
        </p>
      </div>

      {/* Workflows grid */}
      <div className={cn(
        "grid gap-6",
        displayedWorkflows.length === 1 
          ? "grid-cols-1" 
          : displayedWorkflows.length === 2 
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {displayedWorkflows.map(workflow => (
          <WorkflowCard 
            key={workflow.id} 
            workflow={workflow}
            isCompact={compact}
          />
        ))}
      </div>
    </div>
  );
}

// Export individual workflow for use in specific pages
export function SingleWorkflow({ workflowId }: { workflowId: string }) {
  const workflow = WORKFLOWS.find(w => w.id === workflowId);
  if (!workflow) return null;
  return <WorkflowCard workflow={workflow} />;
}

// Mini workflow with dynamic progress indicator
export function MiniWorkflow({ workflowId }: { workflowId: string }) {
  const { language } = useLanguage();
  const { data: progress, isLoading } = useWorkflowProgress(workflowId);
  const workflow = WORKFLOWS.find(w => w.id === workflowId);
  if (!workflow) return null;

  // Get step status from progress data
  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' => {
    if (!progress) return 'pending';
    const stepDetail = progress.stepDetails.find(s => s.stepId === stepId);
    return stepDetail?.status || 'pending';
  };

  const getStepCount = (stepId: string): number | undefined => {
    if (!progress) return undefined;
    const stepDetail = progress.stepDetails.find(s => s.stepId === stepId);
    return stepDetail?.count;
  };

  const progressPercent = progress 
    ? Math.round((progress.currentStep / (progress.totalSteps - 1)) * 100)
    : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar with stats */}
      <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary truncate">
              {workflow.title[language]}
            </p>
            <Progress value={progressPercent} className="h-1.5 w-24 mt-1" />
          </div>
        </div>
        
        {/* Stats badges */}
        {progress && progress.stats.length > 0 && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {progress.stats.slice(0, 3).map((stat, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className={cn(
                  "text-xs",
                  stat.value > 0 && stat.type === 'count' && idx === 0 
                    ? "bg-warning/10 text-warning border-warning/30" 
                    : "bg-muted/50"
                )}
              >
                {stat.type === 'currency' 
                  ? `$${stat.value.toLocaleString()}`
                  : stat.value
                } {stat.label[language]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Steps with dynamic status */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 overflow-x-auto">
        {workflow.steps.map((step, idx) => {
          const StepIcon = step.icon;
          const status = getStepStatus(step.id);
          const count = getStepCount(step.id);
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-1.5 shrink-0 relative">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center relative transition-all",
                  status === 'completed' && "bg-success/20 ring-2 ring-success/50",
                  status === 'current' && "bg-primary/20 ring-2 ring-primary animate-pulse",
                  status === 'pending' && step.bgColor
                )}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <StepIcon className={cn(
                      "h-4 w-4",
                      status === 'current' ? "text-primary" : step.color
                    )} />
                  )}
                  
                  {/* Count badge */}
                  {count !== undefined && count > 0 && status !== 'completed' && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold",
                      "flex items-center justify-center",
                      status === 'current' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-warning text-warning-foreground"
                    )}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    status === 'completed' && "text-success",
                    status === 'current' && "text-primary font-semibold",
                    status === 'pending' && "text-muted-foreground"
                  )}>
                    {step.title[language]}
                  </span>
                  {status === 'current' && (
                    <span className="text-[10px] text-primary/70">
                      {language === 'es' ? 'Paso actual' : 'Current'}
                    </span>
                  )}
                </div>
              </div>
              {idx < workflow.steps.length - 1 && (
                <ArrowRight className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  status === 'completed' ? "text-success" : "text-muted-foreground/50"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export { WORKFLOWS };
