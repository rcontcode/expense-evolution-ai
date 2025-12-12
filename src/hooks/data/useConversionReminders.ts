import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAssets, Asset } from './useNetWorth';

const REMINDER_DAYS = 7;
const NOTIFICATION_TYPE = 'conversion_reminder';

// Parse conversion info from asset notes
const parseConversionStartDate = (asset: Asset): Date | null => {
  const notes = asset.notes || '';
  const match = notes.match(/\[EN CONVERSIÓN:(\d{4}-\d{2}-\d{2})\]/i);
  if (match) {
    return new Date(match[1]);
  }
  return null;
};

const isInConversion = (asset: Asset): boolean => {
  const notes = asset.notes?.toUpperCase() || '';
  return notes.includes('[EN CONVERSIÓN');
};

export const useConversionReminders = () => {
  const { user } = useAuth();
  const { data: assets } = useAssets();
  const queryClient = useQueryClient();

  const createNotification = useMutation({
    mutationFn: async ({ assetId, assetName, daysSinceStart }: { 
      assetId: string; 
      assetName: string; 
      daysSinceStart: number;
    }) => {
      if (!user) return;

      // Check if we already have a recent notification for this asset
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('type', NOTIFICATION_TYPE)
        .ilike('message', `%${assetId}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Don't create duplicate notifications within 7 days
      if (existingNotification) {
        const lastNotificationDate = new Date(existingNotification.created_at);
        const daysSinceLastNotification = Math.floor(
          (Date.now() - lastNotificationDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastNotification < REMINDER_DAYS) {
          return null; // Skip, already notified recently
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: NOTIFICATION_TYPE,
          title: '⏰ Recordatorio de conversión',
          message: `Tu activo "${assetName}" lleva ${daysSinceStart} días en proceso de conversión. ¿Cómo va el progreso? [asset:${assetId}]`,
          action_url: '/net-worth',
          read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!user || !assets) return;

    // Find assets in conversion that need reminders
    const assetsNeedingReminder = assets.filter(asset => {
      if (!isInConversion(asset)) return false;
      
      const startDate = parseConversionStartDate(asset);
      if (!startDate) return false;

      const daysSinceStart = Math.floor(
        (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only remind if it's been at least REMINDER_DAYS since start
      return daysSinceStart >= REMINDER_DAYS;
    });

    // Create notifications for each asset needing a reminder
    assetsNeedingReminder.forEach(asset => {
      const startDate = parseConversionStartDate(asset);
      if (!startDate) return;

      const daysSinceStart = Math.floor(
        (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      createNotification.mutate({
        assetId: asset.id,
        assetName: asset.name,
        daysSinceStart,
      });
    });
  }, [user, assets]);

  return { createNotification };
};
