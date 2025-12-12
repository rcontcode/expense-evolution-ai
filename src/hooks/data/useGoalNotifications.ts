import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnlockAchievement } from './useGamification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';
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

// Create a notification in the database
async function createNotification(userId: string, title: string, message: string, type: string, actionUrl?: string) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      action_url: actionUrl,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export function useGoalNotifications({ savingsGoals, investmentGoals, userLevel }: GoalNotificationsProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const unlockAchievement = useUnlockAchievement();
  const { playCelebrationSound, playFullCelebration, playSuccessSound } = useCelebrationSound();
  const previousGoalsRef = useRef<Map<string, number>>(new Map());
  const notifiedMilestonesRef = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  // Check if user is close to a goal and notify
  const checkProximityNotifications = useCallback(async (goals: any[], goalType: 'savings' | 'investment') => {
    if (!user) return;

    for (const goal of goals) {
      const progress = goal.target_amount > 0 
        ? (goal.current_amount / goal.target_amount) * 100 
        : 0;
      
      // Notify at 75%, 90%, 95% proximity
      const proximityMilestones = [75, 90, 95];
      
      for (const milestone of proximityMilestones) {
        const notificationKey = `${goal.id}-proximity-${milestone}`;
        
        if (progress >= milestone && progress < 100 && !notifiedMilestonesRef.current.has(notificationKey)) {
          notifiedMilestonesRef.current.add(notificationKey);
          
          const remaining = goal.target_amount - goal.current_amount;
          const title = language === 'es' 
            ? `¡Casi llegas a "${goal.name}"!` 
            : `Almost there for "${goal.name}"!`;
          const message = language === 'es'
            ? `Te falta solo $${remaining.toLocaleString()} (${(100 - progress).toFixed(0)}%) para alcanzar tu meta.`
            : `Only $${remaining.toLocaleString()} (${(100 - progress).toFixed(0)}%) left to reach your goal.`;
          
          // Create persistent notification
          await createNotification(
            user.id, 
            title, 
            message, 
            goalType === 'savings' ? 'savings_goal' : 'investment_goal',
            goalType === 'savings' ? '/net-worth' : '/dashboard'
          );
          
          // Show toast for immediate feedback
          if (milestone >= 90) {
            toast.info(`🔥 ${title}`, {
              description: message,
              duration: 5000,
            });
          }
        }
      }
      
      // Check deadline proximity
      if (goal.deadline && goal.current_amount < goal.target_amount) {
        const daysLeft = Math.ceil(
          (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const deadlineMilestones = [30, 14, 7, 3, 1];
        
        for (const days of deadlineMilestones) {
          const deadlineKey = `${goal.id}-deadline-${days}`;
          
          if (daysLeft === days && !notifiedMilestonesRef.current.has(deadlineKey)) {
            notifiedMilestonesRef.current.add(deadlineKey);
            
            const remaining = goal.target_amount - goal.current_amount;
            const title = language === 'es'
              ? `⏰ ${days} ${days === 1 ? 'día' : 'días'} para "${goal.name}"`
              : `⏰ ${days} ${days === 1 ? 'day' : 'days'} left for "${goal.name}"`;
            const message = language === 'es'
              ? `Te falta $${remaining.toLocaleString()} para cumplir tu meta a tiempo.`
              : `$${remaining.toLocaleString()} remaining to meet your goal on time.`;
            
            await createNotification(
              user.id,
              title,
              message,
              'goal_deadline',
              '/dashboard'
            );
            
            if (days <= 7) {
              toast.warning(title, {
                description: message,
                duration: 5000,
              });
            }
          }
        }
      }
    }
  }, [user, language]);

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
              // Goal completed! Play full celebration
              celebrateGoal();
              playFullCelebration();
              toast.success(
                `🎉 ${t('gamification.goalCompleted')}: ${goal.name}!`,
                {
                  description: t('gamification.congratulations'),
                  duration: 5000,
                }
              );
              
              // Unlock goal completion achievements
              if (goal.goal_type) {
                unlockAchievement.mutate(`goal_complete_${goal.goal_type}`);
              }
              unlockAchievement.mutate('first_goal_complete');
              
              // Create celebratory notification
              if (user) {
                createNotification(
                  user.id,
                  language === 'es' ? `🎉 ¡Meta completada!` : `🎉 Goal completed!`,
                  language === 'es' 
                    ? `Has alcanzado tu meta "${goal.name}". ¡Felicidades!`
                    : `You've reached your goal "${goal.name}". Congratulations!`,
                  'goal_complete',
                  '/dashboard'
                );
              }
            } else {
              // Milestone reached - play success sound
              playSuccessSound();
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

    // Check proximity notifications
    if (savingsGoals) {
      checkProximityNotifications(savingsGoals, 'savings');
    }
    if (investmentGoals) {
      checkProximityNotifications(investmentGoals, 'investment');
    }
  }, [savingsGoals, investmentGoals, t, checkProximityNotifications, user, language, unlockAchievement]);

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
    if (totalSavings >= 10000) {
      unlockAchievement.mutate('save_10000');
    }
    if (totalSavings >= 25000) {
      unlockAchievement.mutate('save_25000');
    }
    if (totalSavings >= 50000) {
      unlockAchievement.mutate('save_50000');
    }

    // Investment achievements
    if (totalInvestments >= 1000) {
      unlockAchievement.mutate('invest_1000');
    }
    if (totalInvestments >= 10000) {
      unlockAchievement.mutate('invest_10000');
    }
    if (totalInvestments >= 25000) {
      unlockAchievement.mutate('invest_25000');
    }
    if (totalInvestments >= 50000) {
      unlockAchievement.mutate('invest_50000');
    }
    if (totalInvestments >= 100000) {
      unlockAchievement.mutate('invest_100000');
    }

    // First goals
    if (savingsGoals.length > 0) {
      unlockAchievement.mutate('first_savings_goal');
    }
    if (investmentGoals.length > 0) {
      unlockAchievement.mutate('first_investment');
    }

    // Completed goals count
    const completedGoals = [
      ...savingsGoals.filter(g => g.current_amount >= g.target_amount),
      ...investmentGoals.filter(g => g.current_amount >= g.target_amount)
    ];

    if (completedGoals.length >= 1) {
      unlockAchievement.mutate('goal_achiever_1');
    }
    if (completedGoals.length >= 3) {
      unlockAchievement.mutate('goal_achiever_3');
    }
    if (completedGoals.length >= 5) {
      unlockAchievement.mutate('goal_achiever_5');
    }
    if (completedGoals.length >= 10) {
      unlockAchievement.mutate('goal_master');
    }
  }, [savingsGoals, investmentGoals, unlockAchievement]);

  // Check streak achievements
  useEffect(() => {
    if (!userLevel) return;

    if (userLevel.streak_days >= 7) {
      unlockAchievement.mutate('track_7_days');
    }
    if (userLevel.streak_days >= 30) {
      unlockAchievement.mutate('track_30_days');
    }
    if (userLevel.streak_days >= 60) {
      unlockAchievement.mutate('track_60_days');
    }
    if (userLevel.streak_days >= 100) {
      unlockAchievement.mutate('track_100_days');
    }
    if (userLevel.streak_days >= 365) {
      unlockAchievement.mutate('track_365_days');
    }
  }, [userLevel?.streak_days, unlockAchievement]);

  return {
    celebrateGoal,
    celebrateAchievement,
  };
}

// Hook for displaying level up notifications
export function useLevelUpNotification(userLevel: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { playFullCelebration } = useCelebrationSound();
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userLevel) return;

    if (previousLevelRef.current !== null && userLevel.level > previousLevelRef.current) {
      // Level up! Play celebration sound
      playFullCelebration();
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

      // Create persistent notification
      if (user) {
        createNotification(
          user.id,
          `🎊 ${t('gamification.levelUp')}!`,
          `${t('gamification.reachedLevel')} ${userLevel.level}`,
          'level_up',
          '/dashboard'
        );
      }
    }

    previousLevelRef.current = userLevel.level;
  }, [userLevel?.level, t, user, playFullCelebration]);
}

// Hook for achievement unlock notifications
export function useAchievementNotification() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { playCelebrationSound } = useCelebrationSound();

  const notifyAchievement = useCallback(async (achievementKey: string, achievementName: string) => {
    if (!user) return;

    // Play celebration sound and confetti
    playCelebrationSound();
    celebrateAchievement();

    toast.success(
      language === 'es' ? '🏆 ¡Logro desbloqueado!' : '🏆 Achievement unlocked!',
      {
        description: achievementName,
        duration: 5000,
      }
    );

    await createNotification(
      user.id,
      language === 'es' ? '🏆 ¡Logro desbloqueado!' : '🏆 Achievement unlocked!',
      achievementName,
      'achievement',
      '/notifications'
    );
  }, [user, language, playCelebrationSound]);

  return { notifyAchievement };
}
