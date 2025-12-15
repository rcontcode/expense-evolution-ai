import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Music2 } from 'lucide-react';

const AMBIENT_CONFIG = {
  baseFrequency: 432,
  beatFrequency: 10,
  volume: 0.15
};

export const OnboardingAmbientMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [showControls, setShowControls] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorLeftRef = useRef<OscillatorNode | null>(null);
  const oscillatorRightRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pannerLeftRef = useRef<StereoPannerNode | null>(null);
  const pannerRightRef = useRef<StereoPannerNode | null>(null);

  const startAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;

      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = (volume / 100) * AMBIENT_CONFIG.volume;
      gainNodeRef.current.connect(ctx.destination);

      pannerLeftRef.current = ctx.createStereoPanner();
      pannerLeftRef.current.pan.value = -1;
      pannerLeftRef.current.connect(gainNodeRef.current);

      pannerRightRef.current = ctx.createStereoPanner();
      pannerRightRef.current.pan.value = 1;
      pannerRightRef.current.connect(gainNodeRef.current);

      oscillatorLeftRef.current = ctx.createOscillator();
      oscillatorLeftRef.current.type = 'sine';
      oscillatorLeftRef.current.frequency.value = AMBIENT_CONFIG.baseFrequency;
      oscillatorLeftRef.current.connect(pannerLeftRef.current);

      oscillatorRightRef.current = ctx.createOscillator();
      oscillatorRightRef.current.type = 'sine';
      oscillatorRightRef.current.frequency.value = AMBIENT_CONFIG.baseFrequency + AMBIENT_CONFIG.beatFrequency;
      oscillatorRightRef.current.connect(pannerRightRef.current);

      oscillatorLeftRef.current.start();
      oscillatorRightRef.current.start();

      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting ambient audio:', error);
    }
  };

  const stopAudio = () => {
    try {
      oscillatorLeftRef.current?.stop();
      oscillatorRightRef.current?.stop();
      oscillatorLeftRef.current?.disconnect();
      oscillatorRightRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      pannerLeftRef.current?.disconnect();
      pannerRightRef.current?.disconnect();
      
      oscillatorLeftRef.current = null;
      oscillatorRightRef.current = null;
      
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && isPlaying) {
      gainNodeRef.current.gain.value = (volume / 100) * AMBIENT_CONFIG.volume;
    }
  }, [volume, isPlaying]);

  useEffect(() => {
    return () => {
      stopAudio();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div
      className="fixed bottom-4 left-4 z-50 animate-fade-in"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center gap-2 bg-background/90 backdrop-blur-lg border border-border/50 rounded-full px-3 py-2 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className={`rounded-full p-2 ${isPlaying ? 'text-green-500' : 'text-muted-foreground'}`}
        >
          {isPlaying ? (
            <div className="animate-pulse">
              <Music2 className="h-5 w-5" />
            </div>
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>

        {showControls && (
          <div className="flex items-center gap-3 overflow-hidden animate-fade-in">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              🎵 Ondas Alpha 432Hz
            </span>
            <div className="flex items-center gap-2">
              <VolumeX className="h-3 w-3 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                min={0}
                max={100}
                step={5}
                className="w-20"
              />
              <Volume2 className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        )}

        {!showControls && (
          <span className="text-xs text-muted-foreground">
            {isPlaying ? '🎵' : '🔇'}
          </span>
        )}
      </div>
    </div>
  );
};
