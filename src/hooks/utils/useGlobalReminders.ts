import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useVoicePreferences } from './useVoicePreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Global hook that checks voice reminders even when chat is closed.
 * Stabilized: memoizes voicePrefs values to prevent effect churn.
 */
export function useGlobalReminders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const voicePrefs = useVoicePreferences();
  const lastCheckRef = useRef<string>('');

  // Stabilize references to prevent effect re-runs
  const speechSpeed = voicePrefs.speechSpeed;
  const volume = voicePrefs.volume;
  const pitch = voicePrefs.pitch;
  const checkReminders = voicePrefs.checkReminders;
  const playSound = voicePrefs.playSound;

  const speakReminder = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = speechSpeed;
    utterance.volume = volume;
    utterance.pitch = pitch;
    
    window.speechSynthesis.speak(utterance);
  }, [language, speechSpeed, volume, pitch]);

  useEffect(() => {
    if (!user) return;
    
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Only check once per minute
      if (currentMinute === lastCheckRef.current) return;
      lastCheckRef.current = currentMinute;
      
      const dueReminders = checkReminders(language as 'es' | 'en');
      
      if (dueReminders.length > 0) {
        dueReminders.forEach((reminder, index) => {
          setTimeout(() => {
            toast.info(reminder, {
              icon: '🔔',
              duration: 10000,
              action: {
                label: language === 'es' ? 'Escuchar' : 'Listen',
                onClick: () => speakReminder(reminder),
              },
            });
            
            playSound('notification');
            
            if (index === 0 && document.hasFocus()) {
              speakReminder(reminder);
            }
          }, index * 2000);
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [user, language, checkReminders, playSound, speakReminder]);
}
