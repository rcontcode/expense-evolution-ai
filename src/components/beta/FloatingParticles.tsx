import React from 'react';
import { motion } from 'framer-motion';

interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
  className?: string;
}

export const FloatingParticles = ({ 
  count = 15, 
  colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
  className = ''
}: FloatingParticlesProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(count)].map((_, i) => {
        const randomColor = colors[i % colors.length];
        const randomSize = 4 + Math.random() * 8;
        const randomDuration = 10 + Math.random() * 20;
        const randomDelay = Math.random() * 5;
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: randomColor,
              width: randomSize,
              height: randomSize,
              left: `${startX}%`,
              top: `${startY}%`,
              filter: 'blur(1px)',
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, 0],
              y: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, 0],
              opacity: [0.3, 0.7, 0.5, 0.3],
              scale: [1, 1.5, 0.8, 1],
            }}
            transition={{
              duration: randomDuration,
              repeat: Infinity,
              delay: randomDelay,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      
      {/* Sparkle stars */}
      {[...Array(Math.floor(count / 3))].map((_, i) => {
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        
        return (
          <motion.div
            key={`star-${i}`}
            className="absolute text-yellow-400"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              fontSize: 8 + Math.random() * 8,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            ✦
          </motion.div>
        );
      })}
    </div>
  );
};