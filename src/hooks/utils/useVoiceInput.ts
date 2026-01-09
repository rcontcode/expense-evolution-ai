import { useState, useCallback, useRef, useEffect } from 'react';
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

  const voiceLanguage = options.language || (appLanguage === 'es' ? 'es-ES' : 'en-CA');

  // Max recording duration: 60 seconds
  const MAX_DURATION_MS = 60000;

  useEffect(() => {
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
        console.error('Speech recognition error:', event.error);
        
        // Don't stop on no-speech error in continuous mode - just restart
        if (event.error === 'no-speech' && shouldRestartRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already running, ignore
          }
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
        // Auto-restart if we should keep listening (handles browser auto-stop)
        if (shouldRestartRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // If can't restart, stop listening
            setIsListening(false);
            shouldRestartRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

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
