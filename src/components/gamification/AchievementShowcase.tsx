 import { motion } from 'framer-motion';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useUserAchievements, ACHIEVEMENTS } from '@/hooks/data/useGamification';
import { Trophy, Lock, Sparkles, Star, Flame, Crown, Gift, Zap, Target, TrendingUp, Medal } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Badge } from '@/components/ui/badge';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
 
 // Achievement categories with colors
 const ACHIEVEMENT_CATEGORIES = {
   beginner: {
     labelEs: 'Principiante',
     labelEn: 'Beginner',
     color: 'from-emerald-400 to-teal-500',
     bgColor: 'bg-emerald-500/10',
     borderColor: 'border-emerald-500/30',
     keys: ['first_expense', 'first_income', 'first_savings_goal', 'first_investment', 'complete_profile', 'first_client', 'first_mileage', 'first_contract'],
   },
   streak: {
     labelEs: 'Racha',
     labelEn: 'Streak',
     color: 'from-orange-400 to-red-500',
     bgColor: 'bg-orange-500/10',
     borderColor: 'border-orange-500/30',
     keys: ['track_7_days', 'track_30_days', 'track_60_days', 'track_100_days', 'track_365_days'],
   },
   savings: {
     labelEs: 'Ahorro',
     labelEn: 'Savings',
     color: 'from-amber-400 to-yellow-500',
     bgColor: 'bg-amber-500/10',
     borderColor: 'border-amber-500/30',
     keys: ['save_1000', 'save_5000', 'save_10000', 'save_25000', 'save_50000'],
   },
   investment: {
     labelEs: 'Inversión',
     labelEn: 'Investment',
     color: 'from-violet-400 to-purple-500',
     bgColor: 'bg-violet-500/10',
     borderColor: 'border-violet-500/30',
     keys: ['invest_1000', 'invest_10000', 'invest_25000', 'invest_50000', 'invest_100000'],
   },
   activity: {
     labelEs: 'Actividad',
     labelEn: 'Activity',
     color: 'from-blue-400 to-cyan-500',
     bgColor: 'bg-blue-500/10',
     borderColor: 'border-blue-500/30',
     keys: ['expenses_10', 'expenses_50', 'expenses_100', 'expenses_500', 'income_entries_10', 'income_entries_50'],
   },
   education: {
     labelEs: 'Educación',
     labelEn: 'Education',
     color: 'from-rose-400 to-pink-500',
     bgColor: 'bg-rose-500/10',
     borderColor: 'border-rose-500/30',
     keys: ['first_book', 'bookworm_5', 'bookworm_10', 'bookworm_25', 'first_practice', 'practitioner_10', 'practitioner_50', 'reading_streak_7', 'reading_streak_30', 'pages_100', 'pages_500', 'pages_1000', 'knowledge_master'],
   },
   special: {
     labelEs: 'Especial',
     labelEn: 'Special',
     color: 'from-fuchsia-400 via-purple-500 to-indigo-500',
     bgColor: 'bg-fuchsia-500/10',
     borderColor: 'border-fuchsia-500/30',
     keys: ['mission_starter', 'mission_master', 'mission_legend', 'daily_perfect', 'weekly_perfect', 'first_passive_income', 'diversified_investor', 'tax_master', 'early_bird', 'night_owl', 'weekend_warrior', 'consistent_saver', 'budget_guru'],
   },
 };
 
// Rarity tiers for achievements
const RARITY_TIERS = {
  common: { 
    labelEs: 'Común', labelEn: 'Common', 
    color: 'bg-slate-500', textColor: 'text-slate-400',
    glow: '' 
  },
  rare: { 
    labelEs: 'Raro', labelEn: 'Rare', 
    color: 'bg-blue-500', textColor: 'text-blue-400',
    glow: 'shadow-blue-500/30' 
  },
  epic: { 
    labelEs: 'Épico', labelEn: 'Epic', 
    color: 'bg-purple-500', textColor: 'text-purple-400',
    glow: 'shadow-purple-500/50' 
  },
  legendary: { 
    labelEs: 'Legendario', labelEn: 'Legendary', 
    color: 'bg-gradient-to-r from-amber-400 to-orange-500', textColor: 'text-amber-400',
    glow: 'shadow-amber-500/60' 
  },
};

// Get rarity based on points
const getRarity = (points: number) => {
  if (points >= 100) return 'legendary';
  if (points >= 50) return 'epic';
  if (points >= 25) return 'rare';
  return 'common';
};

 // Achievement descriptions in both languages
 const ACHIEVEMENT_NAMES: Record<string, { es: string; en: string; desc_es: string; desc_en: string }> = {
   first_expense: { es: 'Primer Gasto', en: 'First Expense', desc_es: 'Registraste tu primer gasto', desc_en: 'You logged your first expense' },
   first_income: { es: 'Primer Ingreso', en: 'First Income', desc_es: 'Registraste tu primer ingreso', desc_en: 'You logged your first income' },
   first_savings_goal: { es: 'Meta de Ahorro', en: 'Savings Goal', desc_es: 'Creaste tu primera meta de ahorro', desc_en: 'You created your first savings goal' },
   first_investment: { es: 'Inversor Inicial', en: 'Initial Investor', desc_es: 'Registraste tu primera inversión', desc_en: 'You logged your first investment' },
   complete_profile: { es: 'Perfil Completo', en: 'Profile Complete', desc_es: 'Completaste tu perfil', desc_en: 'You completed your profile' },
   first_client: { es: 'Primer Cliente', en: 'First Client', desc_es: 'Agregaste tu primer cliente', desc_en: 'You added your first client' },
   first_mileage: { es: 'Primer Viaje', en: 'First Trip', desc_es: 'Registraste tu primer kilometraje', desc_en: 'You logged your first mileage' },
   first_contract: { es: 'Primer Contrato', en: 'First Contract', desc_es: 'Subiste tu primer contrato', desc_en: 'You uploaded your first contract' },
   track_7_days: { es: '7 Días Seguidos', en: '7 Day Streak', desc_es: '¡Una semana de consistencia!', desc_en: 'A week of consistency!' },
   track_30_days: { es: '30 Días Seguidos', en: '30 Day Streak', desc_es: '¡Un mes de disciplina!', desc_en: 'A month of discipline!' },
   track_60_days: { es: '60 Días Seguidos', en: '60 Day Streak', desc_es: '¡Dos meses imparables!', desc_en: 'Two unstoppable months!' },
   track_100_days: { es: '100 Días Seguidos', en: '100 Day Streak', desc_es: '¡100 días de hábitos!', desc_en: '100 days of habits!' },
   track_365_days: { es: 'Un Año Completo', en: 'Full Year', desc_es: '¡365 días de maestría!', desc_en: '365 days of mastery!' },
   save_1000: { es: 'Ahorrador Novato', en: 'Novice Saver', desc_es: 'Ahorraste $1,000', desc_en: 'You saved $1,000' },
   save_5000: { es: 'Ahorrador Intermedio', en: 'Intermediate Saver', desc_es: 'Ahorraste $5,000', desc_en: 'You saved $5,000' },
   save_10000: { es: 'Ahorrador Experto', en: 'Expert Saver', desc_es: 'Ahorraste $10,000', desc_en: 'You saved $10,000' },
   save_25000: { es: 'Ahorrador Maestro', en: 'Master Saver', desc_es: 'Ahorraste $25,000', desc_en: 'You saved $25,000' },
   save_50000: { es: 'Leyenda del Ahorro', en: 'Savings Legend', desc_es: 'Ahorraste $50,000', desc_en: 'You saved $50,000' },
   invest_1000: { es: 'Inversor Inicial', en: 'Initial Investor', desc_es: 'Invertiste $1,000', desc_en: 'You invested $1,000' },
   invest_10000: { es: 'Inversor Serio', en: 'Serious Investor', desc_es: 'Invertiste $10,000', desc_en: 'You invested $10,000' },
   invest_25000: { es: 'Inversor Avanzado', en: 'Advanced Investor', desc_es: 'Invertiste $25,000', desc_en: 'You invested $25,000' },
   invest_50000: { es: 'Inversor Élite', en: 'Elite Investor', desc_es: 'Invertiste $50,000', desc_en: 'You invested $50,000' },
   invest_100000: { es: 'Magnate Financiero', en: 'Financial Magnate', desc_es: 'Invertiste $100,000', desc_en: 'You invested $100,000' },
   expenses_10: { es: '10 Gastos', en: '10 Expenses', desc_es: 'Registraste 10 gastos', desc_en: 'You logged 10 expenses' },
   expenses_50: { es: '50 Gastos', en: '50 Expenses', desc_es: 'Registraste 50 gastos', desc_en: 'You logged 50 expenses' },
   expenses_100: { es: '100 Gastos', en: '100 Expenses', desc_es: 'Registraste 100 gastos', desc_en: 'You logged 100 expenses' },
   expenses_500: { es: '500 Gastos', en: '500 Expenses', desc_es: 'Registraste 500 gastos', desc_en: 'You logged 500 expenses' },
   income_entries_10: { es: '10 Ingresos', en: '10 Incomes', desc_es: 'Registraste 10 ingresos', desc_en: 'You logged 10 incomes' },
   income_entries_50: { es: '50 Ingresos', en: '50 Incomes', desc_es: 'Registraste 50 ingresos', desc_en: 'You logged 50 incomes' },
   mission_starter: { es: 'Iniciador de Misiones', en: 'Mission Starter', desc_es: 'Completaste tu primera misión', desc_en: 'You completed your first mission' },
   mission_master: { es: 'Maestro de Misiones', en: 'Mission Master', desc_es: 'Completaste 10 misiones', desc_en: 'You completed 10 missions' },
   mission_legend: { es: 'Leyenda de Misiones', en: 'Mission Legend', desc_es: 'Completaste 50 misiones', desc_en: 'You completed 50 missions' },
   daily_perfect: { es: 'Día Perfecto', en: 'Perfect Day', desc_es: 'Completaste todas las tareas del día', desc_en: 'You completed all daily tasks' },
   weekly_perfect: { es: 'Semana Perfecta', en: 'Perfect Week', desc_es: 'Una semana perfecta de registros', desc_en: 'A perfect week of tracking' },
   first_passive_income: { es: 'Ingreso Pasivo', en: 'Passive Income', desc_es: 'Tu primer ingreso pasivo', desc_en: 'Your first passive income' },
   diversified_investor: { es: 'Inversor Diversificado', en: 'Diversified Investor', desc_es: 'Inversiones en 3+ categorías', desc_en: 'Investments in 3+ categories' },
   tax_master: { es: 'Maestro Fiscal', en: 'Tax Master', desc_es: 'Optimizaste tus impuestos', desc_en: 'You optimized your taxes' },
   early_bird: { es: 'Madrugador', en: 'Early Bird', desc_es: 'Registros antes de las 7am', desc_en: 'Tracking before 7am' },
   night_owl: { es: 'Noctámbulo', en: 'Night Owl', desc_es: 'Registros después de las 11pm', desc_en: 'Tracking after 11pm' },
   weekend_warrior: { es: 'Guerrero de Fin de Semana', en: 'Weekend Warrior', desc_es: 'Activo los fines de semana', desc_en: 'Active on weekends' },
   consistent_saver: { es: 'Ahorrador Consistente', en: 'Consistent Saver', desc_es: 'Ahorraste cada mes', desc_en: 'You saved every month' },
   budget_guru: { es: 'Gurú del Presupuesto', en: 'Budget Guru', desc_es: 'Mantuviste tu presupuesto', desc_en: 'You kept your budget' },
   first_book: { es: 'Primer Libro', en: 'First Book', desc_es: 'Agregaste tu primer libro', desc_en: 'You added your first book' },
   bookworm_5: { es: 'Lector Activo', en: 'Active Reader', desc_es: 'Leíste 5 libros', desc_en: 'You read 5 books' },
   bookworm_10: { es: 'Bibliotecario', en: 'Librarian', desc_es: 'Leíste 10 libros', desc_en: 'You read 10 books' },
   bookworm_25: { es: 'Erudito', en: 'Scholar', desc_es: 'Leíste 25 libros', desc_en: 'You read 25 books' },
   first_practice: { es: 'Primera Práctica', en: 'First Practice', desc_es: 'Aplicaste tu primer aprendizaje', desc_en: 'You applied your first learning' },
   practitioner_10: { es: 'Practicante Activo', en: 'Active Practitioner', desc_es: '10 prácticas registradas', desc_en: '10 practices logged' },
   practitioner_50: { es: 'Maestro Práctico', en: 'Practical Master', desc_es: '50 prácticas registradas', desc_en: '50 practices logged' },
   reading_streak_7: { es: 'Racha de Lectura', en: 'Reading Streak', desc_es: '7 días leyendo', desc_en: '7 days reading' },
   reading_streak_30: { es: 'Hábito de Lectura', en: 'Reading Habit', desc_es: '30 días leyendo', desc_en: '30 days reading' },
   pages_100: { es: '100 Páginas', en: '100 Pages', desc_es: 'Leíste 100 páginas', desc_en: 'You read 100 pages' },
   pages_500: { es: '500 Páginas', en: '500 Pages', desc_es: 'Leíste 500 páginas', desc_en: 'You read 500 pages' },
   pages_1000: { es: '1000 Páginas', en: '1000 Pages', desc_es: 'Leíste 1000 páginas', desc_en: 'You read 1000 pages' },
   knowledge_master: { es: 'Maestro del Conocimiento', en: 'Knowledge Master', desc_es: 'Dominaste la educación financiera', desc_en: 'You mastered financial education' },
 };
 
 interface AchievementShowcaseProps {
   className?: string;
   showAll?: boolean; // Show all achievements including locked ones
   compact?: boolean; // Compact view for smaller displays
 }
 
 export function AchievementShowcase({ className, showAll = true, compact = false }: AchievementShowcaseProps) {
   const { language } = useLanguage();
   const { data: userAchievements, isLoading } = useUserAchievements();
   
   const unlockedKeys = new Set(userAchievements?.map(a => a.achievement_key) || []);
   const totalUnlocked = unlockedKeys.size;
   const totalAchievements = Object.keys(ACHIEVEMENTS).length;
   
   const t = {
     es: {
       title: '🏆 Tus Logros',
       subtitle: 'Colecciona todos los logros y conviértete en leyenda',
       unlocked: 'Desbloqueados',
       locked: 'Bloqueado',
       points: 'pts',
       progress: 'Progreso',
       keepGoing: '¡Sigue así para desbloquear más!',
     },
     en: {
       title: '🏆 Your Achievements',
       subtitle: 'Collect all achievements and become a legend',
       unlocked: 'Unlocked',
       locked: 'Locked',
       points: 'pts',
       progress: 'Progress',
       keepGoing: 'Keep going to unlock more!',
     },
   };
   
   const text = t[language];
   
   if (isLoading) {
     return (
       <div className={cn('animate-pulse rounded-2xl bg-muted h-64', className)} />
     );
   }
  
  const progressPercent = (totalUnlocked / totalAchievements) * 100;
 
   return (
     <div className={cn('space-y-6', className)}>
       {/* Header with progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
             <Trophy className="h-6 w-6 text-amber-500" />
             {text.title}
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              🎮
            </motion.span>
           </h2>
           <p className="text-sm text-muted-foreground">{text.subtitle}</p>
         </div>
         
        <div className="flex flex-col items-end gap-2">
          <motion.div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold shadow-lg shadow-orange-500/30"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="h-5 w-5" />
            </motion.div>
            <span className="text-lg">{totalUnlocked}/{totalAchievements}</span>
            <span className="text-xs opacity-80">{text.unlocked}</span>
          </motion.div>
          
          {/* Progress bar */}
          <div className="w-48 flex items-center gap-2">
            <Progress value={progressPercent} className="h-2" />
            <span className="text-xs font-bold text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
        </div>
       </div>
      
      {/* Rarity legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-muted">
        <span className="text-xs font-medium text-muted-foreground mr-2">
          {language === 'es' ? 'Rareza:' : 'Rarity:'}
        </span>
        {Object.entries(RARITY_TIERS).map(([key, tier]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-full', tier.color)} />
            <span className={cn('text-xs font-medium', tier.textColor)}>
              {language === 'es' ? tier.labelEs : tier.labelEn}
            </span>
          </div>
        ))}
      </div>
 
       {/* Achievement categories */}
       <div className="space-y-4">
         {Object.entries(ACHIEVEMENT_CATEGORIES).map(([categoryKey, category]) => {
           const categoryAchievements = category.keys.filter(key => ACHIEVEMENTS[key as keyof typeof ACHIEVEMENTS]);
           const unlockedInCategory = categoryAchievements.filter(key => unlockedKeys.has(key)).length;
           
           if (!showAll && unlockedInCategory === 0) return null;
           
           return (
             <motion.div
               key={categoryKey}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className={cn(
                  'p-4 rounded-2xl border-2 transition-all hover:shadow-lg',
                 category.bgColor,
                 category.borderColor
               )}
             >
               {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn('text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent flex items-center gap-2', category.color)}>
                    {categoryKey === 'beginner' && '🌱'}
                    {categoryKey === 'streak' && '🔥'}
                    {categoryKey === 'savings' && '💰'}
                    {categoryKey === 'investment' && '📈'}
                    {categoryKey === 'activity' && '⚡'}
                    {categoryKey === 'education' && '📚'}
                    {categoryKey === 'special' && '✨'}
                   {language === 'es' ? category.labelEs : category.labelEn}
                 </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/50">
                      <motion.div
                        animate={unlockedInCategory === categoryAchievements.length ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {unlockedInCategory === categoryAchievements.length ? (
                          <Medal className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Target className="h-4 w-4 text-muted-foreground" />
                        )}
                      </motion.div>
                      <span className="text-sm font-bold">
                        {unlockedInCategory}/{categoryAchievements.length}
                      </span>
                    </div>
                    {unlockedInCategory === categoryAchievements.length && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        {language === 'es' ? '¡Completo!' : 'Complete!'}
                      </Badge>
                    )}
                  </div>
               </div>
               
               {/* Achievement grid */}
               <div className={cn(
                 'grid gap-2',
                 compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
               )}>
                 <TooltipProvider>
                   {categoryAchievements.map((key, index) => {
                     const achievement = ACHIEVEMENTS[key as keyof typeof ACHIEVEMENTS];
                     const isUnlocked = unlockedKeys.has(key);
                     const info = ACHIEVEMENT_NAMES[key] || { es: key, en: key, desc_es: '', desc_en: '' };
                      const rarity = getRarity(achievement?.points || 0);
                      const rarityTier = RARITY_TIERS[rarity];
                     
                     if (!showAll && !isUnlocked) return null;
                     
                     return (
                       <Tooltip key={key}>
                         <TooltipTrigger asChild>
                           <motion.div
                             initial={{ opacity: 0, scale: 0.5 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: index * 0.02 }}
                             whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                             className={cn(
                                'relative aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all group',
                               isUnlocked
                                  ? cn('bg-gradient-to-br shadow-lg', category.color, rarityTier.glow)
                                  : 'bg-muted/50 border border-muted hover:border-primary/30'
                             )}
                           >
                             {isUnlocked ? (
                               <>
                                 <span className={cn('text-2xl', compact && 'text-xl')}>
                                   {achievement?.icon}
                                 </span>
                                 {/* Sparkle effect */}
                                 <motion.div
                                   className="absolute inset-0 rounded-xl"
                                   animate={{
                                      boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 25px rgba(255,255,255,0.6)', '0 0 0px rgba(255,255,255,0)']
                                   }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
                                 />
                                  {/* Rarity indicator */}
                                  <div className={cn('absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full', rarityTier.color)} />
                               </>
                             ) : (
                                <motion.div
                                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <Lock className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                                </motion.div>
                             )}
                             
                             {/* Points badge */}
                             {isUnlocked && (
                                <motion.span 
                                  className="absolute -bottom-1 -right-1 text-[10px] bg-background rounded-full px-1.5 py-0.5 font-bold shadow border"
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.05 }}
                                >
                                 +{achievement?.points}
                                </motion.span>
                             )}
                           </motion.div>
                         </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3">
                            <div className="text-center space-y-2">
                              <div className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white', rarityTier.color)}>
                                {language === 'es' ? rarityTier.labelEs : rarityTier.labelEn}
                              </div>
                              <p className="font-bold flex items-center justify-center gap-1 text-base">
                               {achievement?.icon} {language === 'es' ? info.es : info.en}
                             </p>
                              <p className="text-sm text-muted-foreground">
                               {language === 'es' ? info.desc_es : info.desc_en}
                             </p>
                             <Badge variant="secondary" className="mt-1">
                               <Star className="h-3 w-3 mr-1" />
                               {achievement?.points} {text.points}
                             </Badge>
                             {!isUnlocked && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                                 <Lock className="h-3 w-3" />
                                 {text.locked}
                               </p>
                             )}
                           </div>
                         </TooltipContent>
                       </Tooltip>
                     );
                   })}
                 </TooltipProvider>
               </div>
             </motion.div>
           );
         })}
       </div>
 
       {/* Motivational footer */}
       {totalUnlocked < totalAchievements && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
            className="text-center p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-amber-500/10 border-2 border-primary/20 shadow-lg"
         >
            <motion.p 
              className="text-base font-semibold flex items-center justify-center gap-3"
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.span>
             {text.keepGoing}
              <motion.span
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Gift className="h-5 w-5 text-accent" />
              </motion.span>
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'es' 
                ? `¡Solo te faltan ${totalAchievements - totalUnlocked} logros para completar tu colección!` 
                : `Only ${totalAchievements - totalUnlocked} achievements left to complete your collection!`}
            </p>
         </motion.div>
       )}
        
        {/* All complete celebration */}
        {totalUnlocked === totalAchievements && totalAchievements > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-500/40 shadow-xl"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-3"
            >
              🏆👑🏆
            </motion.div>
            <h3 className="text-xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              {language === 'es' ? '¡LEYENDA COMPLETADA!' : 'LEGEND COMPLETE!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'es' 
                ? '¡Has desbloqueado todos los logros! Eres un verdadero maestro financiero.' 
                : 'You unlocked all achievements! You are a true financial master.'}
            </p>
          </motion.div>
        )}
     </div>
   );
 }