import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseVoiceAssistantOptions {
  onTranscript?: (text: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onContinuousStopped?: () => void;
}

// Voice commands to stop continuous mode - must be EXACT phrases, not partial matches
// Using longer, more specific phrases to avoid false positives from AI responses
const STOP_COMMANDS = {
  es: ['detener asistente', 'parar asistente', 'stop asistente', 'basta ya', 'silencio por favor', 'terminar conversación', 'deja de escuchar'],
  en: ['stop assistant', 'pause assistant', 'quit listening', 'end conversation', 'silence please', 'halt assistant', 'stop listening'],
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
  const continuousModeRef = useRef(false);
  // CRITICAL: Track if we're paused for speaking - prevents auto-restart in onend
  const isPausedForSpeakingRef = useRef(false);
  // Track if we should resume listening after speaking ends
  const resumeAfterSpeakingRef = useRef(false);

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasSpeechRecognition = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    setIsSupported(hasSpeechRecognition && 'speechSynthesis' in window);
  }, []);

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
      
      // Don't restart if we're paused for speaking
      if (isPausedForSpeakingRef.current) {
        setIsListening(false);
        return;
      }
      
      // In continuous mode, restart on some errors
      if (continuousModeRef.current && event.error !== 'aborted') {
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
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
      // CRITICAL: Don't auto-restart if we're paused for speaking
      if (isPausedForSpeakingRef.current) {
        setIsListening(false);
        return;
      }
      
      // In continuous mode, restart listening after each phrase
      if (continuousModeRef.current) {
        setTimeout(() => {
          if (continuousModeRef.current && !isPausedForSpeakingRef.current) {
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

  // Pause listening temporarily (for when speaking)
  const pauseListening = useCallback(() => {
    // CRITICAL: Set the flag BEFORE stopping to prevent auto-restart
    isPausedForSpeakingRef.current = true;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error pausing recognition:', e);
      }
    }
    setIsListening(false);
  }, []);

  // Resume listening after pause (for continuous mode after speaking)
  const resumeListening = useCallback(() => {
    // CRITICAL: Clear the pause flag before resuming
    isPausedForSpeakingRef.current = false;
    
    if (continuousModeRef.current) {
      recognitionRef.current = initRecognition(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Error resuming recognition:', error);
        }
      }
    }
  }, [initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    continuousModeRef.current = false;
    setIsContinuousMode(false);
    resumeAfterSpeakingRef.current = false;
    isPausedForSpeakingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Clean text for speech - remove emojis, markdown symbols, and special characters
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Remove emojis and special unicode symbols
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|👋|✨|🎯|💡|📊|💰|📈|🏆|⭐|🔥|✅|❌|⚠️|ℹ️|🎉|🎊|👍|👎|💪|🙌|🤝|💵|💸|📉|📌|🔔|🔒|🔓|💼|📁|📂|🗂️|📝|📋|✏️|📎|📍|🔍|🔎|⚙️|🛠️|🔧|🔨|⚡|🌟|🌈|☀️|🌙|❄️|🔵|🟢|🟡|🟠|🔴|⚫|⚪|🟣|🟤|▶️|⏸️|⏹️|⏺️|⏭️|⏮️|⏩|⏪|🎵|🎶|🎧|🎤|🎬|📱|💻|🖥️|⌨️|🖨️|💾|💿|📀|🎮|🕹️|🎰|🃏|🎴|🀄|🎲|♟️/gu, '')
      // Remove markdown bold/italic markers
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, ' ')
      // Remove markdown headers
      .replace(/#{1,6}\s/g, '')
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline code backticks
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove bullet points and list markers
      .replace(/^[\s]*[-•◦▪▸►]\s*/gm, '')
      .replace(/^\s*\d+\.\s*/gm, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Clean up any remaining special characters that might sound weird
      .replace(/[~^<>|\\]/g, '')
      // Trim
      .trim();
  }, []);

  // Speak text - IMPORTANT: Pause listening while speaking to prevent feedback loop
  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // CRITICAL: Cancel ANY ongoing speech first - this prevents overlapping voices
    window.speechSynthesis.cancel();

    // CRITICAL: If in continuous mode, ALWAYS pause listening to prevent hearing ourselves
    // We check continuousModeRef directly, not isListening state (which may lag)
    if (continuousModeRef.current) {
      resumeAfterSpeakingRef.current = true;
      pauseListening();
    }

    // Clean the text before speaking
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      // If no text to speak, resume listening immediately
      if (continuousModeRef.current) {
        resumeAfterSpeakingRef.current = false;
        // Small delay before resuming
        setTimeout(() => {
          if (continuousModeRef.current) {
            resumeListening();
          }
        }, 300);
      }
      return;
    }

    // Small delay to ensure cancel takes full effect before starting new speech
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanedText);
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
        
        // CRITICAL: Resume listening after speaking ends in continuous mode
        // Add a small delay to ensure the speaker has fully stopped
        if (resumeAfterSpeakingRef.current && continuousModeRef.current) {
          resumeAfterSpeakingRef.current = false;
          setTimeout(() => {
            if (continuousModeRef.current) {
              resumeListening();
            }
          }, 500); // 500ms delay to ensure audio has fully stopped
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        
        // Resume listening even on error
        if (resumeAfterSpeakingRef.current && continuousModeRef.current) {
          resumeAfterSpeakingRef.current = false;
          setTimeout(() => {
            if (continuousModeRef.current) {
              resumeListening();
            }
          }, 500);
        }
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 50); // 50ms delay to ensure cancel completes
  }, [isSupported, language, options, cleanTextForSpeech, pauseListening, resumeListening]);

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
