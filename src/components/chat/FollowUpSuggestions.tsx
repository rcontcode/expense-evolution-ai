import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FollowUpSuggestionsProps {
  lastIntent: string | null;
  lastAction: string | null;
  lastTarget: string | null;
  language: 'es' | 'en';
  onSuggestionClick: (suggestion: string) => void;
  isVisible: boolean;
}

interface FollowUpOption {
  id: string;
  text: string;
  emoji: string;
}

const FOLLOW_UP_OPTIONS: Record<string, Record<'es' | 'en', FollowUpOption[]>> = {
  navigate: {
    es: [
      { id: 'explain', text: 'Explícame esta página', emoji: '📖' },
      { id: 'add', text: '¿Cómo agrego algo?', emoji: '➕' },
      { id: 'back', text: 'Volver al dashboard', emoji: '🏠' },
    ],
    en: [
      { id: 'explain', text: 'Explain this page', emoji: '📖' },
      { id: 'add', text: 'How do I add something?', emoji: '➕' },
      { id: 'back', text: 'Back to dashboard', emoji: '🏠' },
    ],
  },
  query: {
    es: [
      { id: 'more', text: 'Cuéntame más detalles', emoji: '🔍' },
      { id: 'compare', text: 'Compara con el mes anterior', emoji: '📊' },
      { id: 'export', text: '¿Puedo exportar esto?', emoji: '📄' },
    ],
    en: [
      { id: 'more', text: 'Tell me more details', emoji: '🔍' },
      { id: 'compare', text: 'Compare with last month', emoji: '📊' },
      { id: 'export', text: 'Can I export this?', emoji: '📄' },
    ],
  },
  clarify: {
    es: [
      { id: 'cancel', text: 'Ninguna, gracias', emoji: '❌' },
      { id: 'help', text: 'Necesito más ayuda', emoji: '🆘' },
    ],
    en: [
      { id: 'cancel', text: 'None, thanks', emoji: '❌' },
      { id: 'help', text: 'I need more help', emoji: '🆘' },
    ],
  },
  explain: {
    es: [
      { id: 'example', text: 'Dame un ejemplo', emoji: '💡' },
      { id: 'why', text: '¿Por qué es importante?', emoji: '🤔' },
      { id: 'action', text: '¿Qué debería hacer?', emoji: '✅' },
    ],
    en: [
      { id: 'example', text: 'Give me an example', emoji: '💡' },
      { id: 'why', text: 'Why is this important?', emoji: '🤔' },
      { id: 'action', text: 'What should I do?', emoji: '✅' },
    ],
  },
  conversational: {
    es: [
      { id: 'data', text: 'Muéstrame mis datos', emoji: '📈' },
      { id: 'help', text: '¿Qué más puedes hacer?', emoji: '🤖' },
      { id: 'tip', text: 'Dame un tip financiero', emoji: '💰' },
    ],
    en: [
      { id: 'data', text: 'Show me my data', emoji: '📈' },
      { id: 'help', text: 'What else can you do?', emoji: '🤖' },
      { id: 'tip', text: 'Give me a financial tip', emoji: '💰' },
    ],
  },
};

// Target-specific follow-ups
const TARGET_FOLLOW_UPS: Record<string, Record<'es' | 'en', FollowUpOption[]>> = {
  expenses: {
    es: [
      { id: 'add-expense', text: 'Agregar un gasto', emoji: '💸' },
      { id: 'month-total', text: '¿Cuánto gasté este mes?', emoji: '📊' },
    ],
    en: [
      { id: 'add-expense', text: 'Add an expense', emoji: '💸' },
      { id: 'month-total', text: 'How much did I spend this month?', emoji: '📊' },
    ],
  },
  income: {
    es: [
      { id: 'add-income', text: 'Registrar un ingreso', emoji: '💵' },
      { id: 'month-income', text: '¿Cuánto gané este mes?', emoji: '📊' },
    ],
    en: [
      { id: 'add-income', text: 'Record an income', emoji: '💵' },
      { id: 'month-income', text: 'How much did I earn this month?', emoji: '📊' },
    ],
  },
  clients: {
    es: [
      { id: 'add-client', text: 'Agregar cliente', emoji: '👤' },
      { id: 'client-list', text: 'Ver todos mis clientes', emoji: '📋' },
    ],
    en: [
      { id: 'add-client', text: 'Add client', emoji: '👤' },
      { id: 'client-list', text: 'See all my clients', emoji: '📋' },
    ],
  },
  dashboard: {
    es: [
      { id: 'balance', text: '¿Cuál es mi balance?', emoji: '⚖️' },
      { id: 'pending', text: '¿Tengo algo pendiente?', emoji: '📌' },
    ],
    en: [
      { id: 'balance', text: "What's my balance?", emoji: '⚖️' },
      { id: 'pending', text: 'Do I have anything pending?', emoji: '📌' },
    ],
  },
};

export const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  lastIntent,
  lastAction,
  lastTarget,
  language,
  onSuggestionClick,
  isVisible,
}) => {
  const suggestions = useMemo(() => {
    const result: FollowUpOption[] = [];
    
    // Get action-based suggestions
    const actionKey = lastAction || lastIntent || 'conversational';
    const actionSuggestions = FOLLOW_UP_OPTIONS[actionKey]?.[language] || FOLLOW_UP_OPTIONS.conversational[language];
    result.push(...actionSuggestions.slice(0, 2));
    
    // Get target-specific suggestions
    if (lastTarget && TARGET_FOLLOW_UPS[lastTarget]) {
      const targetSuggestions = TARGET_FOLLOW_UPS[lastTarget][language];
      result.push(...targetSuggestions.slice(0, 1));
    }
    
    return result.slice(0, 3);
  }, [lastIntent, lastAction, lastTarget, language]);

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="px-2 pt-2"
      >
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>{language === 'es' ? 'Sugerencias' : 'Suggestions'}</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => onSuggestionClick(suggestion.text)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
                "bg-muted/50 hover:bg-muted",
                "border border-transparent hover:border-primary/20",
                "transition-all duration-200",
                "group"
              )}
            >
              <span>{suggestion.emoji}</span>
              <span className="text-foreground/80 group-hover:text-foreground">
                {suggestion.text}
              </span>
              <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-50 group-hover:ml-0 transition-all" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
