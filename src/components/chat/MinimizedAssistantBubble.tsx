import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Volume2, Square } from 'lucide-react';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface MinimizedAssistantBubbleProps {
  onExpand: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  isTutorialActive: boolean;
  onStopSpeaking: () => void;
  currentText?: string;
}

export const MinimizedAssistantBubble: React.FC<MinimizedAssistantBubbleProps> = ({
  onExpand,
  isSpeaking,
  isListening,
  isTutorialActive,
  onStopSpeaking,
  currentText,
}) => {
  const { language } = useLanguage();

  // Truncate text for bubble preview
  const previewText = currentText
    ? currentText.length > 30
      ? currentText.substring(0, 30) + '...'
      : currentText
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {/* Speech bubble with text preview when speaking */}
      <AnimatePresence>
        {isSpeaking && previewText && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className={cn(
              "bg-background/95 backdrop-blur-xl border rounded-xl shadow-lg",
              "px-3 py-2 max-w-[200px]",
              "relative"
            )}
          >
            <p className="text-xs text-muted-foreground italic line-clamp-2">
              "{previewText}"
            </p>
            {/* Speech bubble pointer */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-background/95 border-r border-b rotate-45 transform" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial indicator */}
      <AnimatePresence>
        {isTutorialActive && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              "bg-gradient-to-r from-primary/90 to-primary backdrop-blur-xl",
              "rounded-full px-3 py-1.5 shadow-lg",
              "flex items-center gap-2"
            )}
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-sm"
            >
              📖
            </motion.span>
            <span className="text-xs font-medium text-primary-foreground">
              {language === 'es' ? 'Tutorial activo' : 'Tutorial active'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main pulsating bubble */}
      <div className="relative">
        {/* Pulsating ring effect */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-0 rounded-full",
            isSpeaking 
              ? "bg-primary" 
              : isTutorialActive 
                ? "bg-amber-500"
                : "bg-muted-foreground/30"
          )}
        />

        {/* Main button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onExpand}
              variant="outline"
              className={cn(
                "relative h-14 w-14 rounded-full p-0",
                "bg-background/95 backdrop-blur-xl shadow-2xl",
                "border-2 hover:scale-105 transition-transform",
                isSpeaking && "border-primary animate-pulse",
                isTutorialActive && !isSpeaking && "border-amber-500",
                isListening && "border-red-500"
              )}
            >
              <PhoenixLogo
                variant="badge"
                state={isSpeaking ? 'rebirth' : isTutorialActive ? 'flames' : 'default'}
                showEffects={isSpeaking || isTutorialActive}
              />

              {/* Status indicator dot */}
              <motion.div
                animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={cn(
                  "absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                  isSpeaking && "bg-primary",
                  isListening && !isSpeaking && "bg-red-500",
                  isTutorialActive && !isSpeaking && !isListening && "bg-amber-500",
                  !isSpeaking && !isListening && !isTutorialActive && "bg-muted-foreground"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-medium">
                {language === 'es' ? 'Asistente EvoFinz' : 'EvoFinz Assistant'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                {language === 'es' ? 'Clic para expandir' : 'Click to expand'}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Stop button overlay when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -bottom-1 -left-1"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStopSpeaking();
                    }}
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6 rounded-full shadow-md"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {language === 'es' ? 'Detener' : 'Stop'}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expand hint - shows periodically */}
      <AnimatePresence>
        {!isSpeaking && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: [0, 1, 1, 0], y: 0 }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 10 }}
            className="absolute -left-24 bottom-4 bg-background/90 backdrop-blur-sm border rounded-lg px-2 py-1 shadow-sm"
          >
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {language === 'es' ? '¿Necesitas ayuda?' : 'Need help?'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
