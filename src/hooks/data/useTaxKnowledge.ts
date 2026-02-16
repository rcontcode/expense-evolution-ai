import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TaxKnowledgeAssessment {
  id: string;
  user_id: string;
  country: string;
  general_tax_knowledge: number;
  business_structure_knowledge: number;
  deductions_knowledge: number;
  filing_deadlines_knowledge: number;
  business_start_date_notes: string | null;
  employment_transition_notes: string | null;
  previous_filings_notes: string | null;
  accountant_info: string | null;
  tax_software_used: string | null;
  knowledge_gaps: string[];
  has_filed_before: boolean | null;
  has_accountant: boolean | null;
  switched_from_employee: boolean | null;
  employee_end_date: string | null;
  first_business_revenue_date: string | null;
  knows_fiscal_year_end: boolean | null;
  knows_gst_hst_status: boolean | null;
  knows_tax_regime: boolean | null;
  additional_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTaxKnowledge() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tax-knowledge', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_knowledge_assessment')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as TaxKnowledgeAssessment | null;
    },
    enabled: !!user,
  });
}

export function useUpsertTaxKnowledge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<TaxKnowledgeAssessment>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tax_knowledge_assessment')
        .upsert({
          ...data,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-knowledge'] });
    },
    onError: (error: Error) => {
      console.error('Tax knowledge save error:', error);
      toast.error('Error saving assessment');
    },
  });
}
