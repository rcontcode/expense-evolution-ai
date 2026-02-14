/**
 * useElevenLabsTTS - Premium voice synthesis with ElevenLabs
 * 
 * Uses ElevenLabs API for high-quality TTS when user has premium voice minutes.
 * IMPORTANT: Does NOT handle fallback internally - caller must handle fallback.
 * This prevents voice duplication issues.
 */

import { useState, useCallback, useRef } from 'react';
import { usePlanLimits } from '@/hooks/data/usePlanLimits';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { expandAcronymsForSpeech } from '@/lib/acronymExpander';

/**
 * Clean text for TTS: convert symbols to spoken words
 */
function cleanTextForTTS(text: string, lang: string, currency?: string): string {
  // Determine spoken name for $ based on active currency
  const dollarName = (() => {
    if (!currency || currency === 'USD') return lang === 'es' ? ' dólares ' : ' dollars ';
    if (currency === 'CLP') return lang === 'es' ? ' pesos ' : ' pesos ';
    if (currency === 'CAD') return lang === 'es' ? ' dólares canadienses ' : ' Canadian dollars ';
    if (currency === 'MXN') return lang === 'es' ? ' pesos mexicanos ' : ' Mexican pesos ';
    return lang === 'es' ? ' dólares ' : ' dollars ';
  })();

  let cleaned = text
    .replace(/\$\s*(\d)/g, (_, d) => `${d}`)
    .replace(/\$/g, dollarName)
    .replace(/€\s*(\d)/g, (_, d) => `${d}`)
    .replace(/€/g, ' euros ')
    .replace(/%/g, lang === 'es' ? ' por ciento' : ' percent')
    .replace(/&/g, lang === 'es' ? ' y ' : ' and ')
    .replace(/\+/g, lang === 'es' ? ' más ' : ' plus ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/—/g, ', ')
    .replace(/–/g, ', ')
    .replace(/…/g, '...')
    .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '')
    .replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Expand acronyms AFTER cleaning but BEFORE final output
  cleaned = expandAcronymsForSpeech(cleaned, lang);

  return cleaned;
}

// Curated premium voices from ElevenLabs official library
// Selected for: professional mic quality, warm/clear tone, multilingual v2 compatibility
// Female: warm, engaging, slightly sensual tone preferred
// Male: masculine, clear, balanced pace — neither overly enthusiastic nor monotone
export const ELEVENLABS_VOICES = {
  // Spanish — These premade voices render excellent Latin American Spanish via eleven_multilingual_v2
  es: {
    female: [
      { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Cálida y juguetona, muy natural' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Confiada, cálida, profesional' },
      { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', desc: 'Entusiasta, voz soleada' },
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Aterciopelada, elegante' },
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Alto profesional, sofisticada' },
      { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', desc: 'Clara, envolvente' },
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Suave, serena, cercana' },
      { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', desc: 'Dulce, íntima, ASMR' },
      { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', desc: 'Calmada con raspado sutil' },
      { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', desc: 'Agradable, juvenil' },
    ],
    male: [
      { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', desc: 'Resonante, confiable' },
      { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', desc: 'Tenor suave, versátil' },
      { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Fuerte, profesional' },
      { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', desc: 'Natural, auténtico' },
      { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Joven, energético, cálido' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Profundo, maduro, narrador' },
      { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', desc: 'Grave, presencia fuerte' },
      { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', desc: 'Confiado, medio, claro' },
      { id: 'bIHbv24MWmeRgasZH58o', name: 'Will', desc: 'Amigable, fresco' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Profundo, joven, narrativo' },
    ],
  },
  // English — Native speakers, studio-quality recordings
  en: {
    female: [
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Warm, confident, professional' },
      { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Playful, warm, engaging' },
      { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', desc: 'Sunny, enthusiastic' },
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Velvety British, smooth' },
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Alto, articulate, warm' },
      { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', desc: 'Clear, engaging British' },
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Calm, natural, narrator' },
      { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', desc: 'Soft, intimate, ASMR' },
      { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', desc: 'Calm with subtle rasp' },
      { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', desc: 'Pleasant, youthful British' },
    ],
    male: [
      { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', desc: 'Resonant, comforting' },
      { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', desc: 'Smooth tenor, versatile' },
      { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Warm British, captivating' },
      { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Strong British, broadcast' },
      { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', desc: 'Natural, down-to-earth' },
      { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Young, energetic, warm' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', desc: 'Deep, mature narrator' },
      { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', desc: 'Gravelly, commanding' },
      { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', desc: 'Confident, clear' },
      { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Australian, confident' },
    ],
  },
} as const;

export type VoiceGender = 'female' | 'male';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  voiceGender?: VoiceGender;
  lang?: 'es' | 'en';
  currency?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface VoiceOption {
  id: string;
  name: string;
  desc: string;
}

interface VoicesForLang {
  female: VoiceOption[];
  male: VoiceOption[];
}

interface UseElevenLabsTTSReturn {
  speak: (text: string) => Promise<{ success: boolean; error?: string }>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  currentText: string;
  remainingMinutes: number;
  usagePercentage: number;
  canUsePremium: boolean;
  getVoicesForLang: (lang: 'es' | 'en') => VoicesForLang;
}

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}): UseElevenLabsTTSReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    canUsePremiumVoice, 
    getRemainingVoiceMinutes, 
    getVoiceMinutesPercentage,
    isLoading: isPlanLoading 
  } = usePlanLimits();
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Blocked voice IDs that are wrongly mapped or have quality issues
  const BLOCKED_VOICE_IDS = new Set([
    'jsCqWAovK2LkecY7zXl4', // "Sofía" - gringo accent
    'z9fAnlkpzviPz146aGWa', // "Valentina" - gringo accent
    'oWAxZDx7w5VEj9dCyTzz', // "Isabella" - gringo accent
    'LcfcDJNUP1GQjkzn1xUU', // "Daniela" - too slow
    'GBv7mTt0atIp3Br8iCZE', // "Diego" - too slow
    'JBFqnCBsd6RMkjVDRZzb', // George (EN) wrongly used as ES
    'XB0fDUnXU5powFXDhCwa', // "Carolina" - background noise
    'pMsXgVXv3BLzUgSXRplE', // "Mariana" - background noise
    'jBpfuIE2acCO8z3wKNLl', // "Camila" - inconsistent quality
  ]);

  // Get the appropriate voice ID based on language and gender
  // IMPORTANT: Validates against blocked list to prevent gringo voices
  const getVoiceId = useCallback((): string => {
    const lang = options.lang || 'es';
    const gender = options.voiceGender || 'female';
    
    // If user selected a voice, validate it's not blocked
    if (options.voiceId && !BLOCKED_VOICE_IDS.has(options.voiceId)) {
      return options.voiceId;
    }
    
    // Fall back to safe default voice
    const voices = ELEVENLABS_VOICES[lang][gender];
    // Find first non-blocked voice
    const safeVoice = voices.find(v => !BLOCKED_VOICE_IDS.has(v.id));
    return safeVoice?.id || voices[0]?.id || ELEVENLABS_VOICES.es.female[0].id;
  }, [options.voiceId, options.lang, options.voiceGender]);

  const getVoicesForLang = useCallback((lang: 'es' | 'en'): VoicesForLang => {
    const voices = ELEVENLABS_VOICES[lang];
    return {
      female: [...voices.female],
      male: [...voices.male],
    };
  }, []);

  const speak = useCallback(async (text: string): Promise<{ success: boolean; error?: string }> => {
    if (!text?.trim()) {
      return { success: false, error: 'empty_text' };
    }
    
    // Set current text for karaoke display
    setCurrentText(text);
    
    // Stop any current speech
    cleanupAudio();

    // Check if user can use premium voice
    // Also check isPlanLoading - if still loading, assume eligible to avoid race condition
    const canUsePremium = canUsePremiumVoice();
    
    if (!user) {
      return { success: false, error: 'not_eligible' };
    }
    
    if (!canUsePremium && !isPlanLoading) {
      console.log('[ElevenLabs] Not eligible for premium voice (canUsePremium=false, isPlanLoading=false)');
      return { success: false, error: 'not_eligible' };
    }

    setIsLoading(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoading(false);
        return { success: false, error: 'no_session' };
      }

      const voiceId = getVoiceId();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: cleanTextForTTS(text, options.lang || 'es', options.currency),
            voiceId,
            lang: options.lang,
          }),
        }
      );

      setIsLoading(false);

      // Check for errors - map voice_limit_exceeded to trigger fallback
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[ElevenLabsTTS] API error:', errorData);
        
        // Map voice_limit_exceeded to 'not_eligible' so fallback kicks in
        if (errorData.error === 'voice_limit_exceeded') {
          return { success: false, error: 'not_eligible' };
        }
        
        return { success: false, error: errorData.error || 'api_error' };
      }

      // Get audio blob and play it
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onplay = () => {
          setIsSpeaking(true);
          options.onStart?.();
        };

        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentText('');
          cleanupAudio();
          options.onEnd?.();
          
          // Refresh usage data
          queryClient.invalidateQueries({ queryKey: ['usage', user.id] });
          resolve({ success: true });
        };

        audio.onerror = (e) => {
          console.error('[ElevenLabsTTS] Audio playback error:', e);
          setIsSpeaking(false);
          cleanupAudio();
          options.onError?.(new Error('Audio playback failed'));
          resolve({ success: false, error: 'playback_error' });
        };

        // Wait for enough audio to buffer before playing to prevent
        // the first word/syllable from being clipped
        audio.preload = 'auto';
        audio.oncanplaythrough = () => {
          audio.oncanplaythrough = null; // Only fire once
          audio.play().catch((e) => {
            console.error('[ElevenLabsTTS] Play error:', e);
            setIsSpeaking(false);
            cleanupAudio();
            resolve({ success: false, error: 'play_error' });
          });
        };

        // Fallback: if canplaythrough doesn't fire within 3s, try playing anyway
        setTimeout(() => {
          if (audio.paused && !audio.ended) {
            audio.oncanplaythrough = null;
            audio.play().catch((e) => {
              console.error('[ElevenLabsTTS] Play fallback error:', e);
              setIsSpeaking(false);
              cleanupAudio();
              resolve({ success: false, error: 'play_error' });
            });
          }
        }, 3000);
      });

    } catch (error) {
      console.error('[ElevenLabsTTS] Error:', error);
      setIsLoading(false);
      return { success: false, error: 'network_error' };
    }
  }, [user, canUsePremiumVoice, isPlanLoading, options, cleanupAudio, getVoiceId, queryClient]);

  const stop = useCallback(() => {
    cleanupAudio();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanupAudio]);

  // Clear currentText on stop
  const stopAndClear = useCallback(() => {
    cleanupAudio();
    setIsSpeaking(false);
    setIsLoading(false);
    setCurrentText('');
  }, [cleanupAudio]);

  return {
    speak,
    stop: stopAndClear,
    isSpeaking,
    isLoading: isLoading || isPlanLoading,
    currentText,
    remainingMinutes: getRemainingVoiceMinutes(),
    usagePercentage: getVoiceMinutesPercentage(),
    canUsePremium: canUsePremiumVoice(),
    getVoicesForLang,
  };
}
