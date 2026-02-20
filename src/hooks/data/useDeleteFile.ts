import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UnifiedFile } from './useAllFiles';

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: UnifiedFile) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from(file.bucket)
        .remove([file.file_path]);

      if (storageError) {
        console.warn('Storage delete error (may already be removed):', storageError.message);
      }

      // Delete from database
      const table = file.origin === 'receipt' ? 'documents' : 'contracts';
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-files'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Archivo eliminado');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    },
  });
}
