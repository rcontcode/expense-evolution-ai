import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GamificationCelebration } from '@/components/gamification';
import { useUserSettings } from '@/hooks/data/useUserSettings';

interface CelebrationData {
  type: 'achievement' | 'level_up' | 'streak' | 'goal' | 'milestone';
  title: string;
  description: string;
  icon: string;
  points?: number;
  level?: number;
  streak?: number;
}

interface GamificationContextType {
  showCelebration: (data: CelebrationData) => void;
  closeCelebration: () => void;
  isGamificationEnabled: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const { data: settings } = useUserSettings();

  // Default to true if not set (backwards compatible)
  const prefs = (settings?.preferences as Record<string, unknown>) || {};
  const isGamificationEnabled = prefs.gamification_enabled !== false;

  const showCelebration = useCallback((data: CelebrationData) => {
    // Skip celebrations if gamification is disabled
    if (prefs.gamification_enabled === false) return;
    setCelebration(data);
  }, [prefs.gamification_enabled]);

  const closeCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return (
    <GamificationContext.Provider value={{ showCelebration, closeCelebration, isGamificationEnabled }}>
      {children}
      {isGamificationEnabled && (
        <GamificationCelebration celebration={celebration} onClose={closeCelebration} />
      )}
    </GamificationContext.Provider>
  );
}

export function useGamificationCelebration() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamificationCelebration must be used within a GamificationProvider');
  }
  return context;
}

// Helper function to trigger achievement celebration
export function createAchievementCelebration(
  achievementKey: string,
  icon: string,
  points: number,
  language: 'es' | 'en'
): CelebrationData {
  const achievementTitles: Record<string, { es: string; en: string }> = {
    first_expense: { es: '¡Primer Gasto Registrado!', en: 'First Expense Logged!' },
    first_income: { es: '¡Primer Ingreso Registrado!', en: 'First Income Logged!' },
    first_savings_goal: { es: '¡Meta de Ahorro Creada!', en: 'Savings Goal Created!' },
    first_investment: { es: '¡Primera Inversión!', en: 'First Investment!' },
    complete_profile: { es: '¡Perfil Completado!', en: 'Profile Completed!' },
    first_client: { es: '¡Primer Cliente!', en: 'First Client!' },
    first_mileage: { es: '¡Primer Viaje Registrado!', en: 'First Trip Logged!' },
    first_contract: { es: '¡Primer Contrato!', en: 'First Contract!' },
    track_7_days: { es: '¡7 Días de Racha!', en: '7 Day Streak!' },
    track_30_days: { es: '¡30 Días de Disciplina!', en: '30 Days of Discipline!' },
    track_60_days: { es: '¡60 Días Imparables!', en: '60 Unstoppable Days!' },
    track_100_days: { es: '¡100 Días de Maestría!', en: '100 Days of Mastery!' },
    track_365_days: { es: '¡UN AÑO COMPLETO!', en: 'A FULL YEAR!' },
    save_1000: { es: '¡$1,000 Ahorrados!', en: '$1,000 Saved!' },
    save_5000: { es: '¡$5,000 Ahorrados!', en: '$5,000 Saved!' },
    save_10000: { es: '¡$10,000 Ahorrados!', en: '$10,000 Saved!' },
    invest_1000: { es: '¡$1,000 Invertidos!', en: '$1,000 Invested!' },
    invest_10000: { es: '¡$10,000 Invertidos!', en: '$10,000 Invested!' },
    first_book: { es: '¡Primer Libro!', en: 'First Book!' },
    knowledge_master: { es: '¡MAESTRO DEL CONOCIMIENTO!', en: 'KNOWLEDGE MASTER!' },
  };

  const descriptions: Record<string, { es: string; en: string }> = {
    first_expense: { es: 'Has dado el primer paso hacia el control financiero', en: 'You took the first step towards financial control' },
    first_income: { es: 'Tu camino hacia la abundancia ha comenzado', en: 'Your path to abundance has begun' },
    first_savings_goal: { es: 'Los sueños se logran con metas claras', en: 'Dreams are achieved with clear goals' },
    first_investment: { es: 'Tu dinero ahora trabaja para ti', en: 'Your money now works for you' },
    complete_profile: { es: 'Personalización completa para mejores insights', en: 'Complete personalization for better insights' },
    first_client: { es: 'Tu negocio está creciendo', en: 'Your business is growing' },
    first_mileage: { es: 'Cada kilómetro cuenta para tus deducciones', en: 'Every mile counts for your deductions' },
    first_contract: { es: 'Documentación profesional para tu éxito', en: 'Professional documentation for your success' },
    track_7_days: { es: '¡La consistencia es la madre de la excelencia!', en: 'Consistency is the mother of excellence!' },
    track_30_days: { es: '¡Has demostrado verdadera disciplina!', en: 'You have shown true discipline!' },
    track_60_days: { es: '¡Tus hábitos se están convirtiendo en parte de ti!', en: 'Your habits are becoming part of you!' },
    track_100_days: { es: '¡ERES UNA LEYENDA DE LA CONSTANCIA!', en: 'YOU ARE A LEGEND OF CONSISTENCY!' },
    track_365_days: { es: '365 días de maestría financiera absoluta!', en: '365 days of absolute financial mastery!' },
    save_1000: { es: 'Tu fondo de emergencia está creciendo', en: 'Your emergency fund is growing' },
    save_5000: { es: 'Estás construyendo verdadera seguridad', en: 'You are building real security' },
    save_10000: { es: '¡Eres un ahorrador de élite!', en: 'You are an elite saver!' },
    invest_1000: { es: 'El interés compuesto está de tu lado', en: 'Compound interest is on your side' },
    invest_10000: { es: 'Tu patrimonio está creciendo exponencialmente', en: 'Your wealth is growing exponentially' },
    first_book: { es: 'La educación financiera es tu mejor inversión', en: 'Financial education is your best investment' },
    knowledge_master: { es: '¡Has alcanzado la cima del conocimiento financiero!', en: 'You have reached the pinnacle of financial knowledge!' },
  };

  const defaultTitle = { es: '¡Logro Desbloqueado!', en: 'Achievement Unlocked!' };
  const defaultDesc = { es: '¡Sigue así, estás progresando!', en: 'Keep it up, you are making progress!' };

  return {
    type: 'achievement',
    title: (achievementTitles[achievementKey] || defaultTitle)[language],
    description: (descriptions[achievementKey] || defaultDesc)[language],
    icon,
    points,
  };
}

// Helper for level up celebration
export function createLevelUpCelebration(
  newLevel: number,
  language: 'es' | 'en'
): CelebrationData {
  const levelEmojis: Record<number, string> = {
    1: '🌱', 2: '📚', 3: '💰', 4: '📊', 5: '📈',
    6: '🎯', 7: '⭐', 8: '👑', 9: '🏆', 10: '💎',
  };

  return {
    type: 'level_up',
    title: language === 'es' ? `¡NIVEL ${newLevel}!` : `LEVEL ${newLevel}!`,
    description: language === 'es' 
      ? '¡Has subido de nivel! Tu dominio financiero crece.' 
      : 'You leveled up! Your financial mastery grows.',
    icon: levelEmojis[newLevel] || '🌟',
    level: newLevel,
  };
}

// Helper for streak celebration
export function createStreakCelebration(
  streakDays: number,
  language: 'es' | 'en'
): CelebrationData {
  return {
    type: 'streak',
    title: language === 'es' ? `¡${streakDays} DÍAS DE RACHA!` : `${streakDays} DAY STREAK!`,
    description: language === 'es'
      ? '¡Tu consistencia es admirable! Los expertos dicen que los hábitos se forman con constancia.'
      : 'Your consistency is admirable! Experts say habits are formed with consistency.',
    icon: streakDays >= 30 ? '🔥' : streakDays >= 7 ? '⚡' : '✨',
    streak: streakDays,
  };
}