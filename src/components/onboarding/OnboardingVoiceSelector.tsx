import React, { useState, useCallback, useRef } from 'react';
import { Volume2, Play, Loader2, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useVoicePreferences } from '@/hooks/utils/useVoicePreferences';
import { ELEVENLABS_VOICES } from '@/hooks/utils/useElevenLabsTTS';

interface OnboardingVoiceSelectorProps {
  language: 'es' | 'en';
  onVoiceSelected?: (voiceId: string) => void;
}

export function OnboardingVoiceSelector({ language, onVoiceSelected }: OnboardingVoiceSelectorProps) {
  const voicePrefs = useVoicePreferences();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<'female' | 'male'>('female');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get voices for current language
  const voices = ELEVENLABS_VOICES[language][genderFilter];
  const currentVoiceId = voicePrefs.getPremiumVoiceId(language);

  // Preview voice (using native TTS for quick preview)
  const previewVoice = useCallback(async (voice: { id: string; name: string; desc: string }) => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPlayingVoiceId(voice.id);

    // Use Web Speech API for quick preview
    const utterance = new SpeechSynthesisUtterance(
      language === 'es' 
        ? `Hola, soy ${voice.name}. Seré tu guía financiera.`
        : `Hello, I'm ${voice.name}. I'll be your financial guide.`
    );
    utterance.lang = language === 'es' ? 'es-MX' : 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => setPlayingVoiceId(null);
    utterance.onerror = () => setPlayingVoiceId(null);
    
    window.speechSynthesis.speak(utterance);
  }, [language]);

  // Select voice
  const selectVoice = useCallback((voiceId: string) => {
    voicePrefs.setPremiumVoiceIdForLang(language, voiceId);
    onVoiceSelected?.(voiceId);
  }, [voicePrefs, language, onVoiceSelected]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {language === 'es' ? 'Voz de Phoenix' : 'Phoenix Voice'}
          </span>
        </div>
        
        {/* Gender filter */}
        <div className="flex gap-1">
          <Button
            variant={genderFilter === 'female' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setGenderFilter('female')}
          >
            {language === 'es' ? 'Femenina' : 'Female'}
          </Button>
          <Button
            variant={genderFilter === 'male' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setGenderFilter('male')}
          >
            {language === 'es' ? 'Masculina' : 'Male'}
          </Button>
        </div>
      </div>

      {/* Voice list */}
      <ScrollArea className="h-[180px]">
        <div className="grid grid-cols-2 gap-2 pr-2">
          {voices.slice(0, 6).map((voice) => {
            const isSelected = currentVoiceId === voice.id;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <button
                key={voice.id}
                onClick={() => selectVoice(voice.id)}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected 
                    ? "border-primary bg-primary/10 ring-1 ring-primary" 
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">{voice.name}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{voice.desc}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      previewVoice(voice);
                    }}
                  >
                    {isPlaying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Current selection indicator */}
      {currentVoiceId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3 w-3" />
          <span>
            {language === 'es' ? 'Voz seleccionada: ' : 'Selected voice: '}
            <span className="font-medium text-foreground">
              {voices.find(v => v.id === currentVoiceId)?.name || 'Default'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
