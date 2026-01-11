import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';
import { 
  Atom, 
  Eye, 
  Sparkles, 
  Zap, 
  Gift, 
  TrendingUp, 
  CheckCircle2,
  Target,
  Calendar,
  Bell,
  Smartphone,
  DollarSign,
  PiggyBank,
  Receipt,
  Calculator,
  BookOpen,
  Flame,
  Star,
  Trophy,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface AtomicHabitTip {
  id: string;
  law: 'obvious' | 'attractive' | 'easy' | 'satisfying';
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  appActionEs: string;
  appActionEn: string;
  icon: React.ReactNode;
  implemented: boolean;
}

const ATOMIC_HABITS_TIPS: AtomicHabitTip[] = [
  // LAW 1: MAKE IT OBVIOUS
  {
    id: 'obvious-1',
    law: 'obvious',
    titleEs: 'Señales visuales para gastos',
    titleEn: 'Visual cues for expenses',
    descriptionEs: 'Coloca la app en la pantalla principal de tu teléfono. Cada vez que lo desbloquees, verás el recordatorio de registrar gastos.',
    descriptionEn: 'Place the app on your phone\'s home screen. Every time you unlock it, you\'ll see the reminder to log expenses.',
    appActionEs: '📱 Instala la PWA y ponla junto a tus apps bancarias',
    appActionEn: '📱 Install the PWA and place it next to your banking apps',
    icon: <Smartphone className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'obvious-2',
    law: 'obvious',
    titleEs: 'Apilamiento de hábitos',
    titleEn: 'Habit stacking',
    descriptionEs: 'Después de [HÁBITO ACTUAL], haré [NUEVO HÁBITO]. Ejemplo: "Después de tomar mi café, revisaré mis gastos del día anterior".',
    descriptionEn: 'After [CURRENT HABIT], I will [NEW HABIT]. Example: "After drinking my coffee, I\'ll review yesterday\'s expenses."',
    appActionEs: '☕ Configura un recordatorio matutino en la app',
    appActionEn: '☕ Set up a morning reminder in the app',
    icon: <Calendar className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'obvious-3',
    law: 'obvious',
    titleEs: 'Tarjeta de registro inmediato',
    titleEn: 'Immediate logging scorecard',
    descriptionEs: 'Cada vez que pagues algo, di en voz alta "gasto registrado" y abre la app. Hazlo tan automático como guardar el cambio.',
    descriptionEn: 'Every time you pay for something, say out loud "expense logged" and open the app. Make it as automatic as keeping your change.',
    appActionEs: '🎤 Usa captura por voz: "gasto de 50 en restaurante"',
    appActionEn: '🎤 Use voice capture: "expense of 50 at restaurant"',
    icon: <Receipt className="h-5 w-5" />,
    implemented: true,
  },
  
  // LAW 2: MAKE IT ATTRACTIVE
  {
    id: 'attractive-1',
    law: 'attractive',
    titleEs: 'Tentación agrupada',
    titleEn: 'Temptation bundling',
    descriptionEs: 'Combina algo que necesitas hacer (registrar gastos) con algo que quieres hacer (escuchar música/podcast).',
    descriptionEn: 'Combine something you need to do (log expenses) with something you want to do (listen to music/podcast).',
    appActionEs: '🎧 Revisa gastos mientras escuchas tu podcast favorito',
    appActionEn: '🎧 Review expenses while listening to your favorite podcast',
    icon: <Sparkles className="h-5 w-5" />,
    implemented: false,
  },
  {
    id: 'attractive-2',
    law: 'attractive',
    titleEs: 'Gamificación y logros',
    titleEn: 'Gamification and achievements',
    descriptionEs: 'Los puntos XP, rachas y badges hacen que el seguimiento financiero sea un juego. Tu cerebro libera dopamina con cada logro.',
    descriptionEn: 'XP points, streaks, and badges turn financial tracking into a game. Your brain releases dopamine with each achievement.',
    appActionEs: '🏆 Desbloquea badges completando misiones financieras',
    appActionEn: '🏆 Unlock badges by completing financial missions',
    icon: <Gift className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'attractive-3',
    law: 'attractive',
    titleEs: 'Visualiza tu progreso',
    titleEn: 'Visualize your progress',
    descriptionEs: 'Ver gráficos de tu patrimonio creciendo es más motivador que números en una hoja. La app te muestra tu evolución.',
    descriptionEn: 'Seeing charts of your wealth growing is more motivating than numbers on a spreadsheet. The app shows your evolution.',
    appActionEs: '📈 Revisa tu gráfico de patrimonio neto cada semana',
    appActionEn: '📈 Check your net worth chart every week',
    icon: <TrendingUp className="h-5 w-5" />,
    implemented: true,
  },
  
  // LAW 3: MAKE IT EASY
  {
    id: 'easy-1',
    law: 'easy',
    titleEs: 'La regla de los 2 minutos',
    titleEn: 'The 2-minute rule',
    descriptionEs: 'Un nuevo hábito debe tomar menos de 2 minutos. "Registrar mis finanzas" → "Abrir la app y registrar UN gasto".',
    descriptionEn: 'A new habit must take less than 2 minutes. "Track my finances" → "Open the app and log ONE expense".',
    appActionEs: '⚡ Captura rápida: foto del recibo en 10 segundos',
    appActionEn: '⚡ Quick capture: receipt photo in 10 seconds',
    icon: <Zap className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'easy-2',
    law: 'easy',
    titleEs: 'Reduce la fricción',
    titleEn: 'Reduce friction',
    descriptionEs: 'Entre menos pasos, más probable que lo hagas. La captura por voz elimina escribir. La foto elimina ingresar datos.',
    descriptionEn: 'The fewer steps, the more likely you\'ll do it. Voice capture eliminates typing. Photos eliminate data entry.',
    appActionEs: '📷 Foto del recibo → datos auto-extraídos',
    appActionEn: '📷 Receipt photo → auto-extracted data',
    icon: <Receipt className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'easy-3',
    law: 'easy',
    titleEs: 'Preparación del ambiente',
    titleEn: 'Environment design',
    descriptionEs: 'Prepara todo la noche anterior. Deja la app abierta en tu navegador. Configura widgets en tu teléfono.',
    descriptionEn: 'Prepare everything the night before. Leave the app open in your browser. Set up widgets on your phone.',
    appActionEs: '🌙 Configura un recordatorio nocturno para revisar el día',
    appActionEn: '🌙 Set up a nightly reminder to review the day',
    icon: <Bell className="h-5 w-5" />,
    implemented: true,
  },
  
  // LAW 4: MAKE IT SATISFYING
  {
    id: 'satisfying-1',
    law: 'satisfying',
    titleEs: 'Recompensa inmediata',
    titleEn: 'Immediate reward',
    descriptionEs: 'Después de registrar gastos por una semana, date un pequeño premio. La app te muestra cuánto ahorraste para motivarte.',
    descriptionEn: 'After logging expenses for a week, give yourself a small reward. The app shows you how much you saved to motivate you.',
    appActionEs: '🎉 Celebración automática cuando completas hábitos',
    appActionEn: '🎉 Automatic celebration when you complete habits',
    icon: <Gift className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'satisfying-2',
    law: 'satisfying',
    titleEs: 'Nunca rompas la cadena',
    titleEn: 'Never break the chain',
    descriptionEs: 'Mantener una racha de días consecutivos es poderoso. Tu racha es visible y perderla duele más que ganarla.',
    descriptionEn: 'Maintaining a streak of consecutive days is powerful. Your streak is visible and losing it hurts more than gaining it.',
    appActionEs: '🔥 Racha de días registrando gastos',
    appActionEn: '🔥 Streak of days logging expenses',
    icon: <Target className="h-5 w-5" />,
    implemented: true,
  },
  {
    id: 'satisfying-3',
    law: 'satisfying',
    titleEs: 'Tracking visual',
    titleEn: 'Visual tracking',
    descriptionEs: 'Marcar algo como "hecho" activa centros de placer en tu cerebro. Ver progreso te motiva a continuar.',
    descriptionEn: 'Marking something as "done" activates pleasure centers in your brain. Seeing progress motivates you to continue.',
    appActionEs: '✅ Marca hábitos completados y gana XP',
    appActionEn: '✅ Mark habits completed and earn XP',
    icon: <CheckCircle2 className="h-5 w-5" />,
    implemented: true,
  },
];

const LAW_INFO = {
  obvious: {
    number: 1,
    nameEs: 'Hazlo Obvio',
    nameEn: 'Make It Obvious',
    colorClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    borderClass: 'border-blue-500/40',
    bgClass: 'bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-blue-500/5',
    glowClass: 'shadow-blue-500/20',
    icon: <Eye className="h-5 w-5 text-blue-500" />,
    emoji: '👁️',
    principleEs: 'Diseña tu ambiente para que las señales de buenos hábitos sean visibles.',
    principleEn: 'Design your environment so that cues for good habits are visible.',
  },
  attractive: {
    number: 2,
    nameEs: 'Hazlo Atractivo',
    nameEn: 'Make It Attractive',
    colorClass: 'bg-gradient-to-r from-pink-500 to-rose-500',
    borderClass: 'border-pink-500/40',
    bgClass: 'bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-pink-500/5',
    glowClass: 'shadow-pink-500/20',
    icon: <Sparkles className="h-5 w-5 text-pink-500" />,
    emoji: '✨',
    principleEs: 'Asocia hábitos con emociones positivas y recompensas anticipadas.',
    principleEn: 'Associate habits with positive emotions and anticipated rewards.',
  },
  easy: {
    number: 3,
    nameEs: 'Hazlo Fácil',
    nameEn: 'Make It Easy',
    colorClass: 'bg-gradient-to-r from-green-500 to-emerald-500',
    borderClass: 'border-green-500/40',
    bgClass: 'bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-green-500/5',
    glowClass: 'shadow-green-500/20',
    icon: <Zap className="h-5 w-5 text-green-500" />,
    emoji: '⚡',
    principleEs: 'Reduce la fricción. El mejor hábito es el que requiere menos esfuerzo iniciar.',
    principleEn: 'Reduce friction. The best habit is the one that requires the least effort to start.',
  },
  satisfying: {
    number: 4,
    nameEs: 'Hazlo Satisfactorio',
    nameEn: 'Make It Satisfying',
    colorClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5',
    glowClass: 'shadow-amber-500/20',
    icon: <Gift className="h-5 w-5 text-amber-500" />,
    emoji: '🎁',
    principleEs: 'Lo que se recompensa se repite. Lo que se castiga se evita.',
    principleEn: 'What is rewarded is repeated. What is punished is avoided.',
  },
};

export function AtomicHabitsCard() {
  const { language } = useLanguage();
  const { playCelebrationSound } = useCelebrationSound();
  const [selectedLaw, setSelectedLaw] = useState<'all' | 'obvious' | 'attractive' | 'easy' | 'satisfying'>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [pulseProgress, setPulseProgress] = useState(false);
  
  const filteredTips = selectedLaw === 'all' 
    ? ATOMIC_HABITS_TIPS 
    : ATOMIC_HABITS_TIPS.filter(tip => tip.law === selectedLaw);

  const implementedCount = ATOMIC_HABITS_TIPS.filter(t => t.implemented).length;
  const totalCount = ATOMIC_HABITS_TIPS.length;
  const progressPercent = Math.round((implementedCount / totalCount) * 100);

  // Celebración inicial cuando el progreso es alto
  useEffect(() => {
    if (progressPercent >= 80) {
      setPulseProgress(true);
      const timer = setTimeout(() => setPulseProgress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [progressPercent]);

  const handleLawClick = (law: typeof selectedLaw) => {
    setSelectedLaw(selectedLaw === law ? 'all' : law);
    // Mini celebración al explorar una ley
    if (selectedLaw !== law) {
      playCelebrationSound();
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    playCelebrationSound();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b']
    });
    setTimeout(() => setShowCelebration(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/30 relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-amber-500/20 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-blue-500/10 relative">
        {/* Floating particles */}
        <motion.div
          animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-2 right-2 text-2xl"
        >
          ⚛️
        </motion.div>
        
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Atom className="h-6 w-6 text-cyan-500" />
            </motion.div>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-bold">
              {language === 'es' ? 'Hábitos Atómicos' : 'Atomic Habits'}
            </span>
          </CardTitle>
          <Badge 
            className="text-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
            title={language === 'es' ? 'Inspirado en "Hábitos Atómicos" de James Clear. No afiliado.' : 'Inspired by "Atomic Habits" by James Clear. Not affiliated.'}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            📖 Clear*
          </Badge>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mt-1 italic"
        >
          {language === 'es' 
            ? '"Pequeños cambios, resultados extraordinarios" ✨'
            : '"Tiny changes, remarkable results" ✨'}
        </motion.p>
        
        {/* Animated Progress Bar */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Rocket className="h-3 w-3 text-cyan-500" />
              {language === 'es' ? 'Estrategias en la app' : 'Strategies in the app'}
            </span>
            <motion.span 
              className={`font-bold ${progressPercent >= 80 ? 'text-green-500' : 'text-cyan-500'}`}
              animate={pulseProgress ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: pulseProgress ? 3 : 0 }}
            >
              {implementedCount}/{totalCount} 
              {progressPercent >= 80 && ' 🏆'}
            </motion.span>
          </div>
          <div className="relative">
            <Progress 
              value={progressPercent} 
              className={`h-3 ${pulseProgress ? 'animate-pulse' : ''}`}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ width: '30%' }}
            />
          </div>
          {progressPercent >= 80 && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-green-600 font-medium flex items-center gap-1"
            >
              <Trophy className="h-3 w-3" />
              {language === 'es' ? '¡Increíble! Dominas los hábitos atómicos' : 'Amazing! You master atomic habits'}
            </motion.p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 relative">
        {/* 4 Laws Overview - Enhanced */}
        <div className="grid grid-cols-4 gap-2">
          {(['obvious', 'attractive', 'easy', 'satisfying'] as const).map((law, index) => {
            const info = LAW_INFO[law];
            const lawTips = ATOMIC_HABITS_TIPS.filter(t => t.law === law);
            const lawImplemented = lawTips.filter(t => t.implemented).length;
            const isSelected = selectedLaw === law;
            
            return (
              <motion.button
                key={law}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLawClick(law)}
                className={`p-3 rounded-xl border-2 transition-all text-center relative overflow-hidden ${
                  isSelected 
                    ? `${info.bgClass} ${info.borderClass} shadow-lg ${info.glowClass}` 
                    : 'border-border/50 hover:border-primary/30 bg-background/50'
                }`}
              >
                {/* Glow effect when selected */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{ 
                      background: [
                        'radial-gradient(circle at 50% 50%, currentColor, transparent 70%)',
                        'radial-gradient(circle at 50% 50%, currentColor, transparent 50%)',
                        'radial-gradient(circle at 50% 50%, currentColor, transparent 70%)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                <motion.div 
                  className="flex justify-center mb-1 text-2xl"
                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {info.emoji}
                </motion.div>
                <p className="text-xs font-bold truncate">
                  {language === 'es' ? info.nameEs.split(' ')[1] : info.nameEn.split(' ')[2]}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="flex">
                    {[...Array(lawTips.length)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-1.5 h-1.5 rounded-full mr-0.5 ${
                          i < lawImplemented ? 'bg-green-500' : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Law Principle - Enhanced */}
        <AnimatePresence>
          {selectedLaw !== 'all' && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className={`p-4 rounded-xl ${LAW_INFO[selectedLaw].bgClass} ${LAW_INFO[selectedLaw].borderClass} border-2 relative overflow-hidden`}
            >
              {/* Decorative sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-2 right-2 opacity-30"
              >
                <Star className="h-6 w-6" />
              </motion.div>
              
              <div className="flex items-center gap-3 mb-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-2xl"
                >
                  {LAW_INFO[selectedLaw].emoji}
                </motion.span>
                <span className="font-bold text-base">
                  {language === 'es' ? `Ley ${LAW_INFO[selectedLaw].number}:` : `Law ${LAW_INFO[selectedLaw].number}:`}
                  {' '}
                  {language === 'es' ? LAW_INFO[selectedLaw].nameEs : LAW_INFO[selectedLaw].nameEn}
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "{language === 'es' ? LAW_INFO[selectedLaw].principleEs : LAW_INFO[selectedLaw].principleEn}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips Accordion - Enhanced */}
        <Accordion type="single" collapsible className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredTips.map((tip, index) => {
              const lawInfo = LAW_INFO[tip.law];
              
              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <AccordionItem 
                    value={tip.id} 
                    className={`border-2 rounded-xl overflow-hidden ${lawInfo.borderClass} bg-background/50 backdrop-blur-sm`}
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        <motion.div 
                          className={`p-2 rounded-lg ${lawInfo.bgClass} shadow-sm`}
                          whileHover={{ rotate: 5 }}
                        >
                          {tip.icon}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">
                            {language === 'es' ? tip.titleEs : tip.titleEn}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] h-5 ${lawInfo.borderClass}`}
                            >
                              {lawInfo.emoji} {language === 'es' ? lawInfo.nameEs : lawInfo.nameEn}
                            </Badge>
                            {tip.implemented && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <Badge className="text-[10px] h-5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 border-green-500/40 shadow-sm">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {language === 'es' ? 'Activo' : 'Active'}
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {language === 'es' ? tip.descriptionEs : tip.descriptionEn}
                        </p>
                        <motion.div 
                          className={`p-3 rounded-xl ${lawInfo.bgClass} border-2 ${lawInfo.borderClass} relative overflow-hidden`}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <p className="text-xs font-bold uppercase tracking-wide">
                              {language === 'es' ? 'Aplícalo en EvoFinz' : 'Apply it in EvoFinz'}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {language === 'es' ? tip.appActionEs : tip.appActionEn}
                          </p>
                        </motion.div>
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Accordion>

        {/* 1% Better Every Day - Enhanced */}
        <motion.div 
          className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-purple-500/10 to-amber-500/15 border-2 border-primary/20 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-amber-500/10"
            animate={{ 
              x: ['0%', '100%', '0%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <p className="font-bold text-base flex items-center gap-2">
                {language === 'es' ? '1% mejor cada día' : '1% better every day'}
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🚀
                </motion.span>
              </p>
              <p className="text-sm text-muted-foreground">
                = <span className="font-bold text-primary">37x</span> {language === 'es' ? 'mejor en un año' : 'better in a year'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                {language === 'es' 
                  ? '"Registrar UN gasto hoy es el 1% que te hará millonario mañana"'
                  : '"Logging ONE expense today is the 1% that will make you a millionaire tomorrow"'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Start Tips - Enhanced */}
        <div className="space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 20, -20, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              ⚡
            </motion.span>
            {language === 'es' ? 'Empieza AHORA (2 minutos):' : 'Start NOW (2 minutes):'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Receipt, labelEs: 'Registrar 1 gasto', labelEn: 'Log 1 expense', color: 'from-blue-500 to-cyan-500' },
              { icon: Calculator, labelEs: 'Ver mi balance', labelEn: 'View my balance', color: 'from-green-500 to-emerald-500' },
              { icon: PiggyBank, labelEs: 'Definir 1 meta', labelEn: 'Define 1 goal', color: 'from-amber-500 to-orange-500' },
              { icon: DollarSign, labelEs: 'Revisar patrimonio', labelEn: 'Review net worth', color: 'from-purple-500 to-pink-500' },
            ].map((action, index) => (
              <motion.div
                key={action.labelEn}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`w-full justify-start text-xs h-auto py-3 border-2 hover:border-primary/50 transition-all group`}
                  onClick={triggerCelebration}
                >
                  <div className={`p-1.5 rounded-md bg-gradient-to-r ${action.color} mr-2 group-hover:shadow-md transition-shadow`}>
                    <action.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-medium">
                    {language === 'es' ? action.labelEs : action.labelEn}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
