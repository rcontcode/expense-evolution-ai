import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';
import { cn } from '@/lib/utils';

interface PhoenixLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showEffects?: boolean;
}

export const PhoenixLogo = ({ size = 'md', className, showEffects = true }: PhoenixLogoProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showRebirth, setShowRebirth] = useState(false);
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-12 h-12', glow: 'w-14 h-14', flames: 6, embers: 6, scale: 0.5 },
    md: { container: 'w-16 h-16', glow: 'w-20 h-20', flames: 10, embers: 10, scale: 0.7 },
    lg: { container: 'w-24 h-24', glow: 'w-28 h-28', flames: 14, embers: 14, scale: 1 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (!isHovered && hasBeenHovered && showEffects) {
      setShowSmoke(true);
      setShowRebirth(false);
      
      const smokeTimer = setTimeout(() => {
        setShowSmoke(false);
        setShowRebirth(true);
      }, 1500);
      
      const rebirthTimer = setTimeout(() => {
        setShowRebirth(false);
      }, 3500);
      
      return () => {
        clearTimeout(smokeTimer);
        clearTimeout(rebirthTimer);
      };
    }
  }, [isHovered, hasBeenHovered, showEffects]);

  const handleMouseEnter = () => {
    if (showEffects) {
      setIsHovered(true);
      setHasBeenHovered(true);
      setShowSmoke(false);
      setShowRebirth(false);
    }
  };

  // Generate flames based on size
  const birdFlames = Array.from({ length: config.flames }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 40 * config.scale,
    y: -20 - Math.random() * 30 * config.scale,
    delay: i * 0.08,
    size: (6 + Math.random() * 6) * config.scale,
    duration: 0.5 + Math.random() * 0.3,
  }));

  const embers = Array.from({ length: config.embers }, (_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * 30 * config.scale,
    startY: (Math.random() - 0.5) * 20 * config.scale,
    delay: i * 0.1,
    size: (1.5 + Math.random() * 2) * config.scale,
    duration: 1 + Math.random() * 0.5,
  }));

  const smokeParticles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * 30 * config.scale,
    startY: (Math.random() - 0.5) * 20 * config.scale,
    delay: i * 0.08,
    size: (8 + Math.random() * 10) * config.scale,
    duration: 1.5 + Math.random() * 0.5,
    drift: (Math.random() - 0.5) * 30,
  }));

  const goldenSparkles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: i * 45,
    delay: i * 0.08,
    distance: 30 * config.scale + Math.random() * 15 * config.scale,
    size: (2 + Math.random() * 2) * config.scale,
    duration: 1 + Math.random() * 0.5,
  }));

  return (
    <motion.div 
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base glow ring */}
      {showEffects && (
        <motion.div 
          className={cn("absolute inset-0 rounded-full blur-md -z-10", config.glow)}
          style={{ margin: 'auto', top: 0, bottom: 0, left: 0, right: 0 }}
          animate={{
            background: isHovered 
              ? 'linear-gradient(to right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(234, 88, 12))'
              : showSmoke
              ? 'linear-gradient(to right, rgb(156, 163, 175), rgb(107, 114, 128), rgb(156, 163, 175))'
              : showRebirth
              ? 'linear-gradient(to right, rgb(250, 204, 21), rgb(245, 158, 11), rgb(234, 179, 8))'
              : 'linear-gradient(to right, rgb(34, 211, 238), rgb(59, 130, 246), rgb(20, 184, 166))',
            scale: isHovered ? 1.15 : showRebirth ? 1.2 : 1,
            opacity: showSmoke ? 0.4 : 0.7,
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Main logo container */}
      <motion.div 
        className={cn(
          "relative rounded-full bg-white shadow-xl flex items-center justify-center overflow-visible ring-2 ring-white/60 cursor-pointer",
          config.container
        )}
        animate={{
          boxShadow: isHovered 
            ? '0 0 30px rgba(251, 146, 60, 0.6), 0 0 50px rgba(239, 68, 68, 0.4)'
            : showSmoke
            ? '0 0 20px rgba(156, 163, 175, 0.3)'
            : showRebirth
            ? '0 0 30px rgba(250, 204, 21, 0.5), 0 0 50px rgba(245, 158, 11, 0.3)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Fire overlay */}
        <AnimatePresence>
          {isHovered && showEffects && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute inset-2 rounded-full pointer-events-none z-20"
              style={{
                background: 'radial-gradient(ellipse at center 40%, rgba(251, 146, 60, 0.25) 0%, rgba(239, 68, 68, 0.15) 40%, transparent 70%)',
                mixBlendMode: 'overlay',
              }}
            />
          )}
        </AnimatePresence>

        {/* Smoke overlay */}
        <AnimatePresence>
          {showSmoke && showEffects && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full pointer-events-none z-20"
              style={{
                background: 'radial-gradient(circle, rgba(156, 163, 175, 0.3) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Golden rebirth overlay */}
        <AnimatePresence>
          {showRebirth && showEffects && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.25] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-full pointer-events-none z-20"
              style={{
                background: 'radial-gradient(circle, rgba(250, 204, 21, 0.25) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Phoenix logo */}
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
          <motion.img 
            src={phoenixLogo} 
            alt="EvoFinz Phoenix" 
            className="w-[120%] h-[120%] object-contain relative z-10"
            animate={{
              filter: isHovered 
                ? 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.8)) drop-shadow(0 0 15px rgba(239, 68, 68, 0.5)) brightness(1.1) saturate(1.15)' 
                : showSmoke
                ? 'drop-shadow(0 0 5px rgba(156, 163, 175, 0.4)) brightness(0.95) saturate(0.9)'
                : showRebirth
                ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8)) drop-shadow(0 0 20px rgba(245, 158, 11, 0.5)) brightness(1.15) saturate(1.25)'
                : 'none',
              scale: showRebirth ? [1, 1.03, 1] : 1,
            }}
            transition={{ 
              duration: showRebirth ? 1.5 : 0.3,
              repeat: showRebirth ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>

      {/* FLAMES */}
      <AnimatePresence>
        {isHovered && showEffects && (
          <>
            {birdFlames.map((flame) => (
              <motion.div
                key={`flame-${flame.id}`}
                className="absolute left-1/2 top-1/2 pointer-events-none z-30"
                style={{ marginLeft: flame.x, marginTop: flame.y }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.2, 1, 1.2, 0.6],
                  y: [0, -15 * config.scale, -35 * config.scale, -55 * config.scale],
                  x: [0, (Math.random() - 0.5) * 8],
                }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.15 } }}
                transition={{ duration: flame.duration, delay: flame.delay, repeat: Infinity, ease: "easeOut" }}
              >
                <svg width={flame.size} height={flame.size * 2} viewBox="0 0 20 40" className="drop-shadow-md">
                  <defs>
                    <linearGradient id={`flameGrad-sm-${flame.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                      <motion.stop offset="0%" animate={{ stopColor: ['#FDE047', '#FB923C', '#FDE047'] }} transition={{ duration: 0.25, repeat: Infinity }} />
                      <motion.stop offset="50%" animate={{ stopColor: ['#FB923C', '#EF4444', '#FB923C'] }} transition={{ duration: 0.25, repeat: Infinity }} />
                      <motion.stop offset="100%" animate={{ stopColor: ['#EF4444', '#DC2626', '#EF4444'] }} transition={{ duration: 0.25, repeat: Infinity }} />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M10 40C10 40 2 28 2 18C2 8 6 0 10 0C14 0 18 8 18 18C18 28 10 40 10 40Z"
                    fill={`url(#flameGrad-sm-${flame.id})`}
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
                  opacity: [0, 1, 0.8, 0.4, 0],
                  scale: [0.5, 1, 0.7, 0.4, 0.2],
                  y: [0, -25 * config.scale, -55 * config.scale, -85 * config.scale, -110 * config.scale],
                  x: [0, (Math.random() - 0.5) * 20],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: ember.duration, delay: ember.delay, repeat: Infinity, ease: "easeOut" }}
              >
                <motion.div
                  className="w-full h-full rounded-full"
                  animate={{
                    background: ['radial-gradient(circle, #FEF08A 0%, #FB923C 100%)', 'radial-gradient(circle, #FB923C 0%, #EF4444 100%)', 'radial-gradient(circle, #FEF08A 0%, #FB923C 100%)'],
                    boxShadow: ['0 0 4px #FB923C, 0 0 8px #EF4444', '0 0 6px #FEF08A, 0 0 10px #FB923C', '0 0 4px #FB923C, 0 0 8px #EF4444'],
                  }}
                  transition={{ duration: 0.25, repeat: Infinity }}
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* SMOKE */}
      <AnimatePresence>
        {showSmoke && showEffects && (
          <>
            {smokeParticles.map((smoke) => (
              <motion.div
                key={`smoke-${smoke.id}`}
                className="absolute left-1/2 top-1/2 pointer-events-none z-30"
                style={{ marginLeft: smoke.startX, marginTop: smoke.startY }}
                initial={{ opacity: 0, scale: 0.3, y: 0 }}
                animate={{
                  opacity: [0, 0.5, 0.3, 0.15, 0],
                  scale: [0.3, 0.7, 1, 1.5, 2],
                  y: [0, -20 * config.scale, -50 * config.scale, -80 * config.scale, -110 * config.scale],
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
                    background: `radial-gradient(circle, rgba(156, 163, 175, 0.5) 0%, rgba(107, 114, 128, 0.25) 50%, transparent 70%)`,
                    filter: 'blur(4px)',
                  }}
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* GOLDEN REBIRTH */}
      <AnimatePresence>
        {showRebirth && showEffects && (
          <>
            {/* Expanding golden rings */}
            {[0, 1].map((ring) => (
              <motion.div
                key={`ring-${ring}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none border"
                initial={{ width: 40 * config.scale, height: 40 * config.scale, opacity: 0 }}
                animate={{
                  width: [40 * config.scale, 80 * config.scale, 120 * config.scale],
                  height: [40 * config.scale, 80 * config.scale, 120 * config.scale],
                  opacity: [0.6, 0.3, 0],
                  borderColor: ['rgba(250, 204, 21, 0.7)', 'rgba(245, 158, 11, 0.3)', 'rgba(234, 179, 8, 0)'],
                }}
                transition={{
                  duration: 1.5,
                  delay: ring * 0.4,
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
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.5, 1, 0.8, 0.4],
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
                      '0 0 5px #FACC15, 0 0 10px #F59E0B',
                      '0 0 8px #FEF08A, 0 0 12px #FACC15',
                      '0 0 5px #FACC15, 0 0 10px #F59E0B',
                    ],
                  }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
