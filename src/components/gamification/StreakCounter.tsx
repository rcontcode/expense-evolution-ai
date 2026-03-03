import { useMemo } from 'react';
import { motion } from 'framer-motion';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useUserLevel } from '@/hooks/data/useGamification';
import { Flame, Zap, Crown, Star, Trophy, Calendar, Target, TrendingUp, Sparkles } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface StreakCounterProps {
   size?: 'sm' | 'md' | 'lg';
   showMilestone?: boolean;
   className?: string;
 }
 
 // Milestones with rewards and motivation
 const STREAK_MILESTONES = [
  { days: 3, labelEs: '¡3 Días!', labelEn: '3 Days!', emoji: '🌱', color: 'from-green-400 to-emerald-500', reward: 10 },
  { days: 7, labelEs: '¡1 Semana!', labelEn: '1 Week!', emoji: '🔥', color: 'from-orange-400 to-amber-500', reward: 25 },
  { days: 14, labelEs: '¡2 Semanas!', labelEn: '2 Weeks!', emoji: '⚡', color: 'from-amber-400 to-yellow-500', reward: 50 },
  { days: 30, labelEs: '¡1 Mes!', labelEn: '1 Month!', emoji: '🌟', color: 'from-yellow-400 to-orange-500', reward: 100 },
  { days: 60, labelEs: '¡2 Meses!', labelEn: '2 Months!', emoji: '💪', color: 'from-red-400 to-rose-500', reward: 200 },
  { days: 100, labelEs: '¡100 Días!', labelEn: '100 Days!', emoji: '🏆', color: 'from-violet-400 to-purple-500', reward: 500 },
  { days: 365, labelEs: '¡1 Año!', labelEn: '1 Year!', emoji: '👑', color: 'from-amber-300 via-yellow-400 to-orange-500', reward: 1000 },
 ];
 
// Motivational quotes for streaks
const STREAK_QUOTES = {
  es: [
    { quote: 'La consistencia es más importante que la perfección', author: 'Desconocido' },
    { quote: 'Los pequeños pasos llevan a grandes cambios', author: 'Lao Tzu' },
    { quote: 'La disciplina es el puente entre metas y logros', author: 'Jim Rohn' },
    { quote: 'Cada día que avanzas es un día más cerca del éxito', author: 'Brian Tracy' },
  ],
  en: [
    { quote: 'Consistency is more important than perfection', author: 'Unknown' },
    { quote: 'Small steps lead to big changes', author: 'Lao Tzu' },
    { quote: 'Discipline is the bridge between goals and achievement', author: 'Jim Rohn' },
    { quote: 'Every day you advance is one day closer to success', author: 'Brian Tracy' },
  ],
};

 export function StreakCounter({ size = 'md', showMilestone = true, className }: StreakCounterProps) {
   const { language } = useLanguage();
   const { data: userLevel, isLoading } = useUserLevel();
   
   const streakDays = userLevel?.streak_days || 0;
  // Note: best_streak would need to be added to the UserLevel type
  // For now, we'll use streakDays as the best streak reference
  const bestStreak = streakDays;
   
   // Find current milestone and next one
   const currentMilestone = [...STREAK_MILESTONES].reverse().find(m => streakDays >= m.days);
   const nextMilestone = STREAK_MILESTONES.find(m => m.days > streakDays);
   
   const sizeConfig = {
    sm: { container: 'px-4 py-3', flame: 'text-2xl', number: 'text-xl', label: 'text-xs' },
    md: { container: 'px-5 py-4', flame: 'text-4xl', number: 'text-3xl', label: 'text-sm' },
    lg: { container: 'px-6 py-5', flame: 'text-6xl', number: 'text-5xl', label: 'text-base' },
   };
   
   const config = sizeConfig[size];
   
   // Get intensity based on streak
   const getIntensity = () => {
     if (streakDays >= 100) return { 
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
      glow: 'shadow-violet-500/50',
      particles: 10, 
       labelEs: '¡LEGENDARIO!', 
      labelEn: 'LEGENDARY!',
      intensity: 5,
     };
     if (streakDays >= 30) return { 
       gradient: 'from-orange-400 via-red-500 to-rose-600', 
      glow: 'shadow-red-500/50',
       particles: 6, 
       labelEs: '¡EN LLAMAS!', 
      labelEn: 'ON FIRE!',
      intensity: 4,
     };
     if (streakDays >= 14) return { 
       gradient: 'from-amber-400 via-orange-500 to-red-500', 
      glow: 'shadow-orange-500/40',
       particles: 4, 
       labelEs: '¡IMPARABLE!', 
      labelEn: 'UNSTOPPABLE!',
      intensity: 3,
     };
     if (streakDays >= 7) return { 
       gradient: 'from-yellow-400 via-amber-500 to-orange-500', 
      glow: 'shadow-amber-500/30',
       particles: 3, 
       labelEs: '¡Racha Activa!', 
      labelEn: 'Active Streak!',
      intensity: 2,
     };
     if (streakDays >= 3) return { 
       gradient: 'from-yellow-300 to-amber-400', 
      glow: 'shadow-yellow-500/20',
       particles: 2, 
       labelEs: 'Construyendo hábito', 
      labelEn: 'Building habit',
      intensity: 1,
     };
     return { 
       gradient: 'from-slate-300 to-slate-400', 
      glow: '',
       particles: 0, 
       labelEs: 'Comienza hoy', 
      labelEn: 'Start today',
      intensity: 0,
     };
   };
   
   const intensity = getIntensity();
  const randomQuote = useMemo(() => {
    const index = Math.floor(Date.now() / 86400000) % STREAK_QUOTES[language].length;
    return STREAK_QUOTES[language][index];
  }, [language]);
   
   const t = {
     es: {
       days: 'días',
       streak: 'Racha',
       nextMilestone: 'Próximo hito',
       daysToGo: 'días para',
      bestStreak: 'Mejor racha',
      reward: 'Recompensa',
     },
     en: {
       days: 'days',
       streak: 'Streak',
       nextMilestone: 'Next milestone',
       daysToGo: 'days to',
      bestStreak: 'Best streak',
      reward: 'Reward',
     },
   };
   
   const text = t[language];
   
   if (isLoading) {
     return <div className={cn('animate-pulse rounded-xl bg-muted h-20', className)} />;
   }
 
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.9 }}
       animate={{ opacity: 1, scale: 1 }}
       className={cn(
        'relative rounded-2xl overflow-hidden shadow-lg',
        streakDays > 0 ? `bg-gradient-to-r ${intensity.gradient} ${intensity.glow}` : 'bg-muted',
         className
       )}
     >
      {/* Animated background glow */}
      {streakDays > 0 && intensity.intensity >= 3 && (
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
       {/* Animated particles */}
       {streakDays > 0 && (
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {[...Array(intensity.particles)].map((_, i) => (
             <motion.div
               key={i}
              className="absolute"
               style={{
                 left: `${10 + (i * 20)}%`,
                 top: '50%',
               }}
               animate={{
                y: [0, -40, 0],
                 opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.4, 0.8],
               }}
               transition={{
                 duration: 2 + i * 0.3,
                 repeat: Infinity,
                 delay: i * 0.2,
               }}
             >
              {['✨', '🔥', '⭐', '💫'][i % 4]}
             </motion.div>
           ))}
         </div>
       )}
      
      {/* Flame ring animation for high streaks */}
      {intensity.intensity >= 4 && (
        <motion.div
          className="absolute inset-0 border-2 border-white/20 rounded-2xl"
          animate={{ 
            boxShadow: [
              '0 0 0px rgba(255,255,255,0)',
              '0 0 30px rgba(255,255,255,0.3)',
              '0 0 0px rgba(255,255,255,0)',
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
       
       <div className={cn('relative flex items-center gap-4', config.container)}>
         {/* Flame icon */}
         <motion.div
           className={cn('shrink-0', streakDays === 0 && 'opacity-30')}
           animate={streakDays > 0 ? {
            scale: [1, 1.15, 0.95, 1],
            rotate: [-5, 5, -5, 0],
           } : {}}
           transition={{
            duration: 0.6,
             repeat: Infinity,
             repeatType: 'reverse',
           }}
         >
          <span className={config.flame}>
            {streakDays >= 100 ? '🏆' : streakDays >= 30 ? '🔥' : streakDays >= 7 ? '⚡' : '🔥'}
          </span>
         </motion.div>
         
         {/* Stats */}
         <div className={streakDays > 0 ? 'text-white' : ''}>
           <div className="flex items-baseline gap-2">
             <motion.span
               key={streakDays}
               initial={{ scale: 1.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
              className={cn('font-black drop-shadow-lg', config.number)}
             >
               {streakDays}
             </motion.span>
             <span className={cn('font-medium', config.label)}>
               {text.days}
             </span>
           </div>
          <motion.p 
            className={cn('font-bold', config.label, streakDays === 0 && 'text-muted-foreground')}
            animate={streakDays >= 30 ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
             {language === 'es' ? intensity.labelEs : intensity.labelEn}
          </motion.p>
          
          {/* Best streak indicator */}
          {bestStreak > streakDays && streakDays > 0 && (
            <p className="text-xs text-white/70 flex items-center gap-1 mt-1">
              <Trophy className="h-3 w-3" />
              {text.bestStreak}: {bestStreak} {text.days}
            </p>
          )}
         </div>
         
         {/* Next milestone */}
         {showMilestone && nextMilestone && streakDays > 0 && (
          <motion.div 
            className="ml-auto text-right text-white/90"
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-xs font-medium flex items-center gap-1 justify-end">
              <Target className="h-3 w-3" />
              {text.nextMilestone}
            </p>
            <p className="text-base font-bold flex items-center gap-1 justify-end">
               <span>{nextMilestone.emoji}</span>
               <span>{nextMilestone.days - streakDays} {text.daysToGo}</span>
             </p>
             <p className="text-xs font-medium">
               {language === 'es' ? nextMilestone.labelEs : nextMilestone.labelEn}
             </p>
            <p className="text-[10px] text-white/60 flex items-center gap-1 justify-end">
              <Star className="h-2.5 w-2.5" />
              +{nextMilestone.reward} XP
            </p>
          </motion.div>
         )}
         
         {/* Current milestone badge */}
         {currentMilestone && (
           <motion.div
            className="absolute -top-1 -right-1 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1 shadow-lg"
            animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
           >
             <span>{currentMilestone.emoji}</span>
             <span>{language === 'es' ? currentMilestone.labelEs : currentMilestone.labelEn}</span>
           </motion.div>
         )}
       </div>
      
      {/* Motivational quote for active streaks */}
      {streakDays >= 3 && size !== 'sm' && (
        <motion.div 
          className="px-4 pb-3 pt-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[11px] text-white/70 italic flex items-start gap-1">
            <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
            "{randomQuote.quote}" — {randomQuote.author}
          </p>
        </motion.div>
      )}
     </motion.div>
   );
 }