import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBankTransactions } from './useBankTransactions';
import { useMemo } from 'react';

export interface BankTransaction {
  date: string;
  amount: number;
  description: string;
  category?: string;
  isRecurring?: boolean;
  recurringType?: string;
  bank?: string;
  type?: 'debit' | 'credit';
}

export interface RecurringPayment {
  description: string;
  amount: number;
  frequency: string;
  category: string;
  bank?: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface BankAlert {
  type: 'unusual_charge' | 'duplicate' | 'high_amount' | 'new_recurring';
  message: string;
  transaction?: BankTransaction;
  severity: 'info' | 'warning' | 'critical';
}

export interface BankAnalysisResult {
  transactions: BankTransaction[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    netChange: number;
    transactionCount: number;
  };
  recurringPayments: RecurringPayment[];
  categoryBreakdown: CategoryBreakdown[];
  alerts: BankAlert[];
  insights: string[];
}

export const CATEGORY_LABELS: Record<string, { en: string; es: string; icon: string }> = {
  utilities: { en: 'Utilities', es: 'Servicios', icon: '💡' },
  telecommunications: { en: 'Telecom', es: 'Telecomunicaciones', icon: '📱' },
  subscriptions: { en: 'Subscriptions', es: 'Suscripciones', icon: '🔄' },
  insurance: { en: 'Insurance', es: 'Seguros', icon: '🛡️' },
  banking_fees: { en: 'Bank Fees', es: 'Comisiones', icon: '🏦' },
  transfers: { en: 'Transfers', es: 'Transferencias', icon: '↔️' },
  shopping: { en: 'Shopping', es: 'Compras', icon: '🛍️' },
  groceries: { en: 'Groceries', es: 'Supermercado', icon: '🛒' },
  restaurants: { en: 'Restaurants', es: 'Restaurantes', icon: '🍽️' },
  transportation: { en: 'Transportation', es: 'Transporte', icon: '🚗' },
  entertainment: { en: 'Entertainment', es: 'Entretenimiento', icon: '🎬' },
  healthcare: { en: 'Healthcare', es: 'Salud', icon: '🏥' },
  education: { en: 'Education', es: 'Educación', icon: '📚' },
  housing: { en: 'Housing', es: 'Vivienda', icon: '🏠' },
  salary: { en: 'Salary', es: 'Salario', icon: '💰' },
  refunds: { en: 'Refunds', es: 'Reembolsos', icon: '↩️' },
  other: { en: 'Other', es: 'Otros', icon: '📦' },
};

export function useAnalyzeBankStatement() {
  const queryClient = useQueryClient();
  const { data: existingTransactions } = useBankTransactions();

  return useMutation({
    mutationFn: async ({ 
      content, 
      contentType, 
      bankName 
    }: { 
      content: string; 
      contentType: 'image' | 'text' | 'pdf'; 
      bankName?: string;
    }): Promise<BankAnalysisResult> => {
      const { data, error } = await supabase.functions.invoke('analyze-bank-statement', {
        body: { 
          content, 
          contentType, 
          bankName,
          existingTransactions: existingTransactions?.map(t => ({
            date: t.transaction_date,
            amount: t.amount,
            description: t.description,
          })) || [],
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

export function useBankInsights() {
  const { data: transactions } = useBankTransactions();

  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        recurringPayments: [],
        categoryBreakdown: [],
        monthlyTrends: [],
        topVendors: [],
      };
    }

    // Group by description to find recurring payments
    const vendorGroups: Record<string, { amounts: number[]; dates: string[]; description: string }> = {};
    
    transactions.forEach((t) => {
      const key = t.description?.toLowerCase().trim() || 'unknown';
      if (!vendorGroups[key]) {
        vendorGroups[key] = { amounts: [], dates: [], description: t.description || 'Unknown' };
      }
      vendorGroups[key].amounts.push(Number(t.amount));
      vendorGroups[key].dates.push(t.transaction_date);
    });

    // Detect recurring payments (same vendor, similar amounts, multiple occurrences)
    const recurringPayments: RecurringPayment[] = [];
    Object.values(vendorGroups).forEach((group) => {
      if (group.amounts.length >= 2) {
        const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
        const variance = group.amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount <= 0.15);
        
        if (variance) {
          recurringPayments.push({
            description: group.description,
            amount: avgAmount,
            frequency: 'monthly', // simplified
            category: 'other',
          });
        }
      }
    });

    // Top vendors by total spend
    const topVendors = Object.entries(vendorGroups)
      .map(([key, group]) => ({
        vendor: group.description,
        total: group.amounts.reduce((a, b) => a + b, 0),
        count: group.amounts.length,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      recurringPayments: recurringPayments.sort((a, b) => b.amount - a.amount),
      categoryBreakdown: [],
      monthlyTrends: [],
      topVendors,
    };
  }, [transactions]);
}
