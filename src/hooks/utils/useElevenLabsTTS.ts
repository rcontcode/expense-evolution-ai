/**
 * useElevenLabsTTS - Premium voice synthesis with automatic fallback
 * 
 * Uses ElevenLabs API for high-quality TTS when user has premium voice minutes,
 * falls back to native Web Speech API (voiceSynthesisManager) when:
 * - User exceeds their monthly limit
 * - ElevenLabs API fails
 * - User is offline
 */

import { useState, useCallback, useRef } from 'react';
import { usePlanLimits } from '@/hooks/data/usePlanLimits';
import { voiceSynthesisManager } from '@/lib/voiceSynthesisManager';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  lang?: 'es' | 'en';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onFallback?: () => void; // Called when falling back to native voice
}

interface UseElevenLabsTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isPremiumVoice: boolean;
  remainingMinutes: number;
  usagePercentage: number;
  isLoading: boolean;
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
  const [isPremiumVoice, setIsPremiumVoice] = useState(false);
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

  const speakWithNative = useCallback((text: string) => {
    setIsPremiumVoice(false);
    options.onFallback?.();
    
    voiceSynthesisManager.speak(text, {
      lang: options.lang === 'en' ? 'en-US' : 'es-ES',
      onStart: () => {
        setIsSpeaking(true);
        options.onStart?.();
      },
      onEnd: () => {
        setIsSpeaking(false);
        options.onEnd?.();
      },
      onError: (error) => {
        setIsSpeaking(false);
        options.onError?.(error);
      },
    });
  }, [options]);

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    
    // Stop any current speech
    cleanupAudio();
    voiceSynthesisManager.stop();

    // Check if user can use premium voice
    const canUsePremium = canUsePremiumVoice();
    
    if (!canUsePremium || !user) {
      // Fallback to native voice
      speakWithNative(text);
      return;
    }

    // Try premium ElevenLabs voice
    setIsLoading(true);
    setIsPremiumVoice(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth session');
      }

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
            voiceId: options.voiceId,
            lang: options.lang,
          }),
        }
      );

      setIsLoading(false);

      // Check for limit exceeded or other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.useFallback) {
          console.log('[ElevenLabsTTS] Limit exceeded or error, falling back to native voice');
          speakWithNative(text);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to generate premium voice');
      }

      // Get audio blob and play it
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        options.onStart?.();
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setIsPremiumVoice(false);
        cleanupAudio();
        options.onEnd?.();
        
        // Refresh usage data
        queryClient.invalidateQueries({ queryKey: ['usage', user.id] });
      };

      audio.onerror = (e) => {
        console.error('[ElevenLabsTTS] Audio playback error:', e);
        setIsSpeaking(false);
        setIsPremiumVoice(false);
        cleanupAudio();
        options.onError?.(new Error('Audio playback failed'));
        
        // Fallback to native voice
        speakWithNative(text);
      };

      await audio.play();

    } catch (error) {
      console.error('[ElevenLabsTTS] Error:', error);
      setIsLoading(false);
      setIsPremiumVoice(false);
      
      // Fallback to native voice on any error
      speakWithNative(text);
    }
  }, [user, canUsePremiumVoice, options, cleanupAudio, speakWithNative, queryClient]);

  const stop = useCallback(() => {
    cleanupAudio();
    voiceSynthesisManager.stop();
    setIsSpeaking(false);
    setIsPremiumVoice(false);
    setIsLoading(false);
  }, [cleanupAudio]);

  return {
    speak,
    stop,
    isSpeaking,
    isPremiumVoice,
    remainingMinutes: getRemainingVoiceMinutes(),
    usagePercentage: getVoiceMinutesPercentage(),
    isLoading: isLoading || isPlanLoading,
  };
}
