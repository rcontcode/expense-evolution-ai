import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  Lightbulb,
  Sparkles,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useClients } from "@/hooks/data/useClients";
import { useProjects } from "@/hooks/data/useProjects";
import { useContracts } from "@/hooks/data/useContracts";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useProfile } from "@/hooks/data/useProfile";

interface SetupStep {
  id: string;
  icon: React.ReactNode;
  title: { es: string; en: string };
  description: { es: string; en: string };
  action: { es: string; en: string };
  path: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface SetupProgressBannerProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export function SetupProgressBanner({ className, variant = 'full' }: SetupProgressBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(true);
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem('setup-banner-dismissed') === 'true';
  });

  // Fetch data to determine what's missing
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();
  const { data: contracts = [] } = useContracts();
  const { data: expenses = [] } = useExpenses();
  const { data: profile } = useProfile();
  
  // Check if profile is complete (has work type and province)
  const isProfileComplete = profile?.work_types && profile.work_types.length > 0 && profile.province;

  // Define setup steps with completion status
  const steps: SetupStep[] = React.useMemo(() => [
    {
      id: 'profile',
      icon: <User className="h-4 w-4" />,
      title: { es: 'Completar Perfil', en: 'Complete Profile' },
      description: { 
        es: 'Configura tu tipo de trabajo y provincia para cálculos de impuestos precisos',
        en: 'Set up your work type and province for accurate tax calculations'
      },
      action: { es: 'Completar perfil', en: 'Complete profile' },
      path: '/settings',
      completed: !!isProfileComplete,
      priority: 'high'
    },
    {
      id: 'clients',
      icon: <Users className="h-4 w-4" />,
      title: { es: 'Agregar Clientes', en: 'Add Clients' },
      description: { 
        es: 'Configura tus clientes para asociar gastos y generar reportes de reembolso',
        en: 'Set up your clients to associate expenses and generate reimbursement reports'
      },
      action: { es: 'Agregar cliente', en: 'Add client' },
      path: '/clients',
      completed: clients.length > 0,
      priority: 'high'
    },
    {
      id: 'projects',
      icon: <FolderKanban className="h-4 w-4" />,
      title: { es: 'Crear Proyectos', en: 'Create Projects' },
      description: { 
        es: 'Organiza tus gastos e ingresos por proyecto para mejor seguimiento',
        en: 'Organize your expenses and income by project for better tracking'
      },
      action: { es: 'Crear proyecto', en: 'Create project' },
      path: '/projects',
      completed: projects.length > 0,
      priority: 'medium'
    },
    {
      id: 'contracts',
      icon: <FileText className="h-4 w-4" />,
      title: { es: 'Subir Contratos', en: 'Upload Contracts' },
      description: { 
        es: 'Los contratos definen qué gastos son reembolsables por cada cliente',
        en: 'Contracts define which expenses are reimbursable by each client'
      },
      action: { es: 'Subir contrato', en: 'Upload contract' },
      path: '/contracts',
      completed: contracts.length > 0,
      priority: 'medium'
    },
    {
      id: 'expenses',
      icon: <Receipt className="h-4 w-4" />,
      title: { es: 'Registrar Gastos', en: 'Record Expenses' },
      description: { 
        es: 'Empieza a registrar tus gastos con fotos, voz o manualmente',
        en: 'Start recording your expenses with photos, voice or manually'
      },
      action: { es: 'Agregar gasto', en: 'Add expense' },
      path: '/expenses',
      completed: expenses.length > 0,
      priority: 'high'
    }
  ], [clients.length, projects.length, contracts.length, expenses.length, isProfileComplete]);

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const pendingSteps = steps.filter(s => !s.completed);
  const nextStep = pendingSteps[0];

  // Don't show if all complete or dismissed
  if (completedSteps === totalSteps || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('setup-banner-dismissed', 'true');
  };

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
          {language === 'es' 
            ? `Configura tu cuenta: ${completedSteps}/${totalSteps} pasos completados`
            : `Set up your account: ${completedSteps}/${totalSteps} steps completed`
          }
        </span>
        {nextStep && (
          <Button 
            size="sm" 
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
            onClick={() => navigate(nextStep.path)}
          >
            {nextStep.action[language]}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">
                  {language === 'es' ? '¡Configura tu cuenta!' : 'Set up your account!'}
                </h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                  {completedSteps}/{totalSteps}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {language === 'es' 
                  ? 'Completa estos pasos para aprovechar todas las funciones'
                  : 'Complete these steps to unlock all features'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Steps List */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                step.completed 
                  ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                  : "bg-card border-border hover:border-primary/50 hover:bg-accent/30"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                step.completed 
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {step.completed ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    step.completed && "line-through text-muted-foreground"
                  )}>
                    {step.title[language]}
                  </span>
                  {!step.completed && step.priority === 'high' && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      {language === 'es' ? 'Importante' : 'Important'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {step.description[language]}
                </p>
              </div>
              {!step.completed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => navigate(step.path)}
                >
                  {step.action[language]}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* Tip */}
          <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              {language === 'es' 
                ? 'Puedes usar la app sin completar todo, pero estos pasos mejoran tus reportes y organización.'
                : 'You can use the app without completing everything, but these steps improve your reports and organization.'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to reset the banner (for Settings)
export function useResetSetupBanner() {
  return () => {
    localStorage.removeItem('setup-banner-dismissed');
  };
}
