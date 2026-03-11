import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Subscribes to realtime inserts on quiz_leads.
 * Shows a toast notification when a HOT lead arrives (lead_score >= 80).
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

          // Invalidate leads cache
          queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
          queryClient.invalidateQueries({ queryKey: ['cross-app-all-leads'] });

          if (priority === 'hot' || score >= 80) {
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
