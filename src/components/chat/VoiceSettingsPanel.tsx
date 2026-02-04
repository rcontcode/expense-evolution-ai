import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Loader2, Sparkles, Speaker, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useElevenLabsVoices, buildVoiceOptions, ElevenLabsVoice } from '@/hooks/data/useElevenLabsVoices';
import { useVoicePreferences, VoiceGender } from '@/hooks/utils/useVoicePreferences';

interface VoiceSettingsPanelProps {
  language: 'es' | 'en';
  autoSpeak: boolean;
  onAutoSpeakChange: (value: boolean) => void;
  compact?: boolean;
}

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
  language,
  autoSpeak,
  onAutoSpeakChange,
  compact = false,
}) => {
  const voicePrefs = useVoicePreferences();
  const { data: voicesData, isLoading: isLoadingVoices } = useElevenLabsVoices();
  
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'elevenlabs' | 'native'>('elevenlabs');
  const [genderFilter, setGenderFilter] = useState<'female' | 'male'>('female');
  const [langFilter, setLangFilter] = useState<'es' | 'en'>(language);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPreviewRef = useRef<number>(0);

  // Build voice options organized by language and gender
  const organizedVoices = useMemo(() => {
    if (!voicesData?.voices) return { es: { female: [], male: [] }, en: { female: [], male: [] } };
    
    const esVoices = buildVoiceOptions(voicesData.voices, 'es');
    const enVoices = buildVoiceOptions(voicesData.voices, 'en');
    
    return {
      es: esVoices,
      en: enVoices,
    };
  }, [voicesData?.voices]);

  // Get current voice selection
  const currentVoiceId = voicePrefs.premiumVoiceIdByLang?.[langFilter] || null;

  // Preview voice with throttle
  const previewVoice = useCallback(async (voice: ElevenLabsVoice) => {
    const now = Date.now();
    if (now - lastPreviewRef.current < 2000) return;
    lastPreviewRef.current = now;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!voice.previewUrl) return;

    setPlayingVoiceId(voice.id);
    
    try {
      const audio = new Audio(voice.previewUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (e) {
      console.error('Failed to play preview:', e);
      setPlayingVoiceId(null);
    }
  }, []);

  // Stop preview
  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Select voice
  const selectVoice = useCallback((voice: ElevenLabsVoice) => {
    voicePrefs.setPremiumVoiceIdForLang(langFilter, voice.id);
  }, [voicePrefs, langFilter]);

  // Get voices for current filter
  const filteredVoices = useMemo(() => {
    return organizedVoices[langFilter]?.[genderFilter] || [];
  }, [organizedVoices, langFilter, genderFilter]);

  // Native voice selection
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const filtered = voices.filter(v => {
        const lang = v.lang.toLowerCase();
        if (langFilter === 'es') return lang.startsWith('es');
        return lang.startsWith('en');
      });
      setNativeVoices(filtered);
    };
    
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, [langFilter]);

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Speaker className="h-4 w-4 text-primary" />
        {language === 'es' ? 'Configuración de Voz' : 'Voice Settings'}
      </h4>

      {/* Basic Settings */}
      <div className="space-y-3 pb-3 border-b">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>{language === 'es' ? 'Velocidad' : 'Speed'}</span>
            <Badge variant="secondary" className="text-[10px] h-5">{voicePrefs.speechSpeed.toFixed(1)}x</Badge>
          </div>
          <Slider
            value={[voicePrefs.speechSpeed]}
            min={0.5}
            max={2}
            step={0.1}
            onValueChange={([v]) => voicePrefs.setSpeechSpeed(v)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>{language === 'es' ? 'Volumen' : 'Volume'}</span>
            <Badge variant="secondary" className="text-[10px] h-5">{Math.round(voicePrefs.volume * 100)}%</Badge>
          </div>
          <Slider
            value={[voicePrefs.volume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={([v]) => voicePrefs.setVolume(v)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs">{language === 'es' ? 'Leer respuestas' : 'Read responses'}</span>
          <Button
            variant={autoSpeak ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs"
            onClick={() => onAutoSpeakChange(!autoSpeak)}
          >
            {autoSpeak ? 'On' : 'Off'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs">{language === 'es' ? 'Sonidos' : 'Sounds'}</span>
          <Button
            variant={voicePrefs.enableSoundEffects ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs"
            onClick={() => voicePrefs.toggleSoundEffects()}
          >
            {voicePrefs.enableSoundEffects ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">{language === 'es' ? 'Selección de Voz' : 'Voice Selection'}</span>
        </div>

        {/* Voice Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'elevenlabs' | 'native')}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="elevenlabs" className="text-xs flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent-foreground" />
              ElevenLabs
            </TabsTrigger>
            <TabsTrigger value="native" className="text-xs flex items-center gap-1.5">
              <Mic className="h-3 w-3 text-primary" />
              {language === 'es' ? 'Nativa' : 'Native'}
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex gap-2 mt-3">
            {/* Language Filter */}
            <div className="flex-1">
              <RadioGroup 
                value={langFilter} 
                onValueChange={(v) => setLangFilter(v as 'es' | 'en')}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="es" id="lang-es" className="h-3.5 w-3.5" />
                  <Label htmlFor="lang-es" className="text-xs cursor-pointer">🇪🇸 Español</Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="en" id="lang-en" className="h-3.5 w-3.5" />
                  <Label htmlFor="lang-en" className="text-xs cursor-pointer">🇬🇧 English</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* Gender Filter */}
          <div className="flex gap-2 mt-2">
            <RadioGroup 
              value={genderFilter} 
              onValueChange={(v) => setGenderFilter(v as 'female' | 'male')}
              className="flex gap-2"
            >
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="female" id="gender-female" className="h-3.5 w-3.5" />
                <Label htmlFor="gender-female" className="text-xs cursor-pointer">
                  👩 {language === 'es' ? 'Femenina' : 'Female'}
                </Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="male" id="gender-male" className="h-3.5 w-3.5" />
                <Label htmlFor="gender-male" className="text-xs cursor-pointer">
                  👨 {language === 'es' ? 'Masculina' : 'Male'}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <TabsContent value="elevenlabs" className="mt-3">
            {isLoadingVoices ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">
                  {language === 'es' ? 'Cargando voces...' : 'Loading voices...'}
                </span>
              </div>
            ) : filteredVoices.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'No hay voces disponibles para estos filtros'
                  : 'No voices available for these filters'}
              </div>
            ) : (
              <ScrollArea className="h-[180px] pr-2">
                <div className="space-y-1.5">
                  {filteredVoices.map((voice) => {
                    const isSelected = currentVoiceId === voice.id;
                    const isPlaying = playingVoiceId === voice.id;
                    
                    return (
                      <div
                        key={voice.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "border-primary bg-primary/10 shadow-sm" 
                            : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                        )}
                        onClick={() => selectVoice(voice)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{voice.name}</span>
                            {isSelected && (
                              <Badge variant="default" className="text-[9px] h-4 px-1">
                                ✓
                              </Badge>
                            )}
                          </div>
                          {voice.labels?.accent && (
                            <span className="text-[10px] text-muted-foreground">
                              {voice.labels.accent}
                            </span>
                          )}
                        </div>
                        
                        {voice.previewUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPlaying) {
                                stopPreview();
                              } else {
                                previewVoice(voice);
                              }
                            }}
                          >
                            {isPlaying ? (
                              <Pause className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {language === 'es' 
                ? '✨ Voces premium LatAm con acentos nativos'
                : '✨ Premium LatAm voices with native accents'}
            </p>
          </TabsContent>

          <TabsContent value="native" className="mt-3">
            {nativeVoices.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'No hay voces nativas disponibles para este idioma'
                  : 'No native voices available for this language'}
              </div>
            ) : (
              <ScrollArea className="h-[180px] pr-2">
                <div className="space-y-1.5">
                  {nativeVoices.map((voice) => {
                    const isSelected = voicePrefs.selectedVoiceName === voice.name;
                    
                    return (
                      <div
                        key={voice.voiceURI}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "border-primary bg-primary/10 shadow-sm" 
                            : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                        )}
                        onClick={() => voicePrefs.setSelectedVoice(voice.name)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{voice.name}</span>
                            {isSelected && (
                              <Badge variant="default" className="text-[9px] h-4 px-1">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {voice.lang}
                          </span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const utterance = new SpeechSynthesisUtterance(
                              langFilter === 'es' 
                                ? 'Hola, esta es mi voz' 
                                : 'Hello, this is my voice'
                            );
                            utterance.voice = voice;
                            utterance.rate = voicePrefs.speechSpeed;
                            utterance.volume = voicePrefs.volume;
                            window.speechSynthesis.speak(utterance);
                          }}
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {language === 'es' 
                ? '🌐 Voces del navegador (gratuitas)'
                : '🌐 Browser voices (free)'}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
