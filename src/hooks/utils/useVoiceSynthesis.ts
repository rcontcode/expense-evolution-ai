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
      // CRITICAL: Convert problematic Unicode to ASCII (prevents "alien" speech)
      .replace(/…/g, '...') // Unicode ellipsis
      .replace(/[""„«»]/g, '"') // Smart quotes and guillemets
      .replace(/[''‚‹›]/g, "'") // Smart apostrophes
      .replace(/—/g, ', ') // Em dash → comma pause
      .replace(/–/g, ', ') // En dash → comma pause
      .replace(/•◦▪▸►▹▻⦿⦾/g, ', ') // Bullets → comma pause
      .replace(/→/g, ' a ') // Arrow
      .replace(/←↑↓↔↕⇒⇐⇑⇓/g, ' ') // All arrows
      .replace(/[©®™℠]/g, '') // Legal symbols
      .replace(/°/g, ' grados ') // Degree
      .replace(/[%]/g, ' por ciento ') // Percentage
      .replace(/[±∓×÷≈≠≤≥∞∑∏√∫]/g, ' ') // Math symbols
      .replace(/[✓✔✅☑]/g, 'si') // Check marks
      .replace(/[✗✘❌☒]/g, 'no') // X marks
      .replace(/[⚠️⛔🚫❗❓❕❔]/g, '') // Warning/error symbols
      // Remove ALL emojis (comprehensive)
      .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2BFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{2934}-\u{2935}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]/gu, '')
      // Remove ALL markdown formatting symbols (critical for TTS)
      .replace(/\*\*\*/g, '') // Bold italic
      .replace(/\*\*/g, '') // Bold
      .replace(/\*/g, '') // Italic
      .replace(/__/g, '') // Bold underscores
      .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1') // Italic underscores
      .replace(/~~/g, '') // Strikethrough
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^>\s*/gm, '') // Blockquotes
      .replace(/\|\|/g, '') // Spoiler tags
      // CJK and other problematic unicode
      .replace(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/g, '')
      // List markers
      .replace(/^[\s]*[-]\s*/gm, ', ')
      .replace(/^\s*\d+\.\s*/gm, '')
      // Parenthetical formatting hints like _(text)_ 
      .replace(/_\(([^)]+)\)_/g, '$1')
      // Clean up multiple spaces and commas
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Split into sentences for natural pauses
  const splitIntoSentences = useCallback((text: string): string[] => {
    const rough = text.split(/(?<=[.!?。])\s+/).filter(s => s.trim().length > 0);

    // Some browsers cut very long utterances; chunk long "sentences" by words.
    const MAX_CHUNK_LEN = 180;
    const out: string[] = [];

    for (const s of rough) {
      const trimmed = s.trim();
      if (trimmed.length <= MAX_CHUNK_LEN) {
        out.push(trimmed);
        continue;
      }

      const words = trimmed.split(/\s+/);
      let buf = '';
      for (const w of words) {
        const next = buf ? `${buf} ${w}` : w;
        if (next.length > MAX_CHUNK_LEN) {
          if (buf) out.push(buf);
          buf = w;
        } else {
          buf = next;
        }
      }
      if (buf) out.push(buf);
    }

    return out;
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
    // Gentler rate for comprehension - no machine-gunning
    utterance.rate = (options.speechSpeed ?? 0.85) * 0.88;
    utterance.pitch = (options.pitch ?? 1.0) * 1.02;
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
      // Extended natural pause between sentences for "thinking room"
      setTimeout(() => {
        if (!window.speechSynthesis.paused && sentenceQueueRef.current.length > 0) {
          speakNextSentence();
        }
      }, 650);
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
