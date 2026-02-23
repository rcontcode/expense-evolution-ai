import { useMemo, useCallback } from 'react';
import { useUserSettings, useUpdateUserPreferences } from '@/hooks/data/useUserSettings';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface CompletenessStatus {
  /** Whether user has confirmed expenses are up-to-date this month */
  isConfirmed: boolean;
  /** Current month key (e.g. "2026-02") */
  monthKey: string;
  /** Whether there's income but very few expenses (suspicious) */
  looksIncomplete: boolean;
  /** Number of expenses this month */
  expenseCount: number;
  /** Confirm expenses are up-to-date */
  confirmUpToDate: () => void;
  /** Mark as not up-to-date (dismiss for now) */
  dismissPrompt: () => void;
  /** Whether the prompt should be shown */
  shouldShowPrompt: boolean;
}

export function useExpenseCompleteness(): CompletenessStatus {
  const now = new Date();
  const monthKey = format(now, 'yyyy-MM');
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
  const dismissedMonth = preferences.expenses_dismissed_month as string | undefined;

  const isConfirmed = confirmedMonth === monthKey;
  const isDismissed = dismissedMonth === monthKey;

  const totalIncome = income?.reduce((s, i) => s + Number(i.amount), 0) || 0;
  const expenseCount = expenses?.length || 0;
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

  // Heuristic: income exists, expenses exist but seem suspiciously low
  const looksIncomplete = useMemo(() => {
    if (totalIncome <= 0) return false;
    if (expenseCount === 0) return false; // already handled by zero-expense logic
    // If we're past day 10 and expenses are < 10% of income, it's suspicious
    if (dayOfMonth >= 10 && totalExpenses < totalIncome * 0.1) return true;
    // If we're past day 15 and expenses are < 20% of income
    if (dayOfMonth >= 15 && totalExpenses < totalIncome * 0.2) return true;
    // Very few transactions for the time elapsed
    if (dayOfMonth >= 15 && expenseCount < 5) return true;
    return false;
  }, [totalIncome, totalExpenses, expenseCount, dayOfMonth]);

  const shouldShowPrompt = !isConfirmed && !isDismissed && (looksIncomplete || (expenseCount > 0 && dayOfMonth >= 10));

  const confirmUpToDate = useCallback(() => {
    updatePrefs.mutate({ expenses_confirmed_month: monthKey } as any);
  }, [updatePrefs, monthKey]);

  const dismissPrompt = useCallback(() => {
    updatePrefs.mutate({ expenses_dismissed_month: monthKey } as any);
  }, [updatePrefs, monthKey]);

  return {
    isConfirmed,
    monthKey,
    looksIncomplete,
    expenseCount,
    confirmUpToDate,
    dismissPrompt,
    shouldShowPrompt,
  };
}
