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

// ElevenLabs voice IDs - Latin American neutral Spanish + North American English
export const ELEVENLABS_VOICES = {
  // Spanish - Latin American (neutral, not Spain accent)
  es: {
    female: [
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Cálida, profesional' },
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', desc: 'Clara, amigable' },
    ],
    male: [
      { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Neutro, profesional' },
      { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', desc: 'Joven, dinámico' },
    ],
  },
  // English - North American
  en: {
    female: [
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Warm, professional' },
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', desc: 'Clear, friendly' },
    ],
    male: [
      { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', desc: 'Professional, clear' },
      { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', desc: 'Friendly, dynamic' },
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

  // Get the appropriate voice ID based on language and gender
  const getVoiceId = useCallback((): string => {
    if (options.voiceId) return options.voiceId;
    
    const lang = options.lang || 'es';
    const gender = options.voiceGender || 'female';
    const voices = ELEVENLABS_VOICES[lang][gender];
    return voices[0]?.id || ELEVENLABS_VOICES.es.female[0].id;
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
    const canUsePremium = canUsePremiumVoice();
    
    if (!canUsePremium || !user) {
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

      // Check for errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[ElevenLabsTTS] API error:', errorData);
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
  }, [user, canUsePremiumVoice, options, cleanupAudio, getVoiceId, queryClient]);

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
