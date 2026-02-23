import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  enabled: boolean;
  advance_days: number;
  repeat_frequency: string; // 'once' | 'daily_until_deadline' | 'weekly'
  max_reminders: number;
  preferred_hour: number | null;
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_TYPES = [
  'bill_reminder',
  'contract_reminder',
  'tax_reminder',
  'budget_alert',
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

const DEFAULT_PREFS: Record<NotificationType, Omit<NotificationPreference, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = {
  bill_reminder: { notification_type: 'bill_reminder', enabled: true, advance_days: 3, repeat_frequency: 'once', max_reminders: 3, preferred_hour: null },
  contract_reminder: { notification_type: 'contract_reminder', enabled: true, advance_days: 30, repeat_frequency: 'weekly', max_reminders: 4, preferred_hour: null },
  tax_reminder: { notification_type: 'tax_reminder', enabled: true, advance_days: 30, repeat_frequency: 'weekly', max_reminders: 3, preferred_hour: null },
  budget_alert: { notification_type: 'budget_alert', enabled: true, advance_days: 0, repeat_frequency: 'once', max_reminders: 1, preferred_hour: null },
};

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as unknown as NotificationPreference[];
    },
    enabled: !!user,
  });
}

/** Returns merged preferences (DB + defaults for missing types) */
export function useMergedPreferences() {
  const { data: prefs, isLoading } = useNotificationPreferences();

  const merged: Record<string, NotificationPreference> = {};
  for (const type of NOTIFICATION_TYPES) {
    const saved = prefs?.find(p => p.notification_type === type);
    if (saved) {
      merged[type] = saved;
    } else {
      merged[type] = {
        id: '',
        user_id: '',
        ...DEFAULT_PREFS[type],
        created_at: '',
        updated_at: '',
      };
    }
  }

  return { preferences: merged, isLoading };
}

export function useUpsertNotificationPreference() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isEs = language === 'es';

  return useMutation({
    mutationFn: async (pref: Partial<NotificationPreference> & { notification_type: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .upsert(
          {
            user_id: user.id,
            notification_type: pref.notification_type,
            enabled: pref.enabled ?? true,
            advance_days: pref.advance_days ?? 7,
            repeat_frequency: pref.repeat_frequency ?? 'once',
            max_reminders: pref.max_reminders ?? 3,
            preferred_hour: pref.preferred_hour ?? null,
          } as any,
          { onConflict: 'user_id,notification_type' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success(isEs ? 'Preferencia guardada' : 'Preference saved');
    },
    onError: () => {
      toast.error(isEs ? 'Error al guardar' : 'Error saving');
    },
  });
}
