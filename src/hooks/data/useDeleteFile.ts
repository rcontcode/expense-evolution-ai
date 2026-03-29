import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UnifiedFile } from './useAllFiles';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

export function useDeleteFile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (file: UnifiedFile) => {
      if (!user) throw new Error('Not authenticated');

      const { error: storageError } = await supabase.storage.from(file.bucket).remove([file.file_path]);
      if (storageError) {
        console.warn('Storage delete error (may already be removed):', storageError.message);
      }

      const table = file.origin === 'receipt' ? 'documents' : 'contracts';
      const { error: dbError } = await supabase.from(table).delete().eq('id', file.id).eq('user_id', user.id);
      if (dbError) throw dbError;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: table === 'documents' ? 'document' : 'contract', entity_id: file.id,
        entity_name: file.file_name || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-files'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      t.success('Archivo eliminado', 'File deleted');
    },
    onError: (err: any) => {
      t.error(`Error: ${err.message}`, `Error: ${err.message}`);
    },
  });
}
