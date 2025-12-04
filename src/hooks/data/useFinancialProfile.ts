import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FinancialProfile {
  id: string;
  user_id: string;
  passions: string[];
  talents: string[];
  interests: string[];
  available_capital: number;
  monthly_investment_capacity: number;
  risk_tolerance: string;
  time_availability: string;
  preferred_income_type: string;
  financial_education_level: string;
  created_at: string;
  updated_at: string;
}

export function useFinancialProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['financial-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_financial_profile')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as FinancialProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpsertFinancialProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (profile: Partial<FinancialProfile>) => {
      const { data, error } = await supabase
        .from('user_financial_profile')
        .upsert({ 
          ...profile, 
          user_id: user!.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile'] });
      toast.success(t('investments.profileSaved'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
