import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';

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
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InvestmentGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateInvestmentGoal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { invalidate } = useInvalidateRelated();

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
      invalidate('investment-goals', 'dashboard-stats');
      toast.success(t('investments.goalCreated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInvestmentGoal() {
  const { t } = useLanguage();
  const { invalidate } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvestmentGoal> }) => {
      const { error } = await supabase
        .from('investment_goals')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate('investment-goals', 'dashboard-stats');
      toast.success(t('investments.goalUpdated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvestmentGoal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { invalidate } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: existing } = await supabase.from('investment_goals').select('name, target_amount').eq('id', id).single();
      const { error } = await supabase
        .from('investment_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      if (user) {
        await insertAuditLog(user.id, {
          action: 'delete', entity_type: 'investment_goal', entity_id: id,
          entity_name: existing?.name || null, old_values: existing ? { name: existing.name, target_amount: existing.target_amount } : null,
        });
      }
    },
    onSuccess: () => {
      invalidate('investment-goals', 'dashboard-stats');
      toast.success(t('investments.goalDeleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
