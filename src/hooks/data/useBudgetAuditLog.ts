import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Consolidated into the main audit_log table using entity_type = 'budget'
export interface BudgetAuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
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
        .from('audit_log')
        .select('*')
        .eq('user_id', user!.id)
        .in('entity_type', ['budget', 'category_budget', 'budget_rollover'])
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
    mutationFn: async (entry: { action: string; entity_type: string; entity_id?: string; entity_name?: string; old_values?: any; new_values?: any }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('log_audit_event', {
        _action: entry.action,
        _entity_type: entry.entity_type,
        _entity_id: entry.entity_id || null,
        _entity_name: entry.entity_name || null,
        _old_values: (entry.old_values ?? null) as any,
        _new_values: (entry.new_values ?? null) as any,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-audit-log'] }),
  });
}
