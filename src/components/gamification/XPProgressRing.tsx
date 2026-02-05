 import { motion } from 'framer-motion';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useUserLevel, LEVELS } from '@/hooks/data/useGamification';
 import { Zap, TrendingUp, Sparkles, Crown, Star, Flame } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface XPProgressRingProps {
   size?: 'sm' | 'md' | 'lg';
   showDetails?: boolean;
   className?: string;
 }
 
 export function XPProgressRing({ size = 'md', showDetails = true, className }: XPProgressRingProps) {
   const { language } = useLanguage();
   const { data: userLevel, isLoading } = useUserLevel();
   
   const level = userLevel?.level || 1;
   const experiencePoints = userLevel?.experience_points || 0;
   const streakDays = userLevel?.streak_days || 0;
   
   const currentLevelData = LEVELS.find(l => l.level === level) || LEVELS[0];
   const nextLevelData = LEVELS.find(l => l.level === level + 1) || LEVELS[LEVELS.length - 1];
   const currentLevelXP = currentLevelData.minXP;
   const nextLevelXP = nextLevelData.minXP;
   
   const xpProgress = nextLevelXP > currentLevelXP 
     ? ((experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
     : 100;
   
   const sizeConfig = {
     sm: { container: 'w-20 h-20', ring: 60, stroke: 6, text: 'text-lg', icon: 'text-xl' },
     md: { container: 'w-32 h-32', ring: 100, stroke: 8, text: 'text-2xl', icon: 'text-3xl' },
     lg: { container: 'w-44 h-44', ring: 140, stroke: 10, text: 'text-3xl', icon: 'text-4xl' },
   };
   
   const config = sizeConfig[size];
   const circumference = 2 * Math.PI * ((config.ring - config.stroke) / 2);
   const strokeDashoffset = circumference - (xpProgress / 100) * circumference;
   
   // Level-based colors
   const getLevelColor = () => {
     if (level >= 9) return { gradient: 'from-yellow-400 via-amber-500 to-orange-500', glow: 'shadow-amber-500/50' };
     if (level >= 7) return { gradient: 'from-violet-400 via-purple-500 to-fuchsia-500', glow: 'shadow-purple-500/50' };
     if (level >= 5) return { gradient: 'from-blue-400 via-cyan-500 to-teal-500', glow: 'shadow-cyan-500/50' };
     if (level >= 3) return { gradient: 'from-emerald-400 via-green-500 to-teal-500', glow: 'shadow-green-500/50' };
     return { gradient: 'from-primary via-accent to-primary', glow: 'shadow-primary/50' };
   };
   
   const levelColor = getLevelColor();
   
   const t = {
     es: {
       level: 'Nivel',
       xp: 'XP',
       next: 'Próximo',
       streak: 'Racha',
       days: 'días',
     },
     en: {
       level: 'Level',
       xp: 'XP',
       next: 'Next',
       streak: 'Streak',
       days: 'days',
     },
   };
   
   const text = t[language];
   
   if (isLoading) {
     return <div className={cn('animate-pulse rounded-full bg-muted', config.container, className)} />;
   }
 
   return (
     <div className={cn('flex flex-col items-center gap-2', className)}>
       {/* Progress Ring */}
       <div className={cn('relative', config.container)}>
         {/* Glow effect */}
         <motion.div
           className={cn('absolute inset-0 rounded-full blur-xl opacity-50 bg-gradient-to-r', levelColor.gradient)}
           animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
           transition={{ duration: 2, repeat: Infinity }}
         />
         
         {/* SVG Ring */}
         <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${config.ring} ${config.ring}`}>
           {/* Background ring */}
           <circle
             cx={config.ring / 2}
             cy={config.ring / 2}
             r={(config.ring - config.stroke) / 2}
             fill="none"
             stroke="currentColor"
             strokeWidth={config.stroke}
             className="text-muted"
           />
           {/* Progress ring */}
           <motion.circle
             cx={config.ring / 2}
             cy={config.ring / 2}
             r={(config.ring - config.stroke) / 2}
             fill="none"
             stroke="url(#progressGradient)"
             strokeWidth={config.stroke}
             strokeLinecap="round"
             strokeDasharray={circumference}
             initial={{ strokeDashoffset: circumference }}
             animate={{ strokeDashoffset }}
             transition={{ duration: 1.5, ease: 'easeOut' }}
           />
           {/* Gradient definition */}
           <defs>
             <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="hsl(var(--primary))" />
               <stop offset="50%" stopColor="hsl(var(--accent))" />
               <stop offset="100%" stopColor="#f59e0b" />
             </linearGradient>
           </defs>
         </svg>
         
         {/* Center content */}
         <div className="absolute inset-0 flex flex-col items-center justify-center">
           <motion.span
             className={config.icon}
             animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
             transition={{ duration: 3, repeat: Infinity }}
           >
             {currentLevelData.icon}
           </motion.span>
           <span className={cn('font-black', config.text)}>{level}</span>
         </div>
         
         {/* Streak badge */}
         {streakDays > 0 && (
           <motion.div
             className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg"
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 1.5, repeat: Infinity }}
           >
             <Flame className="h-3 w-3" />
             {streakDays}
           </motion.div>
         )}
       </div>
       
       {/* Details below ring */}
       {showDetails && (
         <div className="text-center space-y-1">
           <div className="flex items-center justify-center gap-2">
             <span className="flex items-center gap-1 text-sm font-medium">
               <Zap className="h-4 w-4 text-primary" />
               {experiencePoints.toLocaleString()} {text.xp}
             </span>
           </div>
           <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
             <TrendingUp className="h-3 w-3" />
             {text.next}: {nextLevelXP.toLocaleString()} {text.xp}
           </div>
           {level < 10 && (
             <motion.div
               className="text-xs font-medium text-primary flex items-center justify-center gap-1"
               animate={{ opacity: [0.7, 1, 0.7] }}
               transition={{ duration: 2, repeat: Infinity }}
             >
               <Sparkles className="h-3 w-3" />
               {Math.round(xpProgress)}% {language === 'es' ? 'al siguiente nivel' : 'to next level'}
             </motion.div>
           )}
         </div>
       )}
     </div>
   );
 }