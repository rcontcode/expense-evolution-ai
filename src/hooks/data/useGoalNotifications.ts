import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnlockAchievement } from './useGamification';
import confetti from 'canvas-confetti';

interface GoalNotificationsProps {
  savingsGoals: any[];
  investmentGoals: any[];
  userLevel: any;
}

// Celebrate with confetti
const celebrateGoal = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

const celebrateAchievement = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#10B981', '#8B5CF6', '#F59E0B']
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10B981', '#8B5CF6', '#F59E0B']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};

export function useGoalNotifications({ savingsGoals, investmentGoals, userLevel }: GoalNotificationsProps) {
  const { t } = useLanguage();
  const unlockAchievement = useUnlockAchievement();
  const previousGoalsRef = useRef<Map<string, number>>(new Map());
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      // Initialize with current progress on first load
      const allGoals = [...(savingsGoals || []), ...(investmentGoals || [])];
      allGoals.forEach(goal => {
        previousGoalsRef.current.set(goal.id, goal.current_amount || 0);
      });
      hasInitialized.current = true;
      return;
    }

    const allGoals = [...(savingsGoals || []), ...(investmentGoals || [])];
    
    allGoals.forEach(goal => {
      const previousAmount = previousGoalsRef.current.get(goal.id) || 0;
      const currentAmount = goal.current_amount || 0;
      const targetAmount = goal.target_amount || 0;
      
      if (targetAmount > 0 && currentAmount !== previousAmount) {
        const previousProgress = (previousAmount / targetAmount) * 100;
        const currentProgress = (currentAmount / targetAmount) * 100;
        
        // Check for milestone achievements
        const milestones = [25, 50, 75, 100];
        
        for (const milestone of milestones) {
          if (previousProgress < milestone && currentProgress >= milestone) {
            if (milestone === 100) {
              // Goal completed!
              celebrateGoal();
              toast.success(
                `🎉 ${t('gamification.goalCompleted')}: ${goal.name}!`,
                {
                  description: t('gamification.congratulations'),
                  duration: 5000,
                }
              );
            } else {
              // Milestone reached
              toast.success(
                `🎯 ${goal.name}: ${milestone}% ${t('gamification.completed')}!`,
                {
                  description: `$${currentAmount.toLocaleString()} / $${targetAmount.toLocaleString()}`,
                  duration: 4000,
                }
              );
            }
            break; // Only show one notification per update
          }
        }
        
        // Update stored amount
        previousGoalsRef.current.set(goal.id, currentAmount);
      }
    });
  }, [savingsGoals, investmentGoals, t]);

  // Check for achievement unlocks based on totals
  useEffect(() => {
    if (!savingsGoals || !investmentGoals) return;

    const totalSavings = savingsGoals.reduce((acc, g) => acc + (g.current_amount || 0), 0);
    const totalInvestments = investmentGoals.reduce((acc, g) => acc + (g.current_amount || 0), 0);

    // Savings achievements
    if (totalSavings >= 1000) {
      unlockAchievement.mutate('save_1000');
    }
    if (totalSavings >= 5000) {
      unlockAchievement.mutate('save_5000');
    }

    // Investment achievements
    if (totalInvestments >= 1000) {
      unlockAchievement.mutate('invest_1000');
    }
    if (totalInvestments >= 10000) {
      unlockAchievement.mutate('invest_10000');
    }

    // First goals
    if (savingsGoals.length > 0) {
      unlockAchievement.mutate('first_savings_goal');
    }
    if (investmentGoals.length > 0) {
      unlockAchievement.mutate('first_investment');
    }
  }, [savingsGoals, investmentGoals]);

  // Check streak achievements
  useEffect(() => {
    if (!userLevel) return;

    if (userLevel.streak_days >= 7) {
      unlockAchievement.mutate('track_7_days');
    }
    if (userLevel.streak_days >= 30) {
      unlockAchievement.mutate('track_30_days');
    }
  }, [userLevel?.streak_days]);

  return {
    celebrateGoal,
    celebrateAchievement,
  };
}

// Hook for displaying level up notifications
export function useLevelUpNotification(userLevel: any) {
  const { t } = useLanguage();
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userLevel) return;

    if (previousLevelRef.current !== null && userLevel.level > previousLevelRef.current) {
      // Level up!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });

      toast.success(
        `🎊 ${t('gamification.levelUp')}!`,
        {
          description: `${t('gamification.reachedLevel')} ${userLevel.level}`,
          duration: 5000,
        }
      );
    }

    previousLevelRef.current = userLevel.level;
  }, [userLevel?.level, t]);
}
