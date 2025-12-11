import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type WorkType = Database['public']['Enums']['work_type'];

export interface ProfileFormData {
  full_name: string;
  email: string;
  province: string | null;
  language: string;
  work_types: WorkType[];
  business_name?: string | null;
  business_number?: string | null;
  gst_hst_registered?: boolean;
  business_start_date?: string | null;
  fiscal_year_end?: string | null;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user) throw new Error('Not authenticated');

      const updateData: ProfileUpdate = {
        full_name: data.full_name,
        province: data.province,
        language: data.language,
        work_types: data.work_types,
        business_name: data.business_name,
        business_number: data.business_number,
        gst_hst_registered: data.gst_hst_registered,
        business_start_date: data.business_start_date,
        fiscal_year_end: data.fiscal_year_end,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar perfil');
      console.error(error);
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
