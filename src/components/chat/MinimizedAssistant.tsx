import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Volume2, VolumeX, Square, Radio, Mic } from 'lucide-react';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { AudioLevelIndicator } from './voice/AudioLevelIndicator';

interface MinimizedAssistantProps {
  onExpand: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  isContinuousMode: boolean;
  onStopSpeaking: () => void;
  onStopContinuous: () => void;
  currentText?: string;
}

export const MinimizedAssistant: React.FC<MinimizedAssistantProps> = ({
  onExpand,
  isSpeaking,
  isListening,
  isContinuousMode,
  onStopSpeaking,
  onStopContinuous,
  currentText,
}) => {
  const { language } = useLanguage();
  
  // Truncate text for preview
  const previewText = currentText 
    ? currentText.length > 60 
      ? currentText.substring(0, 60) + '...' 
      : currentText
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "bg-background/95 backdrop-blur-xl border rounded-2xl shadow-2xl",
        "min-w-[280px] max-w-[350px]",
        isSpeaking && "ring-2 ring-primary ring-opacity-50",
        isContinuousMode && "ring-2 ring-green-500 ring-opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <PhoenixLogo 
          variant="badge" 
          state={isSpeaking ? 'rebirth' : 'default'}
          showEffects={isSpeaking}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {language === 'es' ? 'Asistente' : 'Assistant'}
          </p>
          {isSpeaking && (
            <Badge variant="secondary" className="text-[10px] h-4 bg-primary/10 text-primary">
              <Volume2 className="h-2.5 w-2.5 mr-1 animate-pulse" />
              {language === 'es' ? 'Hablando' : 'Speaking'}
            </Badge>
          )}
          {isContinuousMode && !isSpeaking && (
            <Badge variant="secondary" className="text-[10px] h-4 bg-green-500/10 text-green-600">
              <Radio className="h-2.5 w-2.5 mr-1" />
              {language === 'es' ? 'Modo Continuo' : 'Continuous'}
            </Badge>
          )}
          {isListening && !isContinuousMode && (
            <Badge variant="secondary" className="text-[10px] h-4 bg-red-500/10 text-red-600">
              <Mic className="h-2.5 w-2.5 mr-1 animate-pulse" />
              {language === 'es' ? 'Escuchando' : 'Listening'}
            </Badge>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1">
          {isSpeaking && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onStopSpeaking}
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {language === 'es' ? 'Detener' : 'Stop'}
              </TooltipContent>
            </Tooltip>
          )}
          {isContinuousMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onStopContinuous}
                  className="h-7 w-7 text-amber-500 hover:text-amber-600"
                >
                  <VolumeX className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {language === 'es' ? 'Detener modo continuo' : 'Stop continuous'}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExpand}
                className="h-7 w-7"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {language === 'es' ? 'Expandir' : 'Expand'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Preview content when speaking */}
      {(isSpeaking || isListening) && (
        <div className="p-3 space-y-2">
          {/* Audio level indicator when listening */}
          {isListening && !isSpeaking && (
            <div className="flex items-center gap-2">
              <AudioLevelIndicator isListening={true} variant="bars" className="w-12" />
              <span className="text-xs text-muted-foreground">
                {language === 'es' ? 'Escuchando...' : 'Listening...'}
              </span>
            </div>
          )}
          
          {/* Speaking preview */}
          {isSpeaking && previewText && (
            <div className="text-xs text-muted-foreground line-clamp-2 italic">
              "{previewText}"
            </div>
          )}
          
          {/* Animated speaking indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{
                    height: [8, 16, 8],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expand hint */}
      {!isSpeaking && !isListening && (
        <div className="p-2 text-center">
          <span className="text-[10px] text-muted-foreground">
            {language === 'es' ? 'Toca para expandir' : 'Tap to expand'}
          </span>
        </div>
      )}
    </motion.div>
  );
};
