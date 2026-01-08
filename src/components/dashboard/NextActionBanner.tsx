import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  FileWarning, 
  Camera, 
  Users, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NextActionBannerProps {
  pendingDocuments: number;
  incompleteExpenses: number;
  totalClients: number;
  className?: string;
}

type ActionPriority = 'high' | 'medium' | 'low' | 'none';

interface NextAction {
  id: string;
  priority: ActionPriority;
  icon: React.ElementType;
  message: { es: string; en: string };
  actionLabel: { es: string; en: string };
  path: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function NextActionBanner({ 
  pendingDocuments, 
  incompleteExpenses, 
  totalClients,
  className 
}: NextActionBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Determine the most important next action
  const nextAction = useMemo((): NextAction | null => {
    // Priority 1: Pending documents (high urgency)
    if (pendingDocuments > 0) {
      return {
        id: 'pending-docs',
        priority: 'high',
        icon: Camera,
        message: {
          es: `Tienes ${pendingDocuments} documento${pendingDocuments > 1 ? 's' : ''} sin clasificar`,
          en: `You have ${pendingDocuments} unclassified document${pendingDocuments > 1 ? 's' : ''}`
        },
        actionLabel: { es: 'Clasificar Ahora', en: 'Classify Now' },
        path: '/chaos',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-300 dark:border-amber-700'
      };
    }

    // Priority 2: Incomplete expenses
    if (incompleteExpenses > 0) {
      return {
        id: 'incomplete-expenses',
        priority: 'medium',
        icon: FileWarning,
        message: {
          es: `${incompleteExpenses} gasto${incompleteExpenses > 1 ? 's' : ''} necesita${incompleteExpenses > 1 ? 'n' : ''} información`,
          en: `${incompleteExpenses} expense${incompleteExpenses > 1 ? 's' : ''} need${incompleteExpenses === 1 ? 's' : ''} information`
        },
        actionLabel: { es: 'Completar', en: 'Complete' },
        path: '/expenses?incomplete=true',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-300 dark:border-blue-700'
      };
    }

    // Priority 3: No clients yet (onboarding hint)
    if (totalClients === 0) {
      return {
        id: 'add-client',
        priority: 'low',
        icon: Users,
        message: {
          es: 'Agrega tu primer cliente para organizar mejor',
          en: 'Add your first client to organize better'
        },
        actionLabel: { es: 'Agregar Cliente', en: 'Add Client' },
        path: '/clients',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        borderColor: 'border-purple-300 dark:border-purple-700'
      };
    }

    return null;
  }, [pendingDocuments, incompleteExpenses, totalClients]);

  // All good - show success state briefly or nothing
  if (!nextAction) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 py-2 px-4 rounded-lg",
        "bg-success/10 text-success border border-success/20",
        className
      )}>
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">
          {language === 'es' ? '¡Todo al día!' : 'All caught up!'}
        </span>
      </div>
    );
  }

  const Icon = nextAction.icon;
  const isHighPriority = nextAction.priority === 'high';

  return (
    <div className={cn(
      "relative flex items-center justify-between gap-4 p-4 rounded-xl border-2 transition-all",
      nextAction.bgColor,
      nextAction.borderColor,
      isHighPriority && "animate-subtle-glow",
      className
    )}>
      {/* Icon & Message */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          nextAction.bgColor,
          "border-2",
          nextAction.borderColor,
          isHighPriority && "animate-pulse"
        )}>
          <Icon className={cn("h-5 w-5", nextAction.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isHighPriority && (
              <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
            )}
            <p className={cn("font-semibold truncate", nextAction.color)}>
              {nextAction.message[language]}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'Acción recomendada' : 'Recommended action'}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={() => navigate(nextAction.path)}
        className={cn(
          "shrink-0 shadow-md",
          isHighPriority && "animate-guide-pulse"
        )}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {nextAction.actionLabel[language]}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      {/* Subtle glow effect for high priority */}
      {isHighPriority && (
        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 blur-xl" />
      )}
    </div>
  );
}
