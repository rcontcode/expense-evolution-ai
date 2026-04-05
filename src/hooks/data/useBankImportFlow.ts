import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface EnrichedTransaction {
  date: string;
  amount: number;
  description: string;
  original_amount?: number;
  transaction_type?: 'income' | 'expense';
  category?: string;
  is_recurring?: boolean;
  recurring_type?: string | null;
  bank_name?: string;
}

export interface DuplicateInfo {
  transaction: EnrichedTransaction;
  existingId: string;
  existingDate: string;
  existingAmount: number;
  existingDescription: string | null;
}

export interface ImportFlowState {
  step: 'upload' | 'duplicates' | 'classifying' | 'summary' | 'done';
  transactions: EnrichedTransaction[];
  duplicates: DuplicateInfo[];
  newTransactions: EnrichedTransaction[];
  classifyProgress: { current: number; total: number };
  classifiedSummary: {
    incomeCount: number;
    expenseCount: number;
    incomeTotal: number;
    expenseTotal: number;
    recurringCount: number;
    unclassifiedCount: number;
  } | null;
  insertedIds: string[];
}

function generateDuplicateHash(date: string, amount: number, description: string): string {
  const normalizedDesc = (description || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 50);
  return `${date}_${Math.abs(amount).toFixed(2)}_${normalizedDesc}`;
}

const BATCH_SIZE = 50;

export function useBankImportFlow() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<ImportFlowState>({
    step: 'upload',
    transactions: [],
    duplicates: [],
    newTransactions: [],
    classifyProgress: { current: 0, total: 0 },
    classifiedSummary: null,
    insertedIds: [],
  });

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      transactions: [],
      duplicates: [],
      newTransactions: [],
      classifyProgress: { current: 0, total: 0 },
      classifiedSummary: null,
      insertedIds: [],
    });
  }, []);

  // Step 1: Check for duplicates
  const checkDuplicates = useCallback(async (transactions: EnrichedTransaction[]) => {
    if (!user) return;

    const hashes = transactions.map(t => generateDuplicateHash(t.date, t.amount, t.description));

    // Fetch existing hashes
    const { data: existing } = await supabase
      .from('bank_transactions')
      .select('id, duplicate_hash, transaction_date, amount, description')
      .eq('user_id', user.id)
      .in('duplicate_hash', hashes);

    const existingHashMap = new Map(
      (existing || []).map(e => [e.duplicate_hash, e])
    );

    const duplicates: DuplicateInfo[] = [];
    const newTxns: EnrichedTransaction[] = [];

    for (const tx of transactions) {
      const hash = generateDuplicateHash(tx.date, tx.amount, tx.description);
      const existingMatch = existingHashMap.get(hash);
      if (existingMatch) {
        duplicates.push({
          transaction: tx,
          existingId: existingMatch.id,
          existingDate: existingMatch.transaction_date,
          existingAmount: existingMatch.amount,
          existingDescription: existingMatch.description,
        });
      } else {
        newTxns.push(tx);
      }
    }

    setState(prev => ({
      ...prev,
      transactions,
      duplicates,
      newTransactions: newTxns,
      step: duplicates.length > 0 ? 'duplicates' : 'classifying',
    }));

    // If no duplicates, auto-proceed to insert + classify
    if (duplicates.length === 0) {
      await insertAndClassify(newTxns);
    }
  }, [user]);

  // Step 2: After duplicate resolution, insert and classify
  const proceedWithImport = useCallback(async (includeduplicates: boolean) => {
    const txnsToImport = includeduplicates
      ? state.transactions
      : state.newTransactions;

    setState(prev => ({ ...prev, step: 'classifying' }));
    await insertAndClassify(txnsToImport);
  }, [state.transactions, state.newTransactions]);

  // Insert transactions and run batch classification
  const insertAndClassify = useCallback(async (transactions: EnrichedTransaction[]) => {
    if (!user || transactions.length === 0) return;

    // Insert all transactions
    const toInsert = transactions.map(t => ({
      user_id: user.id,
      transaction_date: t.date,
      amount: Math.abs(t.amount),
      original_amount: t.original_amount ?? (t.amount < 0 ? t.amount : Math.abs(t.amount)),
      description: t.description,
      status: 'pending',
      bank_name: t.bank_name || null,
      duplicate_hash: generateDuplicateHash(t.date, t.amount, t.description),
      // Pre-fill if we already have AI data from analyze-bank-statement
      transaction_type: t.transaction_type || 'expense',
      category: t.category || null,
      is_recurring: t.is_recurring || false,
      recurring_type: t.recurring_type || null,
      auto_categorized: !!t.category,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('bank_transactions')
      .insert(toInsert)
      .select('id');

    if (insertError) {
      console.error('Insert error:', insertError);
      toast.error(language === 'es' ? 'Error al importar transacciones' : 'Error importing transactions');
      return;
    }

    const insertedIds = (inserted || []).map(r => r.id);
    setState(prev => ({ ...prev, insertedIds }));

    // Find which ones need classification (no category yet)
    const unclassifiedIds = insertedIds.filter((_, i) => !toInsert[i]?.category);

    if (unclassifiedIds.length > 0) {
      await runBatchClassification(unclassifiedIds, insertedIds);
    } else {
      // All already classified, go to summary
      await buildSummary(insertedIds);
    }
  }, [user, language]);

  // Run batch AI classification
  const runBatchClassification = useCallback(async (transactionIds: string[], allInsertedIds?: string[]) => {
    const totalBatches = Math.ceil(transactionIds.length / BATCH_SIZE);
    setState(prev => ({
      ...prev,
      step: 'classifying',
      classifyProgress: { current: 0, total: totalBatches },
    }));

    for (let i = 0; i < totalBatches; i++) {
      const batchIds = transactionIds.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

      try {
        const { data, error } = await supabase.functions.invoke('classify-bank-transactions', {
          body: {
            transactionIds: batchIds,
            batchIndex: i + 1,
            totalBatches,
          },
        });

        if (error) {
          console.error(`Batch ${i + 1} error:`, error);
        }
      } catch (e) {
        console.error(`Batch ${i + 1} failed:`, e);
      }

      setState(prev => ({
        ...prev,
        classifyProgress: { current: i + 1, total: totalBatches },
      }));
    }

    // Use the explicitly passed IDs to avoid stale closure
    const idsForSummary = allInsertedIds && allInsertedIds.length > 0 ? allInsertedIds : transactionIds;
    await buildSummary(idsForSummary);
  }, []);

  // Build summary from classified data
  const buildSummary = useCallback(async (insertedIds: string[]) => {
    if (!user || insertedIds.length === 0) {
      setState(prev => ({ ...prev, step: 'summary', classifiedSummary: { incomeCount: 0, expenseCount: 0, incomeTotal: 0, expenseTotal: 0, recurringCount: 0, unclassifiedCount: 0 } }));
      return;
    }

    const { data: classified } = await supabase
      .from('bank_transactions')
      .select('transaction_type, category, amount, is_recurring')
      .eq('user_id', user.id)
      .in('id', insertedIds);

    const summary = {
      incomeCount: 0,
      expenseCount: 0,
      incomeTotal: 0,
      expenseTotal: 0,
      recurringCount: 0,
      unclassifiedCount: 0,
    };

    for (const tx of classified || []) {
      if (tx.transaction_type === 'income') {
        summary.incomeCount++;
        summary.incomeTotal += Number(tx.amount);
      } else {
        summary.expenseCount++;
        summary.expenseTotal += Number(tx.amount);
      }
      if (tx.is_recurring) summary.recurringCount++;
      if (!tx.category) summary.unclassifiedCount++;
    }

    setState(prev => ({
      ...prev,
      step: 'summary',
      classifiedSummary: summary,
      insertedIds,
    }));
  }, [user]);

  // Step 3: Auto-create expenses and income from classified transactions
  const autoCreateRecords = useCallback(async () => {
    if (!user || state.insertedIds.length === 0) return;

    const { data: transactions } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('user_id', user.id)
      .in('id', state.insertedIds);

    if (!transactions) return;

    let expensesCreated = 0;
    let incomeCreated = 0;

    // Create expenses for debit transactions
    const expenseTxns = transactions.filter(t => t.transaction_type === 'expense');
    if (expenseTxns.length > 0) {
      const expenseBatches = [];
      for (let i = 0; i < expenseTxns.length; i += 100) {
        expenseBatches.push(expenseTxns.slice(i, i + 100));
      }

      for (const batch of expenseBatches) {
        const expenseRecords = batch.map(t => ({
          user_id: user.id,
          amount: Number(t.amount),
          date: t.transaction_date,
          vendor: t.description || null,
          category: t.category || 'other',
          description: `[Banco] ${t.description || ''}`.trim(),
          status: 'approved' as const,
        }));

        const { data: created, error } = await supabase
          .from('expenses')
          .insert(expenseRecords)
          .select('id');

        if (!error && created) {
          expensesCreated += created.length;
          // Link back to bank transactions
          for (let j = 0; j < created.length; j++) {
            await supabase
              .from('bank_transactions')
              .update({ matched_expense_id: created[j].id, status: 'matched' })
              .eq('id', batch[j].id);
          }
        }
      }
    }

    // Create income for credit transactions
    const incomeTxns = transactions.filter(t => t.transaction_type === 'income');
    if (incomeTxns.length > 0) {
      const incomeBatches = [];
      for (let i = 0; i < incomeTxns.length; i += 100) {
        incomeBatches.push(incomeTxns.slice(i, i + 100));
      }

      for (const batch of incomeBatches) {
        const incomeRecords = batch.map(t => {
          // Map bank category to income_type
          let incomeType = 'client_payment';
          if (t.category === 'salary') incomeType = 'salary';
          else if (t.category === 'refund') incomeType = 'refund';
          else if (t.category === 'investment_return') incomeType = 'investment_stocks';
          else if (t.category === 'transfer_in') incomeType = 'client_payment';

          return {
            user_id: user.id,
            amount: Number(t.amount),
            date: t.transaction_date,
            source: t.description || null,
            income_type: incomeType,
            description: `[Banco] ${t.description || ''}`.trim(),
          };
        });

        const { data: created, error } = await supabase
          .from('income')
          .insert(incomeRecords)
          .select('id');

        if (!error && created) {
          incomeCreated += created.length;
          // Link back
          for (let j = 0; j < created.length; j++) {
            await supabase
              .from('bank_transactions')
              .update({ matched_income_id: created[j].id, status: 'matched' })
              .eq('id', batch[j].id);
          }
        }
      }
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['bank-transactions-with-matches'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['income'] });

    toast.success(
      language === 'es'
        ? `Creados: ${expensesCreated} gastos y ${incomeCreated} ingresos`
        : `Created: ${expensesCreated} expenses and ${incomeCreated} income records`
    );

    setState(prev => ({ ...prev, step: 'done' }));
  }, [user, state.insertedIds, language, queryClient]);

  return {
    state,
    reset,
    checkDuplicates,
    proceedWithImport,
    autoCreateRecords,
    buildSummary,
  };
}
