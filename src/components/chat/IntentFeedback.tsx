import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Navigation, 
  MessageSquare, 
  HelpCircle, 
  Zap,
  Search,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface IntentFeedbackProps {
  intent: string | null;
  action: string | null;
  target: string | null;
  isVisible: boolean;
  language: 'es' | 'en';
}

const INTENT_CONFIG = {
  navigate: {
    icon: Navigation,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    label: { es: 'Navegando', en: 'Navigating' },
  },
  query: {
    icon: Search,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    label: { es: 'Consultando', en: 'Querying' },
  },
  clarify: {
    icon: HelpCircle,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    label: { es: 'Aclarando', en: 'Clarifying' },
  },
  explain: {
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    label: { es: 'Explicando', en: 'Explaining' },
  },
  action: {
    icon: Zap,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    label: { es: 'Ejecutando', en: 'Executing' },
  },
  conversational: {
    icon: MessageSquare,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
    label: { es: 'Conversando', en: 'Chatting' },
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
};

export const IntentFeedback: React.FC<IntentFeedbackProps> = ({
  intent,
  action,
  target,
  isVisible,
  language,
}) => {
  if (!isVisible || (!intent && !action)) return null;

  const actionKey = (action || intent || 'conversational') as keyof typeof INTENT_CONFIG;
  const config = INTENT_CONFIG[actionKey] || INTENT_CONFIG.conversational;
  const Icon = config.icon;
  const targetName = target ? TARGET_NAMES[target]?.[language] || target : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -5 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5 mb-1"
      >
        <Badge 
          variant="secondary"
          className={cn(
            "text-xs py-0.5 px-2 gap-1 font-normal",
            config.color
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{config.label[language]}</span>
          {targetName && (
            <>
              <span className="opacity-50">→</span>
              <span className="font-medium">{targetName}</span>
            </>
          )}
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
};
