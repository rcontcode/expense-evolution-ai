import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BudgetAlertRule {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  condition_type: 'exceeds' | 'approaches' | 'daily_exceeds';
  threshold_amount: number;
  threshold_percentage: number | null;
  is_active: boolean;
  notify_method: string;
  last_triggered_at: string | null;
  entity_id: string | null;
  created_at: string;
}

export function useBudgetAlertRules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budget-alert-rules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_alert_rules')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BudgetAlertRule[];
    },
    enabled: !!user,
  });
}

export function useCreateAlertRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<BudgetAlertRule>) => {
      const { error } = await supabase
        .from('budget_alert_rules')
        .insert({ ...rule, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-alert-rules'] }),
  });
}

export function useUpdateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetAlertRule> & { id: string }) => {
      const { error } = await supabase
        .from('budget_alert_rules')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-alert-rules'] }),
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_alert_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-alert-rules'] }),
  });
}
