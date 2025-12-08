import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useExpensesRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    if (!user?.id) return;

    console.log('[Realtime] Subscribing to expenses changes...');

    const channel = supabase
      .channel('expenses-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] New expense received:', payload);
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          
          // Show toast notification
          const expense = payload.new as any;
          toast.success(
            language === 'es' 
              ? `Nuevo gasto: ${expense.vendor || 'Sin proveedor'} - $${expense.amount}`
              : `New expense: ${expense.vendor || 'Unknown vendor'} - $${expense.amount}`,
            {
              description: language === 'es' 
                ? 'Sincronizado desde otro dispositivo'
                : 'Synced from another device',
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] Expense updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] Expense deleted:', payload);
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from expenses changes...');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, language]);
}
