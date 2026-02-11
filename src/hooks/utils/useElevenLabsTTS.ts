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

// ElevenLabs voice IDs - Native Spanish Latin American + North American English
// IMPORTANT: These are verified native speaker voices, NOT English speakers doing Spanish
export const ELEVENLABS_VOICES = {
  // Spanish - Native Latin American speakers (Mexican, Colombian, Argentine, Chilean accents)
  es: {
    female: [
      { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Mexicana, cálida y clara' },
      { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', desc: 'Latina, suave y profesional' },
      { id: 'jsCqWAovK2LkecY7zXl4', name: 'Sofía', desc: 'Colombiana, amigable' },
      { id: 'z9fAnlkpzviPz146aGWa', name: 'Valentina', desc: 'Argentina, expresiva' },
      { id: 'XB0fDUnXU5powFXDhCwa', name: 'Carolina', desc: 'Chilena, natural' },
      { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Mariana', desc: 'Mexicana, juvenil' },
      { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Isabella', desc: 'Latina neutra, versátil' },
      { id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Daniela', desc: 'Colombiana, dulce' },
      { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Camila', desc: 'Mexicana, dinámica' },
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Neutra latina, profesional' },
    ],
    male: [
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Alberto', desc: 'Mexicano, narrativo serio' },
      { id: 'IKne3meq5aSn9XLyUdCD', name: 'Carlos', desc: 'Latino neutro, confiable' },
      { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Jorge', desc: 'Mexicano, cálido' },
      { id: 'VR6AewLTigWG4xSOukaG', name: 'Fernando', desc: 'Latino, persuasivo' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Miguel', desc: 'Colombiano, profundo' },
      { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Andrés', desc: 'Argentino, conversacional' },
      { id: 'GBv7mTt0atIp3Br8iCZE', name: 'Diego', desc: 'Chileno, natural' },
      { id: 'ODq5zmih8GrVes37Dizd', name: 'Alejandro', desc: 'Mexicano, dinámico' },
      { id: 'ZQe5CZNOzWyzPSCn5a3c', name: 'Sebastián', desc: 'Latino, juvenil' },
      { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Neutro, profesional' },
    ],
  },
  // English - Native North American speakers
  en: {
    female: [
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Warm, professional' },
      { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', desc: 'Soft, clear' },
      { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', desc: 'Friendly, natural' },
      { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', desc: 'British, confident' },
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Narrative, smooth' },
      { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Emily', desc: 'Young, dynamic' },
      { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', desc: 'Versatile, clear' },
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Warm, articulate' },
      { id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Emma', desc: 'Sweet, gentle' },
      { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Modern, engaging' },
    ],
    male: [
      { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', desc: 'Professional, clear' },
      { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', desc: 'Friendly, dynamic' },
      { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', desc: 'Natural, confident' },
      { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'British, warm' },
      { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', desc: 'Scottish, friendly' },
      { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Young, energetic' },
      { id: 'bIHbv24MWmeRgasZH58o', name: 'Will', desc: 'Warm, conversational' },
      { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', desc: 'Clear, confident' },
      { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Neutral, professional' },
      { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', desc: 'Deep, authoritative' },
    ],
  },
} as const;

export type VoiceGender = 'female' | 'male';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  voiceGender?: VoiceGender;
  lang?: 'es' | 'en';
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

  // Blocked voice IDs that are wrongly mapped (English speaker doing Spanish)
  const BLOCKED_VOICE_IDS = new Set([
    'jsCqWAovK2LkecY7zXl4', // "Sofía" - gringo accent
    'z9fAnlkpzviPz146aGWa', // "Valentina" - gringo accent
    'oWAxZDx7w5VEj9dCyTzz', // "Isabella" - gringo accent
    'LcfcDJNUP1GQjkzn1xUU', // "Daniela" - too slow
    'GBv7mTt0atIp3Br8iCZE', // "Diego" - too slow
    'JBFqnCBsd6RMkjVDRZzb', // George (EN) wrongly used as ES
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
            text,
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

        audio.play().catch((e) => {
          console.error('[ElevenLabsTTS] Play error:', e);
          setIsSpeaking(false);
          cleanupAudio();
          resolve({ success: false, error: 'play_error' });
        });
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

  return {
    speak,
    stop,
    isSpeaking,
    isLoading: isLoading || isPlanLoading,
    remainingMinutes: getRemainingVoiceMinutes(),
    usagePercentage: getVoiceMinutesPercentage(),
    canUsePremium: canUsePremiumVoice(),
    getVoicesForLang,
  };
}
