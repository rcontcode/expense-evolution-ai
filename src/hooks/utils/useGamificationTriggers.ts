import { useCallback } from 'react';
import { useUnlockAchievement, addExperience, ACHIEVEMENTS } from '@/hooks/data/useGamification';
import { useMissionTracker } from '@/hooks/data/useMissions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface GamificationConfig {
  firstActionAchievement?: keyof typeof ACHIEVEMENTS;
  milestones?: Record<number, keyof typeof ACHIEVEMENTS>;
  xpPerAction?: number;
  missionAction?: string;
}

// Centralized gamification trigger system
export function useGamificationTriggers() {
  const { user } = useAuth();
  const unlockAchievement = useUnlockAchievement();
  const { trackAction } = useMissionTracker();

  // Check and unlock milestone achievements based on count
  const checkMilestones = useCallback(async (
    tableName: string,
    milestones: Record<number, keyof typeof ACHIEVEMENTS>
  ) => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count) {
        // Check each milestone threshold
        Object.entries(milestones).forEach(([threshold, achievementKey]) => {
          if (count >= parseInt(threshold)) {
            unlockAchievement.mutate(achievementKey);
          }
        });
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  }, [user, unlockAchievement]);

  // Trigger gamification for an action
  const triggerAction = useCallback(async (config: GamificationConfig & {
    tableName?: string;
    currentCount?: number;
  }) => {
    if (!user) return;

    const {
      firstActionAchievement,
      milestones,
      xpPerAction = 5,
      missionAction,
      tableName,
      currentCount
    } = config;

    // Award XP for the action
    if (xpPerAction > 0) {
      await addExperience(user.id, xpPerAction);
    }

    // Track mission progress
    if (missionAction) {
      trackAction(missionAction, 1);
    }

    // Check for first action achievement
    if (firstActionAchievement && currentCount !== undefined) {
      if (currentCount === 0) {
        unlockAchievement.mutate(firstActionAchievement);
      }
    }

    // Check milestones
    if (milestones && tableName) {
      await checkMilestones(tableName, milestones);
    }
  }, [user, trackAction, unlockAchievement, checkMilestones]);

  // Pre-configured triggers for common actions
  const triggers = {
    expense: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_expense',
        milestones: {
          10: 'expenses_10',
          50: 'expenses_50',
          100: 'expenses_100',
          500: 'expenses_500'
        },
        xpPerAction: 5,
        missionAction: 'add_expense',
        tableName: 'expenses',
        currentCount
      });
    },

    income: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_income',
        milestones: {
          10: 'income_entries_10',
          50: 'income_entries_50'
        },
        xpPerAction: 5,
        missionAction: 'add_income',
        tableName: 'income',
        currentCount
      });
    },

    client: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_client',
        xpPerAction: 10,
        missionAction: 'add_client',
        currentCount
      });
    },

    mileage: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_mileage',
        xpPerAction: 5,
        missionAction: 'add_mileage',
        currentCount
      });
    },

    contract: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_contract',
        xpPerAction: 15,
        missionAction: 'add_contract',
        currentCount
      });
    },

    savingsGoal: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_savings_goal',
        xpPerAction: 10,
        missionAction: 'add_savings',
        currentCount
      });
    },

    investment: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_investment',
        xpPerAction: 15,
        missionAction: 'add_investment',
        currentCount
      });
    },

    book: async (currentCount?: number) => {
      await triggerAction({
        firstActionAchievement: 'first_book',
        milestones: {
          5: 'bookworm_5',
          10: 'bookworm_10',
          25: 'bookworm_25'
        },
        xpPerAction: 10,
        missionAction: 'add_book',
        currentCount
      });
    }
  };

  return {
    triggerAction,
    triggers,
    checkMilestones
  };
}

// Helper to get current count before mutation
export async function getTableCount(tableName: string, userId: string): Promise<number> {
  const { count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  return count || 0;
}
