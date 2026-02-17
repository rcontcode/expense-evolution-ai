import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnifiedFile {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  origin: 'receipt' | 'contract';
  status: string | null;
  review_status: string | null;
  client_id: string | null;
  client_name: string | null;
  expense_id: string | null;
  file_path: string;
  bucket: string;
}

export function useAllFiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-files', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<UnifiedFile[]> => {
      const [docsRes, contractsRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, file_name, file_type, file_size, created_at, status, review_status, expense_id, file_path, metadata')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('contracts')
          .select('id, file_name, file_type, created_at, status, client_id, file_path, clients(name)')
          .eq('user_id', user!.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ]);

      const docs: UnifiedFile[] = (docsRes.data ?? []).map((d) => ({
        id: d.id,
        file_name: d.file_name,
        file_type: d.file_type,
        file_size: d.file_size,
        created_at: d.created_at ?? '',
        origin: 'receipt' as const,
        status: d.status,
        review_status: d.review_status,
        client_id: null,
        client_name: null,
        expense_id: d.expense_id,
        file_path: d.file_path,
        bucket: 'expense-documents',
      }));

      const contracts: UnifiedFile[] = (contractsRes.data ?? []).map((c: any) => ({
        id: c.id,
        file_name: c.file_name,
        file_type: c.file_type,
        file_size: null,
        created_at: c.created_at ?? '',
        origin: 'contract' as const,
        status: c.status,
        review_status: null,
        client_id: c.client_id,
        client_name: c.clients?.name ?? null,
        expense_id: null,
        file_path: c.file_path,
        bucket: 'contracts',
      }));

      return [...docs, ...contracts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}
