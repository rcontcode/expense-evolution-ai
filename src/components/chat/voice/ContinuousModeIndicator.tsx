import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { Radio, Square, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ContinuousModeIndicatorProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  duration: number;
  onStop: () => void;
  className?: string;
}

export function ContinuousModeIndicator({
  isActive,
  isListening,
  isSpeaking,
  duration,
  onStop,
  className,
}: ContinuousModeIndicatorProps) {
  const { language } = useLanguage();

  if (!isActive) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn(
          "fixed bottom-36 left-1/2 -translate-x-1/2 z-40",
          "bg-background/95 backdrop-blur-sm border rounded-full shadow-lg",
          "px-4 py-2 flex items-center gap-3",
          "pointer-events-auto",
          className
        )}
      >
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 1 }}
            className={cn(
              "h-3 w-3 rounded-full",
              isSpeaking ? "bg-primary" : isListening ? "bg-red-500" : "bg-green-500"
            )}
          />
          <span className="text-sm font-medium">
            {isSpeaking 
              ? (language === 'es' ? 'Hablando' : 'Speaking')
              : isListening 
                ? (language === 'es' ? 'Escuchando' : 'Listening')
                : (language === 'es' ? 'Esperando' : 'Waiting')
            }
          </span>
        </div>

        {/* Duration */}
        <Badge variant="secondary" className="font-mono text-xs">
          {formatDuration(duration)}
        </Badge>

        {/* Status icon */}
        {isSpeaking ? (
          <Volume2 className="h-4 w-4 text-primary animate-pulse" />
        ) : (
          <Radio className="h-4 w-4 text-green-500" />
        )}

        {/* Stop button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 w-7 rounded-full p-0"
              onClick={onStop}
            >
              <Square className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {language === 'es' ? 'Detener modo continuo (o di "detener")' : 'Stop continuous mode (or say "stop")'}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Floating indicator that shows when voice mode is active
 * even when chat is minimized
 */
interface FloatingVoiceIndicatorProps {
  isContinuousMode: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onOpen: () => void;
  onStop: () => void;
}

export function FloatingVoiceIndicator({
  isContinuousMode,
  isListening,
  isSpeaking,
  onOpen,
  onStop,
}: FloatingVoiceIndicatorProps) {
  const { language } = useLanguage();

  if (!isContinuousMode && !isListening && !isSpeaking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "fixed bottom-36 right-6 z-40",
        "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg",
        "pointer-events-auto",
        isSpeaking 
          ? "bg-primary text-primary-foreground"
          : "bg-green-500 text-white"
      )}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        {isSpeaking ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <Radio className="h-4 w-4" />
        )}
      </motion.div>
      
      <span className="text-xs font-medium">
        {isSpeaking 
          ? (language === 'es' ? 'Hablando...' : 'Speaking...')
          : (language === 'es' ? 'Modo continuo' : 'Continuous')}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-white/20"
        onClick={onStop}
      >
        <Square className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}
