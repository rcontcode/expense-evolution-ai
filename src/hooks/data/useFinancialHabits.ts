import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialHabit {
  id: string;
  user_id: string;
  habit_name: string;
  habit_description: string | null;
  frequency: 'daily' | 'weekly';
  target_per_period: number;
  current_streak: number;
  best_streak: number;
  last_completed_at: string | null;
  is_active: boolean;
  xp_reward: number;
  created_at: string;
  completedToday?: boolean;
  completionsThisPeriod?: number;
}

export interface FinancialHabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  completed_at: string;
  notes: string | null;
}

// Default habits inspired by Tracy/Rohn
export const DEFAULT_HABITS = [
  {
    habit_name: 'Revisar gastos del día',
    habit_description: 'Revisa tus gastos diarios y reflexiona sobre ellos',
    frequency: 'daily' as const,
    xp_reward: 10,
  },
  {
    habit_name: 'Págate primero',
    habit_description: 'Transfiere dinero a ahorro/inversión antes de gastar',
    frequency: 'daily' as const,
    xp_reward: 20,
  },
  {
    habit_name: 'Leer sobre finanzas (15 min)',
    habit_description: 'Dedica 15 minutos a educación financiera',
    frequency: 'daily' as const,
    xp_reward: 15,
  },
  {
    habit_name: 'Revisar metas financieras',
    habit_description: 'Revisa tu progreso hacia tus metas',
    frequency: 'weekly' as const,
    xp_reward: 25,
  },
  {
    habit_name: 'Actualizar presupuesto',
    habit_description: 'Revisa y ajusta tu presupuesto semanal',
    frequency: 'weekly' as const,
    xp_reward: 30,
  },
  {
    habit_name: 'Escribir en diario financiero',
    habit_description: 'Reflexiona sobre tus decisiones financieras',
    frequency: 'daily' as const,
    xp_reward: 15,
  },
];

export function useFinancialHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-habits', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get habits
      const { data: habits, error } = await supabase
        .from('financial_habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get today's logs
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const { data: logs } = await supabase
        .from('financial_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', weekStart.toISOString());

      const logsMap = new Map<string, FinancialHabitLog[]>();
      (logs || []).forEach(log => {
        if (!logsMap.has(log.habit_id)) {
          logsMap.set(log.habit_id, []);
        }
        logsMap.get(log.habit_id)!.push(log as FinancialHabitLog);
      });

      // Enrich habits with completion data
      return (habits || []).map(habit => {
        const habitLogs = logsMap.get(habit.id) || [];
        const completedToday = habitLogs.some(log => 
          log.completed_at.startsWith(today)
        );
        const completionsThisPeriod = habit.frequency === 'daily'
          ? habitLogs.filter(log => log.completed_at.startsWith(today)).length
          : habitLogs.length;

        return {
          ...habit,
          completedToday,
          completionsThisPeriod,
        } as FinancialHabit;
      });
    },
    enabled: !!user,
  });
}

export function useHabitStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-habits-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: habits } = await supabase
        .from('financial_habits')
        .select('current_streak, best_streak, xp_reward')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!habits) return null;

      const totalXP = habits.reduce((sum, h) => sum + (h.xp_reward || 0), 0);
      const longestStreak = Math.max(...habits.map(h => h.best_streak || 0), 0);
      const currentStreakTotal = habits.reduce((sum, h) => sum + (h.current_streak || 0), 0);

      return {
        totalHabits: habits.length,
        totalXP,
        longestStreak,
        currentStreakTotal,
      };
    },
    enabled: !!user,
  });
}

export function useCreateHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { habit_name: string; frequency?: string; habit_description?: string }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('financial_habits')
        .insert({
          user_id: user.id,
          habit_name: data.habit_name,
          frequency: data.frequency || 'daily',
          habit_description: data.habit_description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-habits'] });
      toast.success('Hábito creado');
    },
  });
}

export function useCompleteHabit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, notes }: { habitId: string; notes?: string }) => {
      if (!user) throw new Error('No user');

      // Log the completion
      const { error: logError } = await supabase
        .from('financial_habit_logs')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          notes,
        });

      if (logError) throw logError;

      // Update streak
      const { data: habit } = await supabase
        .from('financial_habits')
        .select('current_streak, best_streak, last_completed_at')
        .eq('id', habitId)
        .single();

      if (habit) {
        const lastCompleted = habit.last_completed_at ? new Date(habit.last_completed_at) : null;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreak = habit.current_streak || 0;
        
        if (!lastCompleted || lastCompleted.toDateString() === yesterday.toDateString()) {
          newStreak++;
        } else if (lastCompleted.toDateString() !== today.toDateString()) {
          newStreak = 1;
        }

        const newBestStreak = Math.max(newStreak, habit.best_streak || 0);

        await supabase
          .from('financial_habits')
          .update({
            current_streak: newStreak,
            best_streak: newBestStreak,
            last_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', habitId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-habits'] });
      toast.success('¡Hábito completado! +XP');
    },
  });
}

export function useInitializeDefaultHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      const habitsToInsert = DEFAULT_HABITS.map(habit => ({
        user_id: user.id,
        ...habit,
      }));

      const { error } = await supabase
        .from('financial_habits')
        .insert(habitsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-habits'] });
      toast.success('Hábitos predeterminados creados');
    },
  });
}
