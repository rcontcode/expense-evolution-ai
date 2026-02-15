 import { useEffect, useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import confetti from 'canvas-confetti';
 import { X, Star, Trophy, Sparkles, Crown, Zap, Flame, Gift, Target, TrendingUp } from 'lucide-react';
 import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { cn } from '@/lib/utils';
 
 // Expert celebration quotes for achievements
 const CELEBRATION_QUOTES = {
   es: [
     { quote: "¡La disciplina de hoy es la libertad de mañana!", author: "Jim Rohn", emoji: "🌟" },
     { quote: "¡Cada pequeño paso te acerca a la grandeza financiera!", author: "Brian Tracy", emoji: "🚀" },
     { quote: "¡Los ganadores nunca dejan de aprender!", author: "Robert Kiyosaki", emoji: "💎" },
     { quote: "¡La persistencia vence a la resistencia!", author: "Dave Ramsey", emoji: "🎯" },
     { quote: "¡Estás construyendo hábitos de millonario!", author: "Morgan Housel", emoji: "💰" },
     { quote: "¡Tu futuro yo te agradecerá por esto!", author: "Napoleon Hill", emoji: "👑" },
    { quote: "¡El dinero es un mal amo pero un excelente sirviente!", author: "P.T. Barnum", emoji: "⚡" },
    { quote: "¡No trabajes por dinero, haz que el dinero trabaje para ti!", author: "Robert Kiyosaki", emoji: "🏦" },
    { quote: "¡La riqueza no se mide en dinero, sino en tiempo libre!", author: "Bodo Schäfer", emoji: "⏰" },
   ],
   en: [
     { quote: "Today's discipline is tomorrow's freedom!", author: "Jim Rohn", emoji: "🌟" },
     { quote: "Every small step brings you closer to financial greatness!", author: "Brian Tracy", emoji: "🚀" },
     { quote: "Winners never stop learning!", author: "Robert Kiyosaki", emoji: "💎" },
     { quote: "Persistence beats resistance!", author: "Dave Ramsey", emoji: "🎯" },
     { quote: "You're building millionaire habits!", author: "Morgan Housel", emoji: "💰" },
     { quote: "Your future self will thank you for this!", author: "Napoleon Hill", emoji: "👑" },
    { quote: "Money is a terrible master but an excellent servant!", author: "P.T. Barnum", emoji: "⚡" },
    { quote: "Don't work for money, make money work for you!", author: "Robert Kiyosaki", emoji: "🏦" },
    { quote: "Wealth is not measured in money, but in free time!", author: "Bodo Schäfer", emoji: "⏰" },
   ],
 };
 
// Motivational power phrases
const POWER_PHRASES = {
  es: [
    '¡INCREÍBLE!', '¡ASOMBROSO!', '¡ÉPICO!', '¡FENOMENAL!', '¡LEGENDARIO!',
    '¡IMPARABLE!', '¡EXTRAORDINARIO!', '¡BRILLANTE!', '¡HEROICO!', '¡GLORIOSO!'
  ],
  en: [
    'INCREDIBLE!', 'AMAZING!', 'EPIC!', 'PHENOMENAL!', 'LEGENDARY!',
    'UNSTOPPABLE!', 'EXTRAORDINARY!', 'BRILLIANT!', 'HEROIC!', 'GLORIOUS!'
  ],
};

 interface CelebrationData {
   type: 'achievement' | 'level_up' | 'streak' | 'goal' | 'milestone';
   title: string;
   description: string;
   icon: string;
   points?: number;
   level?: number;
   streak?: number;
 }
 
 interface GamificationCelebrationProps {
   celebration: CelebrationData | null;
   onClose: () => void;
 }
 
 const CELEBRATION_CONFIG = {
   achievement: {
     gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
     glow: 'violet',
     Icon: Trophy,
   },
   level_up: {
     gradient: 'from-amber-400 via-orange-500 to-red-500',
     glow: 'amber',
     Icon: Crown,
   },
   streak: {
     gradient: 'from-orange-500 via-red-500 to-rose-500',
     glow: 'orange',
     Icon: Flame,
   },
   goal: {
     gradient: 'from-emerald-400 via-green-500 to-teal-500',
     glow: 'emerald',
     Icon: Target,
   },
   milestone: {
     gradient: 'from-blue-400 via-indigo-500 to-purple-500',
     glow: 'blue',
     Icon: TrendingUp,
   },
 };
 
// Fireworks burst effect
const triggerFireworks = () => {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 1000 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

// Starburst effect
const triggerStarburst = () => {
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9400D3', '#00CED1', '#32CD32'];
  
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 30 + i * 10,
        gravity: 0.8,
        scalar: 1.2,
        ticks: 100,
        zIndex: 1000,
      });
    }, i * 150);
  }
};

 export function GamificationCelebration({ celebration, onClose }: GamificationCelebrationProps) {
   const { language } = useLanguage();
   const { playFullCelebration } = useCelebrationSound();
   const [showContent, setShowContent] = useState(false);
   const [randomQuote, setRandomQuote] = useState<typeof CELEBRATION_QUOTES.es[0] | null>(null);
  const [powerPhrase, setPowerPhrase] = useState('');
  const [showPowerPhrase, setShowPowerPhrase] = useState(false);
 
   useEffect(() => {
     if (celebration) {
       // Play celebration sound
       playFullCelebration();
       
       // Select random expert quote
       const quotes = CELEBRATION_QUOTES[language];
       setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
       
      // Select random power phrase
      const phrases = POWER_PHRASES[language];
      setPowerPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      
      // Trigger multiple celebration effects
      triggerFireworks();
      setTimeout(triggerStarburst, 500);
      
      // Show power phrase
      setTimeout(() => setShowPowerPhrase(true), 100);
      setTimeout(() => setShowPowerPhrase(false), 1500);
      
      // Continuous confetti rain
      const duration = 5000;
      const end = Date.now() + duration;
      const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#fbbf24', '#ef4444', '#14b8a6'];
      
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
          zIndex: 1000,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
          zIndex: 1000,
        });
      }, 50);
 
       // Show content after initial animation
      setTimeout(() => setShowContent(true), 300);
 
      // Auto-close after 8 seconds
      const timeout = setTimeout(onClose, 8000);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
     }
   }, [celebration, language, onClose, playFullCelebration]);
 
   if (!celebration) return null;
 
   const config = CELEBRATION_CONFIG[celebration.type];
   const IconComponent = config.Icon;
 
   const t = {
     es: {
       points: 'puntos',
       level: 'Nivel',
       streak: 'Racha',
       days: 'días',
       tapToClose: 'Toca para continuar tu aventura',
       expertSays: 'Los expertos dicen:',
     },
     en: {
       points: 'points',
       level: 'Level',
       streak: 'Streak',
       days: 'days',
       tapToClose: 'Tap to continue your adventure',
       expertSays: 'Experts say:',
     },
   };
 
   const text = t[language];
 
   return (
     <AnimatePresence>
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
         onClick={onClose}
       >
          {/* Power phrase splash */}
          <AnimatePresence>
            {showPowerPhrase && (
              <motion.div
                initial={{ scale: 5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <span className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                  {powerPhrase}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

         {/* Epic radial burst background */}
         <div className="absolute inset-0 overflow-hidden">
            {[...Array(16)].map((_, i) => (
             <motion.div
               key={i}
               className={cn('absolute left-1/2 top-1/2 h-[200vh] w-1 bg-gradient-to-t from-transparent to-primary/30 origin-bottom')}
               style={{
                  rotate: `${i * 22.5}deg`,
                 translateX: '-50%',
                 translateY: '-100%',
               }}
               initial={{ scaleY: 0, opacity: 0 }}
               animate={{ scaleY: 1, opacity: [0, 0.6, 0] }}
                transition={{ duration: 2.5, delay: i * 0.03, repeat: Infinity, repeatDelay: 2 }}
             />
           ))}
         </div>
 
          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className={cn('absolute rounded-full border-2 border-white/20')}
                initial={{ width: 100, height: 100, opacity: 0 }}
                animate={{
                  width: [100, 600],
                  height: [100, 600],
                  opacity: [0.8, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

         {/* Floating particles */}
         <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute text-2xl"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
               }}
               animate={{
                  y: [0, -150, 0],
                 opacity: [0, 1, 0],
                 scale: [0.5, 1.5, 0.5],
                 rotate: [0, 360],
               }}
               transition={{
                 duration: 3 + Math.random() * 2,
                 repeat: Infinity,
                 delay: Math.random() * 2,
               }}
             >
                {['✨', '⭐', '🌟', '💎', '🔥', '💰', '🎯', '🏆', '👑', '🚀'][Math.floor(Math.random() * 10)]}
             </motion.div>
           ))}
         </div>
 
         {/* Main celebration card */}
         <motion.div
           initial={{ scale: 0, rotate: -15 }}
           animate={{ scale: 1, rotate: 0 }}
           exit={{ scale: 0, rotate: 15 }}
           transition={{ type: 'spring', damping: 12, stiffness: 200 }}
           className="relative max-w-md mx-4"
           onClick={(e) => e.stopPropagation()}
         >
           {/* Glow ring */}
           <motion.div
             className={cn('absolute -inset-4 rounded-[2rem] bg-gradient-to-r blur-2xl', config.gradient)}
             animate={{
               scale: [1, 1.1, 1],
               opacity: [0.4, 0.7, 0.4],
             }}
             transition={{ duration: 2, repeat: Infinity }}
           />
 
           <div className={cn('relative bg-gradient-to-br p-1 rounded-3xl shadow-2xl', config.gradient)}>
             <div className="bg-background/95 backdrop-blur-xl rounded-3xl p-8 overflow-hidden">
               {/* Close button */}
               <button
                 onClick={onClose}
                 className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
               >
                 <X className="h-5 w-5 text-muted-foreground" />
               </button>
 
               {/* Celebration icon */}
               <motion.div
                 initial={{ scale: 0, rotate: -180 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                 className="flex justify-center mb-6"
               >
                 <div className="relative">
                   {/* Orbiting sparkles */}
                   {[...Array(6)].map((_, i) => (
                     <motion.div
                       key={i}
                       className="absolute"
                       style={{ left: '50%', top: '50%' }}
                       animate={{ rotate: 360 }}
                       transition={{
                         duration: 4,
                         repeat: Infinity,
                         ease: 'linear',
                         delay: i * 0.3,
                       }}
                     >
                       <motion.span
                         className="absolute text-xl"
                         style={{
                           left: 60 + i * 5,
                           top: 0,
                         }}
                         animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                         transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                       >
                         ✨
                       </motion.span>
                     </motion.div>
                   ))}
                   
                   {/* Main icon container */}
                    <motion.div 
                      className={cn('w-32 h-32 rounded-full bg-gradient-to-br p-1 shadow-2xl', config.gradient)}
                      animate={{ 
                        boxShadow: [
                          '0 0 20px rgba(139, 92, 246, 0.5)',
                          '0 0 60px rgba(139, 92, 246, 0.8)',
                          '0 0 20px rgba(139, 92, 246, 0.5)',
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                     <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                       <motion.span
                          className="text-7xl"
                         animate={{ 
                           scale: [1, 1.2, 1],
                           rotate: [0, -10, 10, 0],
                         }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                       >
                         {celebration.icon}
                       </motion.span>
                     </div>
                    </motion.div>
                 </div>
               </motion.div>
 
               {/* Title and description */}
               <AnimatePresence>
                 {showContent && (
                   <motion.div
                     initial={{ y: 30, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="text-center space-y-3"
                   >
                     <motion.div
                        animate={{ 
                          scale: [1, 1.03, 1],
                          textShadow: [
                            '0 0 10px rgba(139, 92, 246, 0)',
                            '0 0 30px rgba(139, 92, 246, 0.5)',
                            '0 0 10px rgba(139, 92, 246, 0)',
                          ]
                        }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                     >
                        <h2 className={cn('text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent', config.gradient)}>
                         {celebration.title}
                       </h2>
                     </motion.div>
                     
                      <p className="text-muted-foreground text-lg">{celebration.description}</p>
 
                     {/* Points/Level/Streak display */}
                     <div className="flex items-center justify-center gap-3 pt-2">
                       {celebration.points && (
                         <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ delay: 0.3, type: 'spring' }}
                            className={cn('flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r text-white font-bold shadow-xl', config.gradient)}
                         >
                            <Star className="h-6 w-6 animate-pulse" />
                            <span className="text-2xl">+{celebration.points}</span>
                            <span className="text-base opacity-80">{text.points}</span>
                         </motion.div>
                       )}
                       
                       {celebration.level && (
                         <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ delay: 0.4, type: 'spring' }}
                           className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg"
                         >
                           <Crown className="h-5 w-5" />
                           <span>{text.level} {celebration.level}</span>
                         </motion.div>
                       )}
                       
                       {celebration.streak && (
                         <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ delay: 0.4, type: 'spring' }}
                           className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg"
                         >
                           <Flame className="h-5 w-5 animate-pulse" />
                           <span>{celebration.streak} {text.days} 🔥</span>
                         </motion.div>
                       )}
                     </div>
 
                     {/* Expert wisdom quote */}
                     {randomQuote && (
                       <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.6 }}
                          className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-2 border-amber-500/30"
                       >
                          <motion.p 
                            className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center justify-center gap-1 font-semibold"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Sparkles className="h-4 w-4" />
                           {text.expertSays}
                            <Sparkles className="h-4 w-4" />
                          </motion.p>
                          <p className="text-base font-semibold italic text-foreground">
                           {randomQuote.emoji} "{randomQuote.quote}"
                         </p>
                          <p className="text-sm text-primary font-bold mt-2 flex items-center justify-center gap-2">
                            <span className="text-lg">📚</span> — {randomQuote.author}
                         </p>
                       </motion.div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
 
               {/* Tap to close */}
               <motion.p
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.5 }}
                 transition={{ delay: 2 }}
                  className="text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2"
               >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    👆
                  </motion.span>
                 {text.tapToClose} ✨
               </motion.p>
             </div>
           </div>
         </motion.div>
       </motion.div>
     </AnimatePresence>
   );
 }