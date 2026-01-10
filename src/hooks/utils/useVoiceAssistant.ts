import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseVoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onContinuousStopped?: () => void;
  onSpeakProgress?: (sentenceIndex: number, totalSentences: number) => void;
  onInterrupted?: () => void; // Called when user interrupts speech
  speechSpeed?: number; // 0.5 to 2.0, default 1.0
  volume?: number; // 0 to 1, default 1.0
  pitch?: number; // 0.5 to 2.0, default 1.0
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
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
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
  
  // Sentence-by-sentence speech queue
  const sentenceQueueRef = useRef<string[]>([]);
  const currentSentenceIndexRef = useRef(0);

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
      
      // In continuous mode, try to restart on transient errors with AGGRESSIVE reconnection
      if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
        // Use exponential backoff for mobile devices which have flaky connections
        const isNetworkError = event.error === 'network' || event.error === 'service-not-allowed';
        const delay = isNetworkError ? 500 : 200; // Longer delay for network issues
        
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
            console.log('[Voice] Aggressive reconnection attempt');
            createAndStartRecognition(true);
          }
        }, delay);
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
      
      // In continuous mode, restart automatically with AGGRESSIVE retry logic
      if (continuousModeRef.current) {
        // Immediate retry for continuous mode - critical for mobile
        const retryImmediate = () => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
            console.log('[Voice] Auto-restart in continuous mode');
            createAndStartRecognition(true);
          }
        };
        
        // Try immediate restart, if fails will be caught by onerror
        setTimeout(retryImmediate, 50);
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

  // Stop continuous mode - AGGRESSIVE CLEANUP
  const stopContinuousListening = useCallback(() => {
    console.log('[Voice] FORCE stopping continuous mode');
    
    // CRITICAL: Set flags FIRST to prevent any restarts
    continuousModeRef.current = false;
    isPausedForSpeakingRef.current = true; // Block any pending restarts
    
    setIsContinuousMode(false);
    setIsListening(false);
    accumulatedTextRef.current = '';
    clearPauseTimeout();
    
    // Kill recognition multiple times to ensure it's dead
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    
    // Cancel any speech synthesis
    window.speechSynthesis.cancel();
    
    // Unblock after a short delay
    setTimeout(() => {
      isPausedForSpeakingRef.current = false;
    }, 500);
  }, [clearPauseTimeout]);

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

  // Split text into sentences for natural pauses
  const splitIntoSentences = useCallback((text: string): string[] => {
    // Split by sentence-ending punctuation but keep the punctuation
    const sentences = text.split(/(?<=[.!?。])\s+/);
    return sentences.filter(s => s.trim().length > 0);
  }, []);

  // Speak the next sentence in queue
  const speakNextSentence = useCallback(() => {
    if (currentSentenceIndexRef.current >= sentenceQueueRef.current.length) {
      // All done
      console.log('[Voice] All sentences spoken');
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setCurrentSpeakingText('');
      setCurrentSentenceIndex(0);
      sentenceQueueRef.current = [];
      currentSentenceIndexRef.current = 0;
      options.onSpeakEnd?.();
      
      // Resume listening after delay if in continuous mode
      if (continuousModeRef.current) {
        setTimeout(() => {
          console.log('[Voice] Unblocking mic after speech');
          isPausedForSpeakingRef.current = false;
          
          setTimeout(() => {
            if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
              createAndStartRecognition(true);
            }
          }, 200);
        }, 1000);
      } else {
        isPausedForSpeakingRef.current = false;
      }
      return;
    }

    const sentence = sentenceQueueRef.current[currentSentenceIndexRef.current];
    console.log('[Voice] Speaking sentence', currentSentenceIndexRef.current + 1, '/', sentenceQueueRef.current.length);
    
    setCurrentSentenceIndex(currentSentenceIndexRef.current);
    options.onSpeakProgress?.(currentSentenceIndexRef.current, sentenceQueueRef.current.length);

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    // Use provided speech speed or default
    utterance.rate = (options.speechSpeed ?? 1.0) * 0.95; // Slightly slower base for natural speech
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

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
      if (currentSentenceIndexRef.current === 0) {
        setIsSpeaking(true);
        options.onSpeakStart?.();
      }
    };

    utterance.onend = () => {
      currentSentenceIndexRef.current++;
      
      // Add a natural pause between sentences (400ms)
      setTimeout(() => {
        if (!window.speechSynthesis.paused && sentenceQueueRef.current.length > 0) {
          speakNextSentence();
        }
      }, 400);
    };

    utterance.onerror = (event) => {
      console.error('[Voice] Speech synthesis error:', event);
      
      // Try next sentence or finish
      currentSentenceIndexRef.current++;
      if (currentSentenceIndexRef.current < sentenceQueueRef.current.length) {
        speakNextSentence();
      } else {
        setIsSpeaking(false);
        setIsSpeechPaused(false);
        setCurrentSpeakingText('');
        
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
      }
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language, options, createAndStartRecognition]);

  // Speak text with COMPLETE mic blocking and natural sentence pauses
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

    // Split into sentences for natural pauses
    const sentences = splitIntoSentences(cleanedText);
    sentenceQueueRef.current = sentences;
    currentSentenceIndexRef.current = 0;
    setCurrentSpeakingText(text);
    setCurrentSentenceIndex(0);
    setIsSpeechPaused(false);

    // Small delay to ensure abort takes effect
    setTimeout(() => {
      speakNextSentence();
    }, 150);
  }, [isSupported, cleanTextForSpeech, splitIntoSentences, clearPauseTimeout, speakNextSentence, createAndStartRecognition]);

  // Pause speech
  const pauseSpeech = useCallback(() => {
    if (isSpeaking && !isSpeechPaused) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
      console.log('[Voice] Speech paused');
    }
  }, [isSpeaking, isSpeechPaused]);

  // Resume speech
  const resumeSpeech = useCallback(() => {
    if (isSpeaking && isSpeechPaused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
      console.log('[Voice] Speech resumed');
    }
  }, [isSpeaking, isSpeechPaused]);

  // Stop speaking completely (user can call this to interrupt)
  const stopSpeaking = useCallback((wasInterrupted = false) => {
    const wasActuallySpeaking = isSpeaking;
    
    window.speechSynthesis.cancel();
    sentenceQueueRef.current = [];
    currentSentenceIndexRef.current = 0;
    setIsSpeaking(false);
    setIsSpeechPaused(false);
    setCurrentSpeakingText('');
    setCurrentSentenceIndex(0);
    
    // Notify if this was an interruption
    if (wasInterrupted && wasActuallySpeaking) {
      options.onInterrupted?.();
    }
    
    // Unblock mic if needed
    if (continuousModeRef.current) {
      setTimeout(() => {
        isPausedForSpeakingRef.current = false;
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
            createAndStartRecognition(true);
          }
        }, 200);
      }, wasInterrupted ? 100 : 500); // Faster resume on interruption
    } else {
      isPausedForSpeakingRef.current = false;
    }
  }, [isSpeaking, createAndStartRecognition, options]);

  // Interrupt current speech and immediately start listening
  const interruptAndListen = useCallback(() => {
    console.log('[Voice] User interrupted - stopping speech and starting listen');
    stopSpeaking(true);
    
    // Small delay then start listening
    setTimeout(() => {
      if (!isPausedForSpeakingRef.current) {
        if (continuousModeRef.current) {
          createAndStartRecognition(true);
        } else {
          createAndStartRecognition(false);
        }
      }
    }, 150);
  }, [stopSpeaking, createAndStartRecognition]);

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
    isContinuousMode,
    isSpeaking,
    isSpeechPaused,
    isSupported,
    transcript,
    currentSpeakingText,
    currentSentenceIndex,
    totalSentences: sentenceQueueRef.current.length,
    startListening,
    stopListening,
    startContinuousListening,
    stopContinuousListening,
    toggleListening,
    speak,
    pauseSpeech,
    resumeSpeech,
    stopSpeaking,
    interruptAndListen,
  };
}
