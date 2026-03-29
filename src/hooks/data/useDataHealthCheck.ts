import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HealthIssue {
  issue_type: string;
  record_id: string;
  entity_type: string;
  record_name: string;
  detail: string;
  record_date: string;
}

const ISSUE_LABELS: Record<string, { es: string; en: string; severity: 'warning' | 'error' }> = {
  expense_no_client: { es: 'Gasto con cliente eliminado', en: 'Expense with deleted client', severity: 'warning' },
  expense_no_project: { es: 'Gasto con proyecto eliminado', en: 'Expense with deleted project', severity: 'warning' },
  income_no_client: { es: 'Ingreso con cliente eliminado', en: 'Income with deleted client', severity: 'warning' },
  income_no_project: { es: 'Ingreso con proyecto eliminado', en: 'Income with deleted project', severity: 'warning' },
  expense_no_entity: { es: 'Gasto con entidad eliminada', en: 'Expense with deleted entity', severity: 'warning' },
  expense_unclassified: { es: 'Gasto sin clasificar', en: 'Unclassified expense', severity: 'error' },
};

export function useDataHealthCheck() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['data-health-check', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_health_check' as any)
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      const issues = (data || []) as unknown as HealthIssue[];

      // Group by issue type
      const grouped: Record<string, HealthIssue[]> = {};
      issues.forEach(issue => {
        if (!grouped[issue.issue_type]) grouped[issue.issue_type] = [];
        grouped[issue.issue_type].push(issue);
      });

      return {
        issues,
        grouped,
        totalIssues: issues.length,
        labels: ISSUE_LABELS,
      };
    },
    enabled: !!user,
  });
}

export { ISSUE_LABELS };
