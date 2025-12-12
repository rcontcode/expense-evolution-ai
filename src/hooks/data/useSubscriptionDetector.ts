import { useMemo } from 'react';
import { ExpenseWithRelations } from '@/types/expense.types';
import { differenceInDays, format, parseISO } from 'date-fns';

export interface DetectedSubscription {
  vendor: string;
  averageAmount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  occurrences: number;
  lastDate: string;
  totalSpent: number;
  annualizedCost: number;
  category: string | null;
  expenses: ExpenseWithRelations[];
  confidence: number; // 0-100 confidence score
}

interface GroupedExpense {
  vendor: string;
  expenses: ExpenseWithRelations[];
  amounts: number[];
  dates: Date[];
}

function calculateFrequency(dates: Date[]): { frequency: DetectedSubscription['frequency'] | null; confidence: number } {
  if (dates.length < 2) return { frequency: null, confidence: 0 };

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];

  for (let i = 1; i < sortedDates.length; i++) {
    intervals.push(differenceInDays(sortedDates[i], sortedDates[i - 1]));
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate confidence based on consistency of intervals
  const maxDeviation = avgInterval * 0.3; // Allow 30% deviation
  const consistencyScore = Math.max(0, 100 - (stdDev / avgInterval) * 100);
  
  // Determine frequency
  if (avgInterval >= 1 && avgInterval <= 10) {
    return { frequency: 'weekly', confidence: consistencyScore };
  } else if (avgInterval >= 25 && avgInterval <= 35) {
    return { frequency: 'monthly', confidence: consistencyScore };
  } else if (avgInterval >= 80 && avgInterval <= 100) {
    return { frequency: 'quarterly', confidence: consistencyScore };
  } else if (avgInterval >= 350 && avgInterval <= 380) {
    return { frequency: 'yearly', confidence: consistencyScore };
  }

  return { frequency: null, confidence: 0 };
}

function calculateAnnualizedCost(amount: number, frequency: DetectedSubscription['frequency']): number {
  switch (frequency) {
    case 'weekly': return amount * 52;
    case 'monthly': return amount * 12;
    case 'quarterly': return amount * 4;
    case 'yearly': return amount;
    default: return amount * 12;
  }
}

function getFrequencyLabel(frequency: DetectedSubscription['frequency'], language: string): string {
  const labels = {
    weekly: { en: 'Weekly', es: 'Semanal' },
    monthly: { en: 'Monthly', es: 'Mensual' },
    quarterly: { en: 'Quarterly', es: 'Trimestral' },
    yearly: { en: 'Yearly', es: 'Anual' },
  };
  return labels[frequency]?.[language as 'en' | 'es'] || labels[frequency]?.en || frequency;
}

export function useSubscriptionDetector(expenses: ExpenseWithRelations[]) {
  const subscriptions = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by vendor (normalized)
    const grouped: Record<string, GroupedExpense> = {};

    expenses.forEach((expense) => {
      if (!expense.vendor) return;
      
      const normalizedVendor = expense.vendor.toLowerCase().trim();
      
      if (!grouped[normalizedVendor]) {
        grouped[normalizedVendor] = {
          vendor: expense.vendor,
          expenses: [],
          amounts: [],
          dates: [],
        };
      }

      grouped[normalizedVendor].expenses.push(expense);
      grouped[normalizedVendor].amounts.push(Number(expense.amount));
      grouped[normalizedVendor].dates.push(parseISO(expense.date));
    });

    // Detect recurring patterns
    const detected: DetectedSubscription[] = [];

    Object.values(grouped).forEach((group) => {
      // Need at least 2 occurrences to detect a pattern
      if (group.expenses.length < 2) return;

      // Check if amounts are consistent (within 10% variance)
      const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
      const amountVariance = group.amounts.every(
        (amt) => Math.abs(amt - avgAmount) / avgAmount <= 0.1
      );

      if (!amountVariance) return;

      // Detect frequency
      const { frequency, confidence } = calculateFrequency(group.dates);
      
      if (!frequency || confidence < 50) return;

      const totalSpent = group.amounts.reduce((a, b) => a + b, 0);
      const sortedDates = group.dates.sort((a, b) => b.getTime() - a.getTime());

      detected.push({
        vendor: group.vendor,
        averageAmount: avgAmount,
        frequency,
        occurrences: group.expenses.length,
        lastDate: format(sortedDates[0], 'yyyy-MM-dd'),
        totalSpent,
        annualizedCost: calculateAnnualizedCost(avgAmount, frequency),
        category: group.expenses[0]?.category || null,
        expenses: group.expenses,
        confidence,
      });
    });

    // Sort by annualized cost (highest first)
    return detected.sort((a, b) => b.annualizedCost - a.annualizedCost);
  }, [expenses]);

  const totalAnnualSubscriptionCost = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + sub.annualizedCost, 0);
  }, [subscriptions]);

  const totalMonthlySubscriptionCost = useMemo(() => {
    return totalAnnualSubscriptionCost / 12;
  }, [totalAnnualSubscriptionCost]);

  return {
    subscriptions,
    totalAnnualSubscriptionCost,
    totalMonthlySubscriptionCost,
    getFrequencyLabel,
  };
}
