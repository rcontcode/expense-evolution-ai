import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

export type TrashItemType = 'expense' | 'income' | 'client' | 'project' | 'contract' | 'mileage';

export interface TrashItem {
  id: string; type: TrashItemType; name: string; details: string; deleted_at: string;
}

export function useTrashItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trash-items', user?.id],
    queryFn: async () => {
      const items: TrashItem[] = [];

      const { data: expenses } = await supabase.from('expenses').select('id, vendor, amount, date, deleted_at')
        .eq('user_id', user!.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      expenses?.forEach(e => items.push({ id: e.id, type: 'expense', name: e.vendor || 'Sin vendedor', details: `$${e.amount} — ${e.date}`, deleted_at: e.deleted_at! }));

      const { data: incomeData } = await supabase.from('income').select('id, source, amount, date, deleted_at')
        .eq('user_id', user!.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      incomeData?.forEach(i => items.push({ id: i.id, type: 'income', name: i.source || 'Sin fuente', details: `$${i.amount} — ${i.date}`, deleted_at: i.deleted_at! }));

      const { data: clients } = await supabase.from('clients').select('id, name, deleted_at')
        .eq('user_id', user!.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      clients?.forEach(c => items.push({ id: c.id, type: 'client', name: c.name, details: '', deleted_at: c.deleted_at! }));

      const { data: projects } = await supabase.from('projects').select('id, name, deleted_at')
        .eq('user_id', user!.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      projects?.forEach(p => items.push({ id: p.id, type: 'project', name: p.name, details: '', deleted_at: p.deleted_at! }));

      const { data: contracts } = await supabase.from('contracts').select('id, title, file_name, deleted_at')
        .eq('user_id', user!.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      contracts?.forEach(c => items.push({ id: c.id, type: 'contract', name: c.title || c.file_name, details: '', deleted_at: c.deleted_at! }));

      const { data: mileageData } = await supabase.from('mileage').select('id, purpose, kilometers, date, deleted_at')
        .eq('user_id', user!.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
      mileageData?.forEach(m => items.push({ id: m.id, type: 'mileage', name: m.purpose || 'Sin propósito', details: `${m.kilometers} km — ${m.date}`, deleted_at: m.deleted_at! }));

      items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      return items;
    },
    enabled: !!user,
  });
}

export function useRestoreItem() {
  const { user } = useAuth();
  const { afterTrash, invalidate } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: TrashItemType }) => {
      if (!user) throw new Error('Not authenticated');
      const table = type === 'expense' ? 'expenses' : type === 'income' ? 'income' : type === 'client' ? 'clients' : type === 'project' ? 'projects' : type === 'mileage' ? 'mileage' : 'contracts';
      const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, { action: 'restore', entity_type: type, entity_id: id });
    },
    onSuccess: () => {
      afterTrash();
      invalidate('trash-items');
      t.success('Elemento restaurado', 'Item restored');
    },
    onError: () => {
      t.error('Error al restaurar', 'Error restoring item');
    },
  });
}

export function usePermanentDelete() {
  const { user } = useAuth();
  const { invalidate } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: TrashItemType }) => {
      if (!user) throw new Error('Not authenticated');
      const table = type === 'expense' ? 'expenses' : type === 'income' ? 'income' : type === 'client' ? 'clients' : type === 'project' ? 'projects' : type === 'mileage' ? 'mileage' : 'contracts';
      
      if (type === 'expense') {
        await supabase.from('expense_tags').delete().eq('expense_id', id);
        await supabase.from('documents').update({ expense_id: null }).eq('expense_id', id);
      }

      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, { action: 'permanent_delete', entity_type: type, entity_id: id });
    },
    onSuccess: () => {
      invalidate('trash-items');
      t.success('Eliminado permanentemente', 'Permanently deleted');
    },
    onError: () => {
      t.error('Error al eliminar', 'Error deleting');
    },
  });
}

export function useEmptyTrash() {
  const { user } = useAuth();
  const { invalidate } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data: deletedExpenses } = await supabase.from('expenses').select('id').eq('user_id', user.id).not('deleted_at', 'is', null);
      if (deletedExpenses?.length) {
        const expenseIds = deletedExpenses.map(e => e.id);
        for (const eid of expenseIds) {
          await supabase.from('expense_tags').delete().eq('expense_id', eid);
        }
        for (const eid of expenseIds) {
          await supabase.from('documents').update({ expense_id: null }).eq('expense_id', eid);
        }
      }

      const tables = ['expenses', 'income', 'clients', 'projects', 'contracts', 'mileage'] as const;
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id).not('deleted_at', 'is', null);
        if (error) throw error;
      }

      await insertAuditLog(user.id, { action: 'empty_trash', entity_type: 'trash', entity_name: 'all' });
    },
    onSuccess: () => {
      invalidate('trash-items');
      t.success('Papelera vaciada', 'Trash emptied');
    },
    onError: () => {
      t.error('Error al vaciar papelera', 'Error emptying trash');
    },
  });
}
