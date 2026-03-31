import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserLevel, useUserAchievements, ACHIEVEMENTS, LEVELS } from '@/hooks/data/useGamification';
import { XPProgressRing } from '@/components/gamification/XPProgressRing';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { AchievementShowcase } from '@/components/gamification/AchievementShowcase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Sparkles, Target, BookOpen, Flame, Star, Crown, Zap, 
  Rocket, Gift, Map, Compass, Mountain, Flag, Medal, Heart,
  CheckCircle2, Circle, ArrowRight, Play, Info, HelpCircle,
  Receipt, TrendingUp, Users, Car
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';

// Expert wisdom for the adventure
const EXPERT_WISDOM = {
  es: [
    { quote: 'No es cuánto dinero ganas, sino cuánto dinero conservas.', author: 'Sabiduría financiera', icon: '💎' },
    { quote: 'La libertad financiera es un estado mental antes que uno monetario.', author: 'Sabiduría financiera', icon: '🧠' },
    { quote: 'Los ricos adquieren activos. Los pobres adquieren pasivos que creen son activos.', author: 'Sabiduría financiera', icon: '📈' },
    { quote: 'Un presupuesto es decirle a tu dinero a dónde ir en lugar de preguntarte a dónde fue.', author: 'Sabiduría financiera', icon: '🎯' },
    { quote: 'La disciplina es el puente entre metas y logros.', author: 'Sabiduría financiera', icon: '🌉' },
    { quote: 'Tu nivel de éxito rara vez excederá tu nivel de desarrollo personal.', author: 'Sabiduría financiera', icon: '📚' },
  ],
  en: [
    { quote: "It's not how much money you make, but how much money you keep.", author: 'Financial wisdom', icon: '💎' },
    { quote: 'Financial freedom is a mental state before a monetary one.', author: 'Financial wisdom', icon: '🧠' },
    { quote: 'The rich acquire assets. The poor acquire liabilities that they think are assets.', author: 'Financial wisdom', icon: '📈' },
    { quote: "A budget is telling your money where to go instead of wondering where it went.", author: 'Financial wisdom', icon: '🎯' },
    { quote: 'Discipline is the bridge between goals and accomplishment.', author: 'Financial wisdom', icon: '🌉' },
    { quote: 'Your level of success will rarely exceed your level of personal development.', author: 'Financial wisdom', icon: '📚' },
  ],
};

// Tutorial steps
const TUTORIAL_STEPS = {
  es: [
    { title: '¿Qué es la Aventura Financiera?', content: 'Es tu viaje personal hacia la libertad financiera. Cada acción que tomas (registrar gastos, ahorrar, invertir) te da puntos de experiencia (XP) y desbloquea logros.', icon: '🗺️' },
    { title: '¿Cómo gano XP?', content: 'Ganas XP de muchas formas: registrando transacciones (+5 XP), manteniendo tu racha diaria (+10 XP), completando metas (+50-500 XP), y desbloqueando logros (+10-500 XP).', icon: '⚡' },
    { title: '¿Qué es la Racha?', content: 'Tu racha cuenta los días consecutivos que usas la app. ¡Mientras más larga tu racha, más recompensas! Alcanza hitos como 7 días, 30 días, 100 días...', icon: '🔥' },
    { title: '¿Cómo desbloqueo Logros?', content: 'Los logros se desbloquean automáticamente cuando cumples ciertos objetivos: tu primer gasto registrado, $1,000 ahorrados, 30 días de racha, etc.', icon: '🏆' },
    { title: '¿Para qué sirven los Niveles?', content: 'Los niveles reflejan tu progreso general. Cada nivel tiene un nombre único y representa tu maestría financiera creciente. ¡Llega al nivel 10 para ser un Cashflow Master!', icon: '👑' },
  ],
  en: [
    { title: 'What is the Financial Adventure?', content: "It's your personal journey to financial freedom. Every action you take (logging expenses, saving, investing) gives you experience points (XP) and unlocks achievements.", icon: '🗺️' },
    { title: 'How do I earn XP?', content: 'You earn XP in many ways: logging transactions (+5 XP), maintaining your daily streak (+10 XP), completing goals (+50-500 XP), and unlocking achievements (+10-500 XP).', icon: '⚡' },
    { title: 'What is the Streak?', content: "Your streak counts consecutive days you use the app. The longer your streak, the more rewards! Reach milestones like 7 days, 30 days, 100 days...", icon: '🔥' },
    { title: 'How do I unlock Achievements?', content: 'Achievements unlock automatically when you meet certain goals: your first logged expense, $1,000 saved, 30-day streak, etc.', icon: '🏆' },
    { title: 'What are Levels for?', content: 'Levels reflect your overall progress. Each level has a unique name and represents your growing financial mastery. Reach level 10 to become a Cashflow Master!', icon: '👑' },
  ],
};

// Level journey visualization
const LEVEL_JOURNEY = LEVELS.map((level, index) => ({
  ...level,
  milestone: index === 0 ? 'Start' : index === LEVELS.length - 1 ? 'Master' : `Level ${level.level}`,
}));

// Quick action cards for earning XP
const QUICK_XP_ACTIONS = {
  es: [
    { label: 'Registrar gasto', xp: '+5 XP', icon: Receipt, path: '/expenses', color: 'from-blue-500 to-cyan-500' },
    { label: 'Registrar ingreso', xp: '+5 XP', icon: TrendingUp, path: '/income', color: 'from-emerald-500 to-green-500' },
    { label: 'Agregar cliente', xp: '+15 XP', icon: Users, path: '/clients', color: 'from-violet-500 to-purple-500' },
    { label: 'Registrar kilometraje', xp: '+10 XP', icon: Car, path: '/mileage', color: 'from-amber-500 to-orange-500' },
  ],
  en: [
    { label: 'Log expense', xp: '+5 XP', icon: Receipt, path: '/expenses', color: 'from-blue-500 to-cyan-500' },
    { label: 'Log income', xp: '+5 XP', icon: TrendingUp, path: '/income', color: 'from-emerald-500 to-green-500' },
    { label: 'Add client', xp: '+15 XP', icon: Users, path: '/clients', color: 'from-violet-500 to-purple-500' },
    { label: 'Log mileage', xp: '+10 XP', icon: Car, path: '/mileage', color: 'from-amber-500 to-orange-500' },
  ],
};

export default function FinancialAdventure() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: userLevel, isLoading: levelLoading } = useUserLevel();
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTutorial, setShowTutorial] = useState(false);
  
  const level = userLevel?.level || 1;
  const experiencePoints = userLevel?.experience_points || 0;
  const streakDays = userLevel?.streak_days || 0;
  
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  const unlockedAchievements = achievements?.length || 0;
  const achievementProgress = (unlockedAchievements / totalAchievements) * 100;
  
  // Stable wisdom selection (changes hourly, not on every render)
  const wisdom = useMemo(() => {
    const index = Math.floor(Date.now() / 3600000) % EXPERT_WISDOM[language].length;
    return EXPERT_WISDOM[language][index];
  }, [language]);
  
  const isNewUser = experiencePoints === 0 && unlockedAchievements === 0;
  
  const t = {
    es: {
      pageTitle: 'Tu Aventura Financiera',
      pageSubtitle: 'Cada paso te acerca a la libertad financiera',
      overview: 'Resumen',
      achievements: 'Logros',
      journey: 'Tu Camino',
      howItWorks: 'Cómo Funciona',
      yourProgress: 'Tu Progreso',
      currentLevel: 'Nivel Actual',
      totalXP: 'XP Total',
      streak: 'Racha',
      achievementsUnlocked: 'Logros Desbloqueados',
      expertWisdom: 'Sabiduría del Experto',
      levelMap: 'Mapa de Niveles',
      currentPosition: 'Estás aquí',
      nextMilestone: 'Próximo hito',
      xpNeeded: 'XP necesarios',
      showTutorial: '¿Nuevo? Aprende cómo funciona',
      hideTutorial: 'Ocultar tutorial',
      faq: 'Preguntas Frecuentes',
      earnXP: '¡Gana XP Ahora!',
      earnXPDesc: 'Realiza estas acciones para ganar tus primeros puntos',
      welcomeTitle: '¡Bienvenido a tu Aventura!',
      welcomeDesc: 'Comienza registrando tu primer gasto o ingreso para ganar XP y desbloquear logros.',
    },
    en: {
      pageTitle: 'Your Financial Adventure',
      pageSubtitle: 'Every step brings you closer to financial freedom',
      overview: 'Overview',
      achievements: 'Achievements',
      journey: 'Your Path',
      howItWorks: 'How It Works',
      yourProgress: 'Your Progress',
      currentLevel: 'Current Level',
      totalXP: 'Total XP',
      streak: 'Streak',
      achievementsUnlocked: 'Achievements Unlocked',
      expertWisdom: 'Expert Wisdom',
      levelMap: 'Level Map',
      currentPosition: "You're here",
      nextMilestone: 'Next milestone',
      xpNeeded: 'XP needed',
      showTutorial: 'New? Learn how it works',
      hideTutorial: 'Hide tutorial',
      faq: 'FAQ',
      earnXP: 'Earn XP Now!',
      earnXPDesc: 'Take these actions to earn your first points',
      welcomeTitle: 'Welcome to your Adventure!',
      welcomeDesc: 'Start by logging your first expense or income to earn XP and unlock achievements.',
    },
  };
  
  const text = t[language];
  const tutorialSteps = TUTORIAL_STEPS[language];
  const quickActions = QUICK_XP_ACTIONS[language];

  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={text.pageTitle}
          description={text.pageSubtitle}
        />

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-amber-500/20 p-8 border-2 border-primary/30"
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{ left: `${10 + i * 10}%`, top: `${20 + (i % 3) * 30}%` }}
                animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.2 }}
              >
                {['✨', '🌟', '💎', '🚀', '🏆', '💰', '🎯', '🔥', '⭐', '👑'][i]}
              </motion.div>
            ))}
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* XP Ring */}
            <XPProgressRing size="lg" showDetails={true} />
            
            {/* Title & Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-accent to-amber-500 bg-clip-text text-transparent">
                {text.pageTitle}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">{text.pageSubtitle}</p>
              
              {/* Quick stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="font-bold">{experiencePoints.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">XP</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-bold">{streakDays}</span>
                  <span className="text-muted-foreground text-sm">{language === 'es' ? 'días' : 'days'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-bold">{unlockedAchievements}/{totalAchievements}</span>
                  <span className="text-muted-foreground text-sm">{language === 'es' ? 'logros' : 'achievements'}</span>
                </div>
              </div>
              
              {/* Tutorial toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setShowTutorial(!showTutorial)}
              >
                <HelpCircle className="h-4 w-4" />
                {showTutorial ? text.hideTutorial : text.showTutorial}
              </Button>
            </div>
          </div>
          
          {/* Expert wisdom banner */}
          <div className="mt-6 p-4 rounded-xl bg-background/80 backdrop-blur border">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{wisdom.icon}</span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{text.expertWisdom}</p>
                <p className="italic">"{wisdom.quote}"</p>
                <p className="text-sm text-primary font-medium mt-1">— {wisdom.author}</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Tutorial Section (Collapsible) */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-2 border-dashed border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {text.howItWorks}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutorialSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-muted/50 border"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{step.icon}</span>
                          <h4 className="font-semibold">{step.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.content}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW USER: Quick XP Actions (when user has 0 XP) */}
        {isNewUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  {text.earnXP}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{text.earnXPDesc}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(action.path)}
                      className={cn(
                        'p-4 rounded-xl bg-gradient-to-br text-white flex flex-col items-center gap-2 shadow-lg transition-shadow hover:shadow-xl',
                        action.color
                      )}
                    >
                      <action.icon className="h-6 w-6" />
                      <span className="text-sm font-bold">{action.label}</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{action.xp}</span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Streak Counter (Full Width) */}
        <StreakCounter size="lg" showMilestone={true} />
        
        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Compass className="h-4 w-4" />
              {text.overview}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              {text.achievements}
            </TabsTrigger>
            <TabsTrigger value="journey" className="gap-2">
              <Map className="h-4 w-4" />
              {text.journey}
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Achievement progress card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    {text.achievementsUnlocked}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-black text-amber-500">
                      {unlockedAchievements}
                      <span className="text-2xl text-muted-foreground">/{totalAchievements}</span>
                    </div>
                    <Progress value={achievementProgress} className="h-3" />
                    <p className="text-muted-foreground">
                      {Math.round(achievementProgress)}% {language === 'es' ? 'completado' : 'complete'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Level progress card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    {text.levelMap}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {LEVEL_JOURNEY.map((lvl) => {
                      const isCompleted = level > lvl.level;
                      const isCurrent = level === lvl.level;
                      
                      return (
                        <div
                          key={lvl.level}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-lg transition-colors',
                            isCurrent && 'bg-primary/10 border border-primary/30',
                            isCompleted && 'opacity-60'
                          )}
                        >
                          <span className="text-2xl">{lvl.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lvl.name}</span>
                              {isCurrent && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                  {text.currentPosition}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{lvl.minXP} XP</span>
                          </div>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : isCurrent ? (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Star className="h-5 w-5 text-amber-500" />
                            </motion.div>
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/30" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <AchievementShowcase />
          </TabsContent>
          
          {/* Journey Tab */}
          <TabsContent value="journey">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-5 w-5" />
                  {text.journey}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Visual journey map */}
                <div className="relative py-8">
                  {/* Path line */}
                  <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-amber-500 rounded-full" />
                  
                  {/* Level milestones */}
                  <div className="space-y-8">
                    {LEVEL_JOURNEY.map((lvl, index) => {
                      const isCompleted = level > lvl.level;
                      const isCurrent = level === lvl.level;
                      
                      return (
                        <motion.div
                          key={lvl.level}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex items-center gap-6 pl-4"
                        >
                          {/* Milestone marker */}
                          <motion.div
                            className={cn(
                              'relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg',
                              isCompleted ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-muted'
                            )}
                            animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            {lvl.icon}
                          </motion.div>
                          
                          {/* Level info */}
                          <div className={cn(
                            'flex-1 p-4 rounded-xl border transition-all',
                            isCurrent && 'bg-primary/5 border-primary shadow-lg',
                            isCompleted && 'opacity-60'
                          )}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-lg">{lvl.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {lvl.minXP.toLocaleString()} XP {language === 'es' ? 'requeridos' : 'required'}
                                </p>
                              </div>
                              {isCurrent && (
                                <div className="text-right">
                                  <span className="text-xs text-muted-foreground">{text.currentPosition}</span>
                                  <div className="font-bold text-primary">{experiencePoints.toLocaleString()} XP</div>
                                </div>
                              )}
                              {isCompleted && (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
