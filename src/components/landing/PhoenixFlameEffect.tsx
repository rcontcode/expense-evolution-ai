import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';

const PhoenixFlameEffect = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showRebirth, setShowRebirth] = useState(false);
  const [hasBeenHovered, setHasBeenHovered] = useState(false);

  useEffect(() => {
    if (!isHovered && hasBeenHovered) {
      setShowSmoke(true);
      setShowRebirth(false);
      
      // After smoke, trigger golden rebirth
      const smokeTimer = setTimeout(() => {
        setShowSmoke(false);
        setShowRebirth(true);
      }, 2000);
      
      // Rebirth glow fades after a while
      const rebirthTimer = setTimeout(() => {
        setShowRebirth(false);
      }, 5000);
      
      return () => {
        clearTimeout(smokeTimer);
        clearTimeout(rebirthTimer);
      };
    }
  }, [isHovered, hasBeenHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setHasBeenHovered(true);
    setShowSmoke(false);
    setShowRebirth(false);
  };

  // Flames emanating from the bird's body/wings
  const birdFlames = [
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

  const embers = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    startX: -40 + Math.random() * 80,
    startY: -30 + Math.random() * 40,
    delay: i * 0.08,
    size: 2 + Math.random() * 4,
    duration: 1.5 + Math.random() * 1,
  }));

  const smokeParticles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    startX: -50 + Math.random() * 100,
    startY: -40 + Math.random() * 60,
    delay: i * 0.06,
    size: 15 + Math.random() * 25,
    duration: 2 + Math.random() * 1.5,
    drift: (Math.random() - 0.5) * 60,
  }));

  // Golden sparkles for rebirth
  const goldenSparkles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i * 15),
    delay: i * 0.05,
    distance: 70 + Math.random() * 40,
    size: 3 + Math.random() * 5,
    duration: 1.5 + Math.random() * 1,
  }));

  return (
    <motion.div 
      className="relative z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base glow ring - changes color based on state */}
      <motion.div 
        className="absolute inset-0 w-40 h-40 md:w-48 md:h-48 rounded-full blur-md"
        animate={{
          background: isHovered 
            ? 'linear-gradient(to right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(234, 88, 12))'
            : showSmoke
            ? 'linear-gradient(to right, rgb(156, 163, 175), rgb(107, 114, 128), rgb(156, 163, 175))'
            : showRebirth
            ? 'linear-gradient(to right, rgb(250, 204, 21), rgb(245, 158, 11), rgb(234, 179, 8))'
            : 'linear-gradient(to right, rgb(34, 211, 238), rgb(59, 130, 246), rgb(20, 184, 166))',
          scale: isHovered ? 1.1 : showRebirth ? 1.15 : 1,
          opacity: showSmoke ? 0.5 : 1,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Main logo container */}
      <motion.div 
        className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-visible ring-4 ring-white/80 cursor-pointer"
        animate={{
          boxShadow: isHovered 
            ? '0 0 60px rgba(251, 146, 60, 0.7), 0 0 100px rgba(239, 68, 68, 0.5), 0 0 140px rgba(234, 88, 12, 0.3)'
            : showSmoke
            ? '0 0 40px rgba(156, 163, 175, 0.4), 0 0 60px rgba(107, 114, 128, 0.2)'
            : showRebirth
            ? '0 0 60px rgba(250, 204, 21, 0.6), 0 0 100px rgba(245, 158, 11, 0.4), 0 0 140px rgba(234, 179, 8, 0.3)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        transition={{ duration: 0.4 }}
      >
        {/* Fire overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-4 rounded-full pointer-events-none z-20"
              style={{
                background: 'radial-gradient(ellipse at center 40%, rgba(251, 146, 60, 0.3) 0%, rgba(239, 68, 68, 0.2) 40%, transparent 70%)',
                mixBlendMode: 'overlay',
              }}
            />
          )}
        </AnimatePresence>

        {/* Smoke overlay */}
        <AnimatePresence>
          {showSmoke && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
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
          {showRebirth && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 rounded-full pointer-events-none z-20"
              style={{
                background: 'radial-gradient(circle, rgba(250, 204, 21, 0.3) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Phoenix logo with effects */}
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
          <motion.img 
            src={phoenixLogo} 
            alt="EvoFinz Phoenix" 
            className="w-[115%] h-[115%] object-contain relative z-10"
            animate={{
              filter: isHovered 
                ? 'drop-shadow(0 0 15px rgba(251, 146, 60, 0.9)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.6)) brightness(1.15) saturate(1.2)' 
                : showSmoke
                ? 'drop-shadow(0 0 10px rgba(156, 163, 175, 0.5)) brightness(0.95) saturate(0.9)'
                : showRebirth
                ? 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.9)) drop-shadow(0 0 40px rgba(245, 158, 11, 0.6)) brightness(1.2) saturate(1.3)'
                : 'none',
              scale: showRebirth ? [1, 1.05, 1] : 1,
            }}
            transition={{ 
              duration: showRebirth ? 2 : 0.4,
              repeat: showRebirth ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>

      {/* FLAMES */}
      <AnimatePresence>
        {isHovered && (
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
                  y: [0, -20, -45, -70],
                  x: [0, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 15],
                }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                transition={{ duration: flame.duration, delay: flame.delay, repeat: Infinity, ease: "easeOut" }}
              >
                <svg width={flame.size} height={flame.size * 2} viewBox="0 0 20 40" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id={`flameGrad-${i}`} x1="0%" y1="100%" x2="0%" y2="0%">
                      <motion.stop offset="0%" animate={{ stopColor: ['#FDE047', '#FB923C', '#FDE047'] }} transition={{ duration: 0.3, repeat: Infinity }} />
                      <motion.stop offset="50%" animate={{ stopColor: ['#FB923C', '#EF4444', '#FB923C'] }} transition={{ duration: 0.3, repeat: Infinity }} />
                      <motion.stop offset="100%" animate={{ stopColor: ['#EF4444', '#DC2626', '#EF4444'] }} transition={{ duration: 0.3, repeat: Infinity }} />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M10 40C10 40 2 28 2 18C2 8 6 0 10 0C14 0 18 8 18 18C18 28 10 40 10 40Z"
                    fill={`url(#flameGrad-${i})`}
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
                  y: [0, -40, -90, -140, -180],
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

            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-64 md:h-64 rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, rgba(239, 68, 68, 0.1) 50%, transparent 70%)', filter: 'blur(4px)' }}
            />
          </>
        )}
      </AnimatePresence>

      {/* SMOKE */}
      <AnimatePresence>
        {showSmoke && (
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
                  y: [0, -30, -70, -120, -180],
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
                    filter: 'blur(8px)',
                  }}
                />
              </motion.div>
            ))}

            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 md:w-60 md:h-60 rounded-full pointer-events-none"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2 }}
              style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(234, 88, 12, 0.1) 50%, transparent 70%)', filter: 'blur(15px)' }}
            />

            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`wisp-${i}`}
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{ marginLeft: -30 + i * 12, marginTop: -20 }}
                initial={{ opacity: 0, scaleY: 0.5 }}
                animate={{
                  opacity: [0, 0.4, 0.3, 0],
                  scaleY: [0.5, 1, 1.5, 2],
                  y: [0, -50, -100, -160],
                  x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
                  rotate: [0, (Math.random() - 0.5) * 30],
                }}
                transition={{ duration: 2.5, delay: i * 0.15, ease: "easeOut" }}
              >
                <div className="w-4 h-20 rounded-full" style={{ background: 'linear-gradient(to top, rgba(107, 114, 128, 0.4), rgba(156, 163, 175, 0.2), transparent)', filter: 'blur(6px)' }} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* GOLDEN REBIRTH */}
      <AnimatePresence>
        {showRebirth && (
          <>
            {/* Expanding golden rings */}
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={`ring-${ring}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none border-2"
                initial={{ width: 160, height: 160, opacity: 0 }}
                animate={{
                  width: [160, 280, 400],
                  height: [160, 280, 400],
                  opacity: [0.8, 0.4, 0],
                  borderColor: ['rgba(250, 204, 21, 0.8)', 'rgba(245, 158, 11, 0.4)', 'rgba(234, 179, 8, 0)'],
                }}
                transition={{
                  duration: 2,
                  delay: ring * 0.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Golden sparkles radiating outward */}
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

            {/* Central golden glow pulse */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 rounded-full pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: 'radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, rgba(245, 158, 11, 0.2) 40%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Rising golden particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`golden-particle-${i}`}
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{ marginLeft: -50 + Math.random() * 100, marginTop: -30 + Math.random() * 60 }}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  y: [0, -60, -120, -180],
                  x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
                  scale: [0.5, 1, 0.8, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #FEF08A 0%, #FACC15 100%)',
                    boxShadow: '0 0 8px #FACC15, 0 0 16px #F59E0B',
                  }}
                />
              </motion.div>
            ))}

            {/* Shimmer effect on the phoenix */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-48 md:h-48 rounded-full pointer-events-none overflow-hidden z-25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(45deg, transparent 30%, rgba(254, 240, 138, 0.4) 50%, transparent 70%)',
                    'linear-gradient(45deg, transparent 30%, rgba(254, 240, 138, 0.4) 50%, transparent 70%)',
                  ],
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhoenixFlameEffect;
