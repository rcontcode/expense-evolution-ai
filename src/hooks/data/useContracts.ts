import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContractWithClient[];
    },
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ContractFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, data.file);

      if (uploadError) throw uploadError;

      // Create contract record with new fields
      const { data: contract, error: insertError } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          client_id: data.client_id,
          file_name: data.file.name,
          file_path: fileName,
          file_type: data.file.type,
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
      return contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contrato subido',
        description: 'El contrato se ha subido exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo subir el contrato',
        variant: 'destructive',
      });
      console.error('Error uploading contract:', error);
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Contrato actualizado',
        description: 'Los cambios se han guardado correctamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el contrato',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get contract to delete file from storage
      const { data: contract } = await supabase
        .from('contracts')
        .select('file_path')
        .eq('id', id)
        .single();

      if (contract?.file_path) {
        await supabase.storage.from('contracts').remove([contract.file_path]);
      }

      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contrato eliminado',
        description: 'El contrato se ha eliminado correctamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el contrato',
        variant: 'destructive',
      });
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
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return data?.signedUrl || null;
    },
    enabled: !!filePath,
  });
};
