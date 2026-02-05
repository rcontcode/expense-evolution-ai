 import { motion } from 'framer-motion';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useUserLevel } from '@/hooks/data/useGamification';
 import { Flame, Zap, Crown, Star, Trophy } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface StreakCounterProps {
   size?: 'sm' | 'md' | 'lg';
   showMilestone?: boolean;
   className?: string;
 }
 
 // Milestones with rewards and motivation
 const STREAK_MILESTONES = [
   { days: 7, labelEs: '¡1 Semana!', labelEn: '1 Week!', emoji: '🔥', color: 'from-orange-400 to-amber-500' },
   { days: 14, labelEs: '¡2 Semanas!', labelEn: '2 Weeks!', emoji: '⚡', color: 'from-amber-400 to-yellow-500' },
   { days: 30, labelEs: '¡1 Mes!', labelEn: '1 Month!', emoji: '🌟', color: 'from-yellow-400 to-orange-500' },
   { days: 60, labelEs: '¡2 Meses!', labelEn: '2 Months!', emoji: '💪', color: 'from-red-400 to-rose-500' },
   { days: 100, labelEs: '¡100 Días!', labelEn: '100 Days!', emoji: '🏆', color: 'from-violet-400 to-purple-500' },
   { days: 365, labelEs: '¡1 Año!', labelEn: '1 Year!', emoji: '👑', color: 'from-amber-300 via-yellow-400 to-orange-500' },
 ];
 
 export function StreakCounter({ size = 'md', showMilestone = true, className }: StreakCounterProps) {
   const { language } = useLanguage();
   const { data: userLevel, isLoading } = useUserLevel();
   
   const streakDays = userLevel?.streak_days || 0;
   
   // Find current milestone and next one
   const currentMilestone = [...STREAK_MILESTONES].reverse().find(m => streakDays >= m.days);
   const nextMilestone = STREAK_MILESTONES.find(m => m.days > streakDays);
   
   const sizeConfig = {
     sm: { container: 'px-3 py-2', flame: 'text-xl', number: 'text-lg', label: 'text-xs' },
     md: { container: 'px-4 py-3', flame: 'text-3xl', number: 'text-2xl', label: 'text-sm' },
     lg: { container: 'px-6 py-4', flame: 'text-5xl', number: 'text-4xl', label: 'text-base' },
   };
   
   const config = sizeConfig[size];
   
   // Get intensity based on streak
   const getIntensity = () => {
     if (streakDays >= 100) return { 
       gradient: 'from-violet-500 via-fuchsia-500 to-pink-500', 
       particles: 8, 
       labelEs: '¡LEGENDARIO!', 
       labelEn: 'LEGENDARY!' 
     };
     if (streakDays >= 30) return { 
       gradient: 'from-orange-400 via-red-500 to-rose-600', 
       particles: 6, 
       labelEs: '¡EN LLAMAS!', 
       labelEn: 'ON FIRE!' 
     };
     if (streakDays >= 14) return { 
       gradient: 'from-amber-400 via-orange-500 to-red-500', 
       particles: 4, 
       labelEs: '¡IMPARABLE!', 
       labelEn: 'UNSTOPPABLE!' 
     };
     if (streakDays >= 7) return { 
       gradient: 'from-yellow-400 via-amber-500 to-orange-500', 
       particles: 3, 
       labelEs: '¡Racha Activa!', 
       labelEn: 'Active Streak!' 
     };
     if (streakDays >= 3) return { 
       gradient: 'from-yellow-300 to-amber-400', 
       particles: 2, 
       labelEs: 'Construyendo hábito', 
       labelEn: 'Building habit' 
     };
     return { 
       gradient: 'from-slate-300 to-slate-400', 
       particles: 0, 
       labelEs: 'Comienza hoy', 
       labelEn: 'Start today' 
     };
   };
   
   const intensity = getIntensity();
   
   const t = {
     es: {
       days: 'días',
       streak: 'Racha',
       nextMilestone: 'Próximo hito',
       daysToGo: 'días para',
     },
     en: {
       days: 'days',
       streak: 'Streak',
       nextMilestone: 'Next milestone',
       daysToGo: 'days to',
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
         'relative rounded-2xl overflow-hidden',
         streakDays > 0 ? `bg-gradient-to-r ${intensity.gradient}` : 'bg-muted',
         className
       )}
     >
       {/* Animated particles */}
       {streakDays > 0 && (
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {[...Array(intensity.particles)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute text-white/30"
               style={{
                 left: `${10 + (i * 20)}%`,
                 top: '50%',
               }}
               animate={{
                 y: [0, -30, 0],
                 opacity: [0.3, 0.8, 0.3],
                 scale: [0.8, 1.2, 0.8],
               }}
               transition={{
                 duration: 2 + i * 0.3,
                 repeat: Infinity,
                 delay: i * 0.2,
               }}
             >
               ✨
             </motion.div>
           ))}
         </div>
       )}
       
       <div className={cn('relative flex items-center gap-4', config.container)}>
         {/* Flame icon */}
         <motion.div
           className={cn('shrink-0', streakDays === 0 && 'opacity-30')}
           animate={streakDays > 0 ? {
             scale: [1, 1.1, 0.95, 1],
             rotate: [-3, 3, -3],
           } : {}}
           transition={{
             duration: 0.5,
             repeat: Infinity,
             repeatType: 'reverse',
           }}
         >
           <span className={config.flame}>🔥</span>
         </motion.div>
         
         {/* Stats */}
         <div className={streakDays > 0 ? 'text-white' : ''}>
           <div className="flex items-baseline gap-2">
             <motion.span
               key={streakDays}
               initial={{ scale: 1.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className={cn('font-black', config.number)}
             >
               {streakDays}
             </motion.span>
             <span className={cn('font-medium', config.label)}>
               {text.days}
             </span>
           </div>
           <p className={cn('font-semibold', config.label, streakDays === 0 && 'text-muted-foreground')}>
             {language === 'es' ? intensity.labelEs : intensity.labelEn}
           </p>
         </div>
         
         {/* Next milestone */}
         {showMilestone && nextMilestone && streakDays > 0 && (
           <div className="ml-auto text-right text-white/80">
             <p className="text-xs">{text.nextMilestone}</p>
             <p className="text-sm font-bold flex items-center gap-1 justify-end">
               <span>{nextMilestone.emoji}</span>
               <span>{nextMilestone.days - streakDays} {text.daysToGo}</span>
             </p>
             <p className="text-xs font-medium">
               {language === 'es' ? nextMilestone.labelEs : nextMilestone.labelEn}
             </p>
           </div>
         )}
         
         {/* Current milestone badge */}
         {currentMilestone && (
           <motion.div
             className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center gap-1"
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 2, repeat: Infinity }}
           >
             <span>{currentMilestone.emoji}</span>
             <span>{language === 'es' ? currentMilestone.labelEs : currentMilestone.labelEn}</span>
           </motion.div>
         )}
       </div>
     </motion.div>
   );
 }