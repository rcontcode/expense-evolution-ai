import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCallback } from 'react';
import { useUndoRedo } from '@/contexts/UndoRedoContext';

type SoftDeleteTable = 'expenses' | 'income' | 'clients' | 'projects' | 'contracts' | 'mileage';

/**
 * Centralized undo hook for soft-delete actions.
 * Shows a sonner toast with an "Undo" button that restores the record.
 * Also pushes to the global UndoRedo stack for Ctrl+Z / header buttons.
 */
export function useUndoableDelete() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { pushAction } = useUndoRedo();
  const isEs = language === 'es';

  const invalidateQueries = useCallback((table: SoftDeleteTable) => {
    queryClient.invalidateQueries({ queryKey: [table] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['trash'] });
  }, [queryClient]);

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
    invalidateQueries(table);
  }, [user, invalidateQueries]);

  const softDeleteRecord = useCallback(async (table: SoftDeleteTable, id: string | string[]) => {
    if (!user) return;
    const ids = Array.isArray(id) ? id : [id];
    for (const recordId of ids) {
      await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', recordId)
        .eq('user_id', user.id);
    }
    invalidateQueries(table);
  }, [user, invalidateQueries]);

  const showUndoToast = useCallback((
    table: SoftDeleteTable,
    id: string | string[],
    messageEs: string,
    messageEn: string,
  ) => {
    // Push to global undo/redo stack
    pushAction({
      descriptionEs: messageEs,
      descriptionEn: messageEn,
      undoFn: () => restoreRecord(table, id),
      doFn: () => softDeleteRecord(table, id),
    });

    toast(isEs ? messageEs : messageEn, {
      duration: 6000,
      action: {
        label: isEs ? 'Deshacer' : 'Undo',
        onClick: () => restoreRecord(table, id),
      },
    });
  }, [isEs, restoreRecord, softDeleteRecord, pushAction]);

  return { showUndoToast, restoreRecord };
}
