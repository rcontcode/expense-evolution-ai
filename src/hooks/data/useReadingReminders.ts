import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ReadingReminderSettings {
  enabled: boolean;
  times: string[]; // Array of times in HH:MM format
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  message: string;
  sound: boolean;
}

const DEFAULT_SETTINGS: ReadingReminderSettings = {
  enabled: false,
  times: ['09:00', '21:00'],
  days: [1, 2, 3, 4, 5], // Monday to Friday
  message: '',
  sound: true,
};

export const useReadingReminders = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [lastNotificationTime, setLastNotificationTime] = useState<string | null>(null);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['reading-reminder-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return DEFAULT_SETTINGS;

      const { data, error } = await supabase
        .from('settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching reading reminder settings:', error);
        return DEFAULT_SETTINGS;
      }

      const preferences = data?.preferences as Record<string, any> || {};
      return {
        ...DEFAULT_SETTINGS,
        ...preferences.readingReminders,
      } as ReadingReminderSettings;
    },
    enabled: !!user?.id,
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<ReadingReminderSettings>) => {
      if (!user?.id) throw new Error('No user');

      // First get current preferences
      const { data: currentData } = await supabase
        .from('settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      const currentPreferences = currentData?.preferences as Record<string, any> || {};
      
      const updatedPreferences = {
        ...currentPreferences,
        readingReminders: {
          ...DEFAULT_SETTINGS,
          ...currentPreferences.readingReminders,
          ...newSettings,
        },
      };

      const { error } = await supabase
        .from('settings')
        .update({ preferences: updatedPreferences })
        .eq('user_id', user.id);

      if (error) throw error;
      return updatedPreferences.readingReminders;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-reminder-settings'] });
      toast.success(
        language === 'es' 
          ? 'Recordatorios actualizados' 
          : 'Reminders updated'
      );
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error(
        language === 'es' 
          ? 'Error al actualizar recordatorios' 
          : 'Error updating reminders'
      );
    },
  });

  // Show notification
  const showNotification = useCallback((customMessage?: string) => {
    if (notificationPermission !== 'granted') return;

    const title = language === 'es' 
      ? '📚 Hora de leer' 
      : '📚 Time to read';
    
    const body = customMessage || settings?.message || (
      language === 'es'
        ? '¡Es momento de continuar con tu educación financiera!'
        : "It's time to continue with your financial education!"
    );

    const notification = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'reading-reminder',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    if (settings?.sound) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        // Ignore audio errors
      }
    }
  }, [notificationPermission, settings, language]);

  // Check if should show notification
  const checkAndNotify = useCallback(() => {
    if (!settings?.enabled || notificationPermission !== 'granted') return;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentKey = `${currentDay}-${currentTime}`;

    // Check if today is a reminder day
    if (!settings.days.includes(currentDay)) return;

    // Check if current time matches any reminder time
    const shouldNotify = settings.times.some(time => {
      const [hour, minute] = time.split(':').map(Number);
      return hour === now.getHours() && minute === now.getMinutes();
    });

    // Only notify once per minute
    if (shouldNotify && lastNotificationTime !== currentKey) {
      setLastNotificationTime(currentKey);
      showNotification();
    }
  }, [settings, notificationPermission, lastNotificationTime, showNotification]);

  // Set up interval to check for notifications
  useEffect(() => {
    if (!settings?.enabled) return;

    const interval = setInterval(checkAndNotify, 30000); // Check every 30 seconds
    checkAndNotify(); // Check immediately

    return () => clearInterval(interval);
  }, [settings?.enabled, checkAndNotify]);

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
    notificationPermission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  };
};

export const DAY_LABELS = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export const PRESET_TIMES = [
  { label: { es: 'Mañana', en: 'Morning' }, times: ['07:00', '08:00', '09:00'] },
  { label: { es: 'Mediodía', en: 'Noon' }, times: ['12:00', '13:00'] },
  { label: { es: 'Tarde', en: 'Afternoon' }, times: ['17:00', '18:00', '19:00'] },
  { label: { es: 'Noche', en: 'Evening' }, times: ['20:00', '21:00', '22:00'] },
];
