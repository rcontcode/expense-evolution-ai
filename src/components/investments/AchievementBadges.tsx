import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { ACHIEVEMENTS, LEVELS, Achievement } from '@/hooks/data/useGamification';
import { Trophy, Star, Lock, Sparkles, Medal, Award, Crown, Zap, Target, Flame } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AchievementBadgesProps {
  achievements: Achievement[];
  userLevel: {
    level: number;
    experience_points: number;
    streak_days: number;
  } | null;
}

// Extended achievement definitions with more details
const ACHIEVEMENT_DETAILS: Record<string, {
  icon: string;
  points: number;
  category: 'beginner' | 'savings' | 'investment' | 'streak' | 'activity' | 'missions' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description_es: string;
  description_en: string;
  requirement_es: string;
  requirement_en: string;
}> = {
  // Beginner achievements
  first_expense: { 
    icon: '📝', points: 10, category: 'beginner', rarity: 'common',
    description_es: 'Primer Paso', description_en: 'First Step',
    requirement_es: 'Registra tu primer gasto', requirement_en: 'Record your first expense'
  },
  first_income: { 
    icon: '💰', points: 10, category: 'beginner', rarity: 'common',
    description_es: 'Primer Ingreso', description_en: 'First Income',
    requirement_es: 'Registra tu primer ingreso', requirement_en: 'Record your first income'
  },
  first_savings_goal: { 
    icon: '🎯', points: 15, category: 'savings', rarity: 'common',
    description_es: 'Visionario', description_en: 'Visionary',
    requirement_es: 'Crea tu primera meta de ahorro', requirement_en: 'Create your first savings goal'
  },
  first_investment: { 
    icon: '📈', points: 20, category: 'investment', rarity: 'uncommon',
    description_es: 'Inversor Iniciado', description_en: 'Beginner Investor',
    requirement_es: 'Registra tu primera inversión', requirement_en: 'Record your first investment'
  },
  complete_profile: { 
    icon: '✅', points: 15, category: 'beginner', rarity: 'common',
    description_es: 'Perfil Completo', description_en: 'Complete Profile',
    requirement_es: 'Completa tu perfil financiero', requirement_en: 'Complete your financial profile'
  },
  first_client: { 
    icon: '🤝', points: 15, category: 'beginner', rarity: 'common',
    description_es: 'Primer Cliente', description_en: 'First Client',
    requirement_es: 'Agrega tu primer cliente', requirement_en: 'Add your first client'
  },
  first_mileage: { 
    icon: '🚗', points: 10, category: 'beginner', rarity: 'common',
    description_es: 'En el Camino', description_en: 'On the Road',
    requirement_es: 'Registra tu primer viaje', requirement_en: 'Record your first trip'
  },
  first_contract: { 
    icon: '📄', points: 20, category: 'beginner', rarity: 'uncommon',
    description_es: 'Formalizado', description_en: 'Formalized',
    requirement_es: 'Sube tu primer contrato', requirement_en: 'Upload your first contract'
  },
  
  // Streak achievements
  track_7_days: { 
    icon: '🔥', points: 25, category: 'streak', rarity: 'uncommon',
    description_es: 'Semana de Fuego', description_en: 'Fire Week',
    requirement_es: 'Mantén una racha de 7 días', requirement_en: 'Maintain a 7-day streak'
  },
  track_30_days: { 
    icon: '⚡', points: 50, category: 'streak', rarity: 'rare',
    description_es: 'Mes Eléctrico', description_en: 'Electric Month',
    requirement_es: 'Mantén una racha de 30 días', requirement_en: 'Maintain a 30-day streak'
  },
  track_60_days: { 
    icon: '💪', points: 100, category: 'streak', rarity: 'epic',
    description_es: 'Dos Meses Fuertes', description_en: 'Two Strong Months',
    requirement_es: 'Mantén una racha de 60 días', requirement_en: 'Maintain a 60-day streak'
  },
  track_100_days: { 
    icon: '🌟', points: 150, category: 'streak', rarity: 'epic',
    description_es: 'Centenario', description_en: 'Centurion',
    requirement_es: 'Mantén una racha de 100 días', requirement_en: 'Maintain a 100-day streak'
  },
  track_365_days: { 
    icon: '👑', points: 500, category: 'streak', rarity: 'legendary',
    description_es: 'Rey del Año', description_en: 'Year King',
    requirement_es: 'Mantén una racha de 365 días', requirement_en: 'Maintain a 365-day streak'
  },
  
  // Savings achievements
  save_1000: { 
    icon: '💵', points: 30, category: 'savings', rarity: 'uncommon',
    description_es: 'Primer Millar', description_en: 'First Thousand',
    requirement_es: 'Ahorra $1,000', requirement_en: 'Save $1,000'
  },
  save_5000: { 
    icon: '💎', points: 75, category: 'savings', rarity: 'rare',
    description_es: 'Diamante en Bruto', description_en: 'Diamond in the Rough',
    requirement_es: 'Ahorra $5,000', requirement_en: 'Save $5,000'
  },
  save_10000: { 
    icon: '🏦', points: 150, category: 'savings', rarity: 'epic',
    description_es: 'Ahorrador Élite', description_en: 'Elite Saver',
    requirement_es: 'Ahorra $10,000', requirement_en: 'Save $10,000'
  },
  save_25000: { 
    icon: '💰', points: 250, category: 'savings', rarity: 'epic',
    description_es: 'Tesoro Creciente', description_en: 'Growing Treasure',
    requirement_es: 'Ahorra $25,000', requirement_en: 'Save $25,000'
  },
  save_50000: { 
    icon: '🤑', points: 400, category: 'savings', rarity: 'legendary',
    description_es: 'Maestro del Ahorro', description_en: 'Savings Master',
    requirement_es: 'Ahorra $50,000', requirement_en: 'Save $50,000'
  },
  
  // Investment achievements
  invest_1000: { 
    icon: '🚀', points: 40, category: 'investment', rarity: 'uncommon',
    description_es: 'Despegue', description_en: 'Takeoff',
    requirement_es: 'Invierte $1,000', requirement_en: 'Invest $1,000'
  },
  invest_10000: { 
    icon: '🏆', points: 100, category: 'investment', rarity: 'epic',
    description_es: 'Gran Inversor', description_en: 'Great Investor',
    requirement_es: 'Invierte $10,000', requirement_en: 'Invest $10,000'
  },
  invest_25000: { 
    icon: '📊', points: 200, category: 'investment', rarity: 'epic',
    description_es: 'Portafolio Sólido', description_en: 'Solid Portfolio',
    requirement_es: 'Invierte $25,000', requirement_en: 'Invest $25,000'
  },
  invest_50000: { 
    icon: '🌙', points: 350, category: 'investment', rarity: 'legendary',
    description_es: 'Inversor Lunar', description_en: 'Moon Investor',
    requirement_es: 'Invierte $50,000', requirement_en: 'Invest $50,000'
  },
  invest_100000: { 
    icon: '🌍', points: 500, category: 'investment', rarity: 'legendary',
    description_es: 'Inversor Global', description_en: 'Global Investor',
    requirement_es: 'Invierte $100,000', requirement_en: 'Invest $100,000'
  },
  
  // Activity achievements
  expenses_10: { 
    icon: '📋', points: 15, category: 'activity', rarity: 'common',
    description_es: 'Rastreador', description_en: 'Tracker',
    requirement_es: 'Registra 10 gastos', requirement_en: 'Record 10 expenses'
  },
  expenses_50: { 
    icon: '📑', points: 35, category: 'activity', rarity: 'uncommon',
    description_es: 'Organizador', description_en: 'Organizer',
    requirement_es: 'Registra 50 gastos', requirement_en: 'Record 50 expenses'
  },
  expenses_100: { 
    icon: '📚', points: 60, category: 'activity', rarity: 'rare',
    description_es: 'Archivador Pro', description_en: 'Pro Archiver',
    requirement_es: 'Registra 100 gastos', requirement_en: 'Record 100 expenses'
  },
  expenses_500: { 
    icon: '🗄️', points: 150, category: 'activity', rarity: 'epic',
    description_es: 'Maestro de Datos', description_en: 'Data Master',
    requirement_es: 'Registra 500 gastos', requirement_en: 'Record 500 expenses'
  },
  income_entries_10: { 
    icon: '💸', points: 20, category: 'activity', rarity: 'common',
    description_es: 'Flujo de Caja', description_en: 'Cash Flow',
    requirement_es: 'Registra 10 ingresos', requirement_en: 'Record 10 incomes'
  },
  income_entries_50: { 
    icon: '🏧', points: 50, category: 'activity', rarity: 'rare',
    description_es: 'Banco Personal', description_en: 'Personal Bank',
    requirement_es: 'Registra 50 ingresos', requirement_en: 'Record 50 incomes'
  },
  
  // Mission achievements
  mission_starter: { 
    icon: '🎮', points: 25, category: 'missions', rarity: 'uncommon',
    description_es: 'Jugador Activo', description_en: 'Active Player',
    requirement_es: 'Completa 5 misiones', requirement_en: 'Complete 5 missions'
  },
  mission_master: { 
    icon: '🎯', points: 75, category: 'missions', rarity: 'rare',
    description_es: 'Maestro de Misiones', description_en: 'Mission Master',
    requirement_es: 'Completa 25 misiones', requirement_en: 'Complete 25 missions'
  },
  mission_legend: { 
    icon: '🏅', points: 200, category: 'missions', rarity: 'legendary',
    description_es: 'Leyenda', description_en: 'Legend',
    requirement_es: 'Completa 100 misiones', requirement_en: 'Complete 100 missions'
  },
  daily_perfect: { 
    icon: '⭐', points: 30, category: 'missions', rarity: 'rare',
    description_es: 'Día Perfecto', description_en: 'Perfect Day',
    requirement_es: 'Completa todas las misiones diarias', requirement_en: 'Complete all daily missions'
  },
  weekly_perfect: { 
    icon: '🌠', points: 100, category: 'missions', rarity: 'epic',
    description_es: 'Semana Perfecta', description_en: 'Perfect Week',
    requirement_es: 'Completa todas las misiones semanales', requirement_en: 'Complete all weekly missions'
  },
  
  // Special achievements
  first_passive_income: { 
    icon: '🌱', points: 50, category: 'special', rarity: 'rare',
    description_es: 'Semilla Plantada', description_en: 'Seed Planted',
    requirement_es: 'Genera tu primer ingreso pasivo', requirement_en: 'Generate your first passive income'
  },
  diversified_investor: { 
    icon: '🎨', points: 100, category: 'special', rarity: 'epic',
    description_es: 'Inversor Diversificado', description_en: 'Diversified Investor',
    requirement_es: 'Invierte en 3+ tipos de activos', requirement_en: 'Invest in 3+ asset types'
  },
  tax_master: { 
    icon: '📊', points: 75, category: 'special', rarity: 'rare',
    description_es: 'Experto en Impuestos', description_en: 'Tax Expert',
    requirement_es: 'Exporta un reporte T2125', requirement_en: 'Export a T2125 report'
  },
  early_bird: { 
    icon: '🐦', points: 20, category: 'special', rarity: 'uncommon',
    description_es: 'Madrugador', description_en: 'Early Bird',
    requirement_es: 'Registra un gasto antes de las 7am', requirement_en: 'Record an expense before 7am'
  },
  night_owl: { 
    icon: '🦉', points: 20, category: 'special', rarity: 'uncommon',
    description_es: 'Búho Nocturno', description_en: 'Night Owl',
    requirement_es: 'Registra un gasto después de las 11pm', requirement_en: 'Record an expense after 11pm'
  },
  weekend_warrior: { 
    icon: '⚔️', points: 25, category: 'special', rarity: 'uncommon',
    description_es: 'Guerrero de Fin de Semana', description_en: 'Weekend Warrior',
    requirement_es: 'Registra 5 gastos en un fin de semana', requirement_en: 'Record 5 expenses in a weekend'
  },
  consistent_saver: { 
    icon: '🎖️', points: 100, category: 'special', rarity: 'epic',
    description_es: 'Ahorrador Consistente', description_en: 'Consistent Saver',
    requirement_es: 'Ahorra cada mes por 6 meses', requirement_en: 'Save every month for 6 months'
  },
  budget_guru: { 
    icon: '🧮', points: 80, category: 'special', rarity: 'rare',
    description_es: 'Gurú del Presupuesto', description_en: 'Budget Guru',
    requirement_es: 'Mantén gastos bajo presupuesto 3 meses', requirement_en: 'Keep expenses under budget for 3 months'
  },
};

const RARITY_STYLES = {
  common: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
  uncommon: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700',
  rare: 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700',
  epic: 'bg-violet-50 dark:bg-violet-950 border-violet-300 dark:border-violet-700',
  legendary: 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-600',
};

const RARITY_GLOW = {
  common: '',
  uncommon: 'shadow-emerald-200 dark:shadow-emerald-800',
  rare: 'shadow-blue-200 dark:shadow-blue-800',
  epic: 'shadow-violet-200 dark:shadow-violet-800',
  legendary: 'shadow-amber-200 dark:shadow-amber-600 animate-pulse',
};

const CATEGORY_ICONS = {
  beginner: Star,
  savings: Target,
  investment: Zap,
  streak: Flame,
  activity: Medal,
  missions: Award,
  special: Crown,
};

export function AchievementBadges({ achievements, userLevel }: AchievementBadgesProps) {
  const { t, language } = useLanguage();
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);

  const unlockedKeys = new Set(achievements.map(a => a.achievement_key));
  const totalPoints = Object.values(ACHIEVEMENT_DETAILS).reduce((acc, a) => acc + a.points, 0);
  const earnedPoints = achievements.reduce((acc, a) => {
    const details = ACHIEVEMENT_DETAILS[a.achievement_key];
    return acc + (details?.points || 0);
  }, 0);

  // Group achievements by category
  const categories = ['beginner', 'savings', 'investment', 'streak', 'activity', 'missions', 'special'] as const;
  const groupedAchievements = categories.map(category => ({
    category,
    achievements: Object.entries(ACHIEVEMENT_DETAILS).filter(([, v]) => v.category === category)
  }));

  const currentLevel = LEVELS.find(l => l.level === (userLevel?.level || 1)) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === (userLevel?.level || 1) + 1);

  return (
    <div className="space-y-6">
      {/* Level Progress Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-bounce">{currentLevel.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{t('gamification.level')} {userLevel?.level || 1}</h3>
                  <Badge className="bg-white/20 text-white border-0">{currentLevel.name}</Badge>
                </div>
                <p className="text-violet-200 mt-1">
                  {userLevel?.experience_points || 0} XP {t('gamification.total')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Flame className="h-6 w-6 text-orange-300" />
                <span className="text-3xl font-bold">{userLevel?.streak_days || 0}</span>
              </div>
              <p className="text-sm text-violet-200">{t('gamification.dayStreak')}</p>
            </div>
          </div>
          
          {nextLevel && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-violet-200">{t('gamification.nextLevel')}: {nextLevel.name}</span>
                <span className="font-medium">{nextLevel.minXP - (userLevel?.experience_points || 0)} XP</span>
              </div>
              <div className="h-3 bg-violet-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ 
                    width: `${((userLevel?.experience_points || 0) - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Points Summary */}
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-medium">{t('gamification.achievementPoints')}</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold">{earnedPoints}</span>
              <span className="text-muted-foreground"> / {totalPoints}</span>
            </div>
          </div>
          <Progress value={(earnedPoints / totalPoints) * 100} className="mt-2 h-2" />
          <p className="text-sm text-muted-foreground mt-1">
            {achievements.length} / {Object.keys(ACHIEVEMENT_DETAILS).length} {t('gamification.unlockedAchievements')}
          </p>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      {groupedAchievements.map(({ category, achievements: categoryAchievements }) => {
        const CategoryIcon = CATEGORY_ICONS[category];
        const unlockedInCategory = categoryAchievements.filter(([key]) => unlockedKeys.has(key)).length;
        
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <CategoryIcon className="h-5 w-5 text-primary" />
                  {t(`gamification.category.${category}`)}
                </div>
                <Badge variant="outline">
                  {unlockedInCategory} / {categoryAchievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryAchievements.map(([key, details]) => {
                  const isUnlocked = unlockedKeys.has(key);
                  const achievement = achievements.find(a => a.achievement_key === key);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedAchievement(key)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-300",
                        "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary",
                        isUnlocked ? RARITY_STYLES[details.rarity] : 'bg-muted/50 border-muted',
                        isUnlocked && `shadow-lg ${RARITY_GLOW[details.rarity]}`
                      )}
                    >
                      <div className="text-center">
                        <div className={cn(
                          "text-3xl mb-2 transition-all",
                          isUnlocked ? '' : 'grayscale opacity-40'
                        )}>
                          {details.icon}
                        </div>
                        <p className={cn(
                          "text-xs font-medium line-clamp-2",
                          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {language === 'es' ? details.description_es : details.description_en}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600">+{details.points} XP</span>
                        </div>
                      </div>
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {isUnlocked && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Achievement Detail Modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-sm">
          {selectedAchievement && ACHIEVEMENT_DETAILS[selectedAchievement] && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  {language === 'es' 
                    ? ACHIEVEMENT_DETAILS[selectedAchievement].description_es 
                    : ACHIEVEMENT_DETAILS[selectedAchievement].description_en
                  }
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-6">
                <div className={cn(
                  "text-6xl mb-4 inline-block",
                  unlockedKeys.has(selectedAchievement) ? 'animate-bounce' : 'grayscale opacity-40'
                )}>
                  {ACHIEVEMENT_DETAILS[selectedAchievement].icon}
                </div>
                <Badge className={cn(
                  "mb-4",
                  RARITY_STYLES[ACHIEVEMENT_DETAILS[selectedAchievement].rarity]
                )}>
                  {ACHIEVEMENT_DETAILS[selectedAchievement].rarity.toUpperCase()}
                </Badge>
                <p className="text-muted-foreground mb-4">
                  {language === 'es' 
                    ? ACHIEVEMENT_DETAILS[selectedAchievement].requirement_es 
                    : ACHIEVEMENT_DETAILS[selectedAchievement].requirement_en
                  }
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span className="text-lg font-bold text-amber-600">
                    +{ACHIEVEMENT_DETAILS[selectedAchievement].points} XP
                  </span>
                </div>
                {unlockedKeys.has(selectedAchievement) && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <p className="text-sm text-emerald-600 font-medium">
                      ✓ {t('gamification.unlocked')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
