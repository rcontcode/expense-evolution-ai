import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BetaTesterPoints {
  id: string;
  user_id: string;
  total_points: number;
  feedback_points: number;
  bug_report_points: number;
  referral_points: number;
  feature_usage_points: number;
  streak_days: number;
  best_streak: number;
  last_activity_date: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  reward_claimed: boolean;
  reward_claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BetaGoal {
  id: string;
  goal_key: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  points_reward: number;
  goal_type: 'one_time' | 'repeatable' | 'streak';
  target_value: number;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface BetaGoalCompletion {
  id: string;
  user_id: string;
  goal_id: string;
  current_progress: number;
  completed_at: string | null;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface BetaRewardRedemption {
  id: string;
  user_id: string;
  reward_type: 'premium_1_year' | 'pro_6_months' | 'pro_1_year' | 'custom';
  points_spent: number;
  tier_at_redemption: string;
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  admin_notes: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const TIER_CONFIG = {
  bronze: { 
    minPoints: 0, 
    color: 'from-amber-600 to-amber-800', 
    textColor: 'text-amber-700',
    icon: '🥉',
    labelEs: 'Bronce',
    labelEn: 'Bronze'
  },
  silver: { 
    minPoints: 200, 
    color: 'from-slate-400 to-slate-600', 
    textColor: 'text-slate-500',
    icon: '🥈',
    labelEs: 'Plata',
    labelEn: 'Silver'
  },
  gold: { 
    minPoints: 500, 
    color: 'from-yellow-400 to-amber-500', 
    textColor: 'text-yellow-600',
    icon: '🥇',
    labelEs: 'Oro',
    labelEn: 'Gold'
  },
  platinum: { 
    minPoints: 1000, 
    color: 'from-cyan-400 to-teal-500', 
    textColor: 'text-cyan-600',
    icon: '💎',
    labelEs: 'Platino',
    labelEn: 'Platinum'
  },
  diamond: { 
    minPoints: 2000, 
    color: 'from-violet-400 to-purple-600', 
    textColor: 'text-violet-600',
    icon: '👑',
    labelEs: 'Diamante',
    labelEn: 'Diamond'
  },
};

export const REWARDS_CONFIG = {
  premium_1_year: {
    points: 1000,
    labelEs: '🎁 Premium 1 Año',
    labelEn: '🎁 Premium 1 Year',
    descEs: 'Acceso completo a todas las funciones Premium por 12 meses',
    descEn: 'Full access to all Premium features for 12 months',
    tier: 'platinum' as const,
  },
  pro_6_months: {
    points: 1500,
    labelEs: '🚀 Pro 6 Meses',
    labelEn: '🚀 Pro 6 Months',
    descEs: 'Acceso completo a todas las funciones Pro por 6 meses',
    descEn: 'Full access to all Pro features for 6 months',
    tier: 'platinum' as const,
  },
  pro_1_year: {
    points: 2000,
    labelEs: '👑 Pro 1 Año',
    labelEn: '👑 Pro 1 Year',
    descEs: 'Acceso completo a todas las funciones Pro por 12 meses',
    descEn: 'Full access to all Pro features for 12 months',
    tier: 'diamond' as const,
  },
};

export const useBetaGamification = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user points
  const { data: userPoints, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['beta-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('beta_tester_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Initialize if doesn't exist
      if (!data) {
        const { data: newPoints, error: insertError } = await supabase
          .from('beta_tester_points')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPoints as BetaTesterPoints;
      }

      return data as BetaTesterPoints;
    },
    enabled: !!user?.id,
  });

  // Fetch all goals
  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['beta-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_goals')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as BetaGoal[];
    },
    enabled: !!user?.id,
  });

  // Fetch user goal completions
  const { data: completions, isLoading: isLoadingCompletions } = useQuery({
    queryKey: ['beta-completions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('beta_goal_completions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as BetaGoalCompletion[];
    },
    enabled: !!user?.id,
  });

  // Fetch reward redemptions
  const { data: redemptions, isLoading: isLoadingRedemptions } = useQuery({
    queryKey: ['beta-redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('beta_reward_redemptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BetaRewardRedemption[];
    },
    enabled: !!user?.id,
  });

  // Award points
  const awardPoints = useMutation({
    mutationFn: async ({ 
      points, 
      category 
    }: { 
      points: number; 
      category: 'feedback' | 'bug_report' | 'referral' | 'feature_usage'; 
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('award_beta_points', {
        p_user_id: user.id,
        p_points: points,
        p_category: category,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beta-points'] });
      toast({
        title: `+${variables.points} puntos! 🎉`,
        description: 'Sigue así para ganar recompensas',
      });
    },
  });

  // Update streak
  const updateStreak = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('update_beta_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-points'] });
    },
  });

  // Claim reward
  const claimReward = useMutation({
    mutationFn: async (rewardType: 'premium_1_year' | 'pro_6_months' | 'pro_1_year') => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('claim_beta_reward', {
        p_user_id: user.id,
        p_reward_type: rewardType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, rewardType) => {
      queryClient.invalidateQueries({ queryKey: ['beta-points'] });
      queryClient.invalidateQueries({ queryKey: ['beta-redemptions'] });
      toast({
        title: '🎁 ¡Recompensa solicitada!',
        description: `Tu ${REWARDS_CONFIG[rewardType].labelEs} está pendiente de aprobación`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (!userPoints) return { current: 0, next: 200, percentage: 0, nextTier: 'silver' as const };

    const tiers = Object.entries(TIER_CONFIG).sort((a, b) => a[1].minPoints - b[1].minPoints);
    const currentTierIndex = tiers.findIndex(([key]) => key === userPoints.tier);
    
    if (currentTierIndex === tiers.length - 1) {
      return { current: userPoints.total_points, next: userPoints.total_points, percentage: 100, nextTier: 'diamond' as const };
    }

    const currentMin = TIER_CONFIG[userPoints.tier].minPoints;
    const nextTier = tiers[currentTierIndex + 1];
    const nextMin = nextTier[1].minPoints;
    
    const progress = ((userPoints.total_points - currentMin) / (nextMin - currentMin)) * 100;
    
    return {
      current: userPoints.total_points,
      next: nextMin,
      percentage: Math.min(progress, 100),
      nextTier: nextTier[0] as keyof typeof TIER_CONFIG,
    };
  };

  // Get goals with progress
  const getGoalsWithProgress = () => {
    if (!goals || !completions) return [];

    return goals.map(goal => {
      const completion = completions.find(c => c.goal_id === goal.id);
      return {
        ...goal,
        currentProgress: completion?.current_progress || 0,
        isCompleted: completion?.completed_at !== null,
        pointsAwarded: completion?.points_awarded || 0,
      };
    });
  };

  // Check if can claim reward
  const canClaimReward = (rewardType: keyof typeof REWARDS_CONFIG) => {
    if (!userPoints) return false;
    if (userPoints.reward_claimed) return false;
    if (redemptions?.some(r => ['pending', 'approved', 'applied'].includes(r.status))) return false;
    return userPoints.total_points >= REWARDS_CONFIG[rewardType].points;
  };

  return {
    // Data
    userPoints,
    goals,
    completions,
    redemptions,
    goalsWithProgress: getGoalsWithProgress(),
    nextTierProgress: getNextTierProgress(),
    // Loading
    isLoading: isLoadingPoints || isLoadingGoals || isLoadingCompletions || isLoadingRedemptions,
    // Mutations
    awardPoints,
    updateStreak,
    claimReward,
    // Helpers
    canClaimReward,
    TIER_CONFIG,
    REWARDS_CONFIG,
  };
};