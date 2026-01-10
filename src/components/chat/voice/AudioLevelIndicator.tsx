import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioLevelIndicatorProps {
  isListening: boolean;
  className?: string;
  barCount?: number;
  variant?: 'bars' | 'circle' | 'wave';
}

export const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({
  isListening,
  className,
  barCount = 5,
  variant = 'bars',
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isListening) {
      startAudioAnalysis();
    } else {
      stopAudioAnalysis();
    }

    return () => {
      stopAudioAnalysis();
    };
  }, [isListening]);

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyze();
    } catch (error) {
      console.error('Error accessing microphone for level indicator:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
    setLevels(new Array(barCount).fill(0));
  };

  const analyze = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    setAudioLevel(normalizedLevel);

    // Create individual bar levels for visualization
    const newLevels = new Array(barCount).fill(0).map((_, i) => {
      const start = Math.floor((i / barCount) * dataArray.length);
      const end = Math.floor(((i + 1) / barCount) * dataArray.length);
      const segment = dataArray.slice(start, end);
      const segmentAvg = segment.reduce((a, b) => a + b, 0) / segment.length;
      return Math.min(segmentAvg / 128, 1);
    });
    setLevels(newLevels);

    animationRef.current = requestAnimationFrame(analyze);
  };

  if (variant === 'circle') {
    return (
      <div className={cn('relative', className)}>
        <div 
          className="absolute inset-0 rounded-full bg-primary/30 transition-transform duration-75"
          style={{ 
            transform: `scale(${1 + audioLevel * 0.5})`,
            opacity: 0.3 + audioLevel * 0.7,
          }}
        />
        <div 
          className="absolute inset-0 rounded-full bg-primary/20 transition-transform duration-100"
          style={{ 
            transform: `scale(${1 + audioLevel * 0.8})`,
            opacity: 0.2 + audioLevel * 0.3,
          }}
        />
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex items-center justify-center gap-0.5', className)}>
        {levels.map((level, i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(4, level * 24)}px`,
              opacity: isListening ? 0.5 + level * 0.5 : 0.3,
            }}
          />
        ))}
      </div>
    );
  }

  // Default: bars variant
  return (
    <div className={cn('flex items-end justify-center gap-0.5 h-4', className)}>
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-75',
            isListening ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
          style={{
            height: `${Math.max(2, level * 16)}px`,
            opacity: isListening ? 0.6 + level * 0.4 : 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default AudioLevelIndicator;
