import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Square, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

interface AudioPlaybackControlsProps {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0-100
  duration: number; // seconds
  currentTime: number; // seconds
  
  // Playback actions
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  
  // Recording state (optional)
  isRecording?: boolean;
  recordingDuration?: number;
  onStopRecording?: () => void;
  
  className?: string;
}

export const AudioPlaybackControls: React.FC<AudioPlaybackControlsProps> = ({
  isPlaying,
  isPaused,
  progress,
  duration,
  currentTime,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeekBackward,
  onSeekForward,
  isRecording,
  recordingDuration,
  onStopRecording,
  className,
}) => {
  const { language } = useLanguage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If recording, show recording controls
  if (isRecording) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl",
        className
      )}>
        <div className="flex items-center gap-2 flex-1">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {language === 'es' ? 'Grabando' : 'Recording'}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatTime(recordingDuration || 0)}
          </span>
        </div>
        
        {onStopRecording && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onStopRecording}
            className="h-8"
          >
            <Square className="h-3 w-3 mr-1.5" />
            {language === 'es' ? 'Detener' : 'Stop'}
          </Button>
        )}
      </div>
    );
  }

  // If not playing or paused, don't show controls
  if (!isPlaying && !isPaused) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 bg-muted/50 border rounded-xl",
      className
    )}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-10 text-right">{formatTime(currentTime)}</span>
        <Progress value={progress} className="flex-1 h-1.5" />
        <span className="w-10">{formatTime(duration)}</span>
      </div>
      
      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Seek backward 10s */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSeekBackward}
          className="h-8 w-8"
          title={language === 'es' ? 'Retroceder 10s' : 'Rewind 10s'}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        {/* Play/Pause */}
        {isPaused ? (
          <Button
            variant="default"
            size="icon"
            onClick={onResume}
            className="h-10 w-10 rounded-full"
            title={language === 'es' ? 'Reanudar' : 'Resume'}
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={onPause}
            className="h-10 w-10 rounded-full"
            title={language === 'es' ? 'Pausar' : 'Pause'}
          >
            <Pause className="h-5 w-5" />
          </Button>
        )}
        
        {/* Seek forward 10s */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSeekForward}
          className="h-8 w-8"
          title={language === 'es' ? 'Adelantar 10s' : 'Forward 10s'}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        
        {/* Stop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onStop}
          className="h-8 w-8 ml-2"
          title={language === 'es' ? 'Detener' : 'Stop'}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Compact inline version for message bubbles
interface InlinePlayButtonProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const InlinePlayButton: React.FC<InlinePlayButtonProps> = ({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onResume,
}) => {
  const { language } = useLanguage();

  if (isPlaying && !isPaused) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onPause}
        className="h-6 px-2 mt-1 text-xs opacity-70 hover:opacity-100"
      >
        <Pause className="h-3 w-3 mr-1" />
        {language === 'es' ? 'Pausar' : 'Pause'}
      </Button>
    );
  }

  if (isPaused) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onResume}
        className="h-6 px-2 mt-1 text-xs opacity-70 hover:opacity-100"
      >
        <Play className="h-3 w-3 mr-1" />
        {language === 'es' ? 'Reanudar' : 'Resume'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onPlay}
      className="h-6 px-2 mt-1 text-xs opacity-70 hover:opacity-100"
    >
      <Play className="h-3 w-3 mr-1" />
      {language === 'es' ? 'Escuchar' : 'Listen'}
    </Button>
  );
};
