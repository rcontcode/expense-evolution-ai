import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { useMissionTracker } from './useMissions';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

type SavingsGoal = Database['public']['Tables']['savings_goals']['Row'];
type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert'];
type SavingsGoalUpdate = Database['public']['Tables']['savings_goals']['Update'];

export interface SavingsGoalFormData {
  name: string; target_amount: number; current_amount?: number;
  deadline?: Date | null; color?: string; priority?: number; status?: string;
}

export function useSavingsGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', user!.id).order('priority', { ascending: true });
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateSavingsGoal() {
  const { user } = useAuth();
  const { afterSavings } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: SavingsGoalFormData) => {
      if (!user) throw new Error('Not authenticated');
      const insertData: SavingsGoalInsert = {
        user_id: user.id, name: data.name, target_amount: data.target_amount,
        current_amount: data.current_amount || 0,
        deadline: data.deadline?.toISOString().split('T')[0] || null,
        color: data.color || '#10B981', priority: data.priority || 1, status: data.status || 'active',
      };
      const { data: newGoal, error } = await supabase.from('savings_goals').insert(insertData).select().single();
      if (error) throw error;
      return newGoal;
    },
    onSuccess: () => {
      afterSavings();
      t.success('Meta de ahorro creada', 'Savings goal created');
    },
    onError: () => {
      t.error('Error al crear meta', 'Error creating goal');
    },
  });
}

export function useUpdateSavingsGoal() {
  const { afterSavings } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SavingsGoalFormData> }) => {
      const updateData: SavingsGoalUpdate = {
        name: data.name, target_amount: data.target_amount, current_amount: data.current_amount,
        deadline: data.deadline?.toISOString().split('T')[0], color: data.color,
        priority: data.priority, status: data.status,
      };
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof SavingsGoalUpdate] === undefined) delete updateData[key as keyof SavingsGoalUpdate];
      });
      const { error } = await supabase.from('savings_goals').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      afterSavings();
      t.success('Meta actualizada', 'Goal updated');
    },
    onError: () => {
      t.error('Error al actualizar meta', 'Error updating goal');
    },
  });
}

export function useDeleteSavingsGoal() {
  const { afterSavings } = useInvalidateRelated();
  const { user } = useAuth();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: existing } = await supabase.from('savings_goals').select('name, target_amount').eq('id', id).single();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      if (user) {
        await insertAuditLog(user.id, {
          action: 'delete', entity_type: 'savings_goal', entity_id: id,
          entity_name: existing?.name || null, old_values: existing ? { name: existing.name, target_amount: existing.target_amount } : null,
        });
      }
    },
    onSuccess: () => {
      afterSavings();
      t.success('Meta eliminada', 'Goal deleted');
    },
    onError: () => {
      t.error('Error al eliminar meta', 'Error deleting goal');
    },
  });
}

export function useAddToSavingsGoal() {
  const { user } = useAuth();
  const { afterSavings } = useInvalidateRelated();
  const { trackAction } = useMissionTracker();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('savings_contributions').insert({ goal_id: id, amount, notes, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      afterSavings();
      trackAction('add_savings', 1);
      t.success('Cantidad agregada', 'Amount added');
    },
    onError: () => {
      t.error('Error al agregar cantidad', 'Error adding amount');
    },
  });
}

export function useSavingsContributions(goalId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savings-contributions', goalId],
    queryFn: async () => {
      let q = supabase.from('savings_contributions').select('*').eq('user_id', user!.id).order('contribution_date', { ascending: false });
      if (goalId) q = q.eq('goal_id', goalId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });
}
