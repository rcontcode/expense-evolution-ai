import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
}

export function useAuditLog(limit = 100, entityType?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['audit-log', user?.id, limit, entityType],
    queryFn: async () => {
      let query = supabase
        .from('audit_log' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AuditLogEntry[];
    },
    enabled: !!user,
  });
}

export function useLogAction() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      action: string;
      entity_type: string;
      entity_id?: string;
      entity_name?: string;
      old_values?: any;
      new_values?: any;
    }) => {
      if (!user) return;
      const { error } = await supabase
        .from('audit_log' as any)
        .insert({
          user_id: user.id,
          action: entry.action,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id || null,
          entity_name: entry.entity_name || null,
          old_values: entry.old_values || null,
          new_values: entry.new_values || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
}
