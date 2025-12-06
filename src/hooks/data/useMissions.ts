import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnlockAchievement } from './useGamification';

export interface Mission {
  id: string;
  key: string;
  type: 'daily' | 'weekly';
  xp_reward: number;
  icon: string;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  target: number;
  action: string; // e.g., 'add_expense', 'add_income', 'add_savings', 'login', etc.
}

export interface UserMissionProgress {
  mission_key: string;
  progress: number;
  completed: boolean;
  last_reset: string;
}

// Daily missions reset every day, weekly missions reset every week
export const DAILY_MISSIONS: Mission[] = [
  {
    id: 'daily_expense',
    key: 'daily_expense',
    type: 'daily',
    xp_reward: 5,
    icon: '📝',
    title_es: 'Registro Diario',
    title_en: 'Daily Log',
    description_es: 'Registra al menos 1 gasto hoy',
    description_en: 'Log at least 1 expense today',
    target: 1,
    action: 'add_expense',
  },
  {
    id: 'daily_review',
    key: 'daily_review',
    type: 'daily',
    xp_reward: 10,
    icon: '👀',
    title_es: 'Revisión Diaria',
    title_en: 'Daily Review',
    description_es: 'Revisa tus gastos del día',
    description_en: 'Review your expenses for today',
    target: 1,
    action: 'view_expenses',
  },
  {
    id: 'daily_login',
    key: 'daily_login',
    type: 'daily',
    xp_reward: 3,
    icon: '🔓',
    title_es: 'Inicio de Sesión',
    title_en: 'Login Bonus',
    description_es: 'Inicia sesión en la app',
    description_en: 'Log in to the app',
    target: 1,
    action: 'login',
  },
  {
    id: 'daily_categorize',
    key: 'daily_categorize',
    type: 'daily',
    xp_reward: 8,
    icon: '🏷️',
    title_es: 'Organizador',
    title_en: 'Organizer',
    description_es: 'Categoriza 3 gastos',
    description_en: 'Categorize 3 expenses',
    target: 3,
    action: 'categorize_expense',
  },
];

export const WEEKLY_MISSIONS: Mission[] = [
  {
    id: 'weekly_expenses_5',
    key: 'weekly_expenses_5',
    type: 'weekly',
    xp_reward: 25,
    icon: '📊',
    title_es: 'Rastreador Semanal',
    title_en: 'Weekly Tracker',
    description_es: 'Registra 5 gastos esta semana',
    description_en: 'Log 5 expenses this week',
    target: 5,
    action: 'add_expense',
  },
  {
    id: 'weekly_income',
    key: 'weekly_income',
    type: 'weekly',
    xp_reward: 20,
    icon: '💵',
    title_es: 'Flujo de Ingresos',
    title_en: 'Income Flow',
    description_es: 'Registra al menos 1 ingreso',
    description_en: 'Log at least 1 income',
    target: 1,
    action: 'add_income',
  },
  {
    id: 'weekly_savings',
    key: 'weekly_savings',
    type: 'weekly',
    xp_reward: 30,
    icon: '🐷',
    title_es: 'Ahorro Semanal',
    title_en: 'Weekly Savings',
    description_es: 'Añade dinero a una meta de ahorro',
    description_en: 'Add money to a savings goal',
    target: 1,
    action: 'add_savings',
  },
  {
    id: 'weekly_mileage',
    key: 'weekly_mileage',
    type: 'weekly',
    xp_reward: 15,
    icon: '🚗',
    title_es: 'Viajero de Negocios',
    title_en: 'Business Traveler',
    description_es: 'Registra kilometraje de viaje',
    description_en: 'Log travel mileage',
    target: 1,
    action: 'add_mileage',
  },
  {
    id: 'weekly_streak_3',
    key: 'weekly_streak_3',
    type: 'weekly',
    xp_reward: 35,
    icon: '🔥',
    title_es: 'Racha de 3 Días',
    title_en: '3-Day Streak',
    description_es: 'Mantén una racha de 3 días activos',
    description_en: 'Maintain a 3-day active streak',
    target: 3,
    action: 'maintain_streak',
  },
  {
    id: 'weekly_budget_check',
    key: 'weekly_budget_check',
    type: 'weekly',
    xp_reward: 20,
    icon: '📈',
    title_es: 'Análisis Financiero',
    title_en: 'Financial Analysis',
    description_es: 'Revisa el dashboard 3 veces',
    description_en: 'Check the dashboard 3 times',
    target: 3,
    action: 'view_dashboard',
  },
];

const MISSION_STORAGE_KEY = 'user_mission_progress';

function getStoredProgress(): Record<string, UserMissionProgress> {
  try {
    const stored = localStorage.getItem(MISSION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error parsing mission progress:', e);
  }
  return {};
}

function storeProgress(progress: Record<string, UserMissionProgress>) {
  localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(progress));
}

function shouldResetDaily(lastReset: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return lastReset !== today;
}

function shouldResetWeekly(lastReset: string): boolean {
  const lastResetDate = new Date(lastReset);
  const now = new Date();
  const daysSinceReset = Math.floor((now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24));
  const isNewWeek = now.getDay() < lastResetDate.getDay() || daysSinceReset >= 7;
  return isNewWeek;
}

export function useMissions() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, UserMissionProgress>>(getStoredProgress());
  
  // Reset missions if needed
  useEffect(() => {
    const storedProgress = getStoredProgress();
    const today = new Date().toISOString().split('T')[0];
    let updated = false;
    
    // Check and reset daily missions
    DAILY_MISSIONS.forEach(mission => {
      const missionProgress = storedProgress[mission.key];
      if (missionProgress && shouldResetDaily(missionProgress.last_reset)) {
        storedProgress[mission.key] = {
          mission_key: mission.key,
          progress: 0,
          completed: false,
          last_reset: today,
        };
        updated = true;
      }
    });
    
    // Check and reset weekly missions
    WEEKLY_MISSIONS.forEach(mission => {
      const missionProgress = storedProgress[mission.key];
      if (missionProgress && shouldResetWeekly(missionProgress.last_reset)) {
        storedProgress[mission.key] = {
          mission_key: mission.key,
          progress: 0,
          completed: false,
          last_reset: today,
        };
        updated = true;
      }
    });
    
    if (updated) {
      storeProgress(storedProgress);
      setProgress(storedProgress);
    }
  }, []);
  
  const getMissionProgress = (missionKey: string): UserMissionProgress => {
    return progress[missionKey] || {
      mission_key: missionKey,
      progress: 0,
      completed: false,
      last_reset: new Date().toISOString().split('T')[0],
    };
  };
  
  const getDailyMissionsWithProgress = () => {
    return DAILY_MISSIONS.map(mission => ({
      ...mission,
      ...getMissionProgress(mission.key),
    }));
  };
  
  const getWeeklyMissionsWithProgress = () => {
    return WEEKLY_MISSIONS.map(mission => ({
      ...mission,
      ...getMissionProgress(mission.key),
    }));
  };
  
  const dailyCompleted = DAILY_MISSIONS.filter(m => getMissionProgress(m.key).completed).length;
  const weeklyCompleted = WEEKLY_MISSIONS.filter(m => getMissionProgress(m.key).completed).length;
  
  return {
    dailyMissions: getDailyMissionsWithProgress(),
    weeklyMissions: getWeeklyMissionsWithProgress(),
    dailyCompleted,
    weeklyCompleted,
    totalDailyXP: DAILY_MISSIONS.reduce((acc, m) => acc + m.xp_reward, 0),
    totalWeeklyXP: WEEKLY_MISSIONS.reduce((acc, m) => acc + m.xp_reward, 0),
    progress,
  };
}

export function useCompleteMission() {
  const { t } = useLanguage();
  const unlockAchievement = useUnlockAchievement();
  
  const completeMission = async (missionKey: string, action: string, increment: number = 1) => {
    const storedProgress = getStoredProgress();
    const today = new Date().toISOString().split('T')[0];
    
    // Find the mission
    const mission = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS].find(m => m.action === action);
    if (!mission) return;
    
    const currentProgress = storedProgress[mission.key] || {
      mission_key: mission.key,
      progress: 0,
      completed: false,
      last_reset: today,
    };
    
    // Check if already completed
    if (currentProgress.completed) return;
    
    // Update progress
    const newProgress = Math.min(currentProgress.progress + increment, mission.target);
    const isCompleted = newProgress >= mission.target;
    const remaining = mission.target - newProgress;
    
    storedProgress[mission.key] = {
      ...currentProgress,
      progress: newProgress,
      completed: isCompleted,
      last_reset: today,
    };
    
    storeProgress(storedProgress);
    
    // Show progress notification when close to completing (but not completed yet)
    if (!isCompleted && remaining <= Math.ceil(mission.target * 0.5) && remaining > 0) {
      const progressNotificationKey = `progress_notified_${mission.key}_${newProgress}`;
      const alreadyNotified = localStorage.getItem(progressNotificationKey);
      
      if (!alreadyNotified) {
        localStorage.setItem(progressNotificationKey, 'true');
        
        // Show encouraging notification based on remaining count
        if (remaining === 1) {
          toast.info(`${mission.icon} ¡Ya casi! Te falta solo 1 para completar "${mission.title_es}"`, {
            description: `+${mission.xp_reward} XP te esperan`,
            duration: 5000,
          });
        } else if (remaining <= 2) {
          toast.info(`${mission.icon} ¡Estás cerca! Te faltan ${remaining} para "${mission.title_es}"`, {
            description: `Progreso: ${newProgress}/${mission.target}`,
            duration: 4000,
          });
        } else if (newProgress === 1 && mission.target > 2) {
          // First progress notification
          toast(`${mission.icon} Misión iniciada: ${mission.title_es}`, {
            description: `${newProgress}/${mission.target} completado`,
            duration: 3000,
          });
        }
      }
    }
    
    // If completed, add XP and show notification
    if (isCompleted && !currentProgress.completed) {
      // Add XP to user's spendable balance
      const currentXP = parseInt(localStorage.getItem('user_total_xp') || '0', 10);
      const newXP = currentXP + mission.xp_reward;
      localStorage.setItem('user_total_xp', newXP.toString());
      window.dispatchEvent(new CustomEvent('xp-earned', { detail: { xp: mission.xp_reward } }));
      
      toast.success(`${mission.icon} ${t('missions.completed')}: ${mission.title_es}`, {
        description: `+${mission.xp_reward} XP`,
      });
      
      // Clear progress notifications for this mission
      for (let i = 1; i <= mission.target; i++) {
        localStorage.removeItem(`progress_notified_${mission.key}_${i}`);
      }
      
      // Check for mission-related achievements
      const completedMissions = Object.values(storedProgress).filter(p => p.completed).length;
      if (completedMissions >= 5) {
        unlockAchievement.mutate('mission_starter');
      }
      if (completedMissions >= 25) {
        unlockAchievement.mutate('mission_master');
      }
      if (completedMissions >= 100) {
        unlockAchievement.mutate('mission_legend');
      }
    }
    
    // Trigger re-render
    window.dispatchEvent(new CustomEvent('mission-progress-updated'));
  };
  
  return { completeMission };
}

// Hook to track actions and update missions
export function useMissionTracker() {
  const { completeMission } = useCompleteMission();
  
  const trackAction = (action: string, count: number = 1) => {
    // Find all missions with this action and update them
    [...DAILY_MISSIONS, ...WEEKLY_MISSIONS]
      .filter(m => m.action === action)
      .forEach(mission => {
        completeMission(mission.key, action, count);
      });
  };
  
  return { trackAction };
}

// Hook to listen for login events and track login mission
export function useLoginMissionListener() {
  const { trackAction } = useMissionTracker();
  
  useEffect(() => {
    const handleLogin = () => {
      trackAction('login', 1);
    };
    
    window.addEventListener('user-login', handleLogin);
    return () => window.removeEventListener('user-login', handleLogin);
  }, [trackAction]);
}
