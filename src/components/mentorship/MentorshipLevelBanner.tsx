import { useLanguage } from '@/contexts/LanguageContext';
import { useUserLevel, LEVELS } from '@/hooks/data/useGamification';
import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Zap, Crown, Award, Sparkles, TrendingUp, Quote, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

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

// Wisdom from financial masters - inspiring and educational
const EXPERT_WISDOM = {
  kiyosaki: {
    es: [
      { quote: "Los ricos no trabajan por dinero. Hacen que el dinero trabaje para ellos.", tip: "Invierte en activos que generen ingresos pasivos" },
      { quote: "Un activo pone dinero en tu bolsillo. Un pasivo lo saca.", tip: "Registra cada gasto y pregúntate: ¿es activo o pasivo?" },
      { quote: "El miedo a ser diferente nos impide buscar nuevas formas de resolver problemas.", tip: "Atrévete a pensar diferente sobre tu dinero" },
      { quote: "La educación financiera es más valiosa que el dinero.", tip: "Dedica tiempo cada día a aprender sobre finanzas" },
      { quote: "La riqueza es la capacidad de sobrevivir un número determinado de días en el futuro.", tip: "¿Cuántos días podrías vivir sin trabajar?" },
    ],
    en: [
      { quote: "The rich don't work for money. They make money work for them.", tip: "Invest in assets that generate passive income" },
      { quote: "An asset puts money in your pocket. A liability takes it out.", tip: "Track every expense and ask: is this an asset or liability?" },
      { quote: "The fear of being different prevents us from seeking new ways to solve problems.", tip: "Dare to think differently about your money" },
      { quote: "Financial education is more valuable than money.", tip: "Dedicate time every day to learning about finance" },
      { quote: "Wealth is the ability to survive a certain number of days in the future.", tip: "How many days could you live without working?" },
    ],
    author: "Sabiduría financiera",
    emoji: "💎",
    color: "from-violet-500 to-purple-600"
  },
  ramsey: {
    es: [
      { quote: "Vive como nadie más ahora, para poder vivir como nadie más después.", tip: "El sacrificio temporal trae libertad permanente" },
      { quote: "Un presupuesto es decirle a tu dinero a dónde ir, en lugar de preguntarte a dónde fue.", tip: "Registra tus gastos ANTES de gastar" },
      { quote: "La deuda es tan normal que si estás libre de deudas, eres raro.", tip: "Usa el método bola de nieve para eliminar deudas" },
      { quote: "Los ganadores no abandonan cuando tienen problemas. Encuentran una manera.", tip: "Cada obstáculo financiero tiene solución" },
      { quote: "El dinero no es bueno ni malo. Es un amplificador.", tip: "Desarrolla buenos hábitos financieros ahora" },
    ],
    en: [
      { quote: "Live like no one else now, so you can live like no one else later.", tip: "Temporary sacrifice brings permanent freedom" },
      { quote: "A budget is telling your money where to go instead of wondering where it went.", tip: "Track your expenses BEFORE spending" },
      { quote: "Debt is so normal that if you're debt-free, you're weird.", tip: "Use the snowball method to eliminate debt" },
      { quote: "Winners don't quit when they have problems. They find a way.", tip: "Every financial obstacle has a solution" },
      { quote: "Money isn't good or bad. It's an amplifier.", tip: "Develop good financial habits now" },
    ],
    author: "Sabiduría financiera",
    emoji: "🎯",
    color: "from-emerald-500 to-teal-600"
  },
  rohn: {
    es: [
      { quote: "La disciplina es el puente entre metas y logros.", tip: "Pequeñas acciones diarias = grandes resultados" },
      { quote: "No desees que sea más fácil. Desea ser mejor.", tip: "Invierte en tu educación financiera" },
      { quote: "Tu nivel de éxito rara vez excede tu nivel de desarrollo personal.", tip: "Crece tú primero, el dinero seguirá" },
      { quote: "El éxito no es hacer cosas extraordinarias, sino hacer cosas ordinarias extraordinariamente bien.", tip: "Domina los básicos: gasta menos de lo que ganas" },
      { quote: "Los pobres gastan su dinero y ahorran lo que sobra. Los ricos ahorran primero.", tip: "Págate a ti mismo primero, siempre" },
    ],
    en: [
      { quote: "Discipline is the bridge between goals and accomplishment.", tip: "Small daily actions = big results" },
      { quote: "Don't wish it were easier. Wish you were better.", tip: "Invest in your financial education" },
      { quote: "Your level of success rarely exceeds your level of personal development.", tip: "Grow yourself first, money will follow" },
      { quote: "Success is not doing extraordinary things, but doing ordinary things extraordinarily well.", tip: "Master the basics: spend less than you earn" },
      { quote: "Poor people spend and save what's left. Rich people save first.", tip: "Pay yourself first, always" },
    ],
    author: "Sabiduría financiera",
    emoji: "🌟",
    color: "from-amber-500 to-orange-600"
  },
  tracy: {
    es: [
      { quote: "Tu vida solo mejora cuando tú mejoras.", tip: "Aprende algo nuevo sobre finanzas hoy" },
      { quote: "La claridad es el 80% del éxito.", tip: "Define metas financieras específicas y medibles" },
      { quote: "El éxito es previsible, no una casualidad.", tip: "Sigue un sistema, no impulsos" },
      { quote: "Desarrolla una obsesión por servir a los demás.", tip: "Aumenta tus ingresos resolviendo problemas" },
      { quote: "Nunca hay suficiente tiempo para hacer todo, pero siempre hay tiempo para lo importante.", tip: "Prioriza tu salud financiera" },
    ],
    en: [
      { quote: "Your life only gets better when you get better.", tip: "Learn something new about finances today" },
      { quote: "Clarity is 80% of success.", tip: "Set specific, measurable financial goals" },
      { quote: "Success is predictable, not an accident.", tip: "Follow a system, not impulses" },
      { quote: "Develop an obsession about serving others.", tip: "Increase your income by solving problems" },
      { quote: "There's never enough time to do everything, but there's always time for what's important.", tip: "Prioritize your financial health" },
    ],
    author: "Sabiduría financiera",
    emoji: "🚀",
    color: "from-blue-500 to-indigo-600"
  }
};

type ExpertKey = keyof typeof EXPERT_WISDOM;
const EXPERTS: ExpertKey[] = ['kiyosaki', 'ramsey', 'rohn', 'tracy'];

export function MentorshipLevelBanner() {
  const { language } = useLanguage();
  const { data: userLevel, isLoading } = useUserLevel();
  const [currentExpert, setCurrentExpert] = useState<ExpertKey>('kiyosaki');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const level = userLevel?.level || 1;
  const experiencePoints = userLevel?.experience_points || 0;
  const streakDays = userLevel?.streak_days || 0;
  
  // Rotate through experts and quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentExpert((prev) => {
          const currentIdx = EXPERTS.indexOf(prev);
          const nextIdx = (currentIdx + 1) % EXPERTS.length;
          if (nextIdx === 0) {
            // When we complete a cycle, move to next quote
            setQuoteIndex((qi) => (qi + 1) % 5);
          }
          return EXPERTS[nextIdx];
        });
        setIsAnimating(false);
      }, 300);
    }, 8000); // Change every 8 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const expert = EXPERT_WISDOM[currentExpert];
  const currentWisdom = expert[language][quoteIndex];
  
  // Find current and next level XP thresholds
  const currentLevelData = LEVELS.find(l => l.level === level) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === level + 1) || LEVELS[LEVELS.length - 1];
  const currentLevelXP = currentLevelData.minXP;
  const nextLevelXP = nextLevelData.minXP;
  
  const titles = LEVEL_TITLES[language];
  const currentTitle = titles.find(t => level >= t.min && level <= t.max) || titles[0];
  const nextTitle = titles.find(t => t.min > level) || currentTitle;
  
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
      className="relative overflow-hidden rounded-2xl shadow-xl"
    >
      {/* Main level section with gradient */}
      <div className={cn('relative p-5 bg-gradient-to-r', currentTitle.color)}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 bg-white/10 rounded-full"
              style={{
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.1, 0.4, 0.1],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4 + (i * 0.3),
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Level & Title */}
          <div className="flex items-center gap-4">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/30"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              animate={{ 
                boxShadow: ['0 0 20px rgba(255,255,255,0.3)', '0 0 40px rgba(255,255,255,0.5)', '0 0 20px rgba(255,255,255,0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span 
                className="text-4xl"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {currentTitle.emoji}
              </motion.span>
            </motion.div>
            
            <div className="text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/25 text-white border-white/40 text-xs font-bold shadow-lg">
                  {language === 'es' ? 'Nivel' : 'Level'} {level}
                </Badge>
                {streakDays > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400/30 text-xs font-bold shadow-lg">
                      <Flame className="h-3 w-3 mr-1 animate-pulse" />
                      {streakDays} {language === 'es' ? 'días' : 'days'} 🔥
                    </Badge>
                  </motion.div>
                )}
                {level >= 5 && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold">
                    <Crown className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Élite' : 'Elite'}
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-1 drop-shadow-lg tracking-tight">
                {currentTitle.title}
              </h2>
              <p className="text-white/90 text-sm flex items-center gap-1 mt-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                {language === 'es' 
                  ? '¡Cada acción te acerca a la libertad financiera!' 
                  : 'Every action brings you closer to financial freedom!'}
              </p>
            </div>
          </div>

          {/* Right: XP Progress */}
          <div className="w-full md:w-72 space-y-2">
            <div className="flex items-center justify-between text-white text-sm font-medium">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                <Zap className="h-4 w-4 text-yellow-300" />
                {experiencePoints.toLocaleString()} XP
              </span>
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                {nextLevelXP.toLocaleString()} XP
              </span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden bg-white/20 shadow-inner">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/90 to-yellow-200/90 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              {/* XP percentage indicator */}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                {Math.round(xpProgress)}%
              </span>
            </div>
            <p className="text-white/80 text-xs text-center font-medium">
              {level < 10 
                ? (language === 'es' 
                    ? `🎯 Próximo: ${nextTitle.emoji} ${nextTitle.title}` 
                    : `🎯 Next: ${nextTitle.emoji} ${nextTitle.title}`)
                : (language === 'es' ? '👑 ¡Máximo nivel alcanzado! 🏆' : '👑 Max level reached! 🏆')
              }
            </p>
          </div>
        </div>

        {/* Decorative crown icon */}
        <motion.div
          className="absolute -right-6 -bottom-6 opacity-15"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <Crown className="h-40 w-40 text-white" />
        </motion.div>
      </div>

      {/* Expert Wisdom Section - NEW! */}
      <motion.div 
        className={cn(
          'relative p-4 bg-gradient-to-r border-t border-white/10',
          expert.color
        )}
        animate={{ opacity: isAnimating ? 0.5 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <motion.div 
            className="shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
            animate={{ rotate: isAnimating ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-2xl">{expert.emoji}</span>
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Quote className="h-4 w-4 text-white/70" />
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                {language === 'es' ? 'Sabiduría financiera' : 'Financial wisdom'}
              </span>
              <BookOpen className="h-3 w-3 text-white/50" />
            </div>
            
            <motion.p 
              key={`${currentExpert}-${quoteIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white font-semibold text-sm md:text-base leading-snug italic"
            >
              "{currentWisdom.quote}"
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 flex items-center gap-2"
            >
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                💡 {currentWisdom.tip}
              </span>
            </motion.div>
          </div>
          
          {/* Expert indicator dots */}
          <div className="flex gap-1 shrink-0">
            {EXPERTS.map((exp) => (
              <motion.div
                key={exp}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  exp === currentExpert ? 'bg-white scale-125' : 'bg-white/30'
                )}
                animate={exp === currentExpert ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
        
        {/* Sparkle decorations */}
        <motion.div
          className="absolute right-4 top-2 text-white/30"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
