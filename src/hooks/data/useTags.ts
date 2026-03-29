import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tag, TagInsert } from '@/types/expense.types';
import { DEFAULT_TAGS } from '@/lib/constants/default-tags';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

export function useTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user!.id).order('name', { ascending: true });
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useCreateTag() {
  const { user } = useAuth();
  const { afterTag } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (tag: TagInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('tags').insert({ ...tag, user_id: user.id }).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      afterTag();
      t.success('Etiqueta creada', 'Tag created');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al crear etiqueta', error.message || 'Error creating tag');
    },
  });
}

export function useUpdateTag() {
  const { user } = useAuth();
  const { afterTag } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TagInsert> }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('tags').update(updates).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      afterTag();
      t.success('Etiqueta actualizada', 'Tag updated');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al actualizar etiqueta', error.message || 'Error updating tag');
    },
  });
}

export function useDeleteTag() {
  const { user } = useAuth();
  const { afterTag } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('tags').select('name').eq('id', id).eq('user_id', user.id).single();
      const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'tag', entity_id: id,
        entity_name: existing?.name || null,
      });
    },
    onSuccess: () => {
      afterTag();
      t.success('Etiqueta eliminada', 'Tag deleted');
    },
    onError: (error: Error) => {
      t.error(error.message || 'Error al eliminar etiqueta', error.message || 'Error deleting tag');
    },
  });
}

export function useTagsWithExpenseCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tags-with-expense-count', user?.id],
    queryFn: async () => {
      const { data: tags, error: tagsError } = await supabase.from('tags').select('*').eq('user_id', user!.id).order('name', { ascending: true });
      if (tagsError) throw tagsError;

      const { data: expenseTags, error: etError } = await supabase.from('expense_tags').select('tag_id');
      if (etError) throw etError;

      const countMap: Record<string, number> = {};
      expenseTags?.forEach(et => { countMap[et.tag_id] = (countMap[et.tag_id] || 0) + 1; });

      return (tags || []).map(tag => ({ ...tag, expenseCount: countMap[tag.id] || 0 }));
    },
    enabled: !!user,
  });
}

export function useSeedDefaultTags() {
  const { user } = useAuth();
  const { afterTag } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data: existingTags } = await supabase.from('tags').select('id').eq('user_id', user.id).limit(1);
      if (existingTags && existingTags.length > 0) throw new Error('Tags already exist');

      const tagsToInsert = DEFAULT_TAGS.map(tag => ({ name: tag.name, color: tag.color, user_id: user.id }));
      const { data, error } = await supabase.from('tags').insert(tagsToInsert).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterTag();
      t.success('Etiquetas predeterminadas creadas', 'Default tags created');
    },
    onError: (error: Error) => {
      if (error.message !== 'Tags already exist') {
        t.error(error.message || 'Error al crear etiquetas', error.message || 'Error creating tags');
      }
    },
  });
}
