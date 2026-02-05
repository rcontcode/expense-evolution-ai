 import { useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { ACHIEVEMENTS } from './useGamification';
 
 /**
  * Hook for creating gamification-related notifications in the database.
  * These persist in the notification center for users to review later.
  */
 export function useGamificationNotifications() {
   const { user } = useAuth();
   const { language } = useLanguage();
 
   const createNotification = useCallback(async (
     title: string,
     message: string,
     type: string,
     actionUrl?: string
   ) => {
     if (!user) return;
 
     try {
       await supabase.from('notifications').insert({
         user_id: user.id,
         title,
         message,
         type,
         action_url: actionUrl,
       });
     } catch (error) {
       console.error('Failed to create gamification notification:', error);
     }
   }, [user]);
 
   const notifyAchievementUnlocked = useCallback(async (achievementKey: string) => {
     if (!user) return;
 
     const achievementData = ACHIEVEMENTS[achievementKey as keyof typeof ACHIEVEMENTS];
     const icon = achievementData?.icon || '🏆';
     const points = achievementData?.points || 0;
 
     const titles: Record<string, { es: string; en: string }> = {
       first_expense: { es: '¡Primer Gasto Registrado!', en: 'First Expense Logged!' },
       first_income: { es: '¡Primer Ingreso Registrado!', en: 'First Income Logged!' },
       first_savings_goal: { es: '¡Meta de Ahorro Creada!', en: 'Savings Goal Created!' },
       first_investment: { es: '¡Primera Inversión!', en: 'First Investment!' },
       track_7_days: { es: '¡7 Días de Racha!', en: '7 Day Streak!' },
       track_30_days: { es: '¡30 Días de Disciplina!', en: '30 Days of Discipline!' },
       save_1000: { es: '¡$1,000 Ahorrados!', en: '$1,000 Saved!' },
       save_5000: { es: '¡$5,000 Ahorrados!', en: '$5,000 Saved!' },
     };
 
     const defaultTitle = { es: '¡Logro Desbloqueado!', en: 'Achievement Unlocked!' };
     const title = `${icon} ${(titles[achievementKey] || defaultTitle)[language]}`;
     const message = language === 'es'
       ? `¡Has ganado ${points} XP! Sigue así para desbloquear más logros.`
       : `You earned ${points} XP! Keep going to unlock more achievements.`;
 
     await createNotification(title, message, 'achievement', '/adventure');
   }, [user, language, createNotification]);
 
   const notifyLevelUp = useCallback(async (newLevel: number, levelName: string) => {
     if (!user) return;
 
     const title = language === 'es'
       ? `🎉 ¡Nivel ${newLevel} Alcanzado!`
       : `🎉 Level ${newLevel} Reached!`;
     const message = language === 'es'
       ? `¡Felicidades! Ahora eres "${levelName}". Tu maestría financiera crece.`
       : `Congratulations! You are now "${levelName}". Your financial mastery grows.`;
 
     await createNotification(title, message, 'level_up', '/adventure');
   }, [user, language, createNotification]);
 
   const notifyStreakMilestone = useCallback(async (streakDays: number) => {
     if (!user) return;
 
     const milestones: Record<number, { es: string; en: string; emoji: string }> = {
       7: { es: '¡1 Semana de Racha!', en: '1 Week Streak!', emoji: '🔥' },
       14: { es: '¡2 Semanas de Racha!', en: '2 Week Streak!', emoji: '⚡' },
       30: { es: '¡1 Mes de Racha!', en: '1 Month Streak!', emoji: '🌟' },
       60: { es: '¡2 Meses de Racha!', en: '2 Month Streak!', emoji: '💪' },
       100: { es: '¡100 Días de Racha!', en: '100 Day Streak!', emoji: '🏆' },
       365: { es: '¡1 Año de Racha!', en: '1 Year Streak!', emoji: '👑' },
     };
 
     const milestone = milestones[streakDays];
     if (!milestone) return;
 
     const title = `${milestone.emoji} ${milestone[language]}`;
     const message = language === 'es'
       ? `¡Increíble constancia! Has mantenido tu racha por ${streakDays} días consecutivos.`
       : `Incredible consistency! You've maintained your streak for ${streakDays} consecutive days.`;
 
     await createNotification(title, message, 'streak_milestone', '/adventure');
   }, [user, language, createNotification]);
 
   return {
     createNotification,
     notifyAchievementUnlocked,
     notifyLevelUp,
     notifyStreakMilestone,
   };
 }