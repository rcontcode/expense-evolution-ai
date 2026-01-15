import { useCallback, useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VoiceGender } from './useVoicePreferences';

interface UseVoiceSynthesisOptions {
  speechSpeed?: number;
  volume?: number;
  pitch?: number;
  voiceGender?: VoiceGender;
  selectedVoiceName?: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onProgress?: (sentenceIndex: number, totalSentences: number) => void;
}

/**
 * Voice Synthesis Manager - Prevents duplication and manages speech queue
 * 
 * Key features:
 * - Single utterance at a time (mutex)
 * - Queue management for consecutive speaks
 * - Aggressive cancellation
 * - Debounced speak calls
 */
export function useVoiceSynthesis(options: UseVoiceSynthesisOptions = {}) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);

  // Mutex to prevent overlapping speech
  const isSpeakingRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentenceQueueRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean text for speech (remove emojis, markdown, etc.)
  const cleanText = useCallback((text: string): string => {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '') // Emojis
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^[\s]*[-•◦▪▸►]\s*/gm, '')
      .replace(/^\s*\d+\.\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Split into sentences for natural pauses
  const splitIntoSentences = useCallback((text: string): string[] => {
    const sentences = text.split(/(?<=[.!?。])\s+/);
    return sentences.filter(s => s.trim().length > 0);
  }, []);

  // Get best voice for current language and preferences
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // User selected specific voice
    if (options.selectedVoiceName) {
      const selected = voices.find(v => v.name === options.selectedVoiceName);
      if (selected) return selected;
    }

    const voiceGender = options.voiceGender ?? 'female';
    
    // Locale preferences (Chile and Canada first)
    const localePreference = language === 'es'
      ? ['es-CL', 'es-MX', 'es-419', 'es-ES', 'es-US', 'es']
      : ['en-CA', 'en-US', 'en-GB', 'en-AU', 'en'];

    let langVoices: SpeechSynthesisVoice[] = [];
    for (const locale of localePreference) {
      const matching = voices.filter(v =>
        locale.includes('-') ? v.lang === locale : v.lang.startsWith(locale)
      );
      if (matching.length > 0) {
        langVoices = matching;
        break;
      }
    }

    if (langVoices.length === 0) {
      const baseLang = language === 'es' ? 'es' : 'en';
      langVoices = voices.filter(v => v.lang.startsWith(baseLang));
    }

    if (voiceGender !== 'auto' && langVoices.length > 0) {
      const femalePatterns = /female|mujer|femenin|samantha|victoria|karen|monica|paulina|helena|zira|hazel|susan|alice|fiona|moira|tessa|ava|allison|kate|francisca|catalina|ximena|carmen|valentina|amelie|chloe|marie|nathalie|sylvie|angelica|ines|consuelo|esperanza|lucia|rosa/i;
      const malePatterns = /male|hombre|masculin|alex|jorge|daniel|david|diego|enrique|carlos|mark|thomas|oliver|james|fred|lee|rishi|aaron|andres|pablo|rodrigo|mateo|sebastian|nicolas|felipe|ivan|pedro|antonio|luis|miguel|juan|manuel|jean|pierre|jacques|claude|benoit|francois/i;

      const targetPattern = voiceGender === 'female' ? femalePatterns : malePatterns;

      // Local service preferred
      let voice = langVoices.find(v => v.localService && targetPattern.test(v.name));
      if (!voice) voice = langVoices.find(v => targetPattern.test(v.name));
      if (!voice) voice = langVoices.find(v => v.localService);
      if (!voice) voice = langVoices[0];
      return voice;
    }

    return langVoices.find(v => v.localService) || langVoices[0] || null;
  }, [language, options.selectedVoiceName, options.voiceGender]);

  // Speak the next sentence in queue
  const speakNextSentence = useCallback(() => {
    if (currentIndexRef.current >= sentenceQueueRef.current.length) {
      // Done speaking
      console.log('[VoiceSynthesis] All sentences spoken');
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
      setCurrentSentenceIndex(0);
      setTotalSentences(0);
      sentenceQueueRef.current = [];
      currentIndexRef.current = 0;
      options.onEnd?.();
      return;
    }

    const sentence = sentenceQueueRef.current[currentIndexRef.current];
    console.log('[VoiceSynthesis] Speaking sentence', currentIndexRef.current + 1, '/', sentenceQueueRef.current.length);

    setCurrentSentenceIndex(currentIndexRef.current);
    options.onProgress?.(currentIndexRef.current, sentenceQueueRef.current.length);

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = (options.speechSpeed ?? 1.0) * 0.95;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart = () => {
      if (currentIndexRef.current === 0) {
        setIsSpeaking(true);
        options.onStart?.();
      }
    };

    utterance.onend = () => {
      currentIndexRef.current++;
      // Natural pause between sentences
      setTimeout(() => {
        if (!window.speechSynthesis.paused && sentenceQueueRef.current.length > 0) {
          speakNextSentence();
        }
      }, 400);
    };

    utterance.onerror = (event) => {
      console.error('[VoiceSynthesis] Error:', event);
      currentIndexRef.current++;
      if (currentIndexRef.current < sentenceQueueRef.current.length) {
        speakNextSentence();
      } else {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language, options, getBestVoice]);

  // Main speak function with mutex and debounce
  const speak = useCallback((text: string) => {
    if (!text?.trim()) return;

    // Debounce rapid calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      console.log('[VoiceSynthesis] Starting speech');

      // MUTEX: Cancel any ongoing speech first
      if (isSpeakingRef.current) {
        console.log('[VoiceSynthesis] Cancelling previous speech');
        window.speechSynthesis.cancel();
      }

      isSpeakingRef.current = true;

      const cleaned = cleanText(text);
      if (!cleaned) {
        isSpeakingRef.current = false;
        return;
      }

      const sentences = splitIntoSentences(cleaned);
      sentenceQueueRef.current = sentences;
      currentIndexRef.current = 0;
      setCurrentText(text);
      setTotalSentences(sentences.length);
      setIsPaused(false);

      // Small delay to ensure cancel takes effect
      setTimeout(() => {
        speakNextSentence();
      }, 100);
    }, 200); // 200ms debounce
  }, [cleanText, splitIntoSentences, speakNextSentence]);

  // Stop speaking completely
  const stop = useCallback(() => {
    console.log('[VoiceSynthesis] Stopping');
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    sentenceQueueRef.current = [];
    currentIndexRef.current = 0;
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentText('');
    setCurrentSentenceIndex(0);
    setTotalSentences(0);
  }, []);

  // Pause speech
  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  // Resume speech
  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isSpeaking,
    isPaused,
    currentText,
    currentSentenceIndex,
    totalSentences,
    speak,
    stop,
    pause,
    resume,
  };
}
