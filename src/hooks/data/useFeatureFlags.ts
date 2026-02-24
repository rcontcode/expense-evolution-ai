import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  flag_key: string;
  enabled: boolean;
  label: string | null;
  description: string | null;
  category: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all feature flags
  const { data: flagsData, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');
      if (error) {
        console.error('Error fetching feature flags:', error);
        return [];
      }
      return (data || []) as FeatureFlag[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch has_bundle from user_subscriptions
  const { data: hasBundleAccess, isLoading: isLoadingBundle } = useQuery({
    queryKey: ['has-bundle', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('has_bundle')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching bundle status:', error);
        return false;
      }
      return data?.has_bundle ?? false;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Build flags map
  const flags: Record<string, boolean> = {};
  const flagsList = flagsData || [];
  for (const flag of flagsList) {
    flags[flag.flag_key] = flag.enabled;
  }

  // Master switch logic
  const masterEnabled = flags['ecosystem_enabled'] ?? true;

  const isEnabled = (flagKey: string): boolean => {
    // If checking a non-ecosystem flag, just return its value
    if (!flagKey.startsWith('ecosystem_')) {
      return flags[flagKey] ?? false;
    }
    // If master switch is off, all ecosystem flags are off
    if (!masterEnabled && flagKey !== 'ecosystem_enabled') {
      return false;
    }
    return flags[flagKey] ?? false;
  };

  // Update a flag (admin only)
  const updateFlagMutation = useMutation({
    mutationFn: async ({ flagKey, enabled }: { flagKey: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('flag_key', flagKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  const updateFlag = async (flagKey: string, enabled: boolean) => {
    try {
      await updateFlagMutation.mutateAsync({ flagKey, enabled });
      toast.success(`Flag "${flagKey}" ${enabled ? 'activado' : 'desactivado'}`);
    } catch {
      toast.error('Error al actualizar el flag');
    }
  };

  return {
    flags,
    flagsList,
    isEnabled,
    hasBundleAccess: hasBundleAccess ?? false,
    updateFlag,
    isLoading: isLoadingFlags || isLoadingBundle,
  };
}
