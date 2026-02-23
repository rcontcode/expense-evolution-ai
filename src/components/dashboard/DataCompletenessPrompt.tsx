import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenseCompleteness } from '@/hooks/utils/useExpenseCompleteness';
import { CheckCircle2, Clock, ChevronDown, Receipt, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DataCompletenessPrompt() {
  const { language } = useLanguage();
  const l = language === 'es';
  const {
    isConfirmed,
    looksIncomplete,
    expenseCount,
    confirmUpToDate,
    snoozeUntil,
    shouldShowPrompt,
  } = useExpenseCompleteness();

  if (!shouldShowPrompt) {
    if (isConfirmed) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 px-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>{l ? 'Gastos al día' : 'Expenses up to date'}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all",
      looksIncomplete
        ? "bg-amber-500/10 border border-amber-500/20"
        : "bg-muted/50 border border-border/50"
    )}>
      <AlertCircle className={cn(
        "h-4 w-4 shrink-0",
        looksIncomplete ? "text-amber-500" : "text-muted-foreground"
      )} />

      <span className="flex-1 text-xs text-muted-foreground">
        {looksIncomplete
          ? (l
              ? `Solo ${expenseCount} gastos este mes — ¿estás al día?`
              : `Only ${expenseCount} expenses this month — are you caught up?`)
          : (l
              ? '¿Tus gastos del mes están completos?'
              : 'Are your monthly expenses complete?')
        }
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={confirmUpToDate}
          className="h-7 text-xs gap-1 px-2.5"
        >
          <CheckCircle2 className="h-3 w-3" />
          {l ? 'Sí, al día' : 'Yes, up to date'}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => snoozeUntil('working')}
          className="h-7 text-xs gap-1 px-2.5 text-muted-foreground"
        >
          <Receipt className="h-3 w-3" />
          {l ? 'Estoy en eso' : 'Working on it'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2 text-muted-foreground"
            >
              <Clock className="h-3 w-3" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => snoozeUntil('tomorrow')}>
              {l ? 'Recordar mañana' : 'Remind tomorrow'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => snoozeUntil('3days')}>
              {l ? 'En 3 días' : 'In 3 days'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => snoozeUntil('weekend')}>
              {l ? 'El fin de semana' : 'This weekend'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => snoozeUntil('endofmonth')}>
              {l ? 'Al final del mes' : 'End of month'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
