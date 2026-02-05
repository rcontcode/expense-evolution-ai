 import { motion } from 'framer-motion';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useUserLevel, LEVELS } from '@/hooks/data/useGamification';
import { Zap, TrendingUp, Sparkles, Crown, Star, Flame, Rocket, Target } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
// Level titles for more personality
const LEVEL_TITLES = {
  es: {
    1: 'Novato', 2: 'Aprendiz', 3: 'Ahorrador', 4: 'Estratega', 5: 'Inversor',
    6: 'Experto', 7: 'Maestro', 8: 'Élite', 9: 'Campeón', 10: 'Leyenda',
  },
  en: {
    1: 'Novice', 2: 'Apprentice', 3: 'Saver', 4: 'Strategist', 5: 'Investor',
    6: 'Expert', 7: 'Master', 8: 'Elite', 9: 'Champion', 10: 'Legend',
  },
};

// Motivational messages per level
const LEVEL_MOTIVATION = {
  es: {
    1: '¡Comienza tu aventura!',
    2: '¡Estás aprendiendo rápido!',
    3: '¡Dominando el ahorro!',
    4: '¡Estrategia en acción!',
    5: '¡Inversiones inteligentes!',
    6: '¡Experiencia financiera!',
    7: '¡Maestría alcanzada!',
    8: '¡Élite financiera!',
    9: '¡Casi en la cima!',
    10: '¡LEYENDA VIVIENTE!',
  },
  en: {
    1: 'Start your adventure!',
    2: 'Learning fast!',
    3: 'Mastering savings!',
    4: 'Strategy in action!',
    5: 'Smart investing!',
    6: 'Financial expertise!',
    7: 'Mastery achieved!',
    8: 'Financial elite!',
    9: 'Almost at the top!',
    10: 'LIVING LEGEND!',
  },
};

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
    sm: { container: 'w-24 h-24', ring: 80, stroke: 6, text: 'text-lg', icon: 'text-xl' },
    md: { container: 'w-36 h-36', ring: 120, stroke: 8, text: 'text-2xl', icon: 'text-3xl' },
    lg: { container: 'w-48 h-48', ring: 160, stroke: 10, text: 'text-3xl', icon: 'text-4xl' },
   };
   
   const config = sizeConfig[size];
   const circumference = 2 * Math.PI * ((config.ring - config.stroke) / 2);
   const strokeDashoffset = circumference - (xpProgress / 100) * circumference;
   
   // Level-based colors
   const getLevelColor = () => {
    if (level >= 9) return { gradient: 'from-yellow-400 via-amber-500 to-orange-500', glow: 'shadow-amber-500/50', stroke1: '#fbbf24', stroke2: '#f97316' };
    if (level >= 7) return { gradient: 'from-violet-400 via-purple-500 to-fuchsia-500', glow: 'shadow-purple-500/50', stroke1: '#a78bfa', stroke2: '#d946ef' };
    if (level >= 5) return { gradient: 'from-blue-400 via-cyan-500 to-teal-500', glow: 'shadow-cyan-500/50', stroke1: '#60a5fa', stroke2: '#14b8a6' };
    if (level >= 3) return { gradient: 'from-emerald-400 via-green-500 to-teal-500', glow: 'shadow-green-500/50', stroke1: '#34d399', stroke2: '#14b8a6' };
    return { gradient: 'from-primary via-accent to-primary', glow: 'shadow-primary/50', stroke1: 'hsl(var(--primary))', stroke2: 'hsl(var(--accent))' };
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
  const levelTitle = LEVEL_TITLES[language][level as keyof typeof LEVEL_TITLES.es] || '';
  const motivation = LEVEL_MOTIVATION[language][level as keyof typeof LEVEL_MOTIVATION.es] || '';
   
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
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Outer rotating ring */}
        <motion.div
          className={cn('absolute inset-[-4px] rounded-full border-2 border-dashed', level >= 5 ? 'border-amber-500/30' : 'border-primary/20')}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Pulsing ring */}
        <motion.div
          className={cn('absolute inset-[-8px] rounded-full border', level >= 5 ? 'border-amber-500/20' : 'border-primary/10')}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
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
            stroke={`url(#progressGradient-${level})`}
             strokeWidth={config.stroke}
             strokeLinecap="round"
             strokeDasharray={circumference}
             initial={{ strokeDashoffset: circumference }}
             animate={{ strokeDashoffset }}
             transition={{ duration: 1.5, ease: 'easeOut' }}
           />
          {/* Animated glow on progress */}
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={(config.ring - config.stroke) / 2}
            fill="none"
            stroke={`url(#progressGradient-${level})`}
            strokeWidth={config.stroke + 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            opacity={0.3}
            filter="blur(4px)"
          />
           {/* Gradient definition */}
           <defs>
            <linearGradient id={`progressGradient-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={levelColor.stroke1} />
              <stop offset="100%" stopColor={levelColor.stroke2} />
             </linearGradient>
           </defs>
         </svg>
         
         {/* Center content */}
         <div className="absolute inset-0 flex flex-col items-center justify-center">
           <motion.span
             className={config.icon}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
             transition={{ duration: 3, repeat: Infinity }}
           >
             {currentLevelData.icon}
           </motion.span>
          <motion.span 
            className={cn('font-black bg-gradient-to-r bg-clip-text text-transparent', levelColor.gradient, config.text)}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {level}
          </motion.span>
         </div>
         
         {/* Streak badge */}
         {streakDays > 0 && (
           <motion.div
            className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30"
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 1.5, repeat: Infinity }}
           >
            <Flame className="h-3 w-3 animate-pulse" />
             {streakDays}
           </motion.div>
         )}
        
        {/* XP badge on the left */}
        <motion.div
          className="absolute -bottom-1 -left-1 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold shadow-lg"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="h-2.5 w-2.5" />
          {experiencePoints > 1000 ? `${(experiencePoints / 1000).toFixed(1)}k` : experiencePoints}
        </motion.div>
       </div>
       
       {/* Details below ring */}
       {showDetails && (
        <div className="text-center space-y-2">
          {/* Level title */}
          <motion.div
            className={cn('font-bold text-sm bg-gradient-to-r bg-clip-text text-transparent', levelColor.gradient)}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {levelTitle}
          </motion.div>
          
          {/* XP Progress */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold">{experiencePoints.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{text.xp}</span>
            </div>
           </div>
          
          {/* Next level */}
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Target className="h-3 w-3" />
            <span>{text.next}: {nextLevelXP.toLocaleString()} {text.xp}</span>
            <Rocket className="h-3 w-3" />
           </div>
          
          {/* Progress percentage */}
           {level < 10 && (
             <motion.div
              className={cn('text-xs font-semibold flex items-center justify-center gap-1.5 px-3 py-1 rounded-full', levelColor.glow, 'bg-gradient-to-r', levelColor.gradient, 'text-white')}
               animate={{ opacity: [0.7, 1, 0.7] }}
               transition={{ duration: 2, repeat: Infinity }}
             >
              <Sparkles className="h-3 w-3 animate-pulse" />
              {Math.round(xpProgress)}% {language === 'es' ? 'completado' : 'complete'}
             </motion.div>
           )}
          
          {/* Motivation message */}
          <motion.p
            className="text-xs text-muted-foreground italic"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ {motivation}
          </motion.p>
         </div>
       )}
     </div>
   );
 }