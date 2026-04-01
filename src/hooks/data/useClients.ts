import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types/expense.types';
import { useGamificationTriggers, getTableCount } from '@/hooks/utils/useGamificationTriggers';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';
import { useUndoableDelete } from '@/hooks/utils/useUndoableAction';

type ClientInsert = {
  name: string;
  country?: string;
  province?: string | null;
  notes?: string | null;
  entity_id?: string | null;
};

export function useClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients').select('*').eq('user_id', user!.id)
        .is('deleted_at', null).order('name', { ascending: true }).limit(500);
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useCreateClient(defaultEntityId?: string) {
  const { user } = useAuth();
  const { triggers } = useGamificationTriggers();
  const { afterClient, invalidate } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (client: ClientInsert) => {
      if (!user) throw new Error('Not authenticated');
      const currentCount = await getTableCount('clients', user.id);

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user.id, entity_id: client.entity_id || defaultEntityId || null })
        .select().single();
      if (error) throw error;
      
      await triggers.client(currentCount);
      await insertAuditLog(user.id, {
        action: 'create', entity_type: 'client', entity_id: data.id,
        entity_name: client.name, new_values: { name: client.name },
      });
      return data as Client;
    },
    onSuccess: () => {
      afterClient();
      invalidate('user-level', 'user-achievements');
      t.success('Cliente creado', 'Client created');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al crear cliente', error.message || 'Error creating client');
    },
  });
}

export function useUpdateClient() {
  const { user } = useAuth();
  const { afterClient } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientInsert> }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('clients').update(updates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      afterClient();
      t.success('Cliente actualizado', 'Client updated');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al actualizar cliente', error.message || 'Error updating client');
    },
  });
}

export function useDeleteClient() {
  const { user } = useAuth();
  const { afterClientDelete } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('clients').select('name').eq('id', id).eq('user_id', user.id).maybeSingle();
      const { error } = await supabase
        .from('clients').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'client', entity_id: id,
        entity_name: existing?.name || null,
      });
    },
    onSuccess: () => {
      afterClientDelete();
      t.success('Cliente movido a la papelera', 'Client moved to trash');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al eliminar cliente', error.message || 'Error deleting client');
    },
  });
}

export function useDeleteClientTestData() {
  const { user } = useAuth();
  const { afterClientDelete, invalidate } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: clientData } = await supabase.from('clients').select('name').eq('id', clientId).maybeSingle();

      const { data: clientExpenses } = await supabase.from('expenses').select('id').eq('client_id', clientId);
      if (clientExpenses && clientExpenses.length > 0) {
        const expenseIds = clientExpenses.map(e => e.id);
        await supabase.from('expense_tags').delete().in('expense_id', expenseIds);
        await supabase.from('documents').update({ expense_id: null }).in('expense_id', expenseIds);
      }

      const { error: expensesError } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('client_id', clientId);
      if (expensesError) throw expensesError;
      const { error: incomeError } = await supabase.from('income').update({ deleted_at: new Date().toISOString() }).eq('client_id', clientId);
      if (incomeError) throw incomeError;
      const { error: mileageError } = await supabase.from('mileage').update({ deleted_at: new Date().toISOString() }).eq('client_id', clientId);
      if (mileageError) throw mileageError;
      const { error: pcError } = await supabase.from('project_clients').delete().eq('client_id', clientId);
      if (pcError) throw pcError;
      const { error: contractsError } = await supabase.from('contracts').update({ deleted_at: new Date().toISOString() }).eq('client_id', clientId);
      if (contractsError) throw contractsError;

      await insertAuditLog(user.id, {
        action: 'bulk_delete_test_data', entity_type: 'client', entity_id: clientId,
        entity_name: clientData?.name || null,
        new_values: { affected_tables: ['expenses', 'income', 'mileage', 'contracts', 'project_clients'] },
      });
    },
    onSuccess: () => {
      afterClientDelete();
      invalidate('mileage', 'mileage-summary', 'tags-with-expense-count');
      t.success('Datos de prueba eliminados exitosamente', 'Test data deleted successfully');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al eliminar datos de prueba', error.message || 'Error deleting test data');
    },
  });
}
