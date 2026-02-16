import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useMissionTracker } from './useMissions';
import { useInvalidateRelated } from './useInvalidateRelated';

type SavingsGoal = Database['public']['Tables']['savings_goals']['Row'];
type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert'];
type SavingsGoalUpdate = Database['public']['Tables']['savings_goals']['Update'];

export interface SavingsGoalFormData {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: Date | null;
  color?: string;
  priority?: number;
  status?: string;
}

export function useSavingsGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateSavingsGoal() {
  const { user } = useAuth();
  const { afterSavings } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (data: SavingsGoalFormData) => {
      if (!user) throw new Error('Not authenticated');

      const insertData: SavingsGoalInsert = {
        user_id: user.id,
        name: data.name,
        target_amount: data.target_amount,
        current_amount: data.current_amount || 0,
        deadline: data.deadline?.toISOString().split('T')[0] || null,
        color: data.color || '#10B981',
        priority: data.priority || 1,
        status: data.status || 'active',
      };

      const { data: newGoal, error } = await supabase
        .from('savings_goals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return newGoal;
    },
    onSuccess: () => {
      afterSavings();
      toast.success('Meta de ahorro creada');
    },
    onError: (error: Error) => {
      toast.error('Error al crear meta');
      console.error(error);
    },
  });
}

export function useUpdateSavingsGoal() {
  const { afterSavings } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SavingsGoalFormData> }) => {
      const updateData: SavingsGoalUpdate = {
        name: data.name,
        target_amount: data.target_amount,
        current_amount: data.current_amount,
        deadline: data.deadline?.toISOString().split('T')[0],
        color: data.color,
        priority: data.priority,
        status: data.status,
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof SavingsGoalUpdate] === undefined) {
          delete updateData[key as keyof SavingsGoalUpdate];
        }
      });

      const { error } = await supabase
        .from('savings_goals')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      afterSavings();
      toast.success('Meta actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar meta');
      console.error(error);
    },
  });
}

export function useDeleteSavingsGoal() {
  const { afterSavings } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      afterSavings();
      toast.success('Meta eliminada');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar meta');
      console.error(error);
    },
  });
}

export function useAddToSavingsGoal() {
  const { afterSavings } = useInvalidateRelated();
  const { trackAction } = useMissionTracker();

  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('savings_contributions' as any)
        .insert({ goal_id: id, amount, notes, user_id: authUser.id } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      afterSavings();
      trackAction('add_savings', 1);
      toast.success('Cantidad agregada');
    },
    onError: (error: Error) => {
      toast.error('Error al agregar cantidad');
      console.error(error);
    },
  });
}

export function useSavingsContributions(goalId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savings-contributions', goalId],
    queryFn: async () => {
      let q = supabase
        .from('savings_contributions' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('contribution_date', { ascending: false });
      if (goalId) q = q.eq('goal_id', goalId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });
}
