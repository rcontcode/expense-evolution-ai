import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pause, Play, Square } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface KaraokeTextProps {
  text: string;
  currentSentenceIndex: number; // Received from voice assistant hook
  isPlaying: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  className?: string;
}

// Split text into sentences for karaoke highlighting
function splitIntoSentences(text: string): string[] {
  // Split by sentence-ending punctuation but keep the punctuation
  const sentences = text.split(/(?<=[.!?。])\s+/);
  return sentences.filter(s => s.trim().length > 0);
}

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  text,
  currentSentenceIndex,
  isPlaying,
  isPaused,
  onPause,
  onResume,
  onStop,
  className,
}) => {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const sentences = splitIntoSentences(text);

  // Auto-scroll to current sentence
  useEffect(() => {
    const currentRef = sentenceRefs.current[currentSentenceIndex];
    if (currentRef && scrollRef.current) {
      currentRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSentenceIndex]);

  if (!isPlaying && !isPaused) {
    return null;
  }

  return (
    <div className={cn(
      "border rounded-xl bg-background/95 backdrop-blur-sm shadow-lg overflow-hidden",
      className
    )}>
      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground">
          {language === 'es' ? '🎤 Leyendo...' : '🎤 Reading...'}
        </span>
        <div className="flex items-center gap-1">
          {isPaused ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResume}
              className="h-7 px-2 text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Continuar' : 'Resume'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPause}
              className="h-7 px-2 text-xs"
            >
              <Pause className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Pausar' : 'Pause'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          >
            <Square className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Detener' : 'Stop'}
          </Button>
        </div>
      </div>

      {/* Karaoke text area */}
      <ScrollArea 
        ref={scrollRef}
        className="max-h-32 p-4"
      >
        <p className="text-sm leading-relaxed">
          {sentences.map((sentence, index) => (
            <span
              key={index}
              ref={el => sentenceRefs.current[index] = el}
              className={cn(
                "transition-all duration-300",
                index < currentSentenceIndex && "text-muted-foreground/60",
                index === currentSentenceIndex && "text-primary font-medium bg-primary/10 px-1 rounded",
                index > currentSentenceIndex && "text-muted-foreground/40"
              )}
            >
              {sentence}{' '}
            </span>
          ))}
        </p>
      </ScrollArea>

      {/* Progress indicator */}
      <div className="px-4 py-2 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ 
                width: `${Math.min(100, ((currentSentenceIndex + 1) / sentences.length) * 100)}%` 
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {currentSentenceIndex + 1}/{sentences.length}
          </span>
        </div>
      </div>
    </div>
  );
};
