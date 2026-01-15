import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, HelpCircle, X, Navigation, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickResponseChips, getQuickResponsesForContext } from './QuickResponseChips';

interface ClarificationOption {
  id: string;
  label: string;
  action: 'navigate' | 'explain' | 'both' | 'cancel';
  target?: string;
  route?: string;
}

interface ClarificationIndicatorProps {
  isVisible: boolean;
  options: ClarificationOption[];
  remainingSeconds: number;
  language: 'es' | 'en';
  onOptionClick: (option: ClarificationOption) => void;
  onCancel: () => void;
  onQuickResponse?: (value: string) => void;
}

export const ClarificationIndicator: React.FC<ClarificationIndicatorProps> = ({
  isVisible,
  options,
  remainingSeconds,
  language,
  onOptionClick,
  onCancel,
  onQuickResponse,
}) => {
  if (!isVisible || options.length === 0) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'navigate':
        return <Navigation className="h-3.5 w-3.5" />;
      case 'explain':
        return <Lightbulb className="h-3.5 w-3.5" />;
      case 'both':
        return <Sparkles className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'navigate':
        return 'text-blue-600 dark:text-blue-400';
      case 'explain':
        return 'text-purple-600 dark:text-purple-400';
      case 'both':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const timeoutWarning = remainingSeconds <= 10;
  const quickResponses = getQuickResponsesForContext('clarification', language, options.length);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={cn(
          "mx-2 mb-2 p-3 rounded-xl border shadow-sm",
          "bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-800/80",
          "border-slate-200 dark:border-slate-700",
          timeoutWarning && "border-amber-400 dark:border-amber-600 shadow-amber-100 dark:shadow-amber-900/20"
        )}
      >
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {language === 'es' ? '¿Qué prefieres?' : 'What would you prefer?'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs gap-1 font-mono",
                timeoutWarning 
                  ? "border-amber-400 text-amber-600 dark:border-amber-600 dark:text-amber-400 animate-pulse"
                  : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
              )}
            >
              <Clock className="h-3 w-3" />
              {remainingSeconds}s
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
              onClick={onCancel}
              title={language === 'es' ? 'Cancelar' : 'Cancel'}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => onOptionClick(option)}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg text-left",
                "bg-white dark:bg-slate-800/80",
                "hover:bg-primary/5 dark:hover:bg-primary/10",
                "border border-slate-200 dark:border-slate-700",
                "hover:border-primary/40 dark:hover:border-primary/40",
                "transition-all duration-200 group"
              )}
            >
              {/* Number badge */}
              <span className={cn(
                "flex-shrink-0 w-7 h-7 flex items-center justify-center",
                "rounded-lg text-sm font-semibold",
                "bg-slate-100 dark:bg-slate-700",
                "group-hover:bg-primary group-hover:text-primary-foreground",
                "transition-colors duration-200"
              )}>
                {index + 1}
              </span>
              
              {/* Action icon */}
              <span className={cn("flex-shrink-0", getActionColor(option.action))}>
                {getActionIcon(option.action)}
              </span>
              
              {/* Label */}
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">
                {option.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Quick response chips */}
        {onQuickResponse && (
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-muted-foreground mb-1.5">
              {language === 'es' ? 'Respuesta rápida:' : 'Quick response:'}
            </p>
            <QuickResponseChips
              responses={quickResponses}
              onSelect={onQuickResponse}
              language={language}
            />
          </div>
        )}

        {/* Voice hint */}
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {language === 'es' 
            ? '🎤 Di el número o describe lo que prefieres'
            : '🎤 Say the number or describe what you prefer'}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};
