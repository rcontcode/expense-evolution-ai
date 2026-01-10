import { useEffect, useRef, useCallback } from 'react';
import { useVoicePreferences } from './useVoicePreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Global hook that checks voice reminders even when chat is closed.
 * Should be placed at app root level.
 */
export function useGlobalReminders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const voicePrefs = useVoicePreferences();
  const lastCheckRef = useRef<string>('');
  
  const speakReminder = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = voicePrefs.speechSpeed;
    utterance.volume = voicePrefs.volume;
    utterance.pitch = voicePrefs.pitch;
    
    window.speechSynthesis.speak(utterance);
  }, [language, voicePrefs.speechSpeed, voicePrefs.volume, voicePrefs.pitch]);

  useEffect(() => {
    if (!user) return;
    
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Only check once per minute
      if (currentMinute === lastCheckRef.current) return;
      lastCheckRef.current = currentMinute;
      
      const dueReminders = voicePrefs.checkReminders(language as 'es' | 'en');
      
      if (dueReminders.length > 0) {
        dueReminders.forEach((reminder, index) => {
          // Stagger notifications if multiple
          setTimeout(() => {
            // Show toast notification
            toast.info(reminder, {
              icon: '🔔',
              duration: 10000,
              action: {
                label: language === 'es' ? 'Escuchar' : 'Listen',
                onClick: () => speakReminder(reminder),
              },
            });
            
            // Play notification sound
            voicePrefs.playSound('notification');
            
            // Optionally auto-speak if browser allows
            if (index === 0 && document.hasFocus()) {
              speakReminder(reminder);
            }
          }, index * 2000);
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [user, language, voicePrefs, speakReminder]);
}
