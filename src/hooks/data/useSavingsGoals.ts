import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useMissionTracker } from './useMissions';

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
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Meta de ahorro creada');
    },
    onError: (error: Error) => {
      toast.error('Error al crear meta');
      console.error(error);
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

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

      // Remove undefined values
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
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Meta actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar meta');
      console.error(error);
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Meta eliminada');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar meta');
      console.error(error);
    },
  });
}

export function useAddToSavingsGoal() {
  const queryClient = useQueryClient();
  const { trackAction } = useMissionTracker();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      // First get current amount
      const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = (goal.current_amount || 0) + amount;

      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      // Track mission progress
      trackAction('add_savings', 1);
      toast.success('Cantidad agregada');
    },
    onError: (error: Error) => {
      toast.error('Error al agregar cantidad');
      console.error(error);
    },
  });
}
