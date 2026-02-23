import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenseCompleteness } from '@/hooks/utils/useExpenseCompleteness';
import { ClipboardCheck, AlertTriangle, CheckCircle2, X, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function DataCompletenessPrompt() {
  const { language } = useLanguage();
  const l = language === 'es';
  const {
    isConfirmed,
    looksIncomplete,
    expenseCount,
    confirmUpToDate,
    dismissPrompt,
    shouldShowPrompt,
  } = useExpenseCompleteness();

  if (!shouldShowPrompt) {
    // Show small confirmed badge if already confirmed
    if (isConfirmed) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{l ? 'Gastos al día ✓' : 'Expenses up to date ✓'}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className={cn(
          "border-2 transition-all",
          looksIncomplete
            ? "border-amber-500/50 bg-amber-500/5"
            : "border-primary/30 bg-primary/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                looksIncomplete ? "bg-amber-500/10" : "bg-primary/10"
              )}>
                {looksIncomplete
                  ? <AlertTriangle className="h-5 w-5 text-amber-500" />
                  : <ClipboardCheck className="h-5 w-5 text-primary" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold">
                    {looksIncomplete
                      ? (l ? '¿Estás al día con tus gastos?' : 'Are your expenses up to date?')
                      : (l ? '¿Registraste todos tus gastos?' : 'Have you entered all expenses?')
                    }
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    <Receipt className="h-3 w-3 mr-1" />
                    {expenseCount} {l ? 'registros' : 'records'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {looksIncomplete
                    ? (l
                        ? 'Tus gastos parecen bajos para lo que va del mes. Si aún no los registras todos, las métricas de ahorro y presupuesto no reflejan tu realidad. Confirma cuando estés al día.'
                        : 'Your expenses seem low for this point in the month. If you haven\'t entered them all, savings and budget metrics won\'t reflect reality. Confirm when you\'re caught up.')
                    : (l
                        ? 'Para que tus métricas financieras sean precisas, confirma que tus gastos del mes están completos.'
                        : 'For accurate financial metrics, confirm your monthly expenses are complete.')
                  }
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={confirmUpToDate}
                    className="h-7 text-xs gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {l ? 'Sí, estoy al día' : 'Yes, I\'m up to date'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismissPrompt}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    {l ? 'Recordar después' : 'Remind me later'}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={dismissPrompt}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
