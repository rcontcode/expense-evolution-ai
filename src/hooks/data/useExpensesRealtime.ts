import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvalidateRelated } from './useInvalidateRelated';

export function useExpensesRealtime() {
  const { afterExpense } = useInvalidateRelated();
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
          afterExpense();
          
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
        () => {
          afterExpense();
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
        () => {
          afterExpense();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from expenses changes...');
      supabase.removeChannel(channel);
    };
  }, [user?.id, afterExpense, language]);
}
