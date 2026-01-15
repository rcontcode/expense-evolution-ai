import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Sparkles,
  ArrowRight,
  Calendar,
  Receipt,
  PiggyBank,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  type: 'tip' | 'action' | 'alert' | 'insight';
  icon: React.ReactNode;
  title: string;
  description: string;
  command?: string;
  priority: number;
}

interface SmartSuggestionsProps {
  financialData: {
    monthlyExpenses: number;
    monthlyIncome: number;
    balance: number;
    pendingReceipts: number;
    yearlyExpenses: number;
    yearlyIncome: number;
    deductibleTotal?: number;
  };
  currentRoute: string;
  language: 'es' | 'en';
  onSuggestionClick: (command: string) => void;
  isVisible: boolean;
  recentQueries: string[];
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  financialData,
  currentRoute,
  language,
  onSuggestionClick,
  isVisible,
  recentQueries,
}) => {
  const suggestions = useMemo(() => {
    const suggestions: Suggestion[] = [];
    const isSpanish = language === 'es';

    // 1. Pending receipts alert
    if (financialData.pendingReceipts > 0) {
      suggestions.push({
        id: 'pending-receipts',
        type: 'alert',
        icon: <Receipt className="h-4 w-4" />,
        title: isSpanish 
          ? `${financialData.pendingReceipts} recibos pendientes` 
          : `${financialData.pendingReceipts} pending receipts`,
        description: isSpanish 
          ? 'Revisa y aprueba tus recibos' 
          : 'Review and approve your receipts',
        command: isSpanish ? 'llévame a revisión' : 'take me to review',
        priority: 10,
      });
    }

    // 2. Negative balance warning
    if (financialData.balance < 0) {
      suggestions.push({
        id: 'negative-balance',
        type: 'alert',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: isSpanish 
          ? 'Balance negativo este año' 
          : 'Negative balance this year',
        description: isSpanish 
          ? 'Revisa tus gastos vs ingresos' 
          : 'Review your expenses vs income',
        command: isSpanish ? 'analiza mi balance' : 'analyze my balance',
        priority: 9,
      });
    }

    // 3. High savings rate opportunity
    const savingsRate = financialData.monthlyIncome > 0 
      ? ((financialData.monthlyIncome - financialData.monthlyExpenses) / financialData.monthlyIncome) * 100
      : 0;
    
    if (savingsRate > 30) {
      suggestions.push({
        id: 'savings-opportunity',
        type: 'insight',
        icon: <PiggyBank className="h-4 w-4" />,
        title: isSpanish 
          ? `¡Ahorras ${savingsRate.toFixed(0)}% mensual!` 
          : `You save ${savingsRate.toFixed(0)}% monthly!`,
        description: isSpanish 
          ? 'Revisa cómo alcanzar FIRE más rápido' 
          : 'See how to reach FIRE faster',
        command: isSpanish ? 'muéstrame calculador FIRE' : 'show me FIRE calculator',
        priority: 6,
      });
    }

    // 4. Tax optimization suggestion (if deductibles exist)
    if ((financialData.deductibleTotal || 0) > 0) {
      suggestions.push({
        id: 'tax-optimization',
        type: 'tip',
        icon: <Calculator className="h-4 w-4" />,
        title: isSpanish 
          ? 'Optimiza tus impuestos' 
          : 'Optimize your taxes',
        description: isSpanish 
          ? `Tienes $${(financialData.deductibleTotal || 0).toLocaleString()} deducibles` 
          : `You have $${(financialData.deductibleTotal || 0).toLocaleString()} in deductibles`,
        command: isSpanish ? 'muéstrame resumen fiscal' : 'show me tax summary',
        priority: 7,
      });
    }

    // 5. Page-specific suggestions
    const pageSuggestions: Record<string, Suggestion[]> = {
      '/dashboard': [{
        id: 'dashboard-analysis',
        type: 'action',
        icon: <TrendingUp className="h-4 w-4" />,
        title: isSpanish ? 'Ver tendencias' : 'View trends',
        description: isSpanish ? 'Analiza tu progreso mensual' : 'Analyze monthly progress',
        command: isSpanish ? 'muéstrame tendencias' : 'show me trends',
        priority: 5,
      }],
      '/expenses': [{
        id: 'expenses-capture',
        type: 'action',
        icon: <Receipt className="h-4 w-4" />,
        title: isSpanish ? 'Captura rápida' : 'Quick capture',
        description: isSpanish ? 'Escanea un recibo con cámara' : 'Scan a receipt with camera',
        command: isSpanish ? 'capturar gasto' : 'capture expense',
        priority: 5,
      }],
      '/income': [{
        id: 'income-analysis',
        type: 'insight',
        icon: <Target className="h-4 w-4" />,
        title: isSpanish ? 'Diversifica ingresos' : 'Diversify income',
        description: isSpanish ? 'Revisa tus fuentes de ingreso' : 'Review your income sources',
        command: isSpanish ? 'analiza mis fuentes de ingreso' : 'analyze my income sources',
        priority: 4,
      }],
    };

    const pageSpecific = pageSuggestions[currentRoute] || [];
    suggestions.push(...pageSpecific);

    // 6. Time-based suggestions
    const now = new Date();
    const isEndOfMonth = now.getDate() > 25;
    const isStartOfYear = now.getMonth() === 0 && now.getDate() < 15;

    if (isEndOfMonth) {
      suggestions.push({
        id: 'month-end-review',
        type: 'tip',
        icon: <Calendar className="h-4 w-4" />,
        title: isSpanish ? 'Cierre mensual' : 'Monthly close',
        description: isSpanish ? 'Revisa tus finanzas del mes' : 'Review your monthly finances',
        command: isSpanish ? 'resumen del mes' : 'monthly summary',
        priority: 8,
      });
    }

    if (isStartOfYear) {
      suggestions.push({
        id: 'year-start-planning',
        type: 'tip',
        icon: <Target className="h-4 w-4" />,
        title: isSpanish ? 'Metas del año' : 'Year goals',
        description: isSpanish ? 'Define tus metas financieras' : 'Set your financial goals',
        command: isSpanish ? 'llévame a mentoría' : 'take me to mentorship',
        priority: 7,
      });
    }

    // Sort by priority and take top 3
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }, [financialData, currentRoute, language]);

  if (!isVisible || suggestions.length === 0) return null;

  const typeStyles: Record<string, string> = {
    alert: 'bg-red-500/10 text-red-400 border-red-500/20',
    tip: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    action: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    insight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const iconBgStyles: Record<string, string> = {
    alert: 'bg-red-500/20',
    tip: 'bg-amber-500/20',
    action: 'bg-blue-500/20',
    insight: 'bg-emerald-500/20',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>{language === 'es' ? 'Sugerencias inteligentes' : 'Smart suggestions'}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => suggestion.command && onSuggestionClick(suggestion.command)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
                "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                "max-w-[250px]",
                typeStyles[suggestion.type]
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md shrink-0",
                iconBgStyles[suggestion.type]
              )}>
                {suggestion.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{suggestion.title}</p>
                <p className="text-[10px] opacity-70 truncate">{suggestion.description}</p>
              </div>
              <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
