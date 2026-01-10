import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseVoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onContinuousStopped?: () => void;
}

// Voice commands to stop continuous mode
// IMPORTANT: keep this strict to avoid accidentally stopping when the assistant says
// phrases like "para detener...".
const STOP_COMMANDS = {
  es: ['detener', 'parar', 'stop', 'detener asistente', 'parar asistente'],
  en: ['stop', 'pause', 'quit', 'stop assistant', 'pause assistant'],
};

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
  // CRITICAL: Single flag to prevent any recognition activity
  const blockedRef = useRef(false);
  // Accumulated text in continuous mode
  const accumulatedRef = useRef('');

  // Anti-echo: keep a normalized copy of what we just spoke, and a short suppression window
  const lastSpokenNormalizedRef = useRef('');
  const suppressRecognitionUntilRef = useRef(0);

  // Speech synthesis utterance
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    setIsSupported(hasSpeechRecognition && 'speechSynthesis' in window);
  }, []);

  // Check if text is a stop command (strict match)
  const isStopCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim().replace(/[\p{P}\p{S}]+/gu, '');
    const commands = STOP_COMMANDS[language as keyof typeof STOP_COMMANDS] || STOP_COMMANDS.en;
    return commands.some((cmd) => normalizedText === cmd);
  }, [language]);

  // Stop recognition completely
  const stopRecognition = useCallback(() => {
    blockedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Create and start recognition
  const createAndStartRecognition = useCallback((continuous: boolean) => {
    // Don't start if blocked
    if (blockedRef.current) return;
    
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
      if (!blockedRef.current) {
        setIsListening(true);
        setTranscript('');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (blockedRef.current) return;

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

      // Update transcript display
      const currentText = interimTranscript || finalTranscript;
      setTranscript(currentText);

      // Call interim callback for live display
      if (interimTranscript && options.onInterimTranscript) {
        options.onInterimTranscript(interimTranscript);
      }

      if (finalTranscript) {
        const trimmedFinal = finalTranscript.trim();

        // Anti-echo: ignore likely self-transcriptions right after we speak
        if (continuousModeRef.current) {
          const nowTs = Date.now();
          if (nowTs < suppressRecognitionUntilRef.current) {
            return;
          }

          const normalizedFinal = trimmedFinal
            .toLowerCase()
            .trim()
            .replace(/[\p{P}\p{S}]+/gu, ' ')
            .replace(/\s+/g, ' ');

          const lastSpoken = lastSpokenNormalizedRef.current;
          if (lastSpoken && normalizedFinal.length >= 12) {
            // If the transcript is contained within what we just spoke (or vice versa), ignore.
            if (lastSpoken.includes(normalizedFinal) || normalizedFinal.includes(lastSpoken)) {
              return;
            }

            // If the first few words match a snippet of what we just spoke, ignore.
            const words = normalizedFinal.split(' ');
            if (words.length >= 4) {
              const snippet = words.slice(0, 4).join(' ');
              if (lastSpoken.includes(snippet)) {
                return;
              }
            }
          }
        }

        // Check for stop command in continuous mode
        if (continuousModeRef.current && isStopCommand(trimmedFinal)) {
          console.log('[Voice] Stop command detected, stopping continuous mode');
          continuousModeRef.current = false;
          setIsContinuousMode(false);
          stopRecognition();
          options.onContinuousStopped?.();
          return;
        }

        // Accumulate in continuous mode
        if (continuousModeRef.current) {
          accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + trimmedFinal;
        }

        // Send to callback
        if (options.onTranscript) {
          options.onTranscript(trimmedFinal);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.log('[Voice] Recognition error:', event.error);
      
      // Don't restart if blocked or aborted
      if (blockedRef.current || event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      
      // In continuous mode, try to restart on transient errors
      if (continuousModeRef.current && !blockedRef.current) {
        setTimeout(() => {
          if (continuousModeRef.current && !blockedRef.current) {
            createAndStartRecognition(true);
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('[Voice] Recognition ended, blocked:', blockedRef.current, 'continuous:', continuousModeRef.current);
      
      // Don't restart if blocked
      if (blockedRef.current) {
        setIsListening(false);
        return;
      }
      
      // In continuous mode, restart automatically
      if (continuousModeRef.current) {
        setTimeout(() => {
          if (continuousModeRef.current && !blockedRef.current) {
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
  }, [language, options, isStopCommand, stopRecognition]);

  // Start single-phrase listening
  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    // Cancel any speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Reset state
    blockedRef.current = false;
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    accumulatedRef.current = '';
    
    createAndStartRecognition(false);
  }, [isSupported, createAndStartRecognition]);

  // Start continuous mode
  const startContinuousListening = useCallback(() => {
    if (!isSupported) return;
    
    console.log('[Voice] Starting continuous mode');
    
    // Cancel any speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Reset state
    blockedRef.current = false;
    continuousModeRef.current = true;
    setIsContinuousMode(true);
    accumulatedRef.current = '';
    
    createAndStartRecognition(true);
  }, [isSupported, createAndStartRecognition]);

  // Stop continuous mode
  const stopContinuousListening = useCallback(() => {
    console.log('[Voice] Stopping continuous mode');
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    stopRecognition();
  }, [stopRecognition]);

  // Stop all listening
  const stopListening = useCallback(() => {
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    stopRecognition();
  }, [stopRecognition]);

  // Pause listening (for speaking)
  const pauseListening = useCallback(() => {
    console.log('[Voice] Pausing for speech');
    blockedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  // Resume listening (after speaking)
  const resumeListening = useCallback(() => {
    console.log('[Voice] Resuming after speech');
    blockedRef.current = false;
    
    if (continuousModeRef.current) {
      setTimeout(() => {
        if (continuousModeRef.current && !blockedRef.current) {
          createAndStartRecognition(true);
        }
      }, 200);
    }
  }, [createAndStartRecognition]);

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

  // Speak text with proper pause/resume coordination
  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    console.log('[Voice] Starting speech');
    
    // CRITICAL: Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // CRITICAL: Pause listening BEFORE speaking
    if (continuousModeRef.current) {
      // Block recognition immediately and for a short window to avoid echo loops
      suppressRecognitionUntilRef.current = Date.now() + 1400;
      pauseListening();
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      // No text to speak, resume immediately
      if (continuousModeRef.current) {
        resumeListening();
      }
      return;
    }

    // Store what we're about to say (normalized) to filter self-transcriptions
    lastSpokenNormalizedRef.current = cleanedText
      .toLowerCase()
      .trim()
      .replace(/[\p{P}\p{S}]+/gu, ' ')
      .replace(/\s+/g, ' ');

    // Small delay to ensure cancel takes effect
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

        // Keep a short suppression window after speech ends as well
        suppressRecognitionUntilRef.current = Date.now() + 900;

        // Resume listening after a delay
        if (continuousModeRef.current) {
          setTimeout(() => {
            resumeListening();
          }, 650);
        }
      };

      utterance.onerror = (event) => {
        console.error('[Voice] Speech synthesis error:', event);
        setIsSpeaking(false);
        
        // Resume listening even on error
        if (continuousModeRef.current) {
          setTimeout(() => {
            resumeListening();
          }, 500);
        }
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, [isSupported, language, options, cleanTextForSpeech, pauseListening, resumeListening]);

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
      blockedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
      window.speechSynthesis.cancel();
    };
  }, []);

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
