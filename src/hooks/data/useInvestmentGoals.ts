import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface InvestmentGoal {
  id: string;
  user_id: string;
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  monthly_target: number;
  asset_class: string | null;
  risk_level: string;
  deadline: string | null;
  color: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useInvestmentGoals() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['investment-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvestmentGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateInvestmentGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (goal: { name: string; target_amount: number; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('investment_goals')
        .insert([{ 
          name: goal.name,
          target_amount: goal.target_amount,
          goal_type: goal.goal_type || 'passive_income',
          current_amount: goal.current_amount || 0,
          monthly_target: goal.monthly_target || 0,
          asset_class: goal.asset_class || null,
          risk_level: goal.risk_level || 'moderate',
          deadline: goal.deadline || null,
          color: goal.color || '#8B5CF6',
          notes: goal.notes || null,
          user_id: user!.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-goals'] });
      toast.success(t('investments.goalCreated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvestmentGoal() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvestmentGoal> }) => {
      const { error } = await supabase
        .from('investment_goals')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-goals'] });
      toast.success(t('investments.goalUpdated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvestmentGoal() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investment_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-goals'] });
      toast.success(t('investments.goalDeleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
