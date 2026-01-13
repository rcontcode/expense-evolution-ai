import React from 'react';
import { motion } from 'framer-motion';

interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StreakFlame = ({ streak, size = 'md', showLabel = true }: StreakFlameProps) => {
  const sizeConfig = {
    sm: { flame: 'text-2xl', container: 'w-10 h-10', label: 'text-xs' },
    md: { flame: 'text-4xl', container: 'w-16 h-16', label: 'text-sm' },
    lg: { flame: 'text-6xl', container: 'w-24 h-24', label: 'text-base' },
  };

  const config = sizeConfig[size];

  // Intensity based on streak length
  const getIntensity = () => {
    if (streak >= 30) return { color: 'from-violet-500 via-fuchsia-500 to-pink-500', particles: 8, label: '🔥 LEGENDARIO' };
    if (streak >= 14) return { color: 'from-orange-400 via-red-500 to-rose-600', particles: 6, label: '🔥 ÉPICO' };
    if (streak >= 7) return { color: 'from-amber-400 via-orange-500 to-red-500', particles: 4, label: '🔥 FUEGO' };
    if (streak >= 3) return { color: 'from-yellow-400 via-amber-500 to-orange-500', particles: 2, label: '🔥' };
    return { color: 'from-yellow-300 to-amber-400', particles: 1, label: '🔥' };
  };

  const intensity = getIntensity();

  if (streak === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className={`${config.container} rounded-full bg-muted flex items-center justify-center`}>
          <span className={`${config.flame} opacity-30`}>🔥</span>
        </div>
        {showLabel && (
          <span className={`${config.label} text-muted-foreground mt-1`}>Sin racha</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center relative">
      {/* Glow effect */}
      <motion.div
        className={`absolute ${config.container} rounded-full bg-gradient-to-t ${intensity.color} blur-xl opacity-50`}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Main flame container */}
      <div className={`relative ${config.container} flex items-center justify-center`}>
        {/* Rising particles */}
        {[...Array(intensity.particles)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ y: 0, x: 0, opacity: 0 }}
            animate={{
              y: [-10, -40],
              x: [(i - intensity.particles / 2) * 5, (i - intensity.particles / 2) * 8],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <span className="text-orange-400 text-xs">✨</span>
          </motion.div>
        ))}

        {/* Main flame */}
        <motion.span
          className={config.flame}
          animate={{
            scale: [1, 1.1, 0.95, 1],
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          🔥
        </motion.span>

        {/* Streak number badge */}
        <motion.div
          className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-black shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
        >
          {streak}
        </motion.div>
      </div>

      {/* Label */}
      {showLabel && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={`${config.label} font-bold bg-gradient-to-r ${intensity.color} bg-clip-text text-transparent`}>
            {streak} días
          </span>
          {streak >= 7 && (
            <motion.span
              className="block text-xs text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {intensity.label}
            </motion.span>
          )}
        </motion.div>
      )}
    </div>
  );
};