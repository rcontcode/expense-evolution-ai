import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SystemAlert {
  id: string;
  alert_type: 'maintenance' | 'bug' | 'outage' | 'update' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  title_en: string | null;
  message: string;
  message_en: string | null;
  is_active: boolean;
  estimated_resolution: string | null;
  estimated_resolution_en: string | null;
  affected_features: string[] | null;
  created_at: string;
  resolved_at: string | null;
}

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  max_referrals: number;
  current_referrals: number;
  is_active: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code_id: string;
  created_at: string;
  referred_name?: string;
  referred_email?: string;
}

interface CreateAlertParams {
  alert_type: SystemAlert['alert_type'];
  severity: SystemAlert['severity'];
  title: string;
  title_en?: string;
  message: string;
  message_en?: string;
  estimated_resolution?: string;
  estimated_resolution_en?: string;
  affected_features?: string[];
}

export const useBetaSystem = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active system alerts (for beta testers)
  const { data: activeAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['system-alerts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_status_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemAlert[];
    },
    enabled: !!user,
  });

  // Fetch all system alerts (for admin)
  const { data: allAlerts, isLoading: isLoadingAllAlerts } = useQuery({
    queryKey: ['system-alerts-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_status_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemAlert[];
    },
  });

  // Fetch user's referral code
  const { data: myReferralCode, isLoading: isLoadingReferralCode } = useQuery({
    queryKey: ['my-referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('beta_referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ReferralCode | null;
    },
    enabled: !!user,
  });

  // Fetch user's referrals (people they referred)
  const { data: myReferrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['my-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('beta_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get referred user profiles
      const referredIds = data.map(r => r.referred_id);
      if (referredIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', referredIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(referral => ({
        ...referral,
        referred_name: profileMap.get(referral.referred_id)?.full_name || 'N/A',
        referred_email: profileMap.get(referral.referred_id)?.email || 'N/A',
      })) as Referral[];
    },
    enabled: !!user,
  });

  // Create system alert (admin)
  const createAlert = useMutation({
    mutationFn: async (params: CreateAlertParams) => {
      const { data, error } = await supabase
        .from('system_status_alerts')
        .insert({
          ...params,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts-all'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-active'] });
      toast({
        title: '✅ Alerta creada',
        description: 'Los beta testers verán esta alerta.',
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

  // Resolve/deactivate alert (admin)
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('system_status_alerts')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts-all'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-active'] });
      toast({
        title: '✅ Alerta resuelta',
        description: 'La alerta ya no se mostrará.',
      });
    },
  });

  // Use referral code
  const useReferralCode = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('use_beta_referral_code', {
          p_code: code,
          p_user_id: user.id,
        });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: '🎉 ¡Bienvenido!',
        description: 'Ahora eres un beta tester oficial.',
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

  // Upload screenshot to storage
  const uploadScreenshot = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('beta-screenshots')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('beta-screenshots')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    // Alerts
    activeAlerts,
    allAlerts,
    isLoadingAlerts,
    isLoadingAllAlerts,
    createAlert,
    resolveAlert,
    
    // Referrals
    myReferralCode,
    myReferrals,
    isLoadingReferralCode,
    isLoadingReferrals,
    useReferralCode,
    
    // Utilities
    uploadScreenshot,
  };
};
