import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export const ClarificationIndicator: React.FC<ClarificationIndicatorProps> = ({
  isVisible,
  options,
  remainingSeconds,
  language,
  onOptionClick,
  onCancel,
}) => {
  if (!isVisible || options.length === 0) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'navigate':
        return '🚀';
      case 'explain':
        return '💡';
      case 'both':
        return '✨';
      case 'cancel':
        return '❌';
      default:
        return '•';
    }
  };

  const timeoutWarning = remainingSeconds <= 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={cn(
          "mx-2 mb-2 p-3 rounded-lg border-2",
          "bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/40",
          "border-amber-300 dark:border-amber-700",
          timeoutWarning && "animate-pulse border-red-400 dark:border-red-600"
        )}
      >
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {language === 'es' ? 'Elige una opción' : 'Choose an option'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs gap-1",
                timeoutWarning 
                  ? "border-red-400 text-red-600 dark:border-red-600 dark:text-red-400"
                  : "border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-300"
              )}
            >
              <Clock className="h-3 w-3" />
              {remainingSeconds}s
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/20"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-1.5">
          {options.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onOptionClick(option)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md text-left text-sm",
                "bg-white/60 dark:bg-slate-800/60",
                "hover:bg-amber-100 dark:hover:bg-amber-900/30",
                "border border-transparent hover:border-amber-300 dark:hover:border-amber-700",
                "transition-all duration-200"
              )}
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-sm">
                {index + 1}
              </span>
              <span className="mr-1">{getActionIcon(option.action)}</span>
              <span className="flex-1 text-slate-700 dark:text-slate-300">{option.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Hint */}
        <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/80 text-center">
          {language === 'es' 
            ? 'Di el número o describe lo que prefieres'
            : 'Say the number or describe what you prefer'}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};
