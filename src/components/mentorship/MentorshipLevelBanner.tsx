import { useLanguage } from '@/contexts/LanguageContext';
import { useUserLevel, LEVELS } from '@/hooks/data/useGamification';
import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Zap, Crown, Award, Sparkles, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LEVEL_TITLES = {
  es: [
    { min: 1, max: 2, title: 'Aprendiz Financiero', emoji: '🌱', color: 'from-emerald-400 to-teal-500' },
    { min: 3, max: 4, title: 'Practicante Consciente', emoji: '📚', color: 'from-blue-400 to-cyan-500' },
    { min: 5, max: 6, title: 'Inversor en Formación', emoji: '💡', color: 'from-purple-400 to-violet-500' },
    { min: 7, max: 7, title: 'Maestro del Ahorro', emoji: '🎯', color: 'from-amber-400 to-orange-500' },
    { min: 8, max: 8, title: 'Estratega Financiero', emoji: '🧠', color: 'from-rose-400 to-pink-500' },
    { min: 9, max: 9, title: 'Mentor Emergente', emoji: '🌟', color: 'from-yellow-400 to-amber-500' },
    { min: 10, max: Infinity, title: 'Leyenda del Dinero', emoji: '👑', color: 'from-yellow-300 via-amber-400 to-orange-500' },
  ],
  en: [
    { min: 1, max: 2, title: 'Financial Apprentice', emoji: '🌱', color: 'from-emerald-400 to-teal-500' },
    { min: 3, max: 4, title: 'Conscious Practitioner', emoji: '📚', color: 'from-blue-400 to-cyan-500' },
    { min: 5, max: 6, title: 'Investor in Training', emoji: '💡', color: 'from-purple-400 to-violet-500' },
    { min: 7, max: 7, title: 'Savings Master', emoji: '🎯', color: 'from-amber-400 to-orange-500' },
    { min: 8, max: 8, title: 'Financial Strategist', emoji: '🧠', color: 'from-rose-400 to-pink-500' },
    { min: 9, max: 9, title: 'Emerging Mentor', emoji: '🌟', color: 'from-yellow-400 to-amber-500' },
    { min: 10, max: Infinity, title: 'Money Legend', emoji: '👑', color: 'from-yellow-300 via-amber-400 to-orange-500' },
  ],
};

const MOTIVATIONAL_MESSAGES = {
  es: [
    '¡Cada hábito te acerca a la libertad! 🚀',
    '¡El conocimiento es tu mejor inversión! 📈',
    '¡Tus hábitos de hoy construyen tu futuro! 💪',
    '¡Estás en el camino correcto! ⭐',
    '¡La consistencia es la clave del éxito! 🔑',
  ],
  en: [
    'Every habit brings you closer to freedom! 🚀',
    'Knowledge is your best investment! 📈',
    "Today's habits build your future! 💪",
    "You're on the right path! ⭐",
    'Consistency is the key to success! 🔑',
  ],
};

export function MentorshipLevelBanner() {
  const { language } = useLanguage();
  const { data: userLevel, isLoading } = useUserLevel();
  
  const level = userLevel?.level || 1;
  const experiencePoints = userLevel?.experience_points || 0;
  const streakDays = userLevel?.streak_days || 0;
  
  // Find current and next level XP thresholds
  const currentLevelData = LEVELS.find(l => l.level === level) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === level + 1) || LEVELS[LEVELS.length - 1];
  const currentLevelXP = currentLevelData.minXP;
  const nextLevelXP = nextLevelData.minXP;
  
  const titles = LEVEL_TITLES[language];
  const currentTitle = titles.find(t => level >= t.min && level <= t.max) || titles[0];
  const nextTitle = titles.find(t => t.min > level) || currentTitle;
  
  const messages = MOTIVATIONAL_MESSAGES[language];
  const randomMessage = messages[Math.floor(Date.now() / 60000) % messages.length]; // Change every minute
  
  const xpProgress = nextLevelXP > currentLevelXP 
    ? ((experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="h-28 rounded-2xl bg-gradient-to-r from-muted to-muted/50 animate-pulse" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r shadow-lg',
        currentTitle.color
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-16 bg-white/10 rounded-full"
            style={{
              left: `${(i * 20) % 100}%`,
              top: `${(i * 15) % 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Level & Title */}
        <div className="flex items-center gap-4">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl"
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          >
            <span className="text-3xl">{currentTitle.emoji}</span>
          </motion.div>
          
          <div className="text-white">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                {language === 'es' ? 'Nivel' : 'Level'} {level}
              </Badge>
              {streakDays > 0 && (
                <Badge className="bg-orange-500/80 text-white border-orange-400/30 text-xs">
                  <Flame className="h-3 w-3 mr-1" />
                  {streakDays} {language === 'es' ? 'días' : 'days'}
                </Badge>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold mt-1 drop-shadow-md">
              {currentTitle.title}
            </h2>
            <p className="text-white/80 text-sm">{randomMessage}</p>
          </div>
        </div>

        {/* Right: XP Progress */}
        <div className="w-full md:w-64 space-y-2">
          <div className="flex items-center justify-between text-white/90 text-sm">
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {experiencePoints.toLocaleString()} XP
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {nextLevelXP.toLocaleString()} XP
            </span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-white/20">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="text-white/70 text-xs text-center">
            {level < 10 
              ? (language === 'es' 
                  ? `Próximo: ${nextTitle.emoji} ${nextTitle.title}` 
                  : `Next: ${nextTitle.emoji} ${nextTitle.title}`)
              : (language === 'es' ? '¡Máximo nivel alcanzado! 🏆' : 'Max level reached! 🏆')
            }
          </p>
        </div>
      </div>

      {/* Decorative icons */}
      <motion.div
        className="absolute -right-4 -bottom-4 opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Crown className="h-32 w-32 text-white" />
      </motion.div>
    </motion.div>
  );
}
