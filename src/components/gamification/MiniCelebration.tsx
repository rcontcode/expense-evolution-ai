import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Zap, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export type CelebrationType = 'xp' | 'streak' | 'milestone' | 'achievement' | 'level';

interface MiniCelebrationProps {
  type: CelebrationType;
  value?: number | string;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

const celebrationConfig: Record<CelebrationType, {
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  confettiColors: string[];
}> = {
  xp: {
    icon: Sparkles,
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    confettiColors: ['#f59e0b', '#fbbf24', '#fcd34d']
  },
  streak: {
    icon: Flame,
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    confettiColors: ['#f97316', '#ef4444', '#fbbf24']
  },
  milestone: {
    icon: Star,
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    confettiColors: ['#a855f7', '#ec4899', '#8b5cf6']
  },
  achievement: {
    icon: Trophy,
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    confettiColors: ['#10b981', '#14b8a6', '#34d399']
  },
  level: {
    icon: Zap,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    confettiColors: ['#06b6d4', '#3b82f6', '#0ea5e9']
  }
};

export function MiniCelebration({
  type,
  value,
  message,
  duration = 3000,
  onComplete
}: MiniCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = celebrationConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    // Trigger mini confetti
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8, x: 0.5 },
      colors: config.confettiColors,
      scalar: 0.8,
      gravity: 1.5,
      drift: 0
    });

    // Auto-hide
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete, config.confettiColors]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className={`relative overflow-hidden bg-gradient-to-r ${config.bgGradient} backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl px-6 py-4`}>
            {/* Animated glow */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} opacity-50`}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            <div className="relative flex items-center gap-4">
              {/* Icon with pulse */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className={`p-3 rounded-xl bg-white/10 ${config.color}`}
              >
                <Icon className="h-6 w-6" />
              </motion.div>

              {/* Content */}
              <div>
                {value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className={`text-2xl font-bold ${config.color}`}
                  >
                    +{value}
                  </motion.div>
                )}
                {message && (
                  <p className="text-sm text-white/80 font-medium">{message}</p>
                )}
              </div>

              {/* Floating particles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1,
                    scale: 1
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 100, 
                    y: -50 - Math.random() * 50,
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ 
                    duration: 1 + Math.random() * 0.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger mini celebrations
import { createContext, useContext, useCallback, ReactNode } from 'react';

interface MiniCelebrationContextType {
  celebrate: (type: CelebrationType, value?: number | string, message?: string) => void;
}

const MiniCelebrationContext = createContext<MiniCelebrationContextType | undefined>(undefined);

export function MiniCelebrationProvider({ children }: { children: ReactNode }) {
  const [celebrations, setCelebrations] = useState<Array<{
    id: string;
    type: CelebrationType;
    value?: number | string;
    message?: string;
  }>>([]);

  const celebrate = useCallback((type: CelebrationType, value?: number | string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setCelebrations(prev => [...prev, { id, type, value, message }]);
  }, []);

  const removeCelebration = useCallback((id: string) => {
    setCelebrations(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <MiniCelebrationContext.Provider value={{ celebrate }}>
      {children}
      {celebrations.map(celebration => (
        <MiniCelebration
          key={celebration.id}
          type={celebration.type}
          value={celebration.value}
          message={celebration.message}
          onComplete={() => removeCelebration(celebration.id)}
        />
      ))}
    </MiniCelebrationContext.Provider>
  );
}

export function useMiniCelebration() {
  const context = useContext(MiniCelebrationContext);
  if (!context) {
    throw new Error('useMiniCelebration must be used within a MiniCelebrationProvider');
  }
  return context;
}
