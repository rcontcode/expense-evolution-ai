import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseAudioPlaybackOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export function useAudioPlayback(options: UseAudioPlaybackOptions = {}) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const estimatedDurationRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean text for speech
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, ' ')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^[\s]*[-•◦▪▸►]\s*/gm, '')
      .replace(/^\s*\d+\.\s*/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/[~^<>|\\]/g, '')
      .trim();
  }, []);

  // Estimate duration based on text length (average speaking rate)
  const estimateDuration = useCallback((text: string): number => {
    const wordsPerMinute = 150; // Average speaking rate
    const words = text.split(/\s+/).length;
    return (words / wordsPerMinute) * 60;
  }, []);

  // Start progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const estimatedTotal = estimatedDurationRef.current;
      
      if (estimatedTotal > 0) {
        const progressPercent = Math.min((elapsed / estimatedTotal) * 100, 100);
        setProgress(progressPercent);
        setCurrentTime(Math.min(elapsed, estimatedTotal));
      }
    }, 100);
  }, []);

  // Stop progress tracking
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Play text
  const play = useCallback((text: string, messageIndex?: number) => {
    if (!text || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    stopProgressTracking();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    textRef.current = cleanedText;
    setCurrentText(cleanedText);
    if (messageIndex !== undefined) {
      setCurrentMessageIndex(messageIndex);
    }

    const estimatedDur = estimateDuration(cleanedText);
    estimatedDurationRef.current = estimatedDur;
    setDuration(estimatedDur);

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to get a native voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = language === 'es' ? 'es' : 'en';
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(langCode) && v.localService
    ) || voices.find(v => v.lang.startsWith(langCode));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      startProgressTracking();
      options.onStart?.();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      stopProgressTracking();
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      stopProgressTracking();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language, cleanTextForSpeech, estimateDuration, startProgressTracking, stopProgressTracking, options]);

  // Pause
  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      pausedAtRef.current = Date.now() - startTimeRef.current;
      stopProgressTracking();
      options.onPause?.();
    }
  }, [stopProgressTracking, options]);

  // Resume
  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedAtRef.current;
      startProgressTracking();
      options.onResume?.();
    }
  }, [startProgressTracking, options]);

  // Stop
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    setCurrentMessageIndex(null);
    stopProgressTracking();
  }, [stopProgressTracking]);

  // Seek backward (restart with offset simulation)
  const seekBackward = useCallback(() => {
    if (!textRef.current) return;
    
    // Since Web Speech API doesn't support seeking, we'll restart
    // For a more accurate simulation, we'd need to split text and skip parts
    const newTime = Math.max(0, currentTime - 10);
    
    if (newTime <= 0) {
      // Restart from beginning
      stop();
      play(textRef.current, currentMessageIndex ?? undefined);
    } else {
      // Update visual progress (actual audio restarts)
      setCurrentTime(newTime);
      setProgress((newTime / duration) * 100);
      // Note: True seeking would require more complex text chunking
    }
  }, [currentTime, duration, currentMessageIndex, stop, play]);

  // Seek forward
  const seekForward = useCallback(() => {
    if (!textRef.current) return;
    
    const newTime = Math.min(duration, currentTime + 10);
    
    if (newTime >= duration) {
      // End playback
      stop();
    } else {
      // Update visual progress
      setCurrentTime(newTime);
      setProgress((newTime / duration) * 100);
    }
  }, [currentTime, duration, stop]);

  // Replay current text
  const replay = useCallback(() => {
    if (textRef.current) {
      play(textRef.current, currentMessageIndex ?? undefined);
    }
  }, [play, currentMessageIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  return {
    // State
    isPlaying,
    isPaused,
    currentTime,
    duration,
    progress,
    currentText,
    currentMessageIndex,
    
    // Actions
    play,
    pause,
    resume,
    stop,
    seekBackward,
    seekForward,
    replay,
  };
}
