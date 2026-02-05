import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
  }
}

interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { language: appLanguage } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const shouldRestartRef = useRef<boolean>(false);
  const maxDurationRef = useRef<NodeJS.Timeout | null>(null);
  const restartCountRef = useRef<number>(0);
  const lastRestartTimeRef = useRef<number>(0);
  const isInitializingRef = useRef<boolean>(false);

  const voiceLanguage = options.language || (appLanguage === 'es' ? 'es-ES' : 'en-CA');

  // Constants
  const MAX_DURATION_MS = 60000;
  const MAX_RESTARTS_PER_SECOND = 3;
  const RESTART_COOLDOWN_MS = 500;

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      // Enable continuous mode for longer recordings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += result;
          } else {
            interimTranscript += result;
          }
        }

        // Accumulate final transcripts
        if (finalTranscript) {
          accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + finalTranscript.trim();
        }

        // Show accumulated + current interim
        const displayTranscript = accumulatedTranscriptRef.current + 
          (interimTranscript ? (accumulatedTranscriptRef.current ? ' ' : '') + interimTranscript : '');
        setTranscript(displayTranscript);

        if (finalTranscript && options.onResult) {
          options.onResult(accumulatedTranscriptRef.current);
        }
      };

      recognition.onerror = (event) => {
        console.log('[Voice] Recognition error:', event.error);
        
        // For aborted/no-speech errors, let onend handle restart logic
        if (event.error === 'aborted' || event.error === 'no-speech') {
          // Don't do anything here - onend will handle it with proper throttling
          return;
        }
        
        setIsListening(false);
        shouldRestartRef.current = false;
        
        let errorMessage = 'Voice recognition error';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected';
            break;
          case 'network':
            errorMessage = 'Network error';
            break;
        }

        if (options.onError) {
          options.onError(errorMessage);
        }
      };

      recognition.onend = () => {
        console.log('[Voice] Recognition ended, paused:', !shouldRestartRef.current, 'continuous:', options.continuous);
        
        // Throttle restarts to prevent infinite loops
        if (shouldRestartRef.current) {
          const now = Date.now();
          const timeSinceLastRestart = now - lastRestartTimeRef.current;
          
          // Reset counter if enough time has passed
          if (timeSinceLastRestart > 1000) {
            restartCountRef.current = 0;
          }
          
          // Check if we're restarting too fast
          if (restartCountRef.current >= MAX_RESTARTS_PER_SECOND) {
            console.log('[Voice] Too many restarts, pausing...');
            // Wait before trying again
            setTimeout(() => {
              restartCountRef.current = 0;
              if (shouldRestartRef.current && recognitionRef.current) {
                try {
                  console.log('[Voice] Delayed restart after throttle');
                  recognitionRef.current.start();
                  lastRestartTimeRef.current = Date.now();
                } catch (e) {
                  console.log('[Voice] Delayed restart failed:', e);
                  setIsListening(false);
                  shouldRestartRef.current = false;
                }
              }
            }, RESTART_COOLDOWN_MS);
            return;
          }
          
          // Normal restart with small delay
          try {
            restartCountRef.current++;
            lastRestartTimeRef.current = now;
            console.log('[Voice] Auto-restart in continuous mode');
            setTimeout(() => {
              if (shouldRestartRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('[Voice] Restart failed:', e);
                }
              }
            }, 100); // Small delay to prevent rapid cycling
          } catch (e) {
            setIsListening(false);
            shouldRestartRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    isInitializingRef.current = false;

    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        recognitionRef.current.abort();
      }
      if (maxDurationRef.current) {
        clearTimeout(maxDurationRef.current);
      }
    };
  }, [voiceLanguage]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      // Reset accumulated transcript
      accumulatedTranscriptRef.current = '';
      setTranscript('');
      setIsListening(true);
      shouldRestartRef.current = true;
      restartCountRef.current = 0;
      lastRestartTimeRef.current = Date.now();
      
      // Set max duration timeout (60 seconds)
      if (maxDurationRef.current) {
        clearTimeout(maxDurationRef.current);
      }
      maxDurationRef.current = setTimeout(() => {
        shouldRestartRef.current = false;
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
      }, MAX_DURATION_MS);
      
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setIsListening(false);
        shouldRestartRef.current = false;
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    restartCountRef.current = 0;
    if (maxDurationRef.current) {
      clearTimeout(maxDurationRef.current);
      maxDurationRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    setTranscript,
  };
}
