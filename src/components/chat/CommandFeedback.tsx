import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Navigation,
  Search,
  Lightbulb,
  MessageSquare,
  Zap,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface CommandFeedbackProps {
  action: string | null;
  target: string | null;
  status: 'executing' | 'success' | 'error' | null;
  message?: string;
  language: 'es' | 'en';
  onComplete?: () => void;
}

const ACTION_CONFIG: Record<string, {
  icon: React.ElementType;
  executingLabel: { es: string; en: string };
  successLabel: { es: string; en: string };
  color: string;
  bgColor: string;
}> = {
  navigate: {
    icon: Navigation,
    executingLabel: { es: 'Navegando...', en: 'Navigating...' },
    successLabel: { es: '¡Listo!', en: 'Done!' },
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  query: {
    icon: Search,
    executingLabel: { es: 'Buscando datos...', en: 'Fetching data...' },
    successLabel: { es: 'Datos encontrados', en: 'Data found' },
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  clarify: {
    icon: Lightbulb,
    executingLabel: { es: 'Aclarando...', en: 'Clarifying...' },
    successLabel: { es: 'Opciones listas', en: 'Options ready' },
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  explain: {
    icon: MessageSquare,
    executingLabel: { es: 'Explicando...', en: 'Explaining...' },
    successLabel: { es: 'Explicación lista', en: 'Explanation ready' },
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  action: {
    icon: Zap,
    executingLabel: { es: 'Ejecutando...', en: 'Executing...' },
    successLabel: { es: 'Completado', en: 'Completed' },
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

const TARGET_NAMES: Record<string, { es: string; en: string }> = {
  expenses: { es: 'Gastos', en: 'Expenses' },
  income: { es: 'Ingresos', en: 'Income' },
  clients: { es: 'Clientes', en: 'Clients' },
  projects: { es: 'Proyectos', en: 'Projects' },
  contracts: { es: 'Contratos', en: 'Contracts' },
  dashboard: { es: 'Dashboard', en: 'Dashboard' },
  mileage: { es: 'Kilometraje', en: 'Mileage' },
  networth: { es: 'Patrimonio', en: 'Net Worth' },
  banking: { es: 'Banca', en: 'Banking' },
  settings: { es: 'Configuración', en: 'Settings' },
  mentorship: { es: 'Mentoría', en: 'Mentorship' },
  taxes: { es: 'Impuestos', en: 'Taxes' },
  capture: { es: 'Captura', en: 'Capture' },
  chaos: { es: 'Revisión', en: 'Review' },
};

export const CommandFeedback: React.FC<CommandFeedbackProps> = ({
  action,
  target,
  status,
  message,
  language,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status) {
      setIsVisible(true);
      
      if (status === 'success' || status === 'error') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [status, onComplete]);

  if (!isVisible || !action) return null;

  const config = ACTION_CONFIG[action] || ACTION_CONFIG.action;
  const Icon = config.icon;
  const targetName = target ? TARGET_NAMES[target]?.[language] || target : null;

  const getStatusIcon = () => {
    switch (status) {
      case 'executing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Icon className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    if (message) return message;
    
    switch (status) {
      case 'executing':
        return config.executingLabel[language];
      case 'success':
        return config.successLabel[language];
      case 'error':
        return language === 'es' ? 'Error' : 'Error';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        className={cn(
          "fixed bottom-24 right-6 z-50",
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "shadow-lg border backdrop-blur-sm",
          status === 'error' 
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700"
        )}
      >
        {/* Icon container */}
        <div className={cn(
          "p-2 rounded-lg",
          status === 'error' 
            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            : cn(config.bgColor, config.color)
        )}>
          {getStatusIcon()}
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-medium",
            status === 'error' ? "text-red-700 dark:text-red-300" : "text-foreground"
          )}>
            {getLabel()}
          </span>
          {targetName && status !== 'error' && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {targetName}
            </span>
          )}
        </div>

        {/* Progress line for executing */}
        {status === 'executing' && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-b-xl"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
