import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseVoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onContinuousStopped?: () => void;
}

// STRICT stop commands - must match EXACTLY
const STOP_COMMANDS = {
  es: ['detener', 'parar', 'stop'],
  en: ['stop', 'pause', 'quit'],
};

// Pause duration (ms) before sending accumulated transcript
const PAUSE_THRESHOLD_MS = 1800;

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const continuousModeRef = useRef(false);
  
  // CRITICAL: Flag that blocks ALL recognition during speech
  const isPausedForSpeakingRef = useRef(false);
  
  // Accumulation for pause-based sending
  const accumulatedTextRef = useRef('');
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Speech synthesis ref
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    setIsSupported(hasSpeechRecognition && 'speechSynthesis' in window);
  }, []);

  // Check if text is a stop command (EXACT match only)
  const isStopCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim().replace(/[.,!?¿¡]/g, '');
    const commands = STOP_COMMANDS[language as keyof typeof STOP_COMMANDS] || STOP_COMMANDS.en;
    return commands.includes(normalizedText);
  }, [language]);

  // Clear pause timeout
  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  // Stop recognition completely
  const stopRecognition = useCallback(() => {
    console.log('[Voice] Stopping recognition completely');
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
      console.log('[Voice] Flushing accumulated text:', text);
      options.onTranscript(text);
    }
  }, [options, clearPauseTimeout]);

  // Start pause timer - will flush after threshold
  const startPauseTimer = useCallback(() => {
    clearPauseTimeout();
    
    pauseTimeoutRef.current = setTimeout(() => {
      if (accumulatedTextRef.current.trim()) {
        flushAccumulatedText();
      }
    }, PAUSE_THRESHOLD_MS);
  }, [clearPauseTimeout, flushAccumulatedText]);

  // Create and start recognition
  const createAndStartRecognition = useCallback((continuous: boolean) => {
    // Don't start if paused for speaking
    if (isPausedForSpeakingRef.current) {
      console.log('[Voice] Blocked: paused for speaking');
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
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language === 'es' ? 'es-ES' : 'en-US';

    recognition.onstart = () => {
      if (!isPausedForSpeakingRef.current) {
        console.log('[Voice] Recognition started');
        setIsListening(true);
        setTranscript('');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // CRITICAL: Ignore all results if paused for speaking
      if (isPausedForSpeakingRef.current) {
        console.log('[Voice] Ignoring result - paused for speaking');
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

      // Show interim text in UI
      const displayText = accumulatedTextRef.current + (interimTranscript ? ' ' + interimTranscript : '');
      setTranscript(displayText.trim());
      
      if (interimTranscript && options.onInterimTranscript) {
        options.onInterimTranscript(displayText.trim());
      }

      if (finalTranscript) {
        const trimmedFinal = finalTranscript.trim();
        console.log('[Voice] Final transcript segment:', trimmedFinal);

        // Check for stop command FIRST (only exact matches)
        if (continuousModeRef.current && isStopCommand(trimmedFinal)) {
          console.log('[Voice] Stop command detected');
          continuousModeRef.current = false;
          setIsContinuousMode(false);
          accumulatedTextRef.current = '';
          stopRecognition();
          options.onContinuousStopped?.();
          return;
        }

        // Accumulate the text
        if (accumulatedTextRef.current) {
          accumulatedTextRef.current += ' ' + trimmedFinal;
        } else {
          accumulatedTextRef.current = trimmedFinal;
        }

        // Update display
        setTranscript(accumulatedTextRef.current);
        if (options.onInterimTranscript) {
          options.onInterimTranscript(accumulatedTextRef.current);
        }

        // In continuous mode, wait for pause before sending
        if (continuousModeRef.current) {
          startPauseTimer();
        } else {
          // Single mode: send immediately on final
          flushAccumulatedText();
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.log('[Voice] Recognition error:', event.error);
      
      // Don't restart if paused for speaking or aborted
      if (isPausedForSpeakingRef.current || event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      
      // In continuous mode, try to restart on transient errors
      if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
            createAndStartRecognition(true);
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended, paused:', isPausedForSpeakingRef.current, 'continuous:', continuousModeRef.current);
      
      // Don't restart if paused for speaking
      if (isPausedForSpeakingRef.current) {
        setIsListening(false);
        return;
      }
      
      // In continuous mode, restart automatically
      if (continuousModeRef.current) {
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
            createAndStartRecognition(true);
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      console.error('[Voice] Failed to start recognition:', err);
      setIsListening(false);
    }
  }, [language, options, isStopCommand, stopRecognition, startPauseTimer, flushAccumulatedText]);

  // Start single-phrase listening
  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    console.log('[Voice] Starting single listening');
    
    // Cancel any speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Reset state
    isPausedForSpeakingRef.current = false;
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    
    createAndStartRecognition(false);
  }, [isSupported, createAndStartRecognition, clearPauseTimeout]);

  // Start continuous mode
  const startContinuousListening = useCallback(() => {
    if (!isSupported) return;
    
    console.log('[Voice] Starting continuous mode');
    
    // Cancel any speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Reset state
    isPausedForSpeakingRef.current = false;
    continuousModeRef.current = true;
    setIsContinuousMode(true);
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    
    createAndStartRecognition(true);
  }, [isSupported, createAndStartRecognition, clearPauseTimeout]);

  // Stop continuous mode
  const stopContinuousListening = useCallback(() => {
    console.log('[Voice] Stopping continuous mode');
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    stopRecognition();
  }, [stopRecognition, clearPauseTimeout]);

  // Stop all listening
  const stopListening = useCallback(() => {
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    stopRecognition();
  }, [stopRecognition, clearPauseTimeout]);

  // Clean text for speech
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Remove emojis
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '')
      // Remove markdown
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      // Remove list markers
      .replace(/^[\s]*[-•◦▪▸►]\s*/gm, '')
      .replace(/^\s*\d+\.\s*/gm, '')
      // Clean whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Speak text with COMPLETE mic blocking
  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    console.log('[Voice] Starting speech - BLOCKING MIC');
    
    // CRITICAL: Block recognition IMMEDIATELY
    isPausedForSpeakingRef.current = true;
    
    // Stop recognition completely
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    
    // Clear any accumulated text and pause timer
    accumulatedTextRef.current = '';
    clearPauseTimeout();

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      // No text to speak, resume immediately if in continuous mode
      if (continuousModeRef.current) {
        isPausedForSpeakingRef.current = false;
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
            createAndStartRecognition(true);
          }
        }, 300);
      }
      return;
    }

    // Small delay to ensure abort takes effect
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Get a native voice
      const voices = window.speechSynthesis.getVoices();
      const langCode = language === 'es' ? 'es' : 'en';
      const preferredVoice = voices.find(v => 
        v.lang.startsWith(langCode) && v.localService
      ) || voices.find(v => v.lang.startsWith(langCode));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        console.log('[Voice] Speech started');
        setIsSpeaking(true);
        options.onSpeakStart?.();
      };

      utterance.onend = () => {
        console.log('[Voice] Speech ended');
        setIsSpeaking(false);
        options.onSpeakEnd?.();

        // Resume listening after delay if in continuous mode
        if (continuousModeRef.current) {
          // Wait 1 second AFTER speech ends to avoid echo
          setTimeout(() => {
            console.log('[Voice] Unblocking mic after speech');
            isPausedForSpeakingRef.current = false;
            
            // Additional delay before starting recognition
            setTimeout(() => {
              if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
                createAndStartRecognition(true);
              }
            }, 200);
          }, 1000);
        } else {
          isPausedForSpeakingRef.current = false;
        }
      };

      utterance.onerror = (event) => {
        console.error('[Voice] Speech synthesis error:', event);
        setIsSpeaking(false);
        
        // Resume listening even on error
        if (continuousModeRef.current) {
          setTimeout(() => {
            isPausedForSpeakingRef.current = false;
            setTimeout(() => {
              if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
                createAndStartRecognition(true);
              }
            }, 200);
          }, 500);
        } else {
          isPausedForSpeakingRef.current = false;
        }
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 150);
  }, [isSupported, language, options, cleanTextForSpeech, clearPauseTimeout, createAndStartRecognition]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Toggle single listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPausedForSpeakingRef.current = true;
      clearPauseTimeout();
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
    isContinuousMode,
    isSpeaking,
    isSupported,
    transcript,
    startListening,
    stopListening,
    startContinuousListening,
    stopContinuousListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
