import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContractFormData, ContractWithClient, ContractStatus } from '@/types/contract.types';

export const useContracts = () => {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(id, name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContractWithClient[];
    },
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ContractFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const uploadedFiles: { fileName: string; filePath: string; fileType: string }[] = [];
      
      for (const file of data.files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        uploadedFiles.push({
          fileName: file.name,
          filePath,
          fileType: file.type,
        });
      }

      const contracts = [];
      for (const uploadedFile of uploadedFiles) {
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
            title: data.title || null,
            contract_type: data.contract_type || 'services',
            start_date: data.start_date ? data.start_date.toISOString().split('T')[0] : null,
            end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
            auto_renew: data.auto_renew || false,
            renewal_notice_days: data.renewal_notice_days || 30,
            value: data.value || null,
            description: data.description || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        contracts.push(contract);
      }

      return contracts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato subido exitosamente');
    },
    onError: (error) => {
      toast.error('No se pudo subir el contrato');
      console.error('Error uploading contract:', error);
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; client_id?: string; status?: ContractStatus }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato actualizado');
    },
    onError: () => {
      toast.error('No se pudo actualizar el contrato');
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: contract } = await supabase
        .from('contracts')
        .select('file_path')
        .eq('id', id)
        .single();

      if (contract?.file_path) {
        await supabase.storage.from('contracts').remove([contract.file_path]);
      }

      const { error } = await supabase.from('contracts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato movido a la papelera');
    },
    onError: () => {
      toast.error('No se pudo eliminar el contrato');
    },
  });
};

export const useContractUrl = (filePath: string | null) => {
  return useQuery({
    queryKey: ['contract-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;
      
      const { data } = await supabase.storage
        .from('contracts')
        .createSignedUrl(filePath, 3600);

      return data?.signedUrl || null;
    },
    enabled: !!filePath,
  });
};
