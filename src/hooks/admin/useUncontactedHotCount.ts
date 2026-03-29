import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the count of HOT leads that haven't been contacted yet.
 * Used to display a badge in the admin sidebar/CRM navigation.
 */
export function useUncontactedHotCount() {
  return useQuery({
    queryKey: ['uncontacted-hot-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('quiz_leads')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'hot')
        .is('contacted_at', null);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // refresh every 30s
    staleTime: 10000,
  });
}
