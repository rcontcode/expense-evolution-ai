import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';

export type FiscalEntity = Database['public']['Tables']['fiscal_entities']['Row'];
export type FiscalEntityInsert = Database['public']['Tables']['fiscal_entities']['Insert'];
export type FiscalEntityUpdate = Database['public']['Tables']['fiscal_entities']['Update'];

export function useFiscalEntities() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['fiscal-entities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_entities')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as FiscalEntity[];
    },
    enabled: !!user,
  });
}

export function usePrimaryFiscalEntity() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['fiscal-entity-primary', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_entities')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as FiscalEntity | null;
    },
    enabled: !!user,
  });
}

export function useCreateFiscalEntity() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { afterEntity } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (entity: Omit<FiscalEntityInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('fiscal_entities')
        .insert({ ...entity, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterEntity();
      toast.success(language === 'es' ? 'Entidad fiscal creada' : 'Fiscal entity created');
    },
    onError: (error: Error) => {
      toast.error(language === 'es' ? 'Error al crear entidad' : 'Error creating entity');
      console.error(error);
    },
  });
}

export function useUpdateFiscalEntity() {
  const { language } = useLanguage();
  const { afterEntity } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FiscalEntityUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('fiscal_entities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterEntity();
      toast.success(language === 'es' ? 'Entidad actualizada' : 'Entity updated');
    },
    onError: (error: Error) => {
      toast.error(language === 'es' ? 'Error al actualizar' : 'Error updating');
      console.error(error);
    },
  });
}

export function useDeleteFiscalEntity() {
  const { language } = useLanguage();
  const { afterEntity } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: existing } = await supabase.from('fiscal_entities').select('name, entity_type').eq('id', id).single();
      const { error } = await supabase
        .from('fiscal_entities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await insertAuditLog(userData.user.id, {
          action: 'delete', entity_type: 'fiscal_entity', entity_id: id,
          entity_name: existing?.name || null, old_values: existing ? { name: existing.name, entity_type: existing.entity_type } : null,
        });
      }
    },
    onSuccess: () => {
      afterEntity();
      toast.success(language === 'es' ? 'Entidad eliminada' : 'Entity deleted');
    },
    onError: (error: Error) => {
      toast.error(language === 'es' ? 'Error al eliminar' : 'Error deleting');
      console.error(error);
    },
  });
}

export function useSetPrimaryEntity() {
  const { language } = useLanguage();
  const { afterEntity } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('fiscal_entities')
        .update({ is_primary: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterEntity();
      toast.success(language === 'es' ? 'Entidad principal actualizada' : 'Primary entity updated');
    },
    onError: (error: Error) => {
      toast.error(language === 'es' ? 'Error al establecer como principal' : 'Error setting as primary');
      console.error(error);
    },
  });
}
