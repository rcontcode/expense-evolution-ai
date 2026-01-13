import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';
import { useLanguage } from '@/contexts/LanguageContext';
import { TIER_CONFIG } from '@/hooks/data/useBetaGamification';

interface LevelUpAnimationProps {
  newTier: keyof typeof TIER_CONFIG;
  isVisible: boolean;
  onComplete: () => void;
}

export const LevelUpAnimation = ({ newTier, isVisible, onComplete }: LevelUpAnimationProps) => {
  const { language } = useLanguage();
  const { playFullCelebration } = useCelebrationSound();
  const tierConfig = TIER_CONFIG[newTier];

  useEffect(() => {
    if (isVisible) {
      playFullCelebration();

      // Big burst of confetti
      const duration = 4000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#8b5cf6', '#ec4899', '#fbbf24', '#10b981'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#8b5cf6', '#ec4899', '#fbbf24', '#10b981'],
        });
      }, 250);

      const timeout = setTimeout(onComplete, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isVisible, onComplete, playFullCelebration]);

  const t = {
    es: {
      levelUp: '¡SUBISTE DE NIVEL!',
      newLevel: 'Nuevo nivel',
      congrats: '¡Felicidades! Sigue así para desbloquear más recompensas.',
      tapToContinue: 'Toca para continuar',
    },
    en: {
      levelUp: 'LEVEL UP!',
      newLevel: 'New level',
      congrats: 'Congratulations! Keep it up to unlock more rewards.',
      tapToContinue: 'Tap to continue',
    },
  };

  const text = t[language];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={onComplete}
        >
          {/* Radial burst */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 h-[200vh] w-2 origin-bottom bg-gradient-to-t from-transparent via-primary/30 to-transparent"
                style={{
                  rotate: `${i * 30}deg`,
                  translateX: '-50%',
                  translateY: '-100%',
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, delay: i * 0.05 }}
              />
            ))}
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            transition={{ type: 'spring', damping: 12 }}
            className="relative text-center z-10"
          >
            {/* Glowing ring */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${tierConfig.color} blur-3xl`}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Level up text */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative mb-6"
            >
              <motion.h2
                className="text-4xl font-black text-white tracking-wider"
                animate={{
                  textShadow: [
                    '0 0 10px #8b5cf6, 0 0 20px #8b5cf6',
                    '0 0 30px #ec4899, 0 0 40px #ec4899',
                    '0 0 10px #8b5cf6, 0 0 20px #8b5cf6',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {text.levelUp}
              </motion.h2>
            </motion.div>

            {/* Tier icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', damping: 8 }}
              className="relative mb-6"
            >
              <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${tierConfig.color} p-2 mx-auto shadow-2xl`}>
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <motion.span
                    className="text-7xl"
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {tierConfig.icon}
                  </motion.span>
                </div>
              </div>

              {/* Orbiting particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.3,
                  }}
                >
                  <motion.span
                    className="absolute text-2xl"
                    style={{
                      left: 80 + i * 10,
                      top: 0,
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  >
                    ✨
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>

            {/* Tier name */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="relative"
            >
              <p className="text-lg text-white/70 mb-2">{text.newLevel}</p>
              <h3 className={`text-3xl font-black bg-gradient-to-r ${tierConfig.color} bg-clip-text text-transparent`}>
                {language === 'es' ? tierConfig.labelEs : tierConfig.labelEn}
              </h3>
              <p className="text-sm text-white/50 mt-4 max-w-xs mx-auto">
                {text.congrats}
              </p>
            </motion.div>

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 2 }}
              className="text-xs text-white/50 mt-8"
            >
              {text.tapToContinue}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};