import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BudgetAuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
}

export function useBudgetAuditLog(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budget-audit-log', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_audit_log' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as BudgetAuditEntry[];
    },
    enabled: !!user,
  });
}

export function useLogBudgetChange() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { action: string; entity_type: string; entity_id?: string; old_values?: any; new_values?: any }) => {
      const { error } = await supabase
        .from('budget_audit_log' as any)
        .insert({ ...entry, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-audit-log'] }),
  });
}
