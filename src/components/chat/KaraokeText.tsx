import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pause, Play, Square } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface KaraokeTextProps {
  text: string;
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

// Estimate reading time per sentence (avg 150 words/min for speech)
function estimateSentenceTime(sentence: string): number {
  const words = sentence.split(/\s+/).length;
  // Base time: 400ms per word, plus extra time for punctuation pauses
  const baseTime = words * 400;
  const punctuationPauses = (sentence.match(/[.!?,;:。、]/g) || []).length * 200;
  return baseTime + punctuationPauses;
}

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  text,
  isPlaying,
  isPaused,
  onPause,
  onResume,
  onStop,
  className,
}) => {
  const { language } = useLanguage();
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

  const sentences = splitIntoSentences(text);

  // Reset when text changes
  useEffect(() => {
    setCurrentSentenceIndex(0);
    pausedAtRef.current = 0;
    startTimeRef.current = null;
  }, [text]);

  // Handle sentence progression
  useEffect(() => {
    if (!isPlaying || isPaused || currentSentenceIndex >= sentences.length) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const currentSentence = sentences[currentSentenceIndex];
    const duration = estimateSentenceTime(currentSentence);
    
    // Calculate remaining time if resuming from pause
    let remainingTime = duration;
    if (pausedAtRef.current > 0 && startTimeRef.current) {
      const elapsed = pausedAtRef.current - startTimeRef.current;
      remainingTime = Math.max(duration - elapsed, 100);
      pausedAtRef.current = 0;
    }
    
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      if (currentSentenceIndex < sentences.length - 1) {
        setCurrentSentenceIndex(prev => prev + 1);
      }
    }, remainingTime);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, currentSentenceIndex, sentences]);

  // Track pause timing
  useEffect(() => {
    if (isPaused && startTimeRef.current) {
      pausedAtRef.current = Date.now();
    }
  }, [isPaused]);

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
