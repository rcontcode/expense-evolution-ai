import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Star,
  Gift,
  Trophy,
  Crown,
  Zap,
  MessageSquare,
  Bug,
  Users,
  Flame,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useBetaGamification, TIER_CONFIG, REWARDS_CONFIG } from '@/hooks/data/useBetaGamification';
import { useLanguage } from '@/contexts/LanguageContext';

// Group goals by category for better organization
const GOAL_CATEGORIES = {
  feedback: {
    icon: '💬',
    colorEs: 'Opiniones',
    colorEn: 'Feedback',
    gradient: 'from-violet-500/10 to-violet-500/5',
    border: 'border-violet-200 dark:border-violet-800',
  },
  bugs: {
    icon: '🐛',
    colorEs: 'Reportes',
    colorEn: 'Bug Reports',
    gradient: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-200 dark:border-rose-800',
  },
  referrals: {
    icon: '👥',
    colorEs: 'Referidos',
    colorEn: 'Referrals',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  streaks: {
    icon: '🔥',
    colorEs: 'Constancia',
    colorEn: 'Consistency',
    gradient: 'from-orange-500/10 to-orange-500/5',
    border: 'border-orange-200 dark:border-orange-800',
  },
  exploration: {
    icon: '🔍',
    colorEs: 'Exploración',
    colorEn: 'Exploration',
    gradient: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
};

// Map goal_key to category
const getGoalCategory = (goalKey: string) => {
  if (goalKey.includes('feedback') || goalKey.includes('suggestion')) return 'feedback';
  if (goalKey.includes('bug') || goalKey.includes('critical')) return 'bugs';
  if (goalKey.includes('referral') || goalKey.includes('ambassador')) return 'referrals';
  if (goalKey.includes('streak') || goalKey.includes('login')) return 'streaks';
  return 'exploration';
};

export const BetaRoadmapCard = () => {
  const { language } = useLanguage();
  const { userPoints, goalsWithProgress, nextTierProgress, redemptions } = useBetaGamification();

  const t = {
    es: {
      title: '🗺️ Tu Camino Beta',
      subtitle: 'Guía completa para ganar tu membresía gratis',
      howItWorks: '¿Cómo funciona?',
      howItWorksDesc: 'Como beta tester, tu opinión vale. Cada acción que ayude a mejorar la app te suma puntos. ¡Acumula suficientes y gana membresía Premium o Pro GRATIS por 1 año!',
      tierProgress: '📊 Tu Nivel Actual',
      currentLevel: 'Nivel actual',
      pointsEarned: 'puntos ganados',
      nextLevel: 'Siguiente nivel',
      pointsNeeded: 'puntos necesitan',
      allLevels: '🏆 Los 5 Niveles',
      levelBenefits: 'Mayor nivel = Mayor prestigio + Acceso a mejores recompensas',
      missionCategories: '🎯 Misiones Disponibles',
      missionCategoriesDesc: 'Completa misiones para ganar puntos. Cada categoría tiene diferentes objetivos.',
      rewards: '🎁 Recompensas Disponibles',
      rewardsDesc: '¡Tu esfuerzo tiene premio! Alcanza los puntos necesarios para reclamar.',
      unlockAt: 'Desbloquea en',
      points: 'puntos',
      pts: 'pts',
      completed: 'Completada',
      inProgress: 'En progreso',
      locked: 'Bloqueada',
      claimable: '¡Reclamable!',
      claimed: 'Reclamada',
      pending: 'Pendiente',
      yourStatus: 'Tu estado',
      goal: 'meta',
      goals: 'metas',
      of: 'de',
      tips: '💡 Consejos para Avanzar',
      tip1: '📝 Dar feedback detallado (+100 caracteres) duplica tus puntos',
      tip2: '🐛 Reportar bugs críticos da hasta 150 puntos',
      tip3: '📸 Adjuntar screenshots a tus reportes da +25 puntos extra',
      tip4: '👥 Cada amigo que invites te da 100 puntos cuando se activa',
      tip5: '🔥 Mantén tu racha diaria para ganar bonos de constancia',
    },
    en: {
      title: '🗺️ Your Beta Journey',
      subtitle: 'Complete guide to earn your free membership',
      howItWorks: 'How does it work?',
      howItWorksDesc: 'As a beta tester, your opinion matters. Every action that helps improve the app earns you points. Accumulate enough and win a Premium or Pro membership FREE for 1 year!',
      tierProgress: '📊 Your Current Level',
      currentLevel: 'Current level',
      pointsEarned: 'points earned',
      nextLevel: 'Next level',
      pointsNeeded: 'points needed',
      allLevels: '🏆 The 5 Levels',
      levelBenefits: 'Higher level = More prestige + Access to better rewards',
      missionCategories: '🎯 Available Missions',
      missionCategoriesDesc: 'Complete missions to earn points. Each category has different objectives.',
      rewards: '🎁 Available Rewards',
      rewardsDesc: 'Your effort pays off! Reach the required points to claim.',
      unlockAt: 'Unlocks at',
      points: 'points',
      pts: 'pts',
      completed: 'Completed',
      inProgress: 'In progress',
      locked: 'Locked',
      claimable: 'Claimable!',
      claimed: 'Claimed',
      pending: 'Pending',
      yourStatus: 'Your status',
      goal: 'goal',
      goals: 'goals',
      of: 'of',
      tips: '💡 Tips to Progress',
      tip1: '📝 Giving detailed feedback (+100 chars) doubles your points',
      tip2: '🐛 Reporting critical bugs gives up to 150 points',
      tip3: '📸 Attaching screenshots to reports gives +25 extra points',
      tip4: '👥 Each friend you invite gives 100 points when activated',
      tip5: '🔥 Keep your daily streak to earn consistency bonuses',
    },
  };

  const text = t[language];

  if (!userPoints) return null;

  const currentTierConfig = TIER_CONFIG[userPoints.tier];
  const tiers = Object.entries(TIER_CONFIG).sort((a, b) => a[1].minPoints - b[1].minPoints);
  
  // Group goals by category
  const goalsByCategory = goalsWithProgress.reduce((acc, goal) => {
    const category = getGoalCategory(goal.goal_key);
    if (!acc[category]) acc[category] = [];
    acc[category].push(goal);
    return acc;
  }, {} as Record<string, typeof goalsWithProgress>);

  // Check reward status
  const pendingRedemption = redemptions?.find(r => ['pending', 'approved'].includes(r.status));
  const appliedRedemption = redemptions?.find(r => r.status === 'applied');

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/10 p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2">
                  {text.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">{text.subtitle}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-3xl">{currentTierConfig.icon}</span>
                  <div>
                    <p className="text-2xl font-black">{userPoints.total_points}</p>
                    <p className="text-xs text-muted-foreground">{text.pointsEarned}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <Accordion type="multiple" defaultValue={['how-it-works', 'levels', 'rewards']} className="w-full">
              
              {/* How it Works */}
              <AccordionItem value="how-it-works" className="border-b">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{text.howItWorks}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {text.howItWorksDesc}
                    </p>
                    
                    {/* Visual flow */}
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Feedback</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        <Star className="h-3.5 w-3.5" />
                        <span>Puntos</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        <Gift className="h-3.5 w-3.5" />
                        <span>Membresía</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* All 5 Levels */}
              <AccordionItem value="levels" className="border-b">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold">{text.allLevels}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-xs text-muted-foreground mb-4">{text.levelBenefits}</p>
                  
                  {/* Tier progression visual */}
                  <div className="relative">
                    {/* Connection line */}
                    <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-amber-300 via-yellow-400 to-violet-500" />
                    
                    <div className="space-y-3">
                      {tiers.map(([key, tier], index) => {
                        const isCurrentTier = key === userPoints.tier;
                        const isUnlocked = userPoints.total_points >= tier.minPoints;
                        const isNextTier = index === tiers.findIndex(([k]) => k === userPoints.tier) + 1;
                        
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${
                              isCurrentTier 
                                ? `bg-gradient-to-r ${tier.color} text-white border-transparent shadow-lg scale-105` 
                                : isUnlocked 
                                  ? 'bg-muted/50 border-primary/20' 
                                  : 'bg-muted/20 border-dashed border-muted-foreground/20 opacity-60'
                            }`}
                          >
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                              isCurrentTier 
                                ? 'bg-white/20' 
                                : isUnlocked 
                                  ? 'bg-background border-2 border-primary/30' 
                                  : 'bg-muted'
                            }`}>
                              {isUnlocked ? tier.icon : <Lock className="h-5 w-5" />}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isCurrentTier ? 'text-white' : ''}`}>
                                  {language === 'es' ? tier.labelEs : tier.labelEn}
                                </span>
                                {isCurrentTier && (
                                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                                    {text.currentLevel}
                                  </Badge>
                                )}
                                {isNextTier && !isCurrentTier && (
                                  <Badge variant="outline" className="text-xs animate-pulse">
                                    {text.nextLevel}
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm ${isCurrentTier ? 'text-white/80' : 'text-muted-foreground'}`}>
                                {tier.minPoints}+ {text.points}
                              </p>
                            </div>
                            
                            {isUnlocked && !isCurrentTier && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Progress to next tier */}
                  {nextTierProgress.percentage < 100 && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {nextTierProgress.next - nextTierProgress.current} {text.pointsNeeded}
                        </span>
                        <span className="font-semibold">
                          {TIER_CONFIG[nextTierProgress.nextTier].icon} {language === 'es' ? TIER_CONFIG[nextTierProgress.nextTier].labelEs : TIER_CONFIG[nextTierProgress.nextTier].labelEn}
                        </span>
                      </div>
                      <Progress value={nextTierProgress.percentage} className="h-2" />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Mission Categories */}
              <AccordionItem value="missions" className="border-b">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold">{text.missionCategories}</span>
                    <Badge variant="secondary" className="ml-2">
                      {goalsWithProgress.filter(g => g.isCompleted).length}/{goalsWithProgress.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-xs text-muted-foreground mb-4">{text.missionCategoriesDesc}</p>
                  
                  <div className="space-y-4">
                    {Object.entries(GOAL_CATEGORIES).map(([categoryKey, categoryConfig]) => {
                      const categoryGoals = goalsByCategory[categoryKey] || [];
                      if (categoryGoals.length === 0) return null;
                      
                      const completedInCategory = categoryGoals.filter(g => g.isCompleted).length;
                      
                      return (
                        <div 
                          key={categoryKey}
                          className={`rounded-xl border ${categoryConfig.border} overflow-hidden`}
                        >
                          <div className={`bg-gradient-to-r ${categoryConfig.gradient} p-3 flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{categoryConfig.icon}</span>
                              <span className="font-semibold">
                                {language === 'es' ? categoryConfig.colorEs : categoryConfig.colorEn}
                              </span>
                            </div>
                            <Badge variant="outline">
                              {completedInCategory}/{categoryGoals.length} {categoryGoals.length === 1 ? text.goal : text.goals}
                            </Badge>
                          </div>
                          
                          <div className="p-2 space-y-1">
                            {categoryGoals.map((goal) => (
                              <div 
                                key={goal.id}
                                className={`flex items-center gap-3 p-2 rounded-lg ${
                                  goal.isCompleted 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20' 
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                <span className={`text-lg ${goal.isCompleted ? '' : 'grayscale opacity-50'}`}>
                                  {goal.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${goal.isCompleted ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                                    {language === 'es' ? goal.name_es : goal.name_en}
                                  </p>
                                  {!goal.isCompleted && goal.goal_type !== 'one_time' && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Progress 
                                        value={(goal.currentProgress / goal.target_value) * 100} 
                                        className="h-1 flex-1"
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {goal.currentProgress}/{goal.target_value}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge 
                                      variant={goal.isCompleted ? 'default' : 'outline'} 
                                      className={`shrink-0 ${goal.isCompleted ? 'bg-emerald-500' : ''}`}
                                    >
                                      {goal.isCompleted ? (
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                      ) : (
                                        <Star className="h-3 w-3 mr-1" />
                                      )}
                                      {goal.points_reward}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-[200px] text-xs">
                                      {language === 'es' ? goal.description_es : goal.description_en}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Rewards */}
              <AccordionItem value="rewards" className="border-b">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{text.rewards}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-xs text-muted-foreground mb-4">{text.rewardsDesc}</p>
                  
                  <div className="space-y-3">
                    {Object.entries(REWARDS_CONFIG).map(([key, reward], index) => {
                      const isUnlocked = userPoints.total_points >= reward.points;
                      const isClaimed = appliedRedemption?.reward_type === key || pendingRedemption?.reward_type === key;
                      const isPending = pendingRedemption?.reward_type === key;
                      
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
                            isClaimed 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                              : isUnlocked 
                                ? 'border-primary bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg' 
                                : 'border-muted bg-muted/20'
                          }`}
                        >
                          {/* Sparkle effect for unlocked */}
                          {isUnlocked && !isClaimed && (
                            <div className="absolute top-2 right-2">
                              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${
                              isClaimed 
                                ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                                : isUnlocked 
                                  ? 'bg-gradient-to-br from-primary to-accent text-white' 
                                  : 'bg-muted'
                            }`}>
                              {isClaimed ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                              ) : isUnlocked ? (
                                <Gift className="h-6 w-6" />
                              ) : (
                                <Lock className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className={`font-bold ${isClaimed ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                                {language === 'es' ? reward.labelEs : reward.labelEn}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {language === 'es' ? reward.descEs : reward.descEn}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <Badge 
                                variant={isUnlocked ? 'default' : 'secondary'} 
                                className={`mb-1 ${isClaimed ? 'bg-emerald-500' : ''}`}
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                {reward.points} {text.pts}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {isClaimed 
                                  ? (isPending ? text.pending : text.claimed)
                                  : isUnlocked 
                                    ? text.claimable 
                                    : `${text.unlockAt} ${reward.points - userPoints.total_points} ${text.pts}`
                                }
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress bar if not unlocked */}
                          {!isUnlocked && (
                            <div className="mt-3">
                              <Progress 
                                value={(userPoints.total_points / reward.points) * 100} 
                                className="h-1.5"
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Tips */}
              <AccordionItem value="tips">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">{text.tips}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-2">
                    {[text.tip1, text.tip2, text.tip3, text.tip4, text.tip5].map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-100 dark:border-amber-900"
                      >
                        <span className="text-sm">{tip}</span>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};
