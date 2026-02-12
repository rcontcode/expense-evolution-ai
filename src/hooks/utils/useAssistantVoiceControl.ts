/**
 * useAssistantVoiceControl - Unified voice control hook
 * 
 * Single source of truth for all voice activity in the assistant.
 * Eliminates duplication between useVoiceAssistant, useElevenLabsTTS, and removed useAudioPlayback.
 */

import { useCallback, useMemo } from 'react';
import { useVoiceAssistant } from './useVoiceAssistant';
import { useElevenLabsTTS } from './useElevenLabsTTS';
import { useVoicePreferences } from './useVoicePreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEntity } from '@/contexts/EntityContext';

interface UseAssistantVoiceControlOptions {
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onInterrupted?: () => void;
}

export function useAssistantVoiceControl(options: UseAssistantVoiceControlOptions = {}) {
  const { language } = useLanguage();
  const { currentCurrency } = useEntity();
  const voicePrefs = useVoicePreferences();

  // Premium voice ID
  const currentVoiceId = useMemo(() => {
    const lang = language as 'es' | 'en';
    return voicePrefs.premiumVoiceIdByLang?.[lang] || voicePrefs.premiumVoiceId || undefined;
  }, [language, voicePrefs.premiumVoiceIdByLang, voicePrefs.premiumVoiceId]);

  // ElevenLabs TTS - now with currency context
  const elevenLabsTTS = useElevenLabsTTS({
    lang: language as 'es' | 'en',
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender as 'female' | 'male',
    voiceId: currentVoiceId,
    currency: currentCurrency,
  });

  // Native voice assistant with ElevenLabs as premium backend
  const voiceAssistant = useVoiceAssistant({
    speechSpeed: voicePrefs.speechSpeed,
    volume: voicePrefs.volume,
    pitch: voicePrefs.pitch,
    voiceGender: voicePrefs.voiceGender,
    selectedVoiceName: voicePrefs.selectedVoiceName,
    currency: currentCurrency,
    premiumSpeak: elevenLabsTTS.speak,
    isPremiumSpeaking: elevenLabsTTS.isSpeaking,
    onTranscript: options.onTranscript,
    onInterimTranscript: options.onInterimTranscript,
    onInterrupted: options.onInterrupted,
  });

  // UNIFIED speaking state - true if ANY audio source is active
  const isAnySpeaking = voiceAssistant.isSpeaking || elevenLabsTTS.isSpeaking;

  // UNIFIED current text - from native TTS or ElevenLabs
  const currentSpeakingText = voiceAssistant.currentSpeakingText || elevenLabsTTS.currentText || '';

  // UNIFIED STOP - kills ALL audio sources, no exceptions
  const stopAll = useCallback(() => {
    console.log('[VoiceControl] Stopping ALL voice activity');
    // 1. Kill native speech synthesis globally
    window.speechSynthesis.cancel();
    // 2. Kill ElevenLabs audio element
    elevenLabsTTS.stop();
    // 3. Reset voice assistant state
    voiceAssistant.stopSpeaking();
    // 4. Stop listening if active
    if (voiceAssistant.isListening) {
      voiceAssistant.toggleListening();
    }
  }, [elevenLabsTTS, voiceAssistant]);

  // Speak text - unified entry point
  const speak = useCallback(async (text: string) => {
    await voiceAssistant.speak(text);
  }, [voiceAssistant]);

  // Handle mic click - stop all audio first, then toggle
  const handleMicClick = useCallback(() => {
    window.speechSynthesis.cancel();
    elevenLabsTTS.stop();
    if (isAnySpeaking) {
      voiceAssistant.stopSpeaking();
    }
    voiceAssistant.toggleListening();
  }, [elevenLabsTTS, isAnySpeaking, voiceAssistant]);

  return {
    // Unified state
    isAnySpeaking,
    currentSpeakingText,
    
    // From voice assistant (pass-through)
    isListening: voiceAssistant.isListening,
    isSpeaking: voiceAssistant.isSpeaking,
    isSpeechPaused: voiceAssistant.isSpeechPaused,
    isSupported: voiceAssistant.isSupported,
    transcript: voiceAssistant.transcript,
    currentSentenceIndex: voiceAssistant.currentSentenceIndex,
    totalSentences: voiceAssistant.totalSentences,
    
    // Unified actions
    speak,
    stopAll,
    handleMicClick,
    toggleListening: voiceAssistant.toggleListening,
    pauseSpeech: voiceAssistant.pauseSpeech,
    resumeSpeech: voiceAssistant.resumeSpeech,
    stopSpeaking: voiceAssistant.stopSpeaking,
    
    // ElevenLabs specifics (for settings panel)
    elevenLabsTTS,
    
    // Voice prefs (for convenience)
    voicePrefs,
    currentVoiceId,
  };
}
