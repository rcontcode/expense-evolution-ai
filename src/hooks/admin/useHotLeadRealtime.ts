import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/** Play a short beep sound for hot lead alerts */
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available — silently ignore
  }
}

/**
 * Subscribes to realtime inserts on quiz_leads.
 * Shows a toast notification when a HOT lead arrives (lead_score >= 80).
 * Plays a sound alert for HOT leads.
 */
export function useHotLeadRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('hot-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_leads',
        },
        (payload) => {
          const lead = payload.new as Record<string, unknown>;
          const score = (lead.lead_score as number) || 0;
          const priority = (lead.priority as string) || '';
          const name = (lead.name as string) || 'Nuevo lead';
          const source = (lead.source as string) || 'unknown';

          // Invalidate leads cache + uncontacted hot count
          queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
          queryClient.invalidateQueries({ queryKey: ['cross-app-all-leads'] });
          queryClient.invalidateQueries({ queryKey: ['uncontacted-hot-count'] });

          if (priority === 'hot' || score >= 80) {
            playAlertSound();
            toast.error(`🔥 ¡LEAD HOT! ${name}`, {
              description: `Score: ${score} • Source: ${source}`,
              duration: 15000,
              action: {
                label: 'Ver CRM',
                onClick: () => {
                  window.location.href = '/admin/crm';
                },
              },
            });
          } else if (priority === 'warm' || score >= 50) {
            toast.warning(`🌡️ Nuevo lead WARM: ${name}`, {
              description: `Score: ${score} • Source: ${source}`,
              duration: 8000,
            });
          } else {
            toast.info(`📥 Nuevo lead: ${name}`, {
              description: `Source: ${source}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);
}
