import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

import type { VoiceGender } from './useVoicePreferences';

interface PremiumSpeakResult {
  success: boolean;
  error?: string;
}

interface UseVoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onSpeakProgress?: (sentenceIndex: number, totalSentences: number) => void;
  onInterrupted?: () => void;
  speechSpeed?: number;
  volume?: number;
  pitch?: number;
  voiceGender?: VoiceGender;
  selectedVoiceName?: string | null;
  premiumSpeak?: (text: string) => Promise<PremiumSpeakResult>;
  isPremiumSpeaking?: boolean;
}

// Pause duration before sending accumulated transcript
// Extended to 2.5s to allow natural pauses between words/phrases
const PAUSE_THRESHOLD_MS = 2500;

// Cooldown after TTS finishes to prevent self-transcription
const TTS_COOLDOWN_MS = 2000;
const DUPLICATE_THRESHOLD_MS = 5000;

// Inter-sentence pause for natural breathing room
const SENTENCE_PAUSE_MS = 650;

/**
 * Simplified Push-to-Talk Voice Assistant Hook
 * 
 * This hook provides a simple, reliable voice interaction:
 * 1. User taps mic → listens for speech
 * 2. User stops talking → sends transcript
 * 3. AI responds → speaks response
 * 4. Back to idle
 * 
 * NO continuous mode, NO auto-restart, NO complex state management
 */
export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { language } = useLanguage();
  
  // Core states - only 3 needed!
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  // Minimal refs - only what's actually needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const accumulatedTextRef = useRef('');
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sentenceQueueRef = useRef<string[]>([]);
  const currentSentenceIndexRef = useRef(0);
  
  // Anti-echo protection
  const isOutputtingAudioRef = useRef(false);
  const audioEndTimeRef = useRef<number>(0);
  
  // Duplicate prevention
  const lastSpokenTextRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    setIsSupported(hasSpeechRecognition && 'speechSynthesis' in window);
  }, []);

  // Clear pause timeout
  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  // Stop recognition
  const stopRecognition = useCallback(() => {
    console.log('[Voice] Stopping recognition');
    clearPauseTimeout();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearPauseTimeout]);

  // Send accumulated text
  const flushAccumulatedText = useCallback(() => {
    const text = accumulatedTextRef.current.trim();
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    
    if (text && options.onTranscript) {
      console.log('[Voice] Sending transcript:', text);
      options.onTranscript(text);
    }
  }, [options, clearPauseTimeout]);

  // Start pause timer
  const startPauseTimer = useCallback(() => {
    clearPauseTimeout();
    
    pauseTimeoutRef.current = setTimeout(() => {
      if (accumulatedTextRef.current.trim()) {
        flushAccumulatedText();
      }
    }, PAUSE_THRESHOLD_MS);
  }, [clearPauseTimeout, flushAccumulatedText]);

  // Create and start recognition - SIMPLE single-phrase mode only
  const createAndStartRecognition = useCallback(() => {
    // Don't start if speaking
    if (isOutputtingAudioRef.current) {
      console.log('[Voice] Blocked: audio output active');
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    // Cleanup previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false; // SIMPLE: Single phrase only
    recognition.interimResults = true;
    recognition.lang = language === 'es' ? 'es-ES' : 'en-US';

    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setTranscript('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // Ignore if audio is playing
      if (isOutputtingAudioRef.current) {
        console.log('[Voice] Ignoring result - audio output active');
        return;
      }

      // Check cooldown after audio ended
      const timeSinceAudioEnd = Date.now() - audioEndTimeRef.current;
      if (timeSinceAudioEnd < TTS_COOLDOWN_MS && audioEndTimeRef.current > 0) {
        console.log('[Voice] Ignoring result - too soon after audio:', timeSinceAudioEnd, 'ms');
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show interim text
      const displayText = accumulatedTextRef.current + (interimTranscript ? ' ' + interimTranscript : '');
      setTranscript(displayText.trim());
      
      if (interimTranscript && options.onInterimTranscript) {
        options.onInterimTranscript(displayText.trim());
      }

      if (finalTranscript) {
        const trimmedFinal = finalTranscript.trim();
        console.log('[Voice] Final transcript:', trimmedFinal);

        // Accumulate text
        if (accumulatedTextRef.current) {
          accumulatedTextRef.current += ' ' + trimmedFinal;
        } else {
          accumulatedTextRef.current = trimmedFinal;
        }

        setTranscript(accumulatedTextRef.current);
        if (options.onInterimTranscript) {
          options.onInterimTranscript(accumulatedTextRef.current);
        }

        // Wait for pause before sending
        startPauseTimer();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.log('[Voice] Recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended');
      setIsListening(false);
      
      // Flush any remaining text
      if (accumulatedTextRef.current.trim()) {
        flushAccumulatedText();
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      console.error('[Voice] Failed to start recognition:', err);
      setIsListening(false);
    }
  }, [language, options, startPauseTimer, flushAccumulatedText]);

  // Start listening - simple!
  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    console.log('[Voice] Starting listening');
    
    // Cancel any speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Reset state
    isOutputtingAudioRef.current = false;
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    
    createAndStartRecognition();
  }, [isSupported, createAndStartRecognition, clearPauseTimeout]);

  // Stop listening
  const stopListening = useCallback(() => {
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    stopRecognition();
  }, [stopRecognition, clearPauseTimeout]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean text for speech
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      .replace(/…/g, '...')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/—/g, '-')
      .replace(/–/g, '-')
      .replace(/•/g, '-')
      .replace(/→/g, ' a ')
      .replace(/←/g, '')
      .replace(/[©®™]/g, '')
      .replace(/°/g, ' grados ')
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/g, '')
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

  // Split text into sentences
  const splitIntoSentences = useCallback((text: string): string[] => {
    const sentences = text.split(/(?<=[.!?。])\s+/);
    return sentences.filter(s => s.trim().length > 0);
  }, []);

  // Speak next sentence in queue
  const speakNextSentence = useCallback(() => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      setTimeout(speakNextSentence, 100);
      return;
    }

    if (currentSentenceIndexRef.current >= sentenceQueueRef.current.length) {
      // All done
      console.log('[Voice] All sentences spoken');
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setCurrentSpeakingText('');
      setCurrentSentenceIndex(0);
      sentenceQueueRef.current = [];
      currentSentenceIndexRef.current = 0;
      
      audioEndTimeRef.current = Date.now();
      options.onSpeakEnd?.();
      
      // Unblock after cooldown
      setTimeout(() => {
        isOutputtingAudioRef.current = false;
      }, TTS_COOLDOWN_MS);
      return;
    }

    const sentence = sentenceQueueRef.current[currentSentenceIndexRef.current];
    isOutputtingAudioRef.current = true;
    
    console.log('[Voice] Speaking sentence', currentSentenceIndexRef.current + 1, '/', sentenceQueueRef.current.length);
    
    setCurrentSentenceIndex(currentSentenceIndexRef.current);
    options.onSpeakProgress?.(currentSentenceIndexRef.current, sentenceQueueRef.current.length);

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = (options.speechSpeed ?? 0.85) * 0.88;
    utterance.pitch = (options.pitch ?? 1.0) * 1.02;
    utterance.volume = options.volume ?? 1.0;

    // Get voice
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice: SpeechSynthesisVoice | undefined;
    
    if (options.selectedVoiceName) {
      preferredVoice = voices.find(v => v.name === options.selectedVoiceName);
    }
    
    if (!preferredVoice) {
      const voiceGender = options.voiceGender ?? 'female';
      const localePreference = language === 'es' 
        ? ['es-CL', 'es-MX', 'es-419', 'es-ES', 'es-US', 'es']
        : ['en-CA', 'en-US', 'en-GB', 'en-AU', 'en'];
      
      let langVoices: SpeechSynthesisVoice[] = [];
      for (const locale of localePreference) {
        const matchingVoices = voices.filter(v => 
          locale.includes('-') ? v.lang === locale : v.lang.startsWith(locale)
        );
        if (matchingVoices.length > 0) {
          langVoices = matchingVoices;
          break;
        }
      }
      
      if (langVoices.length === 0) {
        const baseLang = language === 'es' ? 'es' : 'en';
        langVoices = voices.filter(v => v.lang.startsWith(baseLang));
      }
      
      if (voiceGender !== 'auto' && langVoices.length > 0) {
        const femalePatterns = /female|mujer|femenin|samantha|victoria|karen|monica|paulina|helena|zira|hazel|susan|alice|fiona|moira|tessa|ava|allison|kate|siri.*female|google.*female|microsoft.*female|francisca|catalina|ximena|carmen|valentina|amelie|chloe|marie|nathalie|sylvie|angelica|ines|consuelo|esperanza|lucia|rosa/i;
        const malePatterns = /male|hombre|masculin|alex|jorge|daniel|david|diego|enrique|carlos|mark|thomas|oliver|james|fred|lee|rishi|aaron|siri.*male|google.*male|microsoft.*male|andres|pablo|rodrigo|mateo|sebastian|nicolas|felipe|ivan|pedro|antonio|luis|miguel|juan|manuel|jean|pierre|jacques|claude|benoit|francois/i;
        
        const targetPattern = voiceGender === 'female' ? femalePatterns : malePatterns;
        
        preferredVoice = langVoices.find(v => v.localService && targetPattern.test(v.name))
          || langVoices.find(v => targetPattern.test(v.name))
          || langVoices.find(v => v.localService)
          || langVoices[0];
      } else {
        preferredVoice = langVoices.find(v => v.localService) || langVoices[0];
      }
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    utterance.onstart = () => {
      if (currentSentenceIndexRef.current === 0) {
        setIsSpeaking(true);
        options.onSpeakStart?.();
      }
    };

    utterance.onend = () => {
      currentSentenceIndexRef.current++;
      setTimeout(() => {
        if (!window.speechSynthesis.paused && sentenceQueueRef.current.length > 0) {
          speakNextSentence();
        }
      }, SENTENCE_PAUSE_MS);
    };

    utterance.onerror = (event) => {
      console.error('[Voice] Speech synthesis error:', event);
      currentSentenceIndexRef.current++;
      if (currentSentenceIndexRef.current < sentenceQueueRef.current.length) {
        speakNextSentence();
      } else {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        setCurrentSpeakingText('');
        isOutputtingAudioRef.current = false;
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [language, options]);

  // Speak text
  const speak = useCallback(async (text: string) => {
    if (!isSupported || !text) return;

    // Duplicate prevention
    const cleanedForDupeCheck = text.trim().toLowerCase().substring(0, 100);
    const now = Date.now();
    if (
      cleanedForDupeCheck === lastSpokenTextRef.current.toLowerCase().substring(0, 100) &&
      now - lastSpokenTimeRef.current < DUPLICATE_THRESHOLD_MS
    ) {
      console.log('[Voice] Blocked: Duplicate speech detected');
      return;
    }
    
    lastSpokenTextRef.current = text.trim();
    lastSpokenTimeRef.current = now;

    // Stop recognition while speaking
    isOutputtingAudioRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    accumulatedTextRef.current = '';
    clearPauseTimeout();

    // ALWAYS set the speaking text BEFORE attempting any TTS
    // This ensures KaraokeText works regardless of which engine speaks
    setCurrentSpeakingText(text);
    setCurrentSentenceIndex(0);

    // Try premium TTS first
    if (options.premiumSpeak) {
      console.log('[Voice] Attempting premium TTS');
      
      const result = await options.premiumSpeak(text);
      
      if (result.success) {
        console.log('[Voice] Premium TTS completed successfully');
        // ElevenLabs already handled onStart/onEnd callbacks internally
        setTimeout(() => {
          isOutputtingAudioRef.current = false;
        }, TTS_COOLDOWN_MS);
        return;
      }
      
      // ONLY fallback to native if premium failed BEFORE audio started
      // These errors mean audio NEVER played:
      // - 'not_eligible': User doesn't have premium minutes
      // - 'no_session': Not authenticated
      // - 'empty_text': Nothing to speak
      // - 'play_error': Browser blocked autoplay (no user gesture)
      // Other errors (playback_error, network_error) mean audio MAY have started
      const shouldFallbackToNative = ['not_eligible', 'no_session', 'empty_text', 'play_error'].includes(result.error || '');
      console.log('[Voice] Premium TTS result:', result.error, '| Fallback to native:', shouldFallbackToNative);
      
      if (!shouldFallbackToNative) {
        // Audio might have partially played - DON'T double-play with native
        console.log('[Voice] Not falling back - audio may have started playing');
        setTimeout(() => {
          isOutputtingAudioRef.current = false;
        }, 500);
        return;
      }
      
      // User not eligible for premium - fall through to native TTS
      console.log('[Voice] Falling back to native TTS (user not eligible for premium)');
    }

    // Use native TTS
    console.log('[Voice] Using native TTS');
    window.speechSynthesis.cancel();
    
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      setTimeout(() => speak(text), 100);
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      setTimeout(() => {
        isOutputtingAudioRef.current = false;
      }, 300);
      return;
    }

    const sentences = splitIntoSentences(cleanedText);
    sentenceQueueRef.current = sentences;
    currentSentenceIndexRef.current = 0;
    setCurrentSpeakingText(text);
    setCurrentSentenceIndex(0);
    setIsSpeechPaused(false);

    setTimeout(() => {
      speakNextSentence();
    }, 150);
  }, [isSupported, options, cleanTextForSpeech, splitIntoSentences, clearPauseTimeout, speakNextSentence]);

  // Pause speech
  const pauseSpeech = useCallback(() => {
    if (isSpeaking && !isSpeechPaused) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
    }
  }, [isSpeaking, isSpeechPaused]);

  // Resume speech
  const resumeSpeech = useCallback(() => {
    if (isSpeaking && isSpeechPaused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
    }
  }, [isSpeaking, isSpeechPaused]);

  // Stop speaking
  const stopSpeaking = useCallback((wasInterrupted = false) => {
    const wasActuallySpeaking = isSpeaking;

    window.speechSynthesis.cancel();
    sentenceQueueRef.current = [];
    currentSentenceIndexRef.current = 0;
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    setCurrentSpeakingText('');
    setCurrentSentenceIndex(0);
    
    if (wasInterrupted && wasActuallySpeaking) {
      options.onInterrupted?.();
    }
    
    setTimeout(() => {
      isOutputtingAudioRef.current = false;
    }, wasInterrupted ? 100 : 500);
  }, [isSpeaking, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPauseTimeout();
      sentenceQueueRef.current = [];
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
      window.speechSynthesis.cancel();
    };
  }, [clearPauseTimeout]);

  return {
    isListening,
    isSpeaking,
    isSpeechPaused,
    isSupported,
    transcript,
    currentSpeakingText,
    currentSentenceIndex,
    totalSentences: sentenceQueueRef.current.length,
    startListening,
    stopListening,
    toggleListening,
    speak,
    pauseSpeech,
    resumeSpeech,
    stopSpeaking,
  };
}
