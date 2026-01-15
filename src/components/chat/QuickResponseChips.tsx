import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickResponseChipsProps {
  responses: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  onSelect: (value: string) => void;
  language: 'es' | 'en';
  className?: string;
}

// Common quick responses for different contexts
export const COMMON_RESPONSES = {
  clarification: {
    es: [
      { id: '1', label: '1️⃣ Primera', value: '1' },
      { id: '2', label: '2️⃣ Segunda', value: '2' },
      { id: '3', label: '3️⃣ Tercera', value: '3' },
      { id: 'cancel', label: '❌ Cancelar', value: 'cancelar' },
    ],
    en: [
      { id: '1', label: '1️⃣ First', value: '1' },
      { id: '2', label: '2️⃣ Second', value: '2' },
      { id: '3', label: '3️⃣ Third', value: '3' },
      { id: 'cancel', label: '❌ Cancel', value: 'cancel' },
    ],
  },
  confirmation: {
    es: [
      { id: 'yes', label: '✓ Sí', value: 'sí' },
      { id: 'no', label: '✗ No', value: 'no' },
    ],
    en: [
      { id: 'yes', label: '✓ Yes', value: 'yes' },
      { id: 'no', label: '✗ No', value: 'no' },
    ],
  },
  navigation: {
    es: [
      { id: 'expenses', label: '💰 Gastos', value: 'gastos' },
      { id: 'income', label: '📈 Ingresos', value: 'ingresos' },
      { id: 'dashboard', label: '🏠 Dashboard', value: 'dashboard' },
    ],
    en: [
      { id: 'expenses', label: '💰 Expenses', value: 'expenses' },
      { id: 'income', label: '📈 Income', value: 'income' },
      { id: 'dashboard', label: '🏠 Dashboard', value: 'dashboard' },
    ],
  },
  queries: {
    es: [
      { id: 'balance', label: '💵 Mi balance', value: 'cuál es mi balance' },
      { id: 'month', label: '📊 Gastos del mes', value: 'cuánto gasté este mes' },
      { id: 'pending', label: '📋 Pendientes', value: 'recibos pendientes' },
    ],
    en: [
      { id: 'balance', label: '💵 My balance', value: 'what is my balance' },
      { id: 'month', label: '📊 Monthly spending', value: 'how much did I spend this month' },
      { id: 'pending', label: '📋 Pending', value: 'pending receipts' },
    ],
  },
};

export const QuickResponseChips: React.FC<QuickResponseChipsProps> = ({
  responses,
  onSelect,
  language,
  className,
}) => {
  if (!responses || responses.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {responses.map((response, index) => (
        <motion.button
          key={response.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(response.value)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            "bg-slate-100 dark:bg-slate-800",
            "text-slate-700 dark:text-slate-300",
            "hover:bg-primary/10 hover:text-primary",
            "dark:hover:bg-primary/20 dark:hover:text-primary",
            "border border-transparent hover:border-primary/30",
            "transition-all duration-150",
            "active:scale-95"
          )}
        >
          {response.label}
        </motion.button>
      ))}
    </motion.div>
  );
};

// Helper to get appropriate chips based on context
export function getQuickResponsesForContext(
  context: 'clarification' | 'confirmation' | 'navigation' | 'queries' | 'idle',
  language: 'es' | 'en',
  optionCount?: number
): Array<{ id: string; label: string; value: string }> {
  if (context === 'idle') {
    return COMMON_RESPONSES.queries[language];
  }
  
  if (context === 'clarification' && optionCount) {
    // Return only as many number options as there are clarification options
    const clarificationResponses = COMMON_RESPONSES.clarification[language];
    return [
      ...clarificationResponses.slice(0, optionCount),
      clarificationResponses[clarificationResponses.length - 1], // Cancel
    ];
  }
  
  return COMMON_RESPONSES[context]?.[language] || [];
}
