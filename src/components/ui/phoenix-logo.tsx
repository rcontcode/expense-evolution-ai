import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';
import { cn } from '@/lib/utils';

export type PhoenixVariant = 'hero' | 'sidebar' | 'mini' | 'badge';
export type PhoenixState = 'default' | 'flames' | 'smoke' | 'rebirth' | 'auto';

interface PhoenixLogoProps {
  variant?: PhoenixVariant;
  state?: PhoenixState;
  className?: string;
  showEffects?: boolean;
  showText?: boolean;
}

// Size configurations for each variant
const variantConfig = {
  hero: { 
    container: 'w-40 h-40 md:w-48 md:h-48', 
    glow: 'w-44 h-44 md:w-52 md:h-52', 
    flames: 21, 
    embers: 20, 
    smokeCount: 18,
    sparkles: 24,
    scale: 1,
    ring: 'ring-4',
    blur: 'blur-md',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  sidebar: { 
    container: 'w-16 h-16', 
    glow: 'w-20 h-20', 
    flames: 10, 
    embers: 10, 
    smokeCount: 6,
    sparkles: 8,
    scale: 0.7,
    ring: 'ring-2',
    blur: 'blur-md',
    shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  mini: { 
    container: 'w-10 h-10', 
    glow: 'w-12 h-12', 
    flames: 6, 
    embers: 6, 
    smokeCount: 4,
    sparkles: 6,
    scale: 0.4,
    ring: 'ring-2',
    blur: 'blur-sm',
    shadow: '0 4px 10px -2px rgba(0, 0, 0, 0.15)',
  },
  badge: { 
    container: 'w-7 h-7', 
    glow: 'w-8 h-8', 
    flames: 0, 
    embers: 0, 
    smokeCount: 0,
    sparkles: 0,
    scale: 0.3,
    ring: 'ring-1',
    blur: 'blur-none',
    shadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
};

export const PhoenixLogo = ({ 
  variant = 'sidebar', 
  state = 'auto',
  className, 
  showEffects = true,
  showText = false 
}: PhoenixLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showRebirth, setShowRebirth] = useState(false);
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  const config = variantConfig[variant];
  const isAutoMode = state === 'auto';
  const isBadge = variant === 'badge';
  
  // Determine actual visual state
  const visualState = useMemo(() => {
    if (state !== 'auto') return state;
    if (isHovered) return 'flames';
    if (showSmoke) return 'smoke';
    if (showRebirth) return 'rebirth';
    return 'default';
  }, [state, isHovered, showSmoke, showRebirth]);

  useEffect(() => {
    if (!isAutoMode || !showEffects || isBadge) return;
    
    if (!isHovered && hasBeenHovered) {
      setShowSmoke(true);
      setShowRebirth(false);
      
      const smokeTimer = setTimeout(() => {
        setShowSmoke(false);
        setShowRebirth(true);
      }, variant === 'hero' ? 2000 : 1500);
      
      const rebirthTimer = setTimeout(() => {
        setShowRebirth(false);
      }, variant === 'hero' ? 5000 : 3500);
      
      return () => {
        clearTimeout(smokeTimer);
        clearTimeout(rebirthTimer);
      };
    }
  }, [isHovered, hasBeenHovered, showEffects, isAutoMode, variant, isBadge]);

  const handleMouseEnter = () => {
    if (showEffects && isAutoMode && !isBadge) {
      setIsHovered(true);
      setHasBeenHovered(true);
      setShowSmoke(false);
      setShowRebirth(false);
    }
  };

  // Generate particles based on variant config
  const birdFlames = useMemo(() => {
    if (variant === 'hero') {
      // Hero variant has specific positioned flames for dramatic effect
      return [
        { x: 0, y: -70, delay: 0, size: 14, duration: 0.6 },
        { x: -8, y: -65, delay: 0.05, size: 10, duration: 0.5 },
        { x: 8, y: -65, delay: 0.08, size: 10, duration: 0.55 },
        { x: -45, y: -30, delay: 0.1, size: 12, duration: 0.7 },
        { x: -55, y: -20, delay: 0.15, size: 14, duration: 0.65 },
        { x: -60, y: -10, delay: 0.2, size: 16, duration: 0.6 },
        { x: -55, y: 0, delay: 0.25, size: 12, duration: 0.7 },
        { x: -45, y: 10, delay: 0.3, size: 10, duration: 0.65 },
        { x: 45, y: -30, delay: 0.12, size: 12, duration: 0.7 },
        { x: 55, y: -20, delay: 0.17, size: 14, duration: 0.65 },
        { x: 60, y: -10, delay: 0.22, size: 16, duration: 0.6 },
        { x: 55, y: 0, delay: 0.27, size: 12, duration: 0.7 },
        { x: 45, y: 10, delay: 0.32, size: 10, duration: 0.65 },
        { x: -15, y: -40, delay: 0.08, size: 11, duration: 0.55 },
        { x: 15, y: -40, delay: 0.1, size: 11, duration: 0.55 },
        { x: -20, y: -20, delay: 0.15, size: 10, duration: 0.6 },
        { x: 20, y: -20, delay: 0.18, size: 10, duration: 0.6 },
        { x: 0, y: -50, delay: 0.03, size: 12, duration: 0.5 },
        { x: -10, y: 30, delay: 0.35, size: 10, duration: 0.8 },
        { x: 10, y: 30, delay: 0.38, size: 10, duration: 0.8 },
        { x: 0, y: 40, delay: 0.4, size: 12, duration: 0.75 },
      ];
    }
    return Array.from({ length: config.flames }, (_, i) => ({
      x: (Math.random() - 0.5) * 40 * config.scale,
      y: -20 - Math.random() * 30 * config.scale,
      delay: i * 0.08,
      size: (6 + Math.random() * 6) * config.scale,
      duration: 0.5 + Math.random() * 0.3,
    }));
  }, [variant, config.flames, config.scale]);

  const embers = useMemo(() => Array.from({ length: config.embers }, (_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * (variant === 'hero' ? 80 : 30) * config.scale,
    startY: (Math.random() - 0.5) * (variant === 'hero' ? 40 : 20) * config.scale,
    delay: i * (variant === 'hero' ? 0.08 : 0.1),
    size: (variant === 'hero' ? 2 + Math.random() * 4 : 1.5 + Math.random() * 2) * config.scale,
    duration: (variant === 'hero' ? 1.5 + Math.random() * 1 : 1 + Math.random() * 0.5),
  })), [config.embers, config.scale, variant]);

  const smokeParticles = useMemo(() => Array.from({ length: config.smokeCount }, (_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * (variant === 'hero' ? 100 : 30) * config.scale,
    startY: (Math.random() - 0.5) * (variant === 'hero' ? 60 : 20) * config.scale,
    delay: i * (variant === 'hero' ? 0.06 : 0.08),
    size: (variant === 'hero' ? 15 + Math.random() * 25 : 8 + Math.random() * 10) * config.scale,
    duration: (variant === 'hero' ? 2 + Math.random() * 1.5 : 1.5 + Math.random() * 0.5),
    drift: (Math.random() - 0.5) * (variant === 'hero' ? 60 : 30),
  })), [config.smokeCount, config.scale, variant]);

  const goldenSparkles = useMemo(() => Array.from({ length: config.sparkles }, (_, i) => ({
    id: i,
    angle: i * (variant === 'hero' ? 15 : 45),
    delay: i * (variant === 'hero' ? 0.05 : 0.08),
    distance: (variant === 'hero' ? 70 + Math.random() * 40 : 30 + Math.random() * 15) * config.scale,
    size: (variant === 'hero' ? 3 + Math.random() * 5 : 2 + Math.random() * 2) * config.scale,
    duration: (variant === 'hero' ? 1.5 + Math.random() * 1 : 1 + Math.random() * 0.5),
  })), [config.sparkles, config.scale, variant]);

  // State-based colors
  const isFlamesState = visualState === 'flames';
  const isSmokeState = visualState === 'smoke';
  const isRebirthState = visualState === 'rebirth';

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div 
        className="relative z-10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Base glow ring */}
        {showEffects && !isBadge && (
          <motion.div 
            className={cn("absolute inset-0 rounded-full -z-10", config.glow, config.blur)}
            style={{ margin: 'auto', top: 0, bottom: 0, left: 0, right: 0 }}
            animate={{
              background: isFlamesState 
                ? 'linear-gradient(to right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(234, 88, 12))'
                : isSmokeState
                ? 'linear-gradient(to right, rgb(156, 163, 175), rgb(107, 114, 128), rgb(156, 163, 175))'
                : isRebirthState
                ? 'linear-gradient(to right, rgb(250, 204, 21), rgb(245, 158, 11), rgb(234, 179, 8))'
                : 'linear-gradient(to right, rgb(34, 211, 238), rgb(59, 130, 246), rgb(20, 184, 166))',
              scale: isFlamesState ? 1.1 : isRebirthState ? 1.15 : 1,
              opacity: isSmokeState ? 0.5 : variant === 'hero' ? 1 : 0.7,
            }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Main logo container */}
        <motion.div 
          className={cn(
            "relative rounded-full bg-white shadow-xl flex items-center justify-center overflow-visible ring-white/60 cursor-pointer",
            config.container,
            config.ring
          )}
          animate={{
            boxShadow: isFlamesState 
              ? variant === 'hero' 
                ? '0 0 60px rgba(251, 146, 60, 0.7), 0 0 100px rgba(239, 68, 68, 0.5), 0 0 140px rgba(234, 88, 12, 0.3)'
                : '0 0 30px rgba(251, 146, 60, 0.6), 0 0 50px rgba(239, 68, 68, 0.4)'
              : isSmokeState
              ? variant === 'hero'
                ? '0 0 40px rgba(156, 163, 175, 0.4), 0 0 60px rgba(107, 114, 128, 0.2)'
                : '0 0 20px rgba(156, 163, 175, 0.3)'
              : isRebirthState
              ? variant === 'hero'
                ? '0 0 60px rgba(250, 204, 21, 0.6), 0 0 100px rgba(245, 158, 11, 0.4), 0 0 140px rgba(234, 179, 8, 0.3)'
                : '0 0 30px rgba(250, 204, 21, 0.5), 0 0 50px rgba(245, 158, 11, 0.3)'
              : config.shadow,
          }}
          transition={{ duration: variant === 'hero' ? 0.4 : 0.3 }}
        >
          {/* Fire overlay */}
          <AnimatePresence>
            {isFlamesState && showEffects && !isBadge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: variant === 'hero' ? 0.5 : 0.3 } }}
                className="absolute inset-2 rounded-full pointer-events-none z-20"
                style={{
                  background: `radial-gradient(ellipse at center 40%, rgba(251, 146, 60, ${variant === 'hero' ? 0.3 : 0.25}) 0%, rgba(239, 68, 68, ${variant === 'hero' ? 0.2 : 0.15}) 40%, transparent 70%)`,
                  mixBlendMode: 'overlay',
                }}
              />
            )}
          </AnimatePresence>

          {/* Smoke overlay */}
          <AnimatePresence>
            {isSmokeState && showEffects && !isBadge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: variant === 'hero' ? 0.3 : 0.25 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full pointer-events-none z-20"
                style={{
                  background: 'radial-gradient(circle, rgba(156, 163, 175, 0.4) 0%, transparent 70%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Golden rebirth overlay */}
          <AnimatePresence>
            {isRebirthState && showEffects && !isBadge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: variant === 'hero' ? 1 : 0.8 }}
                className="absolute inset-0 rounded-full pointer-events-none z-20"
                style={{
                  background: 'radial-gradient(circle, rgba(250, 204, 21, 0.3) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 70%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Phoenix logo */}
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <motion.img 
              src={phoenixLogo} 
              alt="EvoFinz Phoenix" 
              className={cn(
                "object-contain relative z-10",
                variant === 'hero' ? 'w-[115%] h-[115%]' : 'w-[120%] h-[120%]'
              )}
              animate={{
                filter: isFlamesState 
                  ? variant === 'hero'
                    ? 'drop-shadow(0 0 15px rgba(251, 146, 60, 0.9)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.6)) brightness(1.15) saturate(1.2)'
                    : 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.8)) drop-shadow(0 0 15px rgba(239, 68, 68, 0.5)) brightness(1.1) saturate(1.15)'
                  : isSmokeState
                  ? 'drop-shadow(0 0 10px rgba(156, 163, 175, 0.5)) brightness(0.95) saturate(0.9)'
                  : isRebirthState
                  ? variant === 'hero'
                    ? 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.9)) drop-shadow(0 0 40px rgba(245, 158, 11, 0.6)) brightness(1.2) saturate(1.3)'
                    : 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8)) drop-shadow(0 0 20px rgba(245, 158, 11, 0.5)) brightness(1.15) saturate(1.25)'
                  : 'none',
                scale: isRebirthState ? [1, 1.05, 1] : 1,
              }}
              transition={{ 
                duration: isRebirthState ? (variant === 'hero' ? 2 : 1.5) : (variant === 'hero' ? 0.4 : 0.3),
                repeat: isRebirthState ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>

        {/* FLAMES - Only render for non-badge variants */}
        <AnimatePresence>
          {isFlamesState && showEffects && !isBadge && (
            <>
              {birdFlames.map((flame, i) => (
                <motion.div
                  key={`flame-${i}`}
                  className="absolute left-1/2 top-1/2 pointer-events-none z-30"
                  style={{ marginLeft: flame.x, marginTop: flame.y }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0.9, 0],
                    scale: [0.2, 1, 1.3, 0.8],
                    y: [0, -20 * config.scale, -45 * config.scale, -70 * config.scale],
                    x: [0, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 15],
                  }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                  transition={{ duration: flame.duration, delay: flame.delay, repeat: Infinity, ease: "easeOut" }}
                >
                  <svg width={flame.size} height={flame.size * 2} viewBox="0 0 20 40" className="drop-shadow-lg">
                    <defs>
                      <linearGradient id={`flameGrad-${variant}-${i}`} x1="0%" y1="100%" x2="0%" y2="0%">
                        <motion.stop offset="0%" animate={{ stopColor: ['#FDE047', '#FB923C', '#FDE047'] }} transition={{ duration: 0.3, repeat: Infinity }} />
                        <motion.stop offset="50%" animate={{ stopColor: ['#FB923C', '#EF4444', '#FB923C'] }} transition={{ duration: 0.3, repeat: Infinity }} />
                        <motion.stop offset="100%" animate={{ stopColor: ['#EF4444', '#DC2626', '#EF4444'] }} transition={{ duration: 0.3, repeat: Infinity }} />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M10 40C10 40 2 28 2 18C2 8 6 0 10 0C14 0 18 8 18 18C18 28 10 40 10 40Z"
                      fill={`url(#flameGrad-${variant}-${i})`}
                      animate={{
                        d: [
                          "M10 40C10 40 2 28 2 18C2 8 6 0 10 0C14 0 18 8 18 18C18 28 10 40 10 40Z",
                          "M10 40C10 40 3 26 3 16C3 6 7 0 10 0C13 0 17 6 17 16C17 26 10 40 10 40Z",
                          "M10 40C10 40 2 28 2 18C2 8 6 0 10 0C14 0 18 8 18 18C18 28 10 40 10 40Z",
                        ],
                      }}
                      transition={{ duration: 0.2, repeat: Infinity }}
                    />
                  </svg>
                </motion.div>
              ))}

              {embers.map((ember) => (
                <motion.div
                  key={`ember-${ember.id}`}
                  className="absolute left-1/2 top-1/2 pointer-events-none rounded-full z-40"
                  style={{ width: ember.size, height: ember.size, marginLeft: ember.startX, marginTop: ember.startY }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0.5, 0],
                    scale: [0.5, 1, 0.8, 0.5, 0.2],
                    y: [0, -40 * config.scale, -90 * config.scale, -140 * config.scale, -180 * config.scale],
                    x: [0, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: ember.duration, delay: ember.delay, repeat: Infinity, ease: "easeOut" }}
                >
                  <motion.div
                    className="w-full h-full rounded-full"
                    animate={{
                      background: ['radial-gradient(circle, #FEF08A 0%, #FB923C 100%)', 'radial-gradient(circle, #FB923C 0%, #EF4444 100%)', 'radial-gradient(circle, #FEF08A 0%, #FB923C 100%)'],
                      boxShadow: ['0 0 8px #FB923C, 0 0 16px #EF4444', '0 0 12px #FEF08A, 0 0 20px #FB923C', '0 0 8px #FB923C, 0 0 16px #EF4444'],
                    }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* SMOKE */}
        <AnimatePresence>
          {isSmokeState && showEffects && !isBadge && (
            <>
              {smokeParticles.map((smoke) => (
                <motion.div
                  key={`smoke-${smoke.id}`}
                  className="absolute left-1/2 top-1/2 pointer-events-none z-30"
                  style={{ marginLeft: smoke.startX, marginTop: smoke.startY }}
                  initial={{ opacity: 0, scale: 0.3, y: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0.4, 0.2, 0],
                    scale: [0.3, 0.8, 1.2, 1.8, 2.5],
                    y: [0, -30 * config.scale, -70 * config.scale, -120 * config.scale, -180 * config.scale],
                    x: [0, smoke.drift * 0.3, smoke.drift * 0.6, smoke.drift],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: smoke.duration, delay: smoke.delay, ease: "easeOut" }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: smoke.size,
                      height: smoke.size,
                      background: `radial-gradient(circle, rgba(156, 163, 175, 0.6) 0%, rgba(107, 114, 128, 0.3) 50%, transparent 70%)`,
                      filter: `blur(${variant === 'hero' ? 8 : 4}px)`,
                    }}
                  />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* GOLDEN REBIRTH */}
        <AnimatePresence>
          {isRebirthState && showEffects && !isBadge && (
            <>
              {/* Expanding golden rings */}
              {[0, 1, ...(variant === 'hero' ? [2] : [])].map((ring) => (
                <motion.div
                  key={`ring-${ring}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none border-2"
                  initial={{ width: 40 * config.scale, height: 40 * config.scale, opacity: 0 }}
                  animate={{
                    width: [40 * config.scale, (variant === 'hero' ? 280 : 80) * config.scale, (variant === 'hero' ? 400 : 120) * config.scale],
                    height: [40 * config.scale, (variant === 'hero' ? 280 : 80) * config.scale, (variant === 'hero' ? 400 : 120) * config.scale],
                    opacity: [0.8, 0.4, 0],
                    borderColor: ['rgba(250, 204, 21, 0.8)', 'rgba(245, 158, 11, 0.4)', 'rgba(234, 179, 8, 0)'],
                  }}
                  transition={{
                    duration: variant === 'hero' ? 2 : 1.5,
                    delay: ring * (variant === 'hero' ? 0.5 : 0.4),
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Golden sparkles */}
              {goldenSparkles.map((sparkle) => (
                <motion.div
                  key={`sparkle-${sparkle.id}`}
                  className="absolute left-1/2 top-1/2 pointer-events-none z-40"
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.2, 1, 0.5],
                    x: [0, Math.cos(sparkle.angle * Math.PI / 180) * sparkle.distance],
                    y: [0, Math.sin(sparkle.angle * Math.PI / 180) * sparkle.distance],
                  }}
                  transition={{
                    duration: sparkle.duration,
                    delay: sparkle.delay,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                >
                  <motion.div
                    className="rounded-full"
                    style={{ width: sparkle.size, height: sparkle.size }}
                    animate={{
                      background: [
                        'radial-gradient(circle, #FEF08A 0%, #FACC15 100%)',
                        'radial-gradient(circle, #FACC15 0%, #F59E0B 100%)',
                        'radial-gradient(circle, #FEF08A 0%, #FACC15 100%)',
                      ],
                      boxShadow: [
                        '0 0 10px #FACC15, 0 0 20px #F59E0B',
                        '0 0 15px #FEF08A, 0 0 25px #FACC15',
                        '0 0 10px #FACC15, 0 0 20px #F59E0B',
                      ],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Optional text below logo */}
      {showText && (
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-3xl md:text-4xl font-black tracking-tight"
        >
          <motion.span 
            className="bg-clip-text text-transparent"
            animate={{
              backgroundImage: isFlamesState
                ? 'linear-gradient(to right, rgb(234, 88, 12), rgb(220, 38, 38), rgb(245, 158, 11))'
                : isRebirthState
                ? 'linear-gradient(to right, rgb(250, 204, 21), rgb(245, 158, 11), rgb(234, 179, 8))'
                : [
                    'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235), rgb(20, 184, 166))',
                    'linear-gradient(to right, rgb(234, 88, 12), rgb(220, 38, 38), rgb(245, 158, 11))',
                    'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235), rgb(20, 184, 166))'
                  ]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            EvoFinz
          </motion.span>
        </motion.h2>
      )}
    </div>
  );
};