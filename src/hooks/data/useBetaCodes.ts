import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BetaCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
}

interface BetaCodeUse {
  id: string;
  code_id: string;
  used_by: string;
  used_at: string;
  user_email?: string;
  user_name?: string;
}

interface CreateCodeParams {
  prefix: string;
  quantity: number;
  maxUses: number;
  expiresAt: string | null;
}

export const useBetaCodes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all beta codes (admin only)
  const { data: codes, isLoading: isLoadingCodes } = useQuery({
    queryKey: ['beta-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BetaCode[];
    },
  });

  // Fetch code uses with user info
  const { data: codeUses, isLoading: isLoadingUses } = useQuery({
    queryKey: ['beta-code-uses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_code_uses')
        .select(`
          id,
          code_id,
          used_by,
          used_at
        `)
        .order('used_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles for the uses
      const userIds = [...new Set((data || []).map(u => u.used_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(use => ({
        ...use,
        user_email: profileMap.get(use.used_by)?.email || 'N/A',
        user_name: profileMap.get(use.used_by)?.full_name || 'N/A',
      })) as BetaCodeUse[];
    },
  });

  // Create new codes
  const createCodes = useMutation({
    mutationFn: async ({ prefix, quantity, maxUses, expiresAt }: CreateCodeParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const newCodes = [];
      for (let i = 1; i <= quantity; i++) {
        const code = `${prefix}-${String(i).padStart(2, '0')}`;
        newCodes.push({
          code: code.toUpperCase(),
          max_uses: maxUses,
          expires_at: expiresAt,
          created_by: user.id,
        });
      }

      const { data, error } = await supabase
        .from('beta_invitation_codes')
        .insert(newCodes)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beta-codes'] });
      toast({
        title: '¡Códigos creados!',
        description: `Se crearon ${data.length} códigos exitosamente.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle code active status
  const toggleCodeStatus = useMutation({
    mutationFn: async ({ codeId, isActive }: { codeId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('beta_invitation_codes')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-codes'] });
      toast({
        title: 'Estado actualizado',
        description: 'El código ha sido actualizado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete code
  const deleteCode = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('beta_invitation_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-codes'] });
      queryClient.invalidateQueries({ queryKey: ['beta-code-uses'] });
      toast({
        title: 'Código eliminado',
        description: 'El código ha sido eliminado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Statistics
  const stats = {
    totalCodes: codes?.length || 0,
    activeCodes: codes?.filter(c => c.is_active).length || 0,
    totalUses: codeUses?.length || 0,
    availableUses: codes?.reduce((sum, c) => sum + (c.max_uses - c.current_uses), 0) || 0,
  };

  return {
    codes,
    codeUses,
    stats,
    isLoading: isLoadingCodes || isLoadingUses,
    createCodes,
    toggleCodeStatus,
    deleteCode,
  };
};
