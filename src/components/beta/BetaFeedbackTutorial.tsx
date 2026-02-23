import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Star,
  Bug,
  Gift,
  Users,
  Flame,
  Trophy,
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Crown,
  Zap,
  PartyPopper,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

interface TutorialStep {
  id: string;
  icon: React.ReactNode;
  title: { en: string; es: string };
  description: { en: string; es: string };
  features: { en: string[]; es: string[] };
  tip?: { en: string; es: string };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    icon: <Crown className="h-12 w-12 text-amber-500" />,
    title: {
      en: "Welcome to the BETA Program! 🎉",
      es: "¡Bienvenido al Programa BETA! 🎉"
    },
    description: {
      en: "You're now part of an EXCLUSIVE group of founding testers! Your voice directly shapes the future of EvoFinz.",
      es: "¡Ahora eres parte de un grupo EXCLUSIVO de testers fundadores! Tu voz moldea directamente el futuro de EvoFinz."
    },
    features: {
      en: [
        "🌟 Founding Member status",
        "🎁 Earn FREE Premium access",
        "⚡ First access to new features",
        "🏆 Exclusive badges forever"
      ],
      es: [
        "🌟 Estatus de Miembro Fundador",
        "🎁 Gana acceso Premium GRATIS",
        "⚡ Primero en probar nuevas funciones",
        "🏆 Badges exclusivos para siempre"
      ]
    }
  },
  {
    id: 'points',
    icon: <Zap className="h-12 w-12 text-amber-500" />,
    title: {
      en: "How to Earn Points 💰",
      es: "Cómo Ganar Puntos 💰"
    },
    description: {
      en: "Every contribution earns you points. More points = better rewards. It's that simple!",
      es: "Cada contribución te da puntos. Más puntos = mejores recompensas. ¡Así de simple!"
    },
    features: {
      en: [
        "⭐ Rate sections: 25 points each",
        "🐛 Report bugs: 25-150 points",
        "👥 Refer friends: 100 points each",
        "🔥 Daily streak: bonus points!"
      ],
      es: [
        "⭐ Evaluar secciones: 25 puntos c/u",
        "🐛 Reportar bugs: 25-150 puntos",
        "👥 Referir amigos: 100 puntos c/u",
        "🔥 Racha diaria: ¡puntos bonus!"
      ]
    },
    tip: {
      en: "Pro tip: Detailed feedback with suggestions earns more points!",
      es: "Pro tip: ¡Feedback detallado con sugerencias gana más puntos!"
    }
  },
  {
    id: 'levels',
    icon: <Trophy className="h-12 w-12 text-amber-500" />,
    title: {
      en: "The 5 Levels 🏅",
      es: "Los 5 Niveles 🏅"
    },
    description: {
      en: "Climb the ranks and unlock exclusive perks at each level!",
      es: "¡Sube de nivel y desbloquea beneficios exclusivos en cada nivel!"
    },
    features: {
      en: [
        "🥉 Bronze (0 pts) - Starting level",
        "🥈 Silver (250 pts) - Beta features access",
        "🥇 Gold (500 pts) - Priority features",
        "💎 Platinum (1000 pts) - Permanent badge",
        "👑 Diamond (2000 pts) - Founding Member forever!"
      ],
      es: [
        "🥉 Bronze (0 pts) - Nivel inicial",
        "🥈 Silver (250 pts) - Acceso a funciones beta",
        "🥇 Gold (500 pts) - Funciones prioritarias",
        "💎 Platinum (1000 pts) - Badge permanente",
        "👑 Diamond (2000 pts) - ¡Founding Member para siempre!"
      ]
    }
  },
  {
    id: 'rewards',
    icon: <Gift className="h-12 w-12 text-amber-500" />,
    title: {
      en: "THE REWARDS 🎁",
      es: "LAS RECOMPENSAS 🎁"
    },
    description: {
      en: "This is the good part! Exchange your points for REAL subscription value:",
      es: "¡Esta es la parte buena! Canjea tus puntos por VALOR REAL de suscripción:"
    },
    features: {
      en: [
        "🎁 1,000 pts → 1 YEAR Premium FREE ($84 value!)",
        "🎁 1,500 pts → 6 MONTHS Pro FREE ($90 value!)",
        "🎁 2,000 pts → 1 YEAR Pro FREE ($180 value!)",
        "✨ Badges and achievements are PERMANENT"
      ],
      es: [
        "🎁 1,000 pts → 1 AÑO Premium GRATIS (¡valor $84!)",
        "🎁 1,500 pts → 6 MESES Pro GRATIS (¡valor $90!)",
        "🎁 2,000 pts → 1 AÑO Pro GRATIS (¡valor $180!)",
        "✨ Los badges y logros son PERMANENTES"
      ]
    },
    tip: {
      en: "Diamond members get perpetual Founding Member status! 👑",
      es: "¡Los miembros Diamond obtienen el estatus Founding Member perpetuo! 👑"
    }
  },
  {
    id: 'feedback',
    icon: <Star className="h-12 w-12 text-amber-500" />,
    title: {
      en: "How to Give Feedback ⭐",
      es: "Cómo Dar Feedback ⭐"
    },
    description: {
      en: "The Evaluate tab is your main tool. Rate sections and tell us what you think!",
      es: "La pestaña Evaluar es tu herramienta principal. ¡Califica secciones y dinos qué piensas!"
    },
    features: {
      en: [
        "1️⃣ Select a section you've used",
        "2️⃣ Give 1-5 star ratings",
        "3️⃣ Write detailed comments",
        "4️⃣ Share improvement ideas"
      ],
      es: [
        "1️⃣ Selecciona una sección que hayas usado",
        "2️⃣ Da calificación de 1-5 estrellas",
        "3️⃣ Escribe comentarios detallados",
        "4️⃣ Comparte ideas de mejora"
      ]
    },
    tip: {
      en: "The more specific your feedback, the more helpful it is!",
      es: "¡Mientras más específico tu feedback, más útil es!"
    }
  },
  {
    id: 'bugs',
    icon: <Bug className="h-12 w-12 text-amber-500" />,
    title: {
      en: "Report Bugs 🐛",
      es: "Reportar Bugs 🐛"
    },
    description: {
      en: "Found something broken? Report it! Bug reports earn HIGH points, especially critical ones.",
      es: "¿Encontraste algo roto? ¡Repórtalo! Los reportes de bugs ganan puntos ALTOS, especialmente los críticos."
    },
    features: {
      en: [
        "🟢 Low priority: 25 pts",
        "🟡 Medium priority: 50 pts",
        "🟠 High priority: 100 pts",
        "🔴 Critical: 150 pts!"
      ],
      es: [
        "🟢 Prioridad baja: 25 pts",
        "🟡 Prioridad media: 50 pts",
        "🟠 Prioridad alta: 100 pts",
        "🔴 Crítico: ¡150 pts!"
      ]
    },
    tip: {
      en: "Add screenshots for faster fixes and extra appreciation! 📸",
      es: "¡Agrega capturas de pantalla para fixes más rápidos y mayor apreciación! 📸"
    }
  },
  {
    id: 'referrals',
    icon: <Users className="h-12 w-12 text-amber-500" />,
    title: {
      en: "Invite Friends 👥",
      es: "Invita Amigos 👥"
    },
    description: {
      en: "Share your unique referral code! Each friend who joins = 100 points for you.",
      es: "¡Comparte tu código de referido único! Cada amigo que se une = 100 puntos para ti."
    },
    features: {
      en: [
        "📲 Share via WhatsApp, email, or social",
        "🎯 Each signup = 100 points",
        "🏆 Ambassador mission: 3 referrals = 300 pts",
        "🚀 No limit on referrals!"
      ],
      es: [
        "📲 Comparte por WhatsApp, email o redes",
        "🎯 Cada registro = 100 puntos",
        "🏆 Misión Ambassador: 3 referidos = 300 pts",
        "🚀 ¡Sin límite de referidos!"
      ]
    }
  },
  {
    id: 'streak',
    icon: <Flame className="h-12 w-12 text-amber-500" />,
    title: {
      en: "Keep Your Streak 🔥",
      es: "Mantén Tu Racha 🔥"
    },
    description: {
      en: "Use the app daily to build your streak! Consistency is rewarded with bonus points.",
      es: "¡Usa la app diariamente para construir tu racha! La consistencia se recompensa con puntos bonus."
    },
    features: {
      en: [
        "📅 Log in daily to maintain streak",
        "🎯 7-day streak mission: 150 pts",
        "🏆 Your best streak is tracked",
        "⚡ Streak fire grows with each day!"
      ],
      es: [
        "📅 Ingresa diariamente para mantener la racha",
        "🎯 Misión racha 7 días: 150 pts",
        "🏆 Tu mejor racha se guarda",
        "⚡ ¡El fuego de la racha crece cada día!"
      ]
    }
  },
  {
    id: 'start',
    icon: <PartyPopper className="h-12 w-12 text-amber-500" />,
    title: {
      en: "Ready to Start! 🚀",
      es: "¡Listo para Empezar! 🚀"
    },
    description: {
      en: "You now know everything! Start earning points and climb to Diamond status!",
      es: "¡Ya sabes todo! ¡Empieza a ganar puntos y llega al estatus Diamond!"
    },
    features: {
      en: [
        "⭐ Give your first feedback now",
        "🎯 Check the Missions Roadmap",
        "📊 Track your progress in the chart",
        "🏆 Become a Founding Member!"
      ],
      es: [
        "⭐ Da tu primer feedback ahora",
        "🎯 Revisa el Roadmap de Misiones",
        "📊 Sigue tu progreso en el gráfico",
        "🏆 ¡Conviértete en Founding Member!"
      ]
    }
  }
];

const STORAGE_KEY = 'beta-feedback-tutorial-completed';

interface BetaFeedbackTutorialProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function BetaFeedbackTutorial({ forceShow = false, onComplete }: BetaFeedbackTutorialProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }

    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Orange border frame */}
          <div className="m-1 bg-card rounded-xl overflow-hidden">
            {/* Header with progress */}
            <div className="p-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {language === 'es' ? `Paso ${currentStep + 1} de ${TUTORIAL_STEPS.length}` : `Step ${currentStep + 1} of ${TUTORIAL_STEPS.length}`}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSkip} 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={progress} className="h-2 bg-amber-100 dark:bg-amber-900/30" />
            </div>

            {/* Content */}
            <div className="p-6 text-center space-y-4">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 ring-4 ring-amber-500/20"
                  >
                    {step.icon}
                  </motion.div>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-xl font-black bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent mb-2">
                    {step.title[language]}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {step.description[language]}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 gap-2 text-left">
                  {step.features[language].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30"
                    >
                      <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Tip */}
                {step.tip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  >
                    <MessageSquare className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      {step.tip[language]}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="p-4 border-t border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Anterior' : 'Previous'}
              </Button>

              {currentStep === TUTORIAL_STEPS.length - 1 ? (
                <Button 
                  onClick={handleComplete} 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {language === 'es' ? '¡Empezar!' : "Let's Go!"}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
                >
                  {language === 'es' ? 'Siguiente' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function resetBetaFeedbackTutorial() {
  localStorage.removeItem(STORAGE_KEY);
}
