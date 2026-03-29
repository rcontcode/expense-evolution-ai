import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/expense.types';
import { toast } from 'sonner';
import { useGamificationTriggers, getTableCount } from '@/hooks/utils/useGamificationTriggers';
import { useInvalidateRelated } from './useInvalidateRelated';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true })
        .limit(500);
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useCreateClient(defaultEntityId?: string) {
  const { triggers } = useGamificationTriggers();
  const { afterClient, invalidate } = useInvalidateRelated();

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

      await supabase.from('audit_log' as any).insert({
        user_id: user.id, action: 'create', entity_type: 'client', entity_id: data.id,
        entity_name: client.name, new_values: { name: client.name },
      } as any);
      
      return data as Client;
    },
    onSuccess: () => {
      afterClient();
      invalidate('user-level', 'user-achievements');
      toast.success('Cliente creado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear cliente');
    },
  });
}

export function useUpdateClient() {
  const { afterClient } = useInvalidateRelated();

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
      afterClient();
      toast.success('Cliente actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar cliente');
    },
  });
}

export function useDeleteClient() {
  const { afterClientDelete } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: existing } = await supabase.from('clients').select('name').eq('id', id).single();
      const { error } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('audit_log' as any).insert({
          user_id: userData.user.id, action: 'delete', entity_type: 'client', entity_id: id,
          entity_name: existing?.name || null,
        } as any);
      }
    },
    onSuccess: () => {
      afterClientDelete();
      toast.success('Cliente movido a la papelera');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar cliente');
    },
  });
}

export function useDeleteClientTestData() {
  const { afterClientDelete, invalidate } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get client name for audit
      const { data: clientData } = await supabase.from('clients').select('name').eq('id', clientId).single();

      // Get all expense IDs for this client to clean dependents
      const { data: clientExpenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('client_id', clientId);
      
      if (clientExpenses && clientExpenses.length > 0) {
        const expenseIds = clientExpenses.map(e => e.id);
        
        // Clean expense_tags (dependent records)
        await supabase.from('expense_tags').delete().in('expense_id', expenseIds);
        
        // Clean documents linked to expenses
        await supabase.from('documents').delete().in('expense_id', expenseIds);
      }

      // Soft-delete expenses instead of hard delete
      const { error: expensesError } = await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('client_id', clientId);
      if (expensesError) throw expensesError;

      // Soft-delete income
      const { error: incomeError } = await supabase
        .from('income')
        .update({ deleted_at: new Date().toISOString() })
        .eq('client_id', clientId);
      if (incomeError) throw incomeError;

      // Mileage and contracts: soft-delete where possible
      const { error: mileageError } = await supabase.from('mileage').delete().eq('client_id', clientId);
      if (mileageError) throw mileageError;

      const { error: pcError } = await supabase.from('project_clients').delete().eq('client_id', clientId);
      if (pcError) throw pcError;

      const { error: contractsError } = await supabase
        .from('contracts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('client_id', clientId);
      if (contractsError) throw contractsError;

      // Audit log
      await supabase.from('audit_log' as any).insert({
        user_id: user.id,
        action: 'bulk_delete_test_data',
        entity_type: 'client',
        entity_id: clientId,
        entity_name: clientData?.name || null,
        new_values: { affected_tables: ['expenses', 'income', 'mileage', 'contracts', 'project_clients'] },
      } as any);
    },
    onSuccess: () => {
      afterClientDelete();
      invalidate('mileage', 'mileage-summary', 'tags-with-expense-count');
      toast.success('Datos de prueba eliminados exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar datos de prueba');
    },
  });
}
