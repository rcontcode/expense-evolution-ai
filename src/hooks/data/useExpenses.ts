import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExpenseWithRelations, ExpenseInsert, ExpenseUpdate, ExpenseFilters } from '@/types/expense.types';
import { toast } from 'sonner';
import { useMissionTracker } from './useMissions';
import { useGamificationTriggers, getTableCount } from '@/hooks/utils/useGamificationTriggers';
import { useAuth } from '@/contexts/AuthContext';
import { useInvalidateRelated } from './useInvalidateRelated';

const QUERY_LIMIT = 500;

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          client:clients(*),
          expense_tags(tag:tags(*))
        `)
        .is('deleted_at', null);
      
      // Apply filters
      if (filters?.dateRange) {
        query = query
          .gte('date', filters.dateRange.start.toISOString().split('T')[0])
          .lte('date', filters.dateRange.end.toISOString().split('T')[0]);
      }
      
      if (filters?.clientIds?.length) {
        query = query.in('client_id', filters.clientIds);
      }
      
      if (filters?.statuses?.length) {
        query = query.in('status', filters.statuses);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }
      
      if (filters?.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }
      
      if (filters?.searchQuery) {
        query = query.or(`vendor.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,notes.ilike.%${filters.searchQuery}%`);
      }

      if (filters?.hasReceipt) {
        query = query.not('document_id', 'is', null);
      }

      if (filters?.reimbursementType) {
        query = query.eq('reimbursement_type', filters.reimbursementType);
      }

      // Entity/Jurisdiction filtering
      if (filters?.entityId) {
        query = query.eq('entity_id', filters.entityId);
      } else if (filters?.showAllEntities !== true && filters?.entityId === undefined) {
        // By default, show expenses without entity_id (legacy data)
      }

      // Filter for incomplete expenses (for reports)
      if (filters?.onlyIncomplete) {
        query = query.or(
          'reimbursement_type.eq.pending_classification,' +
          'and(reimbursement_type.eq.client_reimbursable,client_id.is.null),' +
          'and(reimbursement_type.eq.client_reimbursable,contract_id.is.null),' +
          'category.is.null'
        );
      }
      
      if (filters?.tagIds?.length) {
        const { data: expenseTagData } = await supabase
          .from('expense_tags')
          .select('expense_id, tag_id')
          .in('tag_id', filters.tagIds);
        
        const tagFilterMode = filters.tagFilterMode || 'OR';
        
        if (tagFilterMode === 'AND') {
          const expenseTagCounts = new Map<string, Set<string>>();
          expenseTagData?.forEach(et => {
            const tags = expenseTagCounts.get(et.expense_id) || new Set();
            tags.add(et.tag_id);
            expenseTagCounts.set(et.expense_id, tags);
          });
          
          const expenseIds = Array.from(expenseTagCounts.entries())
            .filter(([, tagSet]) => filters.tagIds!.every(tagId => tagSet.has(tagId)))
            .map(([expenseId]) => expenseId);
          
          if (expenseIds.length > 0) {
            query = query.in('id', expenseIds);
          } else {
            return [];
          }
        } else {
          const expenseIds = [...new Set(expenseTagData?.map(et => et.expense_id) || [])];
          if (expenseIds.length > 0) {
            query = query.in('id', expenseIds);
          } else {
            return [];
          }
        }
      }
      
      const { data, error } = await query.order('date', { ascending: false }).limit(QUERY_LIMIT);
      
      if (error) throw error;
      
      return (data || []).map(expense => ({
        ...expense,
        tags: expense.expense_tags?.map((et: any) => et.tag).filter(Boolean) || [],
      })) as ExpenseWithRelations[];
    },
  });
}

export function useCreateExpense() {
  const { user } = useAuth();
  const { trackAction } = useMissionTracker();
  const { triggers } = useGamificationTriggers();
  const { afterExpense, invalidate } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (expense: Omit<ExpenseInsert, 'user_id'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Validate vendor is not garbage
      const vendor = (expense as any).vendor?.trim();
      if (vendor && (vendor === 'Unknown' || /^\d{4}$/.test(vendor) || /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}$/i.test(vendor))) {
        console.warn('Suspicious vendor name detected:', vendor);
      }

      // Duplicate detection: same amount + same date + similar vendor
      const amount = (expense as any).amount;
      const date = (expense as any).date;
      if (amount && date && vendor) {
        const { data: potentialDupes } = await supabase
          .from('expenses')
          .select('id, vendor, amount, date')
          .eq('user_id', userData.user.id)
          .eq('amount', amount)
          .eq('date', date)
          .is('deleted_at', null)
          .limit(5);
        
        if (potentialDupes && potentialDupes.length > 0) {
          const vendorLower = vendor.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isDupe = potentialDupes.some(d => {
            const existingVendor = (d.vendor || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            // Simple similarity: one contains the other or Levenshtein-like check
            return existingVendor === vendorLower || 
                   existingVendor.includes(vendorLower) || 
                   vendorLower.includes(existingVendor);
          });
          if (isDupe) {
            throw new Error('DUPLICATE_DETECTED');
          }
        }
      }

      const currentCount = await getTableCount('expenses', userData.user.id);

      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: userData.user.id })
        .select()
        .single();
      
      if (error) throw error;
      
      await triggers.expense(currentCount);
      
      await supabase.from('audit_log' as any).insert({
        user_id: userData.user.id,
        action: 'create',
        entity_type: 'expense',
        entity_id: data.id,
        entity_name: (expense as any).vendor || null,
        new_values: { amount: (expense as any).amount, vendor: (expense as any).vendor, category: (expense as any).category },
      } as any);

      return data;
    },
    onSuccess: () => {
      afterExpense();
      invalidate('user-level', 'user-achievements');
      trackAction('add_expense', 1);
      trackAction('categorize_expense', 1);
      toast.success('Gasto registrado');
    },
    onError: (error: Error) => {
      if (error.message === 'DUPLICATE_DETECTED') {
        toast.error('⚠️ Este gasto parece duplicado (mismo monto, fecha y proveedor)');
        return;
      }
      toast.error(error.message || 'Error al registrar gasto');
    },
  });
}

export function useUpdateExpense() {
  const { afterExpense } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ExpenseUpdate }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterExpense();
      toast.success('Gasto actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar gasto');
    },
  });
}

export function useDeleteExpense() {
  const { afterExpense } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: existing } = await supabase.from('expenses').select('vendor, amount').eq('id', id).single();
      
      const { error } = await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('audit_log' as any).insert({
          user_id: userData.user.id,
          action: 'delete',
          entity_type: 'expense',
          entity_id: id,
          entity_name: existing?.vendor || null,
          old_values: existing ? { vendor: existing.vendor, amount: existing.amount } : null,
        } as any);
      }
    },
    onSuccess: () => {
      afterExpense();
      toast.success('Gasto movido a la papelera');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar gasto');
    },
  });
}

export function useAddExpenseTags() {
  const { invalidate } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ expenseId, tagIds }: { expenseId: string; tagIds: string[] }) => {
      await supabase
        .from('expense_tags')
        .delete()
        .eq('expense_id', expenseId);
      
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from('expense_tags')
          .insert(tagIds.map(tagId => ({ expense_id: expenseId, tag_id: tagId })));
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate('expenses');
    },
  });
}
