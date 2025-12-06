import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  experience_points: number;
  total_savings: number;
  total_investments: number;
  streak_days: number;
  last_activity_date: string | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  progress: number;
}

export const ACHIEVEMENTS = {
  // Beginner achievements
  first_expense: { icon: '📝', points: 10 },
  first_income: { icon: '💰', points: 10 },
  first_savings_goal: { icon: '🎯', points: 15 },
  first_investment: { icon: '📈', points: 20 },
  complete_profile: { icon: '✅', points: 15 },
  first_client: { icon: '🤝', points: 15 },
  first_mileage: { icon: '🚗', points: 10 },
  first_contract: { icon: '📄', points: 20 },
  
  // Streak achievements
  track_7_days: { icon: '🔥', points: 25 },
  track_30_days: { icon: '⚡', points: 50 },
  track_60_days: { icon: '💪', points: 100 },
  track_100_days: { icon: '🌟', points: 150 },
  track_365_days: { icon: '👑', points: 500 },
  
  // Savings achievements
  save_1000: { icon: '💵', points: 30 },
  save_5000: { icon: '💎', points: 75 },
  save_10000: { icon: '🏦', points: 150 },
  save_25000: { icon: '💰', points: 250 },
  save_50000: { icon: '🤑', points: 400 },
  
  // Investment achievements
  invest_1000: { icon: '🚀', points: 40 },
  invest_10000: { icon: '🏆', points: 100 },
  invest_25000: { icon: '📊', points: 200 },
  invest_50000: { icon: '🌙', points: 350 },
  invest_100000: { icon: '🌍', points: 500 },
  
  // Activity achievements
  expenses_10: { icon: '📋', points: 15 },
  expenses_50: { icon: '📑', points: 35 },
  expenses_100: { icon: '📚', points: 60 },
  expenses_500: { icon: '🗄️', points: 150 },
  income_entries_10: { icon: '💸', points: 20 },
  income_entries_50: { icon: '🏧', points: 50 },
  
  // Mission achievements
  mission_starter: { icon: '🎮', points: 25 },
  mission_master: { icon: '🎯', points: 75 },
  mission_legend: { icon: '🏅', points: 200 },
  daily_perfect: { icon: '⭐', points: 30 },
  weekly_perfect: { icon: '🌠', points: 100 },
  
  // Special achievements
  first_passive_income: { icon: '🌱', points: 50 },
  diversified_investor: { icon: '🎨', points: 100 },
  tax_master: { icon: '📊', points: 75 },
  early_bird: { icon: '🐦', points: 20 },
  night_owl: { icon: '🦉', points: 20 },
  weekend_warrior: { icon: '⚔️', points: 25 },
  consistent_saver: { icon: '🎖️', points: 100 },
  budget_guru: { icon: '🧮', points: 80 },
};

export const LEVELS = [
  { level: 1, name: 'Principiante', minXP: 0, icon: '🌱' },
  { level: 2, name: 'Aprendiz', minXP: 50, icon: '📚' },
  { level: 3, name: 'Ahorrador', minXP: 150, icon: '💰' },
  { level: 4, name: 'Inversor Jr.', minXP: 300, icon: '📊' },
  { level: 5, name: 'Inversor', minXP: 500, icon: '📈' },
  { level: 6, name: 'Estratega', minXP: 750, icon: '🎯' },
  { level: 7, name: 'Experto', minXP: 1000, icon: '⭐' },
  { level: 8, name: 'Maestro', minXP: 1500, icon: '👑' },
  { level: 9, name: 'Leyenda', minXP: 2000, icon: '🏆' },
  { level: 10, name: 'Cashflow Master', minXP: 3000, icon: '💎' },
];

export function useUserLevel() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-level', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_financial_level')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as UserLevel | null;
    },
    enabled: !!user,
  });
}

export function useUserAchievements() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!user,
  });
}

export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (achievementKey: string) => {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('achievement_key', achievementKey)
        .maybeSingle();
      
      if (existing) return null; // Already unlocked
      
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({ 
          user_id: user!.id, 
          achievement_key: achievementKey,
          progress: 100 
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add XP
      const points = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS]?.points || 10;
      await addExperience(user!.id, points);
      
      return data;
    },
    onSuccess: (data, achievementKey) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        queryClient.invalidateQueries({ queryKey: ['user-level'] });
        const achievement = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS];
        toast.success(`${achievement?.icon} ${t('gamification.achievementUnlocked')}: ${t(`gamification.achievements.${achievementKey}`)}`);
      }
    },
  });
}

async function addExperience(userId: string, points: number) {
  const { data: current } = await supabase
    .from('user_financial_level')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (current) {
    const newXP = (current.experience_points || 0) + points;
    const newLevel = LEVELS.filter(l => l.minXP <= newXP).pop()?.level || 1;
    
    await supabase
      .from('user_financial_level')
      .update({ 
        experience_points: newXP, 
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else {
    const newLevel = LEVELS.filter(l => l.minXP <= points).pop()?.level || 1;
    await supabase
      .from('user_financial_level')
      .insert({ 
        user_id: userId, 
        experience_points: points,
        level: newLevel
      });
  }
}

export function useUpdateStreak() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: current } = await supabase
        .from('user_financial_level')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (current) {
        const lastDate = current.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = current.streak_days || 0;
        if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else if (lastDate !== today) {
          newStreak = 1;
        }
        
        await supabase
          .from('user_financial_level')
          .update({ 
            streak_days: newStreak,
            last_activity_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user!.id);
      } else {
        await supabase
          .from('user_financial_level')
          .insert({ 
            user_id: user!.id, 
            streak_days: 1,
            last_activity_date: today
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-level'] });
    },
  });
}
