import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Gift, 
  Sparkles, 
  ArrowRight, 
  Star, 
  Users, 
  MessageSquare, 
  Bug, 
  Clock,
  Flame,
  Trophy,
  Zap,
  ChevronRight,
  Bell,
  Calendar,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBetaGamification, TIER_CONFIG, REWARDS_CONFIG } from '@/hooks/data/useBetaGamification';
import { useProfile } from '@/hooks/data/useProfile';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, differenceInHours } from 'date-fns';

// Motivational messages that rotate
const MOTIVATIONAL_MESSAGES = {
  es: [
    { text: '¡Tu opinión construye el futuro! 🚀', icon: '💪' },
    { text: 'Cada punto te acerca a tu recompensa 🎁', icon: '✨' },
    { text: '¡Los Founding Members hacen historia! 👑', icon: '🔥' },
    { text: 'Tu feedback es oro puro para nosotros 💎', icon: '💛' },
    { text: '¡Juntos creamos algo increíble! 🌟', icon: '🤝' },
    { text: 'Estás dejando huella en EvoFinz 🐾', icon: '🎯' },
  ],
  en: [
    { text: 'Your opinion builds the future! 🚀', icon: '💪' },
    { text: 'Every point brings you closer to your reward 🎁', icon: '✨' },
    { text: 'Founding Members make history! 👑', icon: '🔥' },
    { text: 'Your feedback is pure gold to us 💎', icon: '💛' },
    { text: 'Together we create something amazing! 🌟', icon: '🤝' },
    { text: "You're leaving your mark on EvoFinz 🐾", icon: '🎯' },
  ],
};

// Quick action CTAs
const QUICK_ACTIONS = {
  es: [
    { 
      id: 'feedback',
      label: 'Evaluar una función', 
      emoji: '⭐', 
      points: '+25 pts',
      color: 'from-amber-500 to-orange-500',
      route: '/beta-feedback',
      description: 'Cuéntanos qué te parece',
    },
    { 
      id: 'bug',
      label: 'Reportar un problema', 
      emoji: '🐛', 
      points: '+25-150 pts',
      color: 'from-rose-500 to-pink-500',
      route: '/beta-feedback',
      description: 'Ayúdanos a mejorar',
    },
    { 
      id: 'refer',
      label: 'Invitar un amigo', 
      emoji: '👥', 
      points: '+100 pts',
      color: 'from-emerald-500 to-teal-500',
      route: '/beta-feedback',
      description: 'Comparte la experiencia',
    },
    { 
      id: 'explore',
      label: 'Explorar la app', 
      emoji: '🔍', 
      points: '+5-20 pts',
      color: 'from-violet-500 to-purple-500',
      route: '/dashboard',
      description: 'Descubre todas las funciones',
    },
  ],
  en: [
    { 
      id: 'feedback',
      label: 'Rate a feature', 
      emoji: '⭐', 
      points: '+25 pts',
      color: 'from-amber-500 to-orange-500',
      route: '/beta-feedback',
      description: 'Tell us what you think',
    },
    { 
      id: 'bug',
      label: 'Report an issue', 
      emoji: '🐛', 
      points: '+25-150 pts',
      color: 'from-rose-500 to-pink-500',
      route: '/beta-feedback',
      description: 'Help us improve',
    },
    { 
      id: 'refer',
      label: 'Invite a friend', 
      emoji: '👥', 
      points: '+100 pts',
      color: 'from-emerald-500 to-teal-500',
      route: '/beta-feedback',
      description: 'Share the experience',
    },
    { 
      id: 'explore',
      label: 'Explore the app', 
      emoji: '🔍', 
      points: '+5-20 pts',
      color: 'from-violet-500 to-purple-500',
      route: '/dashboard',
      description: 'Discover all features',
    },
  ],
};

interface MissionsCardProps {
  showCompact?: boolean;
  onDismiss?: () => void;
}

export const MissionsCard = ({ showCompact = false, onDismiss }: MissionsCardProps) => {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { userPoints, goalsWithProgress, nextTierProgress } = useBetaGamification();
  const navigate = useNavigate();
  
  const [messageIndex, setMessageIndex] = useState(0);
  const [showActions, setShowActions] = useState(!showCompact);
  
  // Rotate motivational messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES[language].length);
    }, 8000);
    return () => clearInterval(interval);
  }, [language]);
  
  const t = {
    es: {
      title: '🎯 Tus Misiones',
      subtitle: 'Gana puntos y desbloquea recompensas',
      quickActions: '⚡ Acciones Rápidas',
      yourProgress: 'Tu progreso',
      daysLeft: 'días restantes',
      hoursLeft: 'horas restantes',
      expiresWarning: '⏰ Tu acceso beta vence pronto',
      earnMore: '¡Gana más para extender!',
      nextReward: 'Próxima recompensa',
      pointsAway: 'puntos para',
      seeAll: 'Ver todo',
      hideActions: 'Ocultar',
      showActions: 'Ver acciones',
      completedGoals: 'metas completadas',
      keepGoing: '¡Sigue así!',
      almostThere: '¡Ya casi llegas!',
      greatJob: '¡Excelente trabajo!',
      legend: '¡Eres una leyenda!',
    },
    en: {
      title: '🎯 Your Missions',
      subtitle: 'Earn points and unlock rewards',
      quickActions: '⚡ Quick Actions',
      yourProgress: 'Your progress',
      daysLeft: 'days left',
      hoursLeft: 'hours left',
      expiresWarning: '⏰ Your beta access expires soon',
      earnMore: 'Earn more to extend!',
      nextReward: 'Next reward',
      pointsAway: 'points to',
      seeAll: 'See all',
      hideActions: 'Hide',
      showActions: 'Show actions',
      completedGoals: 'goals completed',
      keepGoing: 'Keep going!',
      almostThere: 'Almost there!',
      greatJob: 'Great job!',
      legend: "You're a legend!",
    },
  };
  
  const text = t[language];
  const actions = QUICK_ACTIONS[language];
  const motivationalMessage = MOTIVATIONAL_MESSAGES[language][messageIndex];
  
  // Calculate days until expiration
  const getDaysLeft = () => {
    if (!profile?.beta_expires_at) return null;
    const expiresAt = new Date(profile.beta_expires_at);
    const now = new Date();
    const days = differenceInDays(expiresAt, now);
    if (days < 1) {
      const hours = differenceInHours(expiresAt, now);
      return { value: hours, unit: 'hours' };
    }
    return { value: days, unit: 'days' };
  };
  
  const daysLeft = getDaysLeft();
  const isExpiringSoon = daysLeft && daysLeft.value < (daysLeft.unit === 'days' ? 14 : 24);
  
  // Calculate points to next reward
  const getNextReward = () => {
    if (!userPoints) return null;
    const rewards = Object.entries(REWARDS_CONFIG).sort((a, b) => a[1].points - b[1].points);
    for (const [key, reward] of rewards) {
      if (userPoints.total_points < reward.points) {
        return {
          key,
          reward,
          pointsNeeded: reward.points - userPoints.total_points,
        };
      }
    }
    return null;
  };
  
  const nextReward = getNextReward();
  const completedGoals = goalsWithProgress.filter(g => g.isCompleted).length;
  const totalGoals = goalsWithProgress.length;
  const completionPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  
  // Get encouragement message based on progress
  const getEncouragement = () => {
    if (completionPercentage >= 80) return text.legend;
    if (completionPercentage >= 60) return text.greatJob;
    if (completionPercentage >= 40) return text.almostThere;
    return text.keepGoing;
  };
  
  if (!userPoints) return null;
  
  const tierConfig = TIER_CONFIG[userPoints.tier];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header with rotating message */}
        <div className={`bg-gradient-to-r ${tierConfig.color} p-4 text-white relative overflow-hidden`}>
          {/* Animated sparkles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-white/20"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.6,
                }}
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${20 + (i % 2) * 40}%`,
                }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            ))}
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                key={messageIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-2xl"
              >
                {motivationalMessage.icon}
              </motion.span>
              <div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="font-semibold text-sm"
                  >
                    {motivationalMessage.text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            
            {/* Points display */}
            <div className="text-right">
              <div className="text-2xl font-black">{userPoints.total_points}</div>
              <div className="text-xs text-white/80 flex items-center gap-1">
                <Star className="h-3 w-3" />
                {tierConfig.labelEs}
              </div>
            </div>
          </div>
          
          {/* Progress bar to next tier */}
          {nextTierProgress.percentage < 100 && (
            <div className="relative z-10 mt-3">
              <Progress value={nextTierProgress.percentage} className="h-1.5 bg-white/20" />
              <p className="text-xs text-white/70 mt-1 text-center">
                {nextTierProgress.next - nextTierProgress.current} {text.pointsAway} {TIER_CONFIG[nextTierProgress.nextTier].icon}
              </p>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 space-y-4">
          {/* Expiration warning if soon */}
          {isExpiringSoon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {text.expiresWarning}
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                    {daysLeft?.value} {daysLeft?.unit === 'days' ? text.daysLeft : text.hoursLeft} • {text.earnMore}
                  </p>
                </div>
                <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                  <Flame className="h-3 w-3 mr-1" />
                  +puntos
                </Badge>
              </div>
            </motion.div>
          )}
          
          {/* Next reward preview */}
          {nextReward && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{text.nextReward}</p>
                  <p className="text-sm font-semibold">
                    {language === 'es' ? nextReward.reward.labelEs : nextReward.reward.labelEn}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {nextReward.pointsNeeded} pts
                </Badge>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {text.quickActions}
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowActions(!showActions)}
                className="text-xs h-7"
              >
                {showActions ? text.hideActions : text.showActions}
                <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${showActions ? 'rotate-90' : ''}`} />
              </Button>
            </div>
            
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-2 gap-2 overflow-hidden"
                >
                  {actions.map((action, i) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(action.route)}
                      className={`p-3 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${action.color} text-white shadow-md`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{action.emoji}</span>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0 font-bold">
                          {action.points}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-xs text-white/80">{action.description}</p>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Goals progress summary */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                {completedGoals}/{totalGoals} {text.completedGoals}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {getEncouragement()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/beta-feedback')}
                className="text-xs h-7 gap-1"
              >
                {text.seeAll}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
