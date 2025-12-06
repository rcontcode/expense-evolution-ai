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
  category: 'beginner' | 'savings' | 'investment' | 'streak' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description_es: string;
  description_en: string;
  requirement_es: string;
  requirement_en: string;
}> = {
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
  complete_profile: { 
    icon: '✅', points: 15, category: 'beginner', rarity: 'common',
    description_es: 'Perfil Completo', description_en: 'Complete Profile',
    requirement_es: 'Completa tu perfil financiero', requirement_en: 'Complete your financial profile'
  },
  first_passive_income: { 
    icon: '🌱', points: 50, category: 'special', rarity: 'rare',
    description_es: 'Semilla Plantada', description_en: 'Seed Planted',
    requirement_es: 'Genera tu primer ingreso pasivo', requirement_en: 'Generate your first passive income'
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
  const categories = ['beginner', 'savings', 'investment', 'streak', 'special'] as const;
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
