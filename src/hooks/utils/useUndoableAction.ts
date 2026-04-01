import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCallback } from 'react';

type SoftDeleteTable = 'expenses' | 'income' | 'clients' | 'projects' | 'contracts' | 'mileage';

/**
 * Centralized undo hook for soft-delete actions.
 * Shows a sonner toast with an "Undo" button that restores the record.
 */
export function useUndoableDelete() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isEs = language === 'es';

  const restoreRecord = useCallback(async (table: SoftDeleteTable, id: string | string[]) => {
    if (!user) return;
    const ids = Array.isArray(id) ? id : [id];
    
    for (const recordId of ids) {
      await supabase
        .from(table)
        .update({ deleted_at: null } as any)
        .eq('id', recordId)
        .eq('user_id', user.id);
    }

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: [table] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['trash'] });
    
    toast.success(isEs ? 'Restaurado exitosamente' : 'Restored successfully');
  }, [user, queryClient, isEs]);

  const showUndoToast = useCallback((
    table: SoftDeleteTable,
    id: string | string[],
    messageEs: string,
    messageEn: string,
  ) => {
    toast(isEs ? messageEs : messageEn, {
      duration: 6000,
      action: {
        label: isEs ? 'Deshacer' : 'Undo',
        onClick: () => restoreRecord(table, id),
      },
    });
  }, [isEs, restoreRecord]);

  return { showUndoToast, restoreRecord };
}
