import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
  variant?: 'dots' | 'pulse' | 'wave';
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  variant = 'dots',
  className,
}) => {
  if (!isVisible) return null;

  if (variant === 'dots') {
    return (
      <div className={cn("flex items-center gap-1 px-3 py-2", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60"
            animate={{
              y: [0, -6, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
        <motion.div
          className="flex items-center gap-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-1.5 rounded-full bg-primary/40" />
          <div className="w-10 h-1.5 rounded-full bg-primary/30" />
          <div className="w-4 h-1.5 rounded-full bg-primary/20" />
        </motion.div>
      </div>
    );
  }

  // Wave variant
  return (
    <div className={cn("flex items-center gap-0.5 px-3 py-2", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-primary/60"
          animate={{
            height: [8, 16, 8],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Separate component for "thinking" status
interface ThinkingStatusProps {
  message?: string;
  language: 'es' | 'en';
}

export const ThinkingStatus: React.FC<ThinkingStatusProps> = ({
  message,
  language,
}) => {
  const defaultMessage = language === 'es' ? 'Pensando...' : 'Thinking...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      <TypingIndicator isVisible variant="wave" />
      <span>{message || defaultMessage}</span>
    </motion.div>
  );
};
