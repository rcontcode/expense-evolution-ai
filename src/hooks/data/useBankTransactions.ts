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
      toast.success(
        language === 'es'
          ? 'Transacción conciliada exitosamente'
          : 'Transaction matched successfully'
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
