import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

/** Snooze a notification — hide it until a future time */
export function useSnoozeNotification() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return useMutation({
    mutationFn: async ({ id, snoozeUntil }: { id: string; snoozeUntil: Date }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          snoozed_until: snoozeUntil.toISOString(),
          read: true,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success(isEs ? '⏰ Notificación pospuesta' : '⏰ Notification snoozed');
    },
  });
}

/** Mark a reminder as completed/handled */
export function useCompleteNotification() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          completed_at: new Date().toISOString(),
          read: true,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success(isEs ? '✅ Marcado como completado' : '✅ Marked as completed');
    },
  });
}

/** Mute future notifications of this type/source */
export function useMuteNotification() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          muted: true,
          read: true,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success(isEs ? '🔇 Recordatorio silenciado' : '🔇 Reminder muted');
    },
  });
}
