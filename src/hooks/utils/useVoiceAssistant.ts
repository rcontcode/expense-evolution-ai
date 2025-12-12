import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseVoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onContinuousStopped?: () => void;
}

// Voice commands to stop continuous mode
const STOP_COMMANDS = {
  es: ['detener', 'parar', 'stop', 'para', 'basta', 'silencio', 'terminar'],
  en: ['stop', 'pause', 'quit', 'end', 'silence', 'halt'],
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
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    setIsSupported(hasSpeechRecognition && 'speechSynthesis' in window);
  }, []);

  const continuousModeRef = useRef(false);

  // Check if text contains a stop command
  const isStopCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim();
    const commands = STOP_COMMANDS[language as keyof typeof STOP_COMMANDS] || STOP_COMMANDS.en;
    return commands.some(cmd => normalizedText.includes(cmd));
  }, [language]);

  // Initialize speech recognition
  const initRecognition = useCallback((continuous: boolean = false) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language === 'es' ? 'es-ES' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
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

      setTranscript(interimTranscript || finalTranscript);

      if (finalTranscript) {
        // Check for stop command in continuous mode
        if (continuousModeRef.current && isStopCommand(finalTranscript)) {
          stopContinuousListening();
          options.onContinuousStopped?.();
          return;
        }
        options.onTranscript?.(finalTranscript);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // In continuous mode, restart on some errors
      if (continuousModeRef.current && event.error !== 'aborted') {
        setTimeout(() => {
          if (continuousModeRef.current) {
            try {
              recognitionRef.current = initRecognition(true);
              recognitionRef.current?.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }
        }, 500);
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // In continuous mode, restart listening after each phrase
      if (continuousModeRef.current) {
        setTimeout(() => {
          if (continuousModeRef.current) {
            try {
              recognitionRef.current = initRecognition(true);
              recognitionRef.current?.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [language, options, isStopCommand]);

  // Start listening (single phrase)
  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    continuousModeRef.current = false;
    setIsContinuousMode(false);

    recognitionRef.current = initRecognition(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, [isSupported, initRecognition]);

  // Start continuous listening mode
  const startContinuousListening = useCallback(() => {
    if (!isSupported) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    continuousModeRef.current = true;
    setIsContinuousMode(true);

    recognitionRef.current = initRecognition(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting continuous recognition:', error);
      }
    }
  }, [isSupported, initRecognition]);

  // Stop continuous listening mode
  const stopContinuousListening = useCallback(() => {
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to get a native voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'es' ? 'es' : 'en';
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(langCode) && v.localService
    ) || voices.find(v => v.lang.startsWith(langCode));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      options.onSpeakStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      options.onSpeakEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, options]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Toggle voice mode
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

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
