import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExpenseWithRelations, ExpenseInsert, ExpenseUpdate, ExpenseFilters } from '@/types/expense.types';
import { useToast } from '@/hooks/use-toast';
import { useMissionTracker } from './useMissions';
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
        `);
      
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
      
      if (filters?.tagIds?.length) {
        // First get expense IDs that have the selected tags
        const { data: expenseTagData } = await supabase
          .from('expense_tags')
          .select('expense_id')
          .in('tag_id', filters.tagIds);
        
        const expenseIds = expenseTagData?.map(et => et.expense_id) || [];
        if (expenseIds.length > 0) {
          query = query.in('id', expenseIds);
        } else {
          // No expenses match the tag filter, return empty
          return [];
        }
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw error;
      
      // Transform the nested tags structure
      return (data || []).map(expense => ({
        ...expense,
        tags: expense.expense_tags?.map((et: any) => et.tag).filter(Boolean) || [],
      })) as ExpenseWithRelations[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { trackAction } = useMissionTracker();

  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      // Track mission progress
      trackAction('add_expense', 1);
      trackAction('categorize_expense', 1);
      toast({
        title: 'Expense created',
        description: 'The expense has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense updated',
        description: 'The expense has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense deleted',
        description: 'The expense has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddExpenseTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId, tagIds }: { expenseId: string; tagIds: string[] }) => {
      // First, remove existing tags
      await supabase
        .from('expense_tags')
        .delete()
        .eq('expense_id', expenseId);
      
      // Then add new tags
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from('expense_tags')
          .insert(tagIds.map(tagId => ({ expense_id: expenseId, tag_id: tagId })));
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
