import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileWarning, 
  Camera, 
  Users, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  AlertTriangle
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
          es: `${pendingDocuments} documento${pendingDocuments > 1 ? 's' : ''} sin clasificar`,
          en: `${pendingDocuments} unclassified document${pendingDocuments > 1 ? 's' : ''}`
        },
        actionLabel: { es: 'Clasificar', en: 'Classify' },
        path: '/chaos'
      };
    }

    // Priority 2: Incomplete expenses
    if (incompleteExpenses > 0) {
      return {
        id: 'incomplete-expenses',
        priority: 'medium',
        icon: FileWarning,
        message: {
          es: `${incompleteExpenses} gasto${incompleteExpenses > 1 ? 's' : ''} incompleto${incompleteExpenses > 1 ? 's' : ''}`,
          en: `${incompleteExpenses} incomplete expense${incompleteExpenses > 1 ? 's' : ''}`
        },
        actionLabel: { es: 'Completar', en: 'Complete' },
        path: '/expenses?incomplete=true'
      };
    }

    // Priority 3: No clients yet (onboarding hint)
    if (totalClients === 0) {
      return {
        id: 'add-client',
        priority: 'low',
        icon: Users,
        message: {
          es: 'Agrega tu primer cliente',
          en: 'Add your first client'
        },
        actionLabel: { es: 'Agregar', en: 'Add' },
        path: '/clients'
      };
    }

    return null;
  }, [pendingDocuments, incompleteExpenses, totalClients]);

  // All good - show compact success state
  if (!nextAction) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 py-2 px-4 rounded-lg",
        "bg-success/5 text-success/80 border border-success/10",
        "text-sm",
        className
      )}>
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">
          {language === 'es' ? '¡Todo al día!' : 'All caught up!'}
        </span>
      </div>
    );
  }

  const Icon = nextAction.icon;
  const isHighPriority = nextAction.priority === 'high';
  const isMediumPriority = nextAction.priority === 'medium';

  // Color schemes based on priority
  const colorScheme = isHighPriority 
    ? {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-400',
        iconBg: 'bg-amber-500/20',
        button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
      }
    : isMediumPriority
    ? {
        bg: 'bg-blue-500/10 dark:bg-blue-500/15',
        border: 'border-blue-500/30',
        text: 'text-blue-700 dark:text-blue-400',
        iconBg: 'bg-blue-500/20',
        button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
      }
    : {
        bg: 'bg-purple-500/10 dark:bg-purple-500/15',
        border: 'border-purple-500/30',
        text: 'text-purple-700 dark:text-purple-400',
        iconBg: 'bg-purple-500/20',
        button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
      };

  return (
    <div className={cn(
      "relative flex items-center justify-between gap-4 py-3 px-4 rounded-xl border transition-all",
      colorScheme.bg,
      colorScheme.border,
      isHighPriority && "animate-subtle-glow shadow-md",
      className
    )}>
      {/* Icon & Message */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
          colorScheme.iconBg,
          isHighPriority && "animate-pulse"
        )}>
          {isHighPriority ? (
            <AlertTriangle className={cn("h-5 w-5", colorScheme.text)} />
          ) : (
            <Icon className={cn("h-5 w-5", colorScheme.text)} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm truncate", colorScheme.text)}>
            {nextAction.message[language]}
          </p>
          <p className="text-xs text-muted-foreground">
            {isHighPriority 
              ? (language === 'es' ? 'Acción prioritaria' : 'Priority action')
              : (language === 'es' ? 'Sugerencia' : 'Suggestion')
            }
          </p>
        </div>
      </div>

      {/* Action Button */}
      <Button
        size="sm"
        onClick={() => navigate(nextAction.path)}
        className={cn(
          "shrink-0 shadow-md font-semibold",
          colorScheme.button,
          isHighPriority && "animate-guide-pulse"
        )}
      >
        {nextAction.actionLabel[language]}
        <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
    </div>
  );
}
