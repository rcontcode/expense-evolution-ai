 import { motion } from 'framer-motion';
 import { useNavigate } from 'react-router-dom';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useUserLevel, useUserAchievements, ACHIEVEMENTS, LEVELS } from '@/hooks/data/useGamification';
 import { XPProgressRing } from './XPProgressRing';
 import { StreakCounter } from './StreakCounter';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Trophy, Sparkles, Target, ChevronRight, Gift, Flame, Star, Crown, Zap, BookOpen, Rocket } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Progress } from '@/components/ui/progress';
 
 interface DashboardGamificationWidgetProps {
   className?: string;
   compact?: boolean;
 }
 
 // Quick tips from experts
 const QUICK_TIPS = {
   es: [
     { tip: 'Registra un gasto hoy para mantener tu racha', icon: '📝' },
     { tip: 'Revisa tus metas semanalmente', icon: '🎯' },
     { tip: 'Cada pequeño ahorro suma a tu libertad', icon: '💰' },
     { tip: 'La consistencia vence al talento', icon: '🔥' },
   ],
   en: [
     { tip: 'Log an expense today to maintain your streak', icon: '📝' },
     { tip: 'Review your goals weekly', icon: '🎯' },
     { tip: 'Every small saving adds to your freedom', icon: '💰' },
     { tip: 'Consistency beats talent', icon: '🔥' },
   ],
 };
 
 export function DashboardGamificationWidget({ className, compact = false }: DashboardGamificationWidgetProps) {
   const { language } = useLanguage();
   const navigate = useNavigate();
   const { data: userLevel, isLoading: levelLoading } = useUserLevel();
   const { data: achievements, isLoading: achievementsLoading } = useUserAchievements();
   
   const level = userLevel?.level || 1;
   const experiencePoints = userLevel?.experience_points || 0;
   const streakDays = userLevel?.streak_days || 0;
   
   const totalAchievements = Object.keys(ACHIEVEMENTS).length;
   const unlockedAchievements = achievements?.length || 0;
   const achievementProgress = (unlockedAchievements / totalAchievements) * 100;
   
   // Get recent achievements (last 3)
   const recentAchievements = achievements?.slice(0, 3) || [];
   
   // Random daily tip
   const dailyTip = QUICK_TIPS[language][Math.floor(Date.now() / 86400000) % QUICK_TIPS[language].length];
   
   const currentLevelData = LEVELS.find(l => l.level === level) || LEVELS[0];
   const nextLevelData = LEVELS.find(l => l.level === level + 1);
   
   const t = {
     es: {
       title: 'Tu Aventura Financiera',
       subtitle: '¡Sigue creciendo!',
       achievements: 'Logros',
       unlocked: 'desbloqueados',
       viewAll: 'Ver Aventura Completa',
       dailyTip: 'Tip del día',
       nextLevel: 'Próximo nivel',
       keepGoing: '¡Sigue así!',
       startStreak: '¡Comienza tu racha hoy!',
       recentUnlocks: 'Últimos logros',
     },
     en: {
       title: 'Your Financial Adventure',
       subtitle: 'Keep growing!',
       achievements: 'Achievements',
       unlocked: 'unlocked',
       viewAll: 'View Full Adventure',
       dailyTip: 'Daily tip',
       nextLevel: 'Next level',
       keepGoing: 'Keep going!',
       startStreak: 'Start your streak today!',
       recentUnlocks: 'Recent unlocks',
     },
   };
   
   const text = t[language];
   
   if (levelLoading || achievementsLoading) {
     return (
       <Card className={cn('animate-pulse', className)}>
         <CardContent className="p-6">
           <div className="h-40 bg-muted rounded-lg" />
         </CardContent>
       </Card>
     );
   }
 
   if (compact) {
     return (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className={className}
       >
         <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
           <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-amber-500/10 p-4">
             <div className="flex items-center justify-between gap-4">
               {/* XP Ring mini */}
               <XPProgressRing size="sm" showDetails={false} />
               
               {/* Quick stats */}
               <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2">
                   <span className="text-2xl">{currentLevelData.icon}</span>
                   <span className="font-bold">{currentLevelData.name}</span>
                   <span className="text-muted-foreground text-sm">Lvl {level}</span>
                 </div>
                 
                 <div className="flex items-center gap-4 text-sm">
                   <div className="flex items-center gap-1">
                     <Flame className="h-4 w-4 text-orange-500" />
                     <span className="font-medium">{streakDays} días</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <Trophy className="h-4 w-4 text-amber-500" />
                     <span className="font-medium">{unlockedAchievements}/{totalAchievements}</span>
                   </div>
                 </div>
               </div>
               
               {/* CTA */}
               <Button
                 size="sm"
                 onClick={() => navigate('/adventure')}
                 className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
               >
                 <Rocket className="h-4 w-4 mr-1" />
                 {language === 'es' ? 'Ver' : 'View'}
               </Button>
             </div>
           </div>
         </Card>
       </motion.div>
     );
   }
   
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className={className}
     >
       <Card className="overflow-hidden border-2 border-primary/30 shadow-xl shadow-primary/10">
         {/* Header gradient */}
         <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-amber-500/20 p-4 border-b">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <motion.div
                 animate={{ rotate: [0, 10, -10, 0] }}
                 transition={{ duration: 2, repeat: Infinity }}
               >
                 <Sparkles className="h-6 w-6 text-primary" />
               </motion.div>
               <div>
                 <h3 className="font-bold text-lg">{text.title}</h3>
                 <p className="text-sm text-muted-foreground">{text.subtitle}</p>
               </div>
             </div>
             <Button
               variant="outline"
               size="sm"
               onClick={() => navigate('/adventure')}
               className="gap-1"
             >
               {text.viewAll}
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
         </div>
         
         <CardContent className="p-6">
           <div className="grid md:grid-cols-2 gap-6">
             {/* Left: XP Ring + Level Progress */}
             <div className="flex flex-col items-center gap-4">
               <XPProgressRing size="md" showDetails={true} />
               
               {/* Next level progress */}
               {nextLevelData && (
                 <div className="w-full space-y-2">
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">{text.nextLevel}</span>
                     <span className="font-medium flex items-center gap-1">
                       {nextLevelData.icon} {nextLevelData.name}
                     </span>
                   </div>
                 </div>
               )}
             </div>
             
             {/* Right: Streak + Achievements */}
             <div className="space-y-4">
               {/* Streak counter */}
               <StreakCounter size="sm" showMilestone={true} />
               
               {/* Achievement progress */}
               <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <Trophy className="h-5 w-5 text-amber-500" />
                     <span className="font-medium">{text.achievements}</span>
                   </div>
                   <span className="font-bold text-amber-600">
                     {unlockedAchievements}/{totalAchievements}
                   </span>
                 </div>
                 <Progress value={achievementProgress} className="h-2" />
                 <p className="text-xs text-muted-foreground mt-1">
                   {Math.round(achievementProgress)}% {text.unlocked}
                 </p>
                 
                 {/* Recent achievements */}
                 {recentAchievements.length > 0 && (
                   <div className="mt-3 pt-3 border-t border-amber-500/20">
                     <p className="text-xs text-muted-foreground mb-2">{text.recentUnlocks}</p>
                     <div className="flex gap-2">
                       {recentAchievements.map((a) => {
                         const achievementData = ACHIEVEMENTS[a.achievement_key as keyof typeof ACHIEVEMENTS];
                         return (
                           <motion.div
                             key={a.id}
                             className="text-2xl"
                             animate={{ scale: [1, 1.1, 1] }}
                             transition={{ duration: 2, repeat: Infinity }}
                             title={a.achievement_key}
                           >
                             {achievementData?.icon || '🏆'}
                           </motion.div>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </div>
               
               {/* Daily tip */}
               <motion.div
                 className="p-3 rounded-lg bg-muted/50 border"
                 animate={{ opacity: [0.8, 1, 0.8] }}
                 transition={{ duration: 3, repeat: Infinity }}
               >
                 <div className="flex items-start gap-2">
                   <span className="text-lg">{dailyTip.icon}</span>
                   <div>
                     <p className="text-xs text-muted-foreground font-medium">{text.dailyTip}</p>
                     <p className="text-sm">{dailyTip.tip}</p>
                   </div>
                 </div>
               </motion.div>
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }