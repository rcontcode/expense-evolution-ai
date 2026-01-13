import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Gift, 
  Star, 
  Users, 
  MessageSquare, 
  Flame,
  ArrowRight,
  Trophy,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useBetaGamification, TIER_CONFIG } from '@/hooks/data/useBetaGamification';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';

// Reminder types based on user state
type ReminderType = 
  | 'welcome_back' 
  | 'streak_reminder' 
  | 'expiring_soon' 
  | 'almost_reward' 
  | 'invite_friends' 
  | 'give_feedback'
  | 'streak_celebration';

interface ReminderConfig {
  titleEs: string;
  titleEn: string;
  messageEs: string;
  messageEn: string;
  icon: React.ReactNode;
  emoji: string;
  ctaLabelEs: string;
  ctaLabelEn: string;
  ctaRoute: string;
  gradient: string;
  priority: number;
}

const REMINDER_CONFIGS: Record<ReminderType, ReminderConfig> = {
  welcome_back: {
    titleEs: '¡Hola de nuevo! 👋',
    titleEn: 'Welcome back! 👋',
    messageEs: 'Te echamos de menos. ¿Qué tal si hoy compartes tu opinión sobre alguna función?',
    messageEn: 'We missed you. How about sharing your opinion on a feature today?',
    icon: <Heart className="h-5 w-5" />,
    emoji: '💜',
    ctaLabelEs: 'Dar mi opinión',
    ctaLabelEn: 'Give feedback',
    ctaRoute: '/beta-feedback',
    gradient: 'from-violet-500/20 to-purple-500/20',
    priority: 2,
  },
  streak_reminder: {
    titleEs: '🔥 ¡No pierdas tu racha!',
    titleEn: '🔥 Keep your streak!',
    messageEs: 'Haz cualquier actividad hoy para mantener tu racha activa y ganar puntos extra.',
    messageEn: 'Do any activity today to keep your streak going and earn extra points.',
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    emoji: '🔥',
    ctaLabelEs: 'Mantener racha',
    ctaLabelEn: 'Keep streak',
    ctaRoute: '/beta-feedback',
    gradient: 'from-orange-500/20 to-amber-500/20',
    priority: 3,
  },
  expiring_soon: {
    titleEs: '⏰ Tu acceso beta vence pronto',
    titleEn: '⏰ Your beta access expires soon',
    messageEs: '¡Aún hay tiempo! Gana puntos para extender tu acceso y desbloquear recompensas.',
    messageEn: "There's still time! Earn points to extend your access and unlock rewards.",
    icon: <Gift className="h-5 w-5 text-amber-500" />,
    emoji: '⏰',
    ctaLabelEs: '¡Ganar puntos!',
    ctaLabelEn: 'Earn points!',
    ctaRoute: '/beta-feedback',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    priority: 5,
  },
  almost_reward: {
    titleEs: '🎁 ¡Casi tienes tu recompensa!',
    titleEn: '🎁 Almost got your reward!',
    messageEs: 'Estás muy cerca de desbloquear una membresía gratis. ¡Solo un poco más!',
    messageEn: "You're so close to unlocking a free membership. Just a little more!",
    icon: <Gift className="h-5 w-5 text-emerald-500" />,
    emoji: '🎁',
    ctaLabelEs: '¡Ya casi!',
    ctaLabelEn: 'Almost there!',
    ctaRoute: '/beta-feedback',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    priority: 4,
  },
  invite_friends: {
    titleEs: '👥 ¡Invita a tus amigos!',
    titleEn: '👥 Invite your friends!',
    messageEs: 'Cada amigo que se une te da 100 puntos. ¡Comparte la experiencia!',
    messageEn: 'Every friend who joins gives you 100 points. Share the experience!',
    icon: <Users className="h-5 w-5 text-blue-500" />,
    emoji: '👥',
    ctaLabelEs: 'Invitar amigos',
    ctaLabelEn: 'Invite friends',
    ctaRoute: '/beta-feedback',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    priority: 1,
  },
  give_feedback: {
    titleEs: '⭐ ¿Qué te parece EvoFinz?',
    titleEn: '⭐ How do you like EvoFinz?',
    messageEs: 'Tu opinión nos ayuda a mejorar. Cuéntanos qué funciona y qué podemos mejorar.',
    messageEn: 'Your feedback helps us improve. Tell us what works and what we can do better.',
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    emoji: '⭐',
    ctaLabelEs: 'Dar feedback',
    ctaLabelEn: 'Give feedback',
    ctaRoute: '/beta-feedback',
    gradient: 'from-primary/20 to-accent/20',
    priority: 1,
  },
  streak_celebration: {
    titleEs: '🏆 ¡Racha increíble!',
    titleEn: '🏆 Amazing streak!',
    messageEs: '¡Llevas varios días activo! Sigue así para desbloquear recompensas especiales.',
    messageEn: "You've been active for days! Keep it up to unlock special rewards.",
    icon: <Trophy className="h-5 w-5 text-amber-500" />,
    emoji: '🏆',
    ctaLabelEs: 'Ver progreso',
    ctaLabelEn: 'See progress',
    ctaRoute: '/beta-feedback',
    gradient: 'from-amber-500/20 to-orange-500/20',
    priority: 0,
  },
};

// Local storage key for dismissals
const DISMISSED_KEY = 'evofinz_beta_reminder_dismissed';
const DISMISS_DURATION_HOURS = 24; // Show again after 24 hours

export const BetaReminderBanner = () => {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { userPoints, goalsWithProgress } = useBetaGamification();
  const navigate = useNavigate();
  
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden
  const [currentReminder, setCurrentReminder] = useState<ReminderType | null>(null);
  
  // Check if banner should show
  useEffect(() => {
    if (!profile?.is_beta_tester || !userPoints) return;
    
    // Check dismissal
    const dismissedData = localStorage.getItem(DISMISSED_KEY);
    if (dismissedData) {
      const { timestamp, type } = JSON.parse(dismissedData);
      const hoursSinceDismiss = differenceInHours(new Date(), new Date(timestamp));
      if (hoursSinceDismiss < DISMISS_DURATION_HOURS) {
        setIsDismissed(true);
        return;
      }
    }
    
    // Determine which reminder to show based on user state
    const reminder = determineReminder();
    if (reminder) {
      setCurrentReminder(reminder);
      setIsDismissed(false);
    }
  }, [profile, userPoints, goalsWithProgress]);
  
  const determineReminder = (): ReminderType | null => {
    if (!userPoints || !profile) return null;
    
    const now = new Date();
    const candidates: { type: ReminderType; priority: number }[] = [];
    
    // Check expiring soon (within 14 days)
    if (profile.beta_expires_at) {
      const expiresAt = parseISO(profile.beta_expires_at);
      const daysLeft = differenceInDays(expiresAt, now);
      if (daysLeft <= 14 && daysLeft > 0) {
        candidates.push({ type: 'expiring_soon', priority: REMINDER_CONFIGS.expiring_soon.priority + (14 - daysLeft) });
      }
    }
    
    // Check almost reward (within 200 points of any reward)
    const pointsToFirstReward = 1000 - userPoints.total_points;
    if (pointsToFirstReward > 0 && pointsToFirstReward <= 200) {
      candidates.push({ type: 'almost_reward', priority: REMINDER_CONFIGS.almost_reward.priority + (200 - pointsToFirstReward) / 50 });
    }
    
    // Check streak celebration (5+ days)
    if (userPoints.streak_days >= 5) {
      candidates.push({ type: 'streak_celebration', priority: REMINDER_CONFIGS.streak_celebration.priority });
    }
    
    // Check if last activity was yesterday (streak at risk)
    if (userPoints.last_activity_date) {
      const lastActivity = parseISO(userPoints.last_activity_date);
      const daysSinceActivity = differenceInDays(now, lastActivity);
      if (daysSinceActivity === 1 && userPoints.streak_days > 0) {
        candidates.push({ type: 'streak_reminder', priority: REMINDER_CONFIGS.streak_reminder.priority + userPoints.streak_days });
      }
    }
    
    // Check welcome back (no activity for 3+ days)
    if (userPoints.last_activity_date) {
      const lastActivity = parseISO(userPoints.last_activity_date);
      const daysSinceActivity = differenceInDays(now, lastActivity);
      if (daysSinceActivity >= 3) {
        candidates.push({ type: 'welcome_back', priority: REMINDER_CONFIGS.welcome_back.priority + daysSinceActivity });
      }
    }
    
    // Check if user hasn't given much feedback yet
    if (userPoints.feedback_points < 50) {
      candidates.push({ type: 'give_feedback', priority: REMINDER_CONFIGS.give_feedback.priority });
    }
    
    // Check if user hasn't referred anyone
    if (userPoints.referral_points === 0) {
      candidates.push({ type: 'invite_friends', priority: REMINDER_CONFIGS.invite_friends.priority });
    }
    
    // Return highest priority reminder
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0].type;
  };
  
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      type: currentReminder,
    }));
  };
  
  const handleAction = () => {
    if (currentReminder) {
      navigate(REMINDER_CONFIGS[currentReminder].ctaRoute);
    }
  };
  
  if (!profile?.is_beta_tester || !currentReminder || isDismissed) return null;
  
  const config = REMINDER_CONFIGS[currentReminder];
  const tierConfig = userPoints ? TIER_CONFIG[userPoints.tier] : TIER_CONFIG.bronze;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="mb-4"
      >
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${config.gradient} p-4`}>
          {/* Decorative sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-2 right-12"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4 text-primary/30" />
            </motion.div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Icon with tier color */}
            <motion.div 
              className={`p-3 rounded-xl bg-gradient-to-br ${tierConfig.color} text-white shadow-lg shrink-0`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {config.icon}
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{config.emoji}</span>
                <h4 className="font-bold text-foreground">
                  {language === 'es' ? config.titleEs : config.titleEn}
                </h4>
                {userPoints && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Star className="h-3 w-3" />
                    {userPoints.total_points} pts
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {language === 'es' ? config.messageEs : config.messageEn}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleAction}
                size="sm"
                className="gap-1 shadow-md"
              >
                {language === 'es' ? config.ctaLabelEs : config.ctaLabelEn}
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
