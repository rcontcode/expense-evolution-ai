import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DecodedCode {
  id: string;
  user_id: string;
  original_code: string;
  decoded_meaning: string;
  vendor_context: string | null;
  category: string | null;
  confidence_count: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

interface DecodedCodeInput {
  original_code: string;
  decoded_meaning: string;
  vendor_context?: string;
  category?: string;
}

export function useDecodedCodes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['decoded-codes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('decoded_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('confidence_count', { ascending: false });

      if (error) throw error;
      return data as DecodedCode[];
    },
    enabled: !!user?.id
  });
}

export function useRegisterDecodedCode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: DecodedCodeInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if code already exists for this user and vendor context
      const { data: existing } = await supabase
        .from('decoded_codes')
        .select('id, confidence_count')
        .eq('user_id', user.id)
        .eq('original_code', input.original_code.toUpperCase())
        .eq('vendor_context', input.vendor_context || '')
        .maybeSingle();

      if (existing) {
        // Update existing record - increment confidence and update last_seen
        const { error } = await supabase
          .from('decoded_codes')
          .update({
            confidence_count: existing.confidence_count + 1,
            last_seen_at: new Date().toISOString(),
            decoded_meaning: input.decoded_meaning // Update in case meaning was refined
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('decoded_codes')
          .insert({
            user_id: user.id,
            original_code: input.original_code.toUpperCase(),
            decoded_meaning: input.decoded_meaning,
            vendor_context: input.vendor_context || null,
            category: input.category || null
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decoded-codes'] });
    }
  });
}

export function useLookupCode(code: string, vendorContext?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['decoded-codes', 'lookup', code, vendorContext],
    queryFn: async () => {
      if (!user?.id || !code) return null;

      // First try exact match with vendor context
      if (vendorContext) {
        const { data } = await supabase
          .from('decoded_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('original_code', code.toUpperCase())
          .eq('vendor_context', vendorContext)
          .maybeSingle();

        if (data) return data as DecodedCode;
      }

      // Try without vendor context
      const { data } = await supabase
        .from('decoded_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('original_code', code.toUpperCase())
        .order('confidence_count', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data as DecodedCode | null;
    },
    enabled: !!user?.id && !!code
  });
}
