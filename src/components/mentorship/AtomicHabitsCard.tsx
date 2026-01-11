import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
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
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    colorClass: 'bg-blue-500',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-500/10',
    icon: <Eye className="h-5 w-5 text-blue-500" />,
    principleEs: 'Diseña tu ambiente para que las señales de buenos hábitos sean visibles.',
    principleEn: 'Design your environment so that cues for good habits are visible.',
  },
  attractive: {
    number: 2,
    nameEs: 'Hazlo Atractivo',
    nameEn: 'Make It Attractive',
    colorClass: 'bg-pink-500',
    borderClass: 'border-pink-500/30',
    bgClass: 'bg-pink-500/10',
    icon: <Sparkles className="h-5 w-5 text-pink-500" />,
    principleEs: 'Asocia hábitos con emociones positivas y recompensas anticipadas.',
    principleEn: 'Associate habits with positive emotions and anticipated rewards.',
  },
  easy: {
    number: 3,
    nameEs: 'Hazlo Fácil',
    nameEn: 'Make It Easy',
    colorClass: 'bg-green-500',
    borderClass: 'border-green-500/30',
    bgClass: 'bg-green-500/10',
    icon: <Zap className="h-5 w-5 text-green-500" />,
    principleEs: 'Reduce la fricción. El mejor hábito es el que requiere menos esfuerzo iniciar.',
    principleEn: 'Reduce friction. The best habit is the one that requires the least effort to start.',
  },
  satisfying: {
    number: 4,
    nameEs: 'Hazlo Satisfactorio',
    nameEn: 'Make It Satisfying',
    colorClass: 'bg-amber-500',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10',
    icon: <Gift className="h-5 w-5 text-amber-500" />,
    principleEs: 'Lo que se recompensa se repite. Lo que se castiga se evita.',
    principleEn: 'What is rewarded is repeated. What is punished is avoided.',
  },
};

export function AtomicHabitsCard() {
  const { language } = useLanguage();
  const [selectedLaw, setSelectedLaw] = useState<'all' | 'obvious' | 'attractive' | 'easy' | 'satisfying'>('all');
  
  const filteredTips = selectedLaw === 'all' 
    ? ATOMIC_HABITS_TIPS 
    : ATOMIC_HABITS_TIPS.filter(tip => tip.law === selectedLaw);

  const implementedCount = ATOMIC_HABITS_TIPS.filter(t => t.implemented).length;
  const totalCount = ATOMIC_HABITS_TIPS.length;
  const progressPercent = Math.round((implementedCount / totalCount) * 100);

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Atom className="h-6 w-6 text-primary animate-pulse" />
            {language === 'es' ? 'Hábitos Atómicos' : 'Atomic Habits'}
          </CardTitle>
          <Badge variant="secondary" className="text-xs bg-primary/10">
            James Clear 📖
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'es' 
            ? '"Pequeños cambios, resultados extraordinarios" - Aplicado a tus finanzas'
            : '"Tiny changes, remarkable results" - Applied to your finances'}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {language === 'es' ? 'Estrategias implementadas en la app' : 'Strategies implemented in the app'}
            </span>
            <span className="font-medium text-primary">{implementedCount}/{totalCount}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* 4 Laws Overview */}
        <div className="grid grid-cols-4 gap-2">
          {(['obvious', 'attractive', 'easy', 'satisfying'] as const).map((law) => {
            const info = LAW_INFO[law];
            const lawTips = ATOMIC_HABITS_TIPS.filter(t => t.law === law);
            const lawImplemented = lawTips.filter(t => t.implemented).length;
            
            return (
              <button
                key={law}
                onClick={() => setSelectedLaw(selectedLaw === law ? 'all' : law)}
                className={`p-2 rounded-lg border transition-all text-center ${
                  selectedLaw === law 
                    ? `${info.bgClass} ${info.borderClass} scale-105` 
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex justify-center mb-1">{info.icon}</div>
                <p className="text-xs font-medium truncate">
                  {language === 'es' ? info.nameEs.split(' ')[1] : info.nameEn.split(' ')[2]}
                </p>
                <p className="text-[10px] text-muted-foreground">{lawImplemented}/{lawTips.length}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Law Principle */}
        {selectedLaw !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 rounded-lg ${LAW_INFO[selectedLaw].bgClass} ${LAW_INFO[selectedLaw].borderClass} border`}
          >
            <div className="flex items-center gap-2 mb-1">
              {LAW_INFO[selectedLaw].icon}
              <span className="font-medium text-sm">
                {language === 'es' ? `Ley ${LAW_INFO[selectedLaw].number}:` : `Law ${LAW_INFO[selectedLaw].number}:`}
                {' '}
                {language === 'es' ? LAW_INFO[selectedLaw].nameEs : LAW_INFO[selectedLaw].nameEn}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? LAW_INFO[selectedLaw].principleEs : LAW_INFO[selectedLaw].principleEn}
            </p>
          </motion.div>
        )}

        {/* Tips Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredTips.map((tip, index) => {
              const lawInfo = LAW_INFO[tip.law];
              
              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AccordionItem value={tip.id} className={`border rounded-lg ${lawInfo.borderClass}`}>
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <div className={`p-1.5 rounded ${lawInfo.bgClass}`}>
                          {tip.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {language === 'es' ? tip.titleEs : tip.titleEn}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] h-4">
                              {language === 'es' ? lawInfo.nameEs : lawInfo.nameEn}
                            </Badge>
                            {tip.implemented && (
                              <Badge className="text-[10px] h-4 bg-green-500/20 text-green-700 border-green-500/30">
                                ✓ {language === 'es' ? 'En la app' : 'In app'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <p className="text-sm text-muted-foreground mb-3">
                        {language === 'es' ? tip.descriptionEs : tip.descriptionEn}
                      </p>
                      <div className={`p-2 rounded-lg ${lawInfo.bgClass} border ${lawInfo.borderClass}`}>
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {language === 'es' ? 'Aplícalo en EvoFinz:' : 'Apply it in EvoFinz:'}
                        </p>
                        <p className="text-sm mt-1">
                          {language === 'es' ? tip.appActionEs : tip.appActionEn}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Accordion>

        {/* 1% Better Every Day */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {language === 'es' ? '1% mejor cada día = 37x mejor en un año' : '1% better every day = 37x better in a year'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'Registrar UN gasto hoy es el 1% que te hará millonario mañana.'
                  : 'Logging ONE expense today is the 1% that will make you a millionaire tomorrow.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start Tips */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            {language === 'es' ? 'Empieza ahora (2 minutos):' : 'Start now (2 minutes):'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start text-xs h-auto py-2">
              <Receipt className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Registrar 1 gasto' : 'Log 1 expense'}
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs h-auto py-2">
              <Calculator className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Ver mi balance' : 'View my balance'}
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs h-auto py-2">
              <PiggyBank className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Definir 1 meta' : 'Define 1 goal'}
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs h-auto py-2">
              <DollarSign className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Revisar patrimonio' : 'Review net worth'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
