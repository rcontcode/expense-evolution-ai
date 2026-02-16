import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TrashItemType = 'expense' | 'income' | 'client' | 'project' | 'contract';

export interface TrashItem {
  id: string;
  type: TrashItemType;
  name: string;
  details: string;
  deleted_at: string;
}

export function useTrashItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trash-items', user?.id],
    queryFn: async () => {
      const items: TrashItem[] = [];

      // Fetch deleted expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, vendor, amount, date, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      expenses?.forEach(e => items.push({
        id: e.id,
        type: 'expense',
        name: e.vendor || 'Sin vendedor',
        details: `$${e.amount} — ${e.date}`,
        deleted_at: e.deleted_at!,
      }));

      // Fetch deleted income
      const { data: incomeData } = await supabase
        .from('income')
        .select('id, source, amount, date, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      incomeData?.forEach(i => items.push({
        id: i.id,
        type: 'income',
        name: i.source || 'Sin fuente',
        details: `$${i.amount} — ${i.date}`,
        deleted_at: i.deleted_at!,
      }));

      // Fetch deleted clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      clients?.forEach(c => items.push({
        id: c.id,
        type: 'client',
        name: c.name,
        details: '',
        deleted_at: c.deleted_at!,
      }));

      // Fetch deleted projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      projects?.forEach(p => items.push({
        id: p.id,
        type: 'project',
        name: p.name,
        details: '',
        deleted_at: p.deleted_at!,
      }));

      // Fetch deleted contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, title, file_name, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      contracts?.forEach(c => items.push({
        id: c.id,
        type: 'contract',
        name: c.title || c.file_name,
        details: '',
        deleted_at: c.deleted_at!,
      }));

      // Sort all by deleted_at desc
      items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

      return items;
    },
    enabled: !!user,
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: TrashItemType }) => {
      const table = type === 'expense' ? 'expenses' : type === 'income' ? 'income' : type === 'client' ? 'clients' : type === 'project' ? 'projects' : 'contracts';
      
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null } as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-items'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['income-summary'] });
      toast.success('Elemento restaurado');
    },
    onError: () => {
      toast.error('Error al restaurar');
    },
  });
}

export function usePermanentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: TrashItemType }) => {
      const table = type === 'expense' ? 'expenses' : type === 'income' ? 'income' : type === 'client' ? 'clients' : type === 'project' ? 'projects' : 'contracts';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-items'] });
      toast.success('Eliminado permanentemente');
    },
    onError: () => {
      toast.error('Error al eliminar');
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Delete all soft-deleted records permanently
      const tables = ['expenses', 'income', 'clients', 'projects', 'contracts'] as const;
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .not('deleted_at', 'is', null);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-items'] });
      toast.success('Papelera vaciada');
    },
    onError: () => {
      toast.error('Error al vaciar papelera');
    },
  });
}
