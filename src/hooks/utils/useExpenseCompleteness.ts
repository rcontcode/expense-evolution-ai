import { useMemo, useCallback } from 'react';
import { useUserSettings, useUpdateUserPreferences } from '@/hooks/data/useUserSettings';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { startOfMonth, endOfMonth, format, addDays, nextSaturday, lastDayOfMonth } from 'date-fns';

type SnoozeOption = 'tomorrow' | '3days' | 'weekend' | 'endofmonth' | 'working';

interface CompletenessStatus {
  isConfirmed: boolean;
  monthKey: string;
  looksIncomplete: boolean;
  expenseCount: number;
  confirmUpToDate: () => void;
  snoozeUntil: (option: SnoozeOption) => void;
  shouldShowPrompt: boolean;
}

export function useExpenseCompleteness(): CompletenessStatus {
  const now = new Date();
  const monthKey = format(now, 'yyyy-MM');
  const today = format(now, 'yyyy-MM-dd');
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const dayOfMonth = now.getDate();

  const { data: settings } = useUserSettings();
  const updatePrefs = useUpdateUserPreferences();

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
  });

  const { data: income } = useIncome({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const preferences = (settings?.preferences as Record<string, unknown>) || {};
  const confirmedMonth = preferences.expenses_confirmed_month as string | undefined;
  const snoozedUntil = preferences.expenses_snoozed_until as string | undefined;

  const isConfirmed = confirmedMonth === monthKey;
  const isSnoozed = snoozedUntil ? today < snoozedUntil : false;

  const totalIncome = income?.reduce((s, i) => s + Number(i.amount), 0) || 0;
  const expenseCount = expenses?.length || 0;
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

  const looksIncomplete = useMemo(() => {
    if (totalIncome <= 0) return false;
    if (expenseCount === 0) return false;
    if (dayOfMonth >= 10 && totalExpenses < totalIncome * 0.1) return true;
    if (dayOfMonth >= 15 && totalExpenses < totalIncome * 0.2) return true;
    if (dayOfMonth >= 15 && expenseCount < 5) return true;
    return false;
  }, [totalIncome, totalExpenses, expenseCount, dayOfMonth]);

  const shouldShowPrompt = !isConfirmed && !isSnoozed && (looksIncomplete || (expenseCount > 0 && dayOfMonth >= 10));

  const confirmUpToDate = useCallback(() => {
    updatePrefs.mutate({
      expenses_confirmed_month: monthKey,
      expenses_snoozed_until: undefined,
    } as any);
  }, [updatePrefs, monthKey]);

  const snoozeUntil = useCallback((option: SnoozeOption) => {
    let target: Date;
    switch (option) {
      case 'tomorrow':
        target = addDays(now, 1);
        break;
      case '3days':
        target = addDays(now, 3);
        break;
      case 'weekend':
        target = nextSaturday(now);
        break;
      case 'endofmonth':
        target = lastDayOfMonth(now);
        break;
      case 'working':
        // "I'm working on it" = remind in 2 days
        target = addDays(now, 2);
        break;
      default:
        target = addDays(now, 1);
    }
    updatePrefs.mutate({
      expenses_snoozed_until: format(target, 'yyyy-MM-dd'),
    } as any);
  }, [updatePrefs, now]);

  return {
    isConfirmed,
    monthKey,
    looksIncomplete,
    expenseCount,
    confirmUpToDate,
    snoozeUntil,
    shouldShowPrompt,
  };
}
