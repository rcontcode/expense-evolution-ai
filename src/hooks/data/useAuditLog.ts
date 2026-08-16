import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Centralized audit log insert.
 * Writes go through the server-side `log_audit_event` function, which forces
 * the row's user_id to the authenticated user and validates the action.
 * Direct client inserts into audit_log are not allowed.
 */
export async function insertAuditLog(_userId: string, entry: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_name?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
}) {
  const { error } = await supabase.rpc('log_audit_event', {
    _action: entry.action,
    _entity_type: entry.entity_type,
    _entity_id: entry.entity_id || null,
    _entity_name: entry.entity_name || null,
    _old_values: (entry.old_values ?? null) as any,
    _new_values: (entry.new_values ?? null) as any,
  });
  if (error) console.error('Audit log error:', error);
}

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
        .from('audit_log')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AuditLogEntry[];
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
      await insertAuditLog(user.id, entry);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
}
