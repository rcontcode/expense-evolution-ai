import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';

const PhoenixFlameEffect = () => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate multiple flame particles
  const flameParticles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i * 15) - 180, // Spread around the top half
    delay: i * 0.03,
    size: 8 + Math.random() * 12,
    duration: 0.8 + Math.random() * 0.6,
  }));

  // Generate ember particles
  const emberParticles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    x: -60 + Math.random() * 120,
    delay: i * 0.05,
    size: 2 + Math.random() * 4,
  }));

  return (
    <motion.div 
      className="relative z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pulsing glow ring - intensifies on hover */}
      <motion.div 
        className="absolute inset-0 w-40 h-40 md:w-48 md:h-48 rounded-full blur-md"
        animate={{
          background: isHovered 
            ? 'linear-gradient(to right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(234, 88, 12))'
            : 'linear-gradient(to right, rgb(34, 211, 238), rgb(59, 130, 246), rgb(20, 184, 166))',
          scale: isHovered ? 1.15 : 1,
        }}
        transition={{ duration: 0.3 }}
        style={{
          animation: 'pulse-glow 3s ease-in-out infinite'
        }}
      />

      {/* Main logo container */}
      <motion.div 
        className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-visible ring-4 ring-white/80 cursor-pointer"
        animate={{
          boxShadow: isHovered 
            ? '0 0 60px rgba(251, 146, 60, 0.6), 0 0 100px rgba(239, 68, 68, 0.4)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Inner fire glow overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at center, rgba(251, 146, 60, 0.2) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Phoenix logo - clips to circle */}
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
          <motion.img 
            src={phoenixLogo} 
            alt="EvoFinz Phoenix" 
            className="w-[115%] h-[115%] object-contain"
            animate={{
              filter: isHovered 
                ? 'drop-shadow(0 0 20px rgba(251, 146, 60, 0.8)) brightness(1.1)' 
                : 'none',
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Animated Flames - appear on hover */}
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Main flame tongues */}
            {flameParticles.map((particle) => (
              <motion.div
                key={`flame-${particle.id}`}
                className="absolute left-1/2 top-1/2 pointer-events-none"
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: '-50%',
                  y: '-50%',
                }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.3, 1, 1.2, 0.5],
                  x: [
                    '-50%',
                    `calc(-50% + ${Math.sin(particle.angle * Math.PI / 180) * 80}px)`,
                    `calc(-50% + ${Math.sin(particle.angle * Math.PI / 180) * 120}px)`,
                  ],
                  y: [
                    '-50%',
                    `calc(-50% + ${Math.cos(particle.angle * Math.PI / 180) * 80}px)`,
                    `calc(-50% + ${Math.cos(particle.angle * Math.PI / 180) * 140}px)`,
                  ],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              >
                <svg
                  width={particle.size}
                  height={particle.size * 1.8}
                  viewBox="0 0 20 36"
                  fill="none"
                  style={{
                    transform: `rotate(${180 + particle.angle}deg)`,
                    filter: 'blur(1px)',
                  }}
                >
                  <motion.path
                    d="M10 0C10 0 20 12 20 22C20 30 15 36 10 36C5 36 0 30 0 22C0 12 10 0 10 0Z"
                    animate={{
                      fill: [
                        'rgba(254, 240, 138, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(239, 68, 68, 0.9)',
                        'rgba(254, 240, 138, 1)',
                      ],
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </svg>
              </motion.div>
            ))}

            {/* Rising ember particles */}
            {emberParticles.map((ember) => (
              <motion.div
                key={`ember-${ember.id}`}
                className="absolute left-1/2 top-0 pointer-events-none rounded-full"
                style={{
                  width: ember.size,
                  height: ember.size,
                  background: 'radial-gradient(circle, rgba(254, 240, 138, 1) 0%, rgba(251, 146, 60, 1) 100%)',
                  boxShadow: '0 0 6px rgba(251, 146, 60, 0.8)',
                }}
                initial={{ 
                  opacity: 0,
                  x: ember.x,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [ember.x, ember.x + (Math.random() - 0.5) * 40, ember.x + (Math.random() - 0.5) * 60],
                  y: [0, -60, -120],
                  scale: [1, 0.8, 0.3],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: ember.delay,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Large flame aura behind */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                className="w-64 h-80 md:w-80 md:h-96 -mt-20"
                animate={{
                  background: [
                    'radial-gradient(ellipse at center bottom, rgba(251, 146, 60, 0.4) 0%, rgba(239, 68, 68, 0.2) 40%, transparent 70%)',
                    'radial-gradient(ellipse at center bottom, rgba(254, 240, 138, 0.4) 0%, rgba(251, 146, 60, 0.2) 40%, transparent 70%)',
                    'radial-gradient(ellipse at center bottom, rgba(251, 146, 60, 0.4) 0%, rgba(239, 68, 68, 0.2) 40%, transparent 70%)',
                  ],
                }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  filter: 'blur(20px)',
                }}
              />
            </motion.div>

            {/* Flickering flame ring */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 md:w-64 md:h-64 rounded-full pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: [0.6, 0.8, 0.6],
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(251, 146, 60, 0.5), transparent, rgba(239, 68, 68, 0.5), transparent)',
                filter: 'blur(8px)',
              }}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhoenixFlameEffect;
