import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BankTransaction {
  id: string;
  user_id: string;
  transaction_date: string;
  amount: number;
  description: string | null;
  status: string | null;
  matched_expense_id: string | null;
  created_at: string | null;
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
}

export interface ExpenseMatch {
  expense: {
    id: string;
    date: string;
    amount: number;
    vendor: string | null;
    description: string | null;
    category: string | null;
  };
  score: number;
  matchType: 'exact' | 'amount' | 'date' | 'fuzzy';
}

export interface TransactionWithMatches extends BankTransaction {
  suggestedMatches: ExpenseMatch[];
}

export function useBankTransactions() {
  return useQuery({
    queryKey: ['bank-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as BankTransaction[];
    },
  });
}

export function useBankTransactionsWithMatches() {
  return useQuery({
    queryKey: ['bank-transactions-with-matches'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;

      // Fetch expenses for matching
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('id, date, amount, vendor, description, category')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (expError) throw expError;

      // Find matches for each transaction
      const transactionsWithMatches: TransactionWithMatches[] = (transactions || []).map(tx => {
        const matches = findMatchingExpenses(tx, expenses || []);
        return {
          ...tx,
          suggestedMatches: matches,
        };
      });

      return transactionsWithMatches;
    },
  });
}

// Matching algorithm
function findMatchingExpenses(
  transaction: BankTransaction,
  expenses: { id: string; date: string; amount: number; vendor: string | null; description: string | null; category: string | null }[]
): ExpenseMatch[] {
  const matches: ExpenseMatch[] = [];
  const txDate = new Date(transaction.transaction_date);
  const txAmount = Number(transaction.amount);

  for (const expense of expenses) {
    const expDate = new Date(expense.date);
    const expAmount = Number(expense.amount);
    
    // Calculate date difference in days
    const dateDiff = Math.abs((txDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate amount difference percentage
    const amountDiff = Math.abs(txAmount - expAmount) / Math.max(txAmount, expAmount);
    
    let score = 0;
    let matchType: 'exact' | 'amount' | 'date' | 'fuzzy' = 'fuzzy';

    // Exact match: same amount and within 3 days
    if (amountDiff < 0.01 && dateDiff <= 3) {
      score = 100;
      matchType = 'exact';
    }
    // Amount match: exact amount, different date (within 7 days)
    else if (amountDiff < 0.01 && dateDiff <= 7) {
      score = 85;
      matchType = 'amount';
    }
    // Date match: same day, similar amount (within 5%)
    else if (dateDiff <= 1 && amountDiff <= 0.05) {
      score = 80;
      matchType = 'date';
    }
    // Close match: within 3 days and 10% amount difference
    else if (dateDiff <= 3 && amountDiff <= 0.10) {
      score = 70;
      matchType = 'fuzzy';
    }
    // Fuzzy match: within 7 days and 15% amount difference
    else if (dateDiff <= 7 && amountDiff <= 0.15) {
      score = 50;
      matchType = 'fuzzy';
    }

    // Add text similarity bonus
    if (score > 0 && transaction.description && expense.vendor) {
      const descLower = transaction.description.toLowerCase();
      const vendorLower = expense.vendor.toLowerCase();
      if (descLower.includes(vendorLower) || vendorLower.includes(descLower)) {
        score += 10;
      }
    }

    if (score >= 50) {
      matches.push({
        expense,
        score: Math.min(score, 100),
        matchType,
      });
    }
  }

  // Sort by score descending and return top 3
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function useCreateBankTransactions() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (transactions: Omit<BankTransaction, 'id' | 'user_id' | 'created_at'>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const transactionsWithUser = transactions.map(t => ({
        ...t,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('bank_transactions')
        .insert(transactionsWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions-with-matches'] });
      toast.success(
        language === 'es'
          ? `${data.length} transacciones importadas exitosamente`
          : `${data.length} transactions imported successfully`
      );
    },
    onError: (error) => {
      console.error('Error importing transactions:', error);
      toast.error(
        language === 'es'
          ? 'Error al importar transacciones'
          : 'Error importing transactions'
      );
    },
  });
}

export function useMatchTransaction() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async ({ transactionId, expenseId }: { transactionId: string; expenseId: string }) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update({ 
          matched_expense_id: expenseId,
          status: 'matched'
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions-with-matches'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(
        language === 'es'
          ? 'Transacción conciliada exitosamente'
          : 'Transaction matched successfully'
      );
    },
  });
}

export function useMarkAsDiscrepancy() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update({ status: 'discrepancy' })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions-with-matches'] });
      toast.info(
        language === 'es'
          ? 'Transacción marcada como discrepancia'
          : 'Transaction marked as discrepancy'
      );
    },
  });
}

export function useDeleteBankTransaction() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions-with-matches'] });
      toast.success(
        language === 'es'
          ? 'Transacción eliminada'
          : 'Transaction deleted'
      );
    },
  });
}

// CSV Parser utility
export function parseCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Find column indices
  const dateIdx = headers.findIndex(h => 
    h.includes('date') || h.includes('fecha') || h === 'posted date' || h === 'transaction date'
  );
  const amountIdx = headers.findIndex(h => 
    h.includes('amount') || h.includes('monto') || h.includes('importe') || h === 'debit' || h === 'credit'
  );
  const descIdx = headers.findIndex(h => 
    h.includes('description') || h.includes('descripcion') || h.includes('memo') || h.includes('details')
  );

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error('Could not find required columns (date, amount)');
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV with quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const dateStr = values[dateIdx]?.replace(/"/g, '');
    const amountStr = values[amountIdx]?.replace(/"/g, '').replace(/[$,]/g, '');
    const description = values[descIdx]?.replace(/"/g, '') || '';

    if (!dateStr || !amountStr) continue;

    // Parse date (try different formats)
    let parsedDate: Date | null = null;
    const dateFormats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];

    for (const format of dateFormats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === dateFormats[0]) {
          parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else if (format === dateFormats[1]) {
          parsedDate = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        } else {
          parsedDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        }
        break;
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) continue;

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    transactions.push({
      date: parsedDate.toISOString().split('T')[0],
      amount: Math.abs(amount),
      description,
    });
  }

  return transactions;
}
