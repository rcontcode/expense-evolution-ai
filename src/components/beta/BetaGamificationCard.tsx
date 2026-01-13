import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  Flame,
  Gift,
  Target,
  Crown,
  Zap,
  ChevronRight,
  Check,
  Lock,
  Sparkles,
  Medal,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBetaGamification, TIER_CONFIG, REWARDS_CONFIG } from '@/hooks/data/useBetaGamification';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { BetaExpirationBadge } from './BetaExpirationBadge';

export const BetaGamificationCard = () => {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const {
    userPoints,
    goalsWithProgress,
    nextTierProgress,
    redemptions,
    isLoading,
    claimReward,
    canClaimReward,
  } = useBetaGamification();

  const [selectedReward, setSelectedReward] = useState<keyof typeof REWARDS_CONFIG | null>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  const t = {
    es: {
      title: '🏆 Tu Progreso Beta',
      subtitle: 'Gana puntos y desbloquea recompensas',
      points: 'Puntos',
      streak: 'Racha',
      days: 'días',
      bestStreak: 'Mejor racha',
      tier: 'Nivel',
      nextTier: 'Siguiente nivel',
      pointsToGo: 'puntos para',
      goalsTab: '🎯 Metas',
      rewardsTab: '🎁 Recompensas',
      statsTab: '📊 Estadísticas',
      completed: 'Completado',
      inProgress: 'En progreso',
      claimReward: 'Reclamar',
      locked: 'Bloqueado',
      unlocked: '¡Desbloqueado!',
      pending: 'Pendiente',
      approved: 'Aprobado',
      applied: 'Aplicado',
      confirmClaim: '¿Reclamar recompensa?',
      confirmClaimDesc: 'Una vez reclamada, no podrás cambiarla. Tu solicitud será revisada y aplicada pronto.',
      cancel: 'Cancelar',
      confirm: '¡Sí, reclamar!',
      alreadyClaimed: 'Ya tienes una recompensa activa',
      feedbackPoints: 'Feedback',
      bugPoints: 'Bugs',
      referralPoints: 'Referidos',
      usagePoints: 'Uso',
      noGoals: 'Cargando metas...',
      yourRedemptions: 'Tus Recompensas',
      noRedemptions: 'Aún no has reclamado ninguna recompensa',
    },
    en: {
      title: '🏆 Your Beta Progress',
      subtitle: 'Earn points and unlock rewards',
      points: 'Points',
      streak: 'Streak',
      days: 'days',
      bestStreak: 'Best streak',
      tier: 'Tier',
      nextTier: 'Next tier',
      pointsToGo: 'points to',
      goalsTab: '🎯 Goals',
      rewardsTab: '🎁 Rewards',
      statsTab: '📊 Stats',
      completed: 'Completed',
      inProgress: 'In progress',
      claimReward: 'Claim',
      locked: 'Locked',
      unlocked: 'Unlocked!',
      pending: 'Pending',
      approved: 'Approved',
      applied: 'Applied',
      confirmClaim: 'Claim reward?',
      confirmClaimDesc: 'Once claimed, you cannot change it. Your request will be reviewed and applied soon.',
      cancel: 'Cancel',
      confirm: 'Yes, claim!',
      alreadyClaimed: 'You already have an active reward',
      feedbackPoints: 'Feedback',
      bugPoints: 'Bugs',
      referralPoints: 'Referrals',
      usagePoints: 'Usage',
      noGoals: 'Loading goals...',
      yourRedemptions: 'Your Rewards',
      noRedemptions: "You haven't claimed any rewards yet",
    },
  };

  const text = t[language];

  const handleClaimReward = async () => {
    if (!selectedReward) return;
    
    await claimReward.mutateAsync(selectedReward);
    setShowClaimDialog(false);
    
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#8b5cf6', '#10b981', '#ec4899'],
    });
  };

  if (isLoading || !userPoints) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-40 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const tierConfig = TIER_CONFIG[userPoints.tier];
  const completedGoals = goalsWithProgress.filter(g => g.isCompleted).length;
  const pendingRedemption = redemptions?.find(r => ['pending', 'approved'].includes(r.status));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
          {/* Header with tier gradient */}
          <div className={`bg-gradient-to-r ${tierConfig.color} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-5xl"
                >
                  {tierConfig.icon}
                </motion.div>
                <div>
                  <h3 className="text-2xl font-black flex items-center gap-2">
                    {text.title}
                  </h3>
                  <p className="text-white/80 text-sm">{text.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black">{userPoints.total_points}</div>
                <div className="text-sm text-white/80">{text.points}</div>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTierProgress.percentage < 100 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <span>{tierConfig.icon}</span>
                    <span>{language === 'es' ? tierConfig.labelEs : tierConfig.labelEn}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>{TIER_CONFIG[nextTierProgress.nextTier].icon}</span>
                    <span>{language === 'es' ? TIER_CONFIG[nextTierProgress.nextTier].labelEs : TIER_CONFIG[nextTierProgress.nextTier].labelEn}</span>
                  </span>
                </div>
                <Progress value={nextTierProgress.percentage} className="h-2 bg-white/20" />
                <p className="text-xs text-white/70 text-center">
                  {nextTierProgress.next - nextTierProgress.current} {text.pointsToGo} {TIER_CONFIG[nextTierProgress.nextTier].icon}
                </p>
              </div>
            )}
          </div>

          {/* Beta Expiration Warning */}
          {profile?.beta_expires_at && (
            <div className="px-6 py-3 border-b border-white/10">
              <BetaExpirationBadge expiresAt={profile.beta_expires_at} showDetailed />
            </div>
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50">
            <div className="flex items-center justify-center gap-2 p-3 bg-background rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              <div className="text-center">
                <div className="font-bold">{userPoints.streak_days}</div>
                <div className="text-xs text-muted-foreground">{text.streak}</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-background rounded-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div className="text-center">
                <div className="font-bold">{userPoints.best_streak}</div>
                <div className="text-xs text-muted-foreground">{text.bestStreak}</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-background rounded-lg">
              <Target className="h-5 w-5 text-emerald-500" />
              <div className="text-center">
                <div className="font-bold">{completedGoals}/{goalsWithProgress.length}</div>
                <div className="text-xs text-muted-foreground">{text.completed}</div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                <TabsTrigger value="goals" className="gap-2 data-[state=active]:bg-primary/10">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">{text.goalsTab}</span>
                </TabsTrigger>
                <TabsTrigger value="rewards" className="gap-2 data-[state=active]:bg-primary/10">
                  <Gift className="h-4 w-4" />
                  <span className="hidden sm:inline">{text.rewardsTab}</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary/10">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">{text.statsTab}</span>
                </TabsTrigger>
              </TabsList>

              {/* Goals Tab */}
              <TabsContent value="goals" className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {goalsWithProgress.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{text.noGoals}</p>
                ) : (
                  goalsWithProgress.map((goal, i) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        goal.isCompleted 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className={`text-2xl ${goal.isCompleted ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                        {goal.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {language === 'es' ? goal.name_es : goal.name_en}
                          </p>
                          {goal.isCompleted && (
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {language === 'es' ? goal.description_es : goal.description_en}
                        </p>
                        {!goal.isCompleted && goal.goal_type !== 'one_time' && (
                          <div className="mt-1">
                            <Progress 
                              value={(goal.currentProgress / goal.target_value) * 100} 
                              className="h-1.5"
                            />
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {goal.currentProgress} / {goal.target_value}
                            </p>
                          </div>
                        )}
                      </div>
                      <Badge variant={goal.isCompleted ? 'default' : 'outline'} className="shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        {goal.points_reward}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="p-4 space-y-4">
                {pendingRedemption && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-semibold">
                        {REWARDS_CONFIG[pendingRedemption.reward_type as keyof typeof REWARDS_CONFIG]?.[language === 'es' ? 'labelEs' : 'labelEn']}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {text[pendingRedemption.status as keyof typeof text] || pendingRedemption.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {Object.entries(REWARDS_CONFIG).map(([key, reward]) => {
                  const rewardKey = key as keyof typeof REWARDS_CONFIG;
                  const canClaim = canClaimReward(rewardKey);
                  const isLocked = userPoints.total_points < reward.points;
                  const hasActiveReward = !!pendingRedemption || userPoints.reward_claimed;

                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: canClaim ? 1.02 : 1 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        canClaim 
                          ? 'border-primary bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer' 
                          : 'border-muted opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${
                            canClaim 
                              ? 'bg-gradient-to-br from-primary to-accent text-white' 
                              : 'bg-muted'
                          }`}>
                            {isLocked ? <Lock className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
                          </div>
                          <div>
                            <h4 className="font-bold">{language === 'es' ? reward.labelEs : reward.labelEn}</h4>
                            <p className="text-sm text-muted-foreground">
                              {language === 'es' ? reward.descEs : reward.descEn}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={canClaim ? 'default' : 'secondary'} className="mb-2">
                            <Crown className="h-3 w-3 mr-1" />
                            {reward.points} pts
                          </Badge>
                          {canClaim && !hasActiveReward && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReward(rewardKey);
                                setShowClaimDialog(true);
                              }}
                              className="w-full gap-1"
                            >
                              <Gift className="h-3 w-3" />
                              {text.claimReward}
                            </Button>
                          )}
                          {isLocked && (
                            <p className="text-xs text-muted-foreground">
                              {reward.points - userPoints.total_points} {text.pointsToGo.split(' ')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                      <Star className="h-5 w-5" />
                      <span className="font-semibold">{text.feedbackPoints}</span>
                    </div>
                    <p className="text-2xl font-black mt-1">{userPoints.feedback_points}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <Zap className="h-5 w-5" />
                      <span className="font-semibold">{text.bugPoints}</span>
                    </div>
                    <p className="text-2xl font-black mt-1">{userPoints.bug_report_points}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Medal className="h-5 w-5" />
                      <span className="font-semibold">{text.referralPoints}</span>
                    </div>
                    <p className="text-2xl font-black mt-1">{userPoints.referral_points}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-semibold">{text.usagePoints}</span>
                    </div>
                    <p className="text-2xl font-black mt-1">{userPoints.feature_usage_points}</p>
                  </div>
                </div>

                {/* Redemption history */}
                {redemptions && redemptions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">{text.yourRedemptions}</h4>
                    <div className="space-y-2">
                      {redemptions.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="font-medium">
                            {REWARDS_CONFIG[r.reward_type as keyof typeof REWARDS_CONFIG]?.[language === 'es' ? 'labelEs' : 'labelEn']}
                          </span>
                          <Badge variant={r.status === 'applied' ? 'default' : 'secondary'}>
                            {text[r.status as keyof typeof text] || r.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Claim Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {text.confirmClaim}
            </DialogTitle>
            <DialogDescription>
              {selectedReward && (
                <div className="mt-3 p-4 rounded-lg bg-muted">
                  <p className="font-bold text-foreground">
                    {REWARDS_CONFIG[selectedReward][language === 'es' ? 'labelEs' : 'labelEn']}
                  </p>
                  <p className="text-sm mt-1">
                    {REWARDS_CONFIG[selectedReward][language === 'es' ? 'descEs' : 'descEn']}
                  </p>
                </div>
              )}
              <p className="mt-3">{text.confirmClaimDesc}</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              {text.cancel}
            </Button>
            <Button onClick={handleClaimReward} disabled={claimReward.isPending}>
              <Sparkles className="h-4 w-4 mr-2" />
              {text.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};