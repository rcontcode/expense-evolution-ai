import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/expense.types';
import { toast } from 'sonner';
import { useGamificationTriggers, getTableCount } from '@/hooks/utils/useGamificationTriggers';

type ClientInsert = {
  name: string;
  country?: string;
  province?: string | null;
  notes?: string | null;
  entity_id?: string | null;
};

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useCreateClient(defaultEntityId?: string) {
  const queryClient = useQueryClient();
  const { triggers } = useGamificationTriggers();

  return useMutation({
    mutationFn: async (client: ClientInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentCount = await getTableCount('clients', user.id);

      const { data, error } = await supabase
        .from('clients')
        .insert({ 
          ...client, 
          user_id: user.id,
          entity_id: client.entity_id || defaultEntityId || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await triggers.client(currentCount);
      
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['user-level'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      toast.success('Cliente creado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear cliente');
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientInsert> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar cliente');
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['income-summary'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Cliente movido a la papelera');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar cliente');
    },
  });
}

export function useDeleteClientTestData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // Delete expense_tags for expenses of this client first
      const { data: clientExpenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('client_id', clientId);
      
      if (clientExpenses && clientExpenses.length > 0) {
        const expenseIds = clientExpenses.map(e => e.id);
        const { error: tagsError } = await supabase
          .from('expense_tags')
          .delete()
          .in('expense_id', expenseIds);
        if (tagsError) throw tagsError;
      }

      // Delete documents linked to expenses of this client
      if (clientExpenses && clientExpenses.length > 0) {
        const expenseIds = clientExpenses.map(e => e.id);
        const { error: docsError } = await supabase
          .from('documents')
          .delete()
          .in('expense_id', expenseIds);
        if (docsError) throw docsError;
      }

      // Delete expenses for this client
      const { error: expensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('client_id', clientId);
      if (expensesError) throw expensesError;

      // Delete income for this client
      const { error: incomeError } = await supabase
        .from('income')
        .delete()
        .eq('client_id', clientId);
      if (incomeError) throw incomeError;

      // Delete mileage for this client
      const { error: mileageError } = await supabase
        .from('mileage')
        .delete()
        .eq('client_id', clientId);
      if (mileageError) throw mileageError;

      // Delete project_clients relationships
      const { error: pcError } = await supabase
        .from('project_clients')
        .delete()
        .eq('client_id', clientId);
      if (pcError) throw pcError;

      // Delete contracts for this client
      const { error: contractsError } = await supabase
        .from('contracts')
        .delete()
        .eq('client_id', clientId);
      if (contractsError) throw contractsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['income-summary'] });
      queryClient.invalidateQueries({ queryKey: ['tags-with-expense-count'] });
      toast.success('Datos de prueba eliminados exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar datos de prueba');
    },
  });
}
