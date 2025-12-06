import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Reward {
  id: string;
  type: 'theme' | 'badge' | 'feature' | 'title';
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  xp_cost: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview?: string; // For themes, color preview
  unlockable: boolean;
}

export interface UnlockedReward {
  reward_id: string;
  unlocked_at: string;
  equipped?: boolean;
}

const REWARDS_STORAGE_KEY = 'user_rewards';
const USER_XP_KEY = 'user_total_xp';

// Available rewards
export const REWARDS: Reward[] = [
  // Premium Themes
  {
    id: 'theme_midnight',
    type: 'theme',
    name_es: 'Tema Medianoche',
    name_en: 'Midnight Theme',
    description_es: 'Un elegante tema oscuro con acentos púrpura',
    description_en: 'An elegant dark theme with purple accents',
    xp_cost: 100,
    icon: '🌙',
    rarity: 'common',
    preview: 'linear-gradient(135deg, #1a1a2e, #16213e, #7c3aed)',
    unlockable: true,
  },
  {
    id: 'theme_aurora',
    type: 'theme',
    name_es: 'Tema Aurora Boreal',
    name_en: 'Aurora Theme',
    description_es: 'Colores vibrantes inspirados en la aurora boreal',
    description_en: 'Vibrant colors inspired by the northern lights',
    xp_cost: 200,
    icon: '🌌',
    rarity: 'rare',
    preview: 'linear-gradient(135deg, #0f766e, #059669, #10b981, #34d399)',
    unlockable: true,
  },
  {
    id: 'theme_golden',
    type: 'theme',
    name_es: 'Tema Dorado Luxury',
    name_en: 'Golden Luxury Theme',
    description_es: 'Tema premium con toques dorados y elegantes',
    description_en: 'Premium theme with golden and elegant touches',
    xp_cost: 500,
    icon: '👑',
    rarity: 'epic',
    preview: 'linear-gradient(135deg, #78350f, #b45309, #f59e0b, #fbbf24)',
    unlockable: true,
  },
  {
    id: 'theme_neon',
    type: 'theme',
    name_es: 'Tema Neon Cyberpunk',
    name_en: 'Neon Cyberpunk Theme',
    description_es: 'Estética futurista con colores neón intensos',
    description_en: 'Futuristic aesthetic with intense neon colors',
    xp_cost: 1000,
    icon: '🔮',
    rarity: 'legendary',
    preview: 'linear-gradient(135deg, #0c0a09, #ec4899, #8b5cf6, #06b6d4)',
    unlockable: true,
  },
  
  // Special Badges
  {
    id: 'badge_vip',
    type: 'badge',
    name_es: 'Badge VIP',
    name_en: 'VIP Badge',
    description_es: 'Muestra tu estatus VIP en tu perfil',
    description_en: 'Show your VIP status on your profile',
    xp_cost: 150,
    icon: '⭐',
    rarity: 'rare',
    unlockable: true,
  },
  {
    id: 'badge_diamond',
    type: 'badge',
    name_es: 'Badge Diamante',
    name_en: 'Diamond Badge',
    description_es: 'Un brillante badge de diamante exclusivo',
    description_en: 'A brilliant exclusive diamond badge',
    xp_cost: 750,
    icon: '💎',
    rarity: 'legendary',
    unlockable: true,
  },
  {
    id: 'badge_crown',
    type: 'badge',
    name_es: 'Badge Corona',
    name_en: 'Crown Badge',
    description_es: 'La corona del maestro financiero',
    description_en: 'The crown of the financial master',
    xp_cost: 2000,
    icon: '👑',
    rarity: 'legendary',
    unlockable: true,
  },
  {
    id: 'badge_fire',
    type: 'badge',
    name_es: 'Badge Fuego',
    name_en: 'Fire Badge',
    description_es: 'Para los que mantienen rachas épicas',
    description_en: 'For those who maintain epic streaks',
    xp_cost: 300,
    icon: '🔥',
    rarity: 'epic',
    unlockable: true,
  },
  
  // Titles
  {
    id: 'title_apprentice',
    type: 'title',
    name_es: 'Título: Aprendiz Financiero',
    name_en: 'Title: Financial Apprentice',
    description_es: 'Un título que muestra tu compromiso',
    description_en: 'A title that shows your commitment',
    xp_cost: 50,
    icon: '📚',
    rarity: 'common',
    unlockable: true,
  },
  {
    id: 'title_master',
    type: 'title',
    name_es: 'Título: Maestro del Ahorro',
    name_en: 'Title: Savings Master',
    description_es: 'Reconocimiento de tu maestría en finanzas',
    description_en: 'Recognition of your financial mastery',
    xp_cost: 400,
    icon: '🎓',
    rarity: 'epic',
    unlockable: true,
  },
  {
    id: 'title_legend',
    type: 'title',
    name_es: 'Título: Leyenda Financiera',
    name_en: 'Title: Financial Legend',
    description_es: 'El título más prestigioso disponible',
    description_en: 'The most prestigious title available',
    xp_cost: 1500,
    icon: '🏆',
    rarity: 'legendary',
    unlockable: true,
  },
  
  // Features
  {
    id: 'feature_confetti',
    type: 'feature',
    name_es: 'Confeti Premium',
    name_en: 'Premium Confetti',
    description_es: 'Efectos de confeti más elaborados al completar logros',
    description_en: 'More elaborate confetti effects when completing achievements',
    xp_cost: 75,
    icon: '🎊',
    rarity: 'common',
    unlockable: true,
  },
  {
    id: 'feature_sound',
    type: 'feature',
    name_es: 'Efectos de Sonido',
    name_en: 'Sound Effects',
    description_es: 'Sonidos de celebración al completar misiones',
    description_en: 'Celebration sounds when completing missions',
    xp_cost: 100,
    icon: '🔔',
    rarity: 'rare',
    unlockable: true,
  },
];

export const RARITY_COLORS = {
  common: 'bg-slate-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-gradient-to-r from-amber-400 to-orange-500',
};

export const RARITY_LABELS = {
  common: { es: 'Común', en: 'Common' },
  rare: { es: 'Raro', en: 'Rare' },
  epic: { es: 'Épico', en: 'Epic' },
  legendary: { es: 'Legendario', en: 'Legendary' },
};

function getStoredRewards(): Record<string, UnlockedReward> {
  try {
    const stored = localStorage.getItem(REWARDS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error parsing rewards:', e);
  }
  return {};
}

function storeRewards(rewards: Record<string, UnlockedReward>) {
  localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(rewards));
}

function getUserXP(): number {
  try {
    const stored = localStorage.getItem(USER_XP_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function setUserXP(xp: number) {
  localStorage.setItem(USER_XP_KEY, xp.toString());
}

export function useRewards() {
  const { language } = useLanguage();
  const [unlockedRewards, setUnlockedRewards] = useState<Record<string, UnlockedReward>>(getStoredRewards());
  const [userXP, setUserXPState] = useState<number>(getUserXP());
  
  // Listen for XP updates from missions
  useEffect(() => {
    const handleXPUpdate = (event: CustomEvent<{ xp: number }>) => {
      const newXP = userXP + event.detail.xp;
      setUserXP(newXP);
      setUserXPState(newXP);
    };
    
    window.addEventListener('xp-earned' as any, handleXPUpdate);
    return () => window.removeEventListener('xp-earned' as any, handleXPUpdate);
  }, [userXP]);
  
  // Sync from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setUnlockedRewards(getStoredRewards());
      setUserXPState(getUserXP());
    };
    
    window.addEventListener('rewards-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('rewards-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const isRewardUnlocked = useCallback((rewardId: string) => {
    return !!unlockedRewards[rewardId];
  }, [unlockedRewards]);
  
  const canAffordReward = useCallback((reward: Reward) => {
    return userXP >= reward.xp_cost;
  }, [userXP]);
  
  const getRewardsByType = useCallback((type: Reward['type']) => {
    return REWARDS.filter(r => r.type === type);
  }, []);
  
  const getUnlockedRewardsList = useCallback(() => {
    return REWARDS.filter(r => unlockedRewards[r.id]);
  }, [unlockedRewards]);
  
  const getEquippedRewards = useCallback(() => {
    return REWARDS.filter(r => unlockedRewards[r.id]?.equipped);
  }, [unlockedRewards]);
  
  return {
    rewards: REWARDS,
    unlockedRewards,
    userXP,
    isRewardUnlocked,
    canAffordReward,
    getRewardsByType,
    getUnlockedRewardsList,
    getEquippedRewards,
  };
}

export function usePurchaseReward() {
  const { language } = useLanguage();
  
  const purchaseReward = useCallback((reward: Reward) => {
    const currentXP = getUserXP();
    
    if (currentXP < reward.xp_cost) {
      toast.error(language === 'es' ? 'XP insuficiente' : 'Insufficient XP', {
        description: language === 'es' 
          ? `Necesitas ${reward.xp_cost - currentXP} XP más`
          : `You need ${reward.xp_cost - currentXP} more XP`,
      });
      return false;
    }
    
    const rewards = getStoredRewards();
    if (rewards[reward.id]) {
      toast.info(language === 'es' ? 'Ya tienes esta recompensa' : 'You already have this reward');
      return false;
    }
    
    // Deduct XP
    const newXP = currentXP - reward.xp_cost;
    setUserXP(newXP);
    
    // Add reward
    rewards[reward.id] = {
      reward_id: reward.id,
      unlocked_at: new Date().toISOString(),
      equipped: false,
    };
    storeRewards(rewards);
    
    // Notify
    toast.success(`${reward.icon} ${language === 'es' ? '¡Recompensa desbloqueada!' : 'Reward unlocked!'}`, {
      description: language === 'es' ? reward.name_es : reward.name_en,
    });
    
    window.dispatchEvent(new CustomEvent('rewards-updated'));
    return true;
  }, [language]);
  
  return { purchaseReward };
}

export function useEquipReward() {
  const { language } = useLanguage();
  
  const equipReward = useCallback((rewardId: string, equip: boolean) => {
    const rewards = getStoredRewards();
    
    if (!rewards[rewardId]) {
      toast.error(language === 'es' ? 'No tienes esta recompensa' : "You don't have this reward");
      return false;
    }
    
    const reward = REWARDS.find(r => r.id === rewardId);
    if (!reward) return false;
    
    // For themes, unequip other themes first
    if (reward.type === 'theme' && equip) {
      Object.keys(rewards).forEach(key => {
        const r = REWARDS.find(rw => rw.id === key);
        if (r?.type === 'theme') {
          rewards[key].equipped = false;
        }
      });
    }
    
    rewards[rewardId].equipped = equip;
    storeRewards(rewards);
    
    window.dispatchEvent(new CustomEvent('rewards-updated'));
    window.dispatchEvent(new CustomEvent('theme-reward-changed', { detail: { rewardId, equipped: equip } }));
    
    toast.success(equip 
      ? (language === 'es' ? '¡Equipado!' : 'Equipped!') 
      : (language === 'es' ? 'Desequipado' : 'Unequipped')
    );
    
    return true;
  }, [language]);
  
  return { equipReward };
}

// Hook to add XP (called when missions complete)
export function useAddXP() {
  const addXP = useCallback((amount: number) => {
    const currentXP = getUserXP();
    const newXP = currentXP + amount;
    setUserXP(newXP);
    window.dispatchEvent(new CustomEvent('xp-earned', { detail: { xp: amount } }));
  }, []);
  
  return { addXP };
}
