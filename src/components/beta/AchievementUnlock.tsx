import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Star, Trophy, Sparkles } from 'lucide-react';
import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';
import { useLanguage } from '@/contexts/LanguageContext';

interface AchievementData {
  id: string;
  icon: string;
  title: string;
  description: string;
  points: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementUnlockProps {
  achievement: AchievementData | null;
  onClose: () => void;
}

const RARITY_CONFIG = {
  common: {
    gradient: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/50',
    label: { es: 'Común', en: 'Common' },
  },
  rare: {
    gradient: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/50',
    label: { es: 'Raro', en: 'Rare' },
  },
  epic: {
    gradient: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-500/50',
    label: { es: 'Épico', en: 'Epic' },
  },
  legendary: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glow: 'shadow-amber-500/50',
    label: { es: 'Legendario', en: 'Legendary' },
  },
};

export const AchievementUnlock = ({ achievement, onClose }: AchievementUnlockProps) => {
  const { language } = useLanguage();
  const { playFullCelebration } = useCelebrationSound();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (achievement) {
      // Play celebration sound
      playFullCelebration();
      
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;
      
      const colors = achievement.rarity === 'legendary' 
        ? ['#fbbf24', '#f59e0b', '#d97706', '#ffffff']
        : ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Show details after initial animation
      setTimeout(() => setShowDetails(true), 500);

      // Auto-close after 5 seconds
      const timeout = setTimeout(onClose, 6000);
      return () => clearTimeout(timeout);
    }
  }, [achievement, onClose, playFullCelebration]);

  if (!achievement) return null;

  const rarity = achievement.rarity || 'common';
  const rarityConfig = RARITY_CONFIG[rarity];

  const t = {
    es: {
      unlocked: '¡LOGRO DESBLOQUEADO!',
      points: 'puntos',
      tapToClose: 'Toca para cerrar',
    },
    en: {
      unlocked: 'ACHIEVEMENT UNLOCKED!',
      points: 'points',
      tapToClose: 'Tap to close',
    },
  };

  const text = t[language];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Radial burst background */}
        <motion.div
          className="absolute inset-0 opacity-30"
          initial={{ scale: 0 }}
          animate={{ scale: 3 }}
          transition={{ duration: 1 }}
          style={{
            background: `radial-gradient(circle, ${rarity === 'legendary' ? '#fbbf24' : '#8b5cf6'} 0%, transparent 70%)`,
          }}
        />

        {/* Main card */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow ring */}
          <motion.div
            className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${rarityConfig.gradient} blur-xl`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className={`relative bg-gradient-to-br ${rarityConfig.gradient} p-1 rounded-3xl ${rarityConfig.glow} shadow-2xl`}>
            <div className="bg-background/95 backdrop-blur-xl rounded-3xl p-8 min-w-[320px]">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-bold tracking-widest">
                    {text.unlocked}
                  </span>
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                
                {/* Rarity badge */}
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${rarityConfig.gradient}`}
                >
                  {rarityConfig.label[language]}
                </motion.span>
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', damping: 10 }}
                className="flex justify-center mb-4"
              >
                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${rarityConfig.gradient} p-1`}>
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <motion.span
                      className="text-5xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 5, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {achievement.icon}
                    </motion.span>
                  </div>
                  
                  {/* Orbiting stars */}
                  {rarity === 'legendary' && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-yellow-400"
                          style={{ fontSize: 12 }}
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 1,
                            ease: 'linear',
                          }}
                        >
                          <motion.span
                            style={{
                              position: 'absolute',
                              left: 48,
                              top: -8,
                              transformOrigin: '0 56px',
                            }}
                            animate={{ rotate: -360 }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: i * 1,
                              ease: 'linear',
                            }}
                          >
                            ⭐
                          </motion.span>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Title & Description */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center space-y-2"
                  >
                    <h3 className="text-xl font-black">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    
                    {/* Points earned */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="flex items-center justify-center gap-2 pt-4"
                    >
                      <div className="flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg">
                        <Star className="h-4 w-4" />
                        <span>+{achievement.points}</span>
                        <span className="text-sm">{text.points}</span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tap to close hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1 }}
                className="text-center text-xs text-muted-foreground mt-6"
              >
                {text.tapToClose}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};