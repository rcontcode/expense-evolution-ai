import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ContractFormData, ContractWithClient, ContractStatus } from '@/types/contract.types';
import { useInvalidateRelated } from './useInvalidateRelated';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';
import { useUndoableDelete } from '@/hooks/utils/useUndoableAction';

export const useContracts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts').select(`*, client:clients(id, name)`)
        .eq('user_id', user!.id).is('deleted_at', null)
        .order('created_at', { ascending: false })
        .order('page_order', { ascending: true });
      if (error) throw error;
      return data as ContractWithClient[];
    },
    enabled: !!user,
  });
};

export const useContractGroup = (groupId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contract-group', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('contracts').select(`*, client:clients(id, name)`)
        .eq('user_id', user!.id)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('page_order', { ascending: true });
      if (error) throw error;
      return data as ContractWithClient[];
    },
    enabled: !!user && !!groupId,
  });
};

export const useCreateContract = () => {
  const { user } = useAuth();
  const { afterContract } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: ContractFormData) => {
      if (!user) throw new Error('User not authenticated');
      const uploadedFiles: { fileName: string; filePath: string; fileType: string }[] = [];
      
      for (const file of data.files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('contracts').upload(filePath, file);
        if (uploadError) throw uploadError;
        uploadedFiles.push({ fileName: file.name, filePath, fileType: file.type });
      }

      // Generate shared group_id when uploading multiple files
      const groupId = uploadedFiles.length > 1 ? crypto.randomUUID() : null;

      const contracts = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const uploadedFile = uploadedFiles[i];
        const isFirst = i === 0;

        const { data: contract, error: insertError } = await supabase
          .from('contracts')
          .insert({
            user_id: user.id, 
            client_id: data.client_id,
            file_name: uploadedFile.fileName, 
            file_path: uploadedFile.filePath,
            file_type: uploadedFile.fileType, 
            billing_profile: data.billing_profile || {},
            status: 'uploaded', 
            // Only the first page carries full metadata
            title: isFirst ? (data.title || null) : null,
            contract_type: isFirst ? (data.contract_type || 'services') : 'services',
            start_date: isFirst && data.start_date ? data.start_date.toISOString().split('T')[0] : null,
            end_date: isFirst && data.end_date ? data.end_date.toISOString().split('T')[0] : null,
            auto_renew: isFirst ? (data.auto_renew || false) : false, 
            renewal_notice_days: isFirst ? (data.renewal_notice_days || 30) : 30,
            value: isFirst ? (data.value || null) : null, 
            description: isFirst ? (data.description || null) : null,
            group_id: groupId,
            page_order: i,
          })
          .select().single();
        if (insertError) throw insertError;
        contracts.push(contract);
      }
      return contracts;
    },
    onSuccess: () => {
      afterContract();
      t.success('Contrato subido exitosamente', 'Contract uploaded successfully');
    },
    onError: (error) => {
      t.error('No se pudo subir el contrato', 'Could not upload contract');
      console.error('Error uploading contract:', error);
    },
  });
};

export const useUpdateContract = () => {
  const { user } = useAuth();
  const { afterContract } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; client_id?: string; status?: ContractStatus }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('contracts').update(updates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterContract();
      t.success('Contrato actualizado', 'Contract updated');
    },
    onError: () => {
      t.error('No se pudo actualizar el contrato', 'Could not update contract');
    },
  });
};

export const useDeleteContract = () => {
  const { user } = useAuth();
  const { afterContract } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: contract } = await supabase.from('contracts').select('file_path, group_id').eq('id', id).eq('user_id', user.id).maybeSingle();
      
      if (contract?.group_id) {
        // Delete all pages in the group
        const { data: groupContracts } = await supabase
          .from('contracts')
          .select('id, file_path')
          .eq('group_id', contract.group_id)
          .eq('user_id', user.id);
        
        if (groupContracts) {
          const filePaths = groupContracts.map(c => c.file_path).filter(Boolean);
          if (filePaths.length > 0) {
            await supabase.storage.from('contracts').remove(filePaths);
          }
          const ids = groupContracts.map(c => c.id);
          const { error } = await supabase
            .from('contracts')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', ids)
            .eq('user_id', user.id);
          if (error) throw error;
        }
      } else {
        if (contract?.file_path) {
          await supabase.storage.from('contracts').remove([contract.file_path]);
        }
        const { error } = await supabase.from('contracts').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      afterContract();
      t.success('Contrato movido a la papelera', 'Contract moved to trash');
    },
    onError: () => {
      t.error('No se pudo eliminar el contrato', 'Could not delete contract');
    },
  });
};

export const useContractUrl = (filePath: string | null) => {
  return useQuery({
    queryKey: ['contract-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;
      const { data } = await supabase.storage.from('contracts').createSignedUrl(filePath, 3600);
      return data?.signedUrl || null;
    },
    enabled: !!filePath,
  });
};
