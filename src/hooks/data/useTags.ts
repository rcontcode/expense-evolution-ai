import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag, TagInsert } from '@/types/expense.types';
import { toast } from 'sonner';
import { DEFAULT_TAGS } from '@/lib/constants/default-tags';
import { useInvalidateRelated } from './useInvalidateRelated';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useCreateTag() {
  const { afterTag } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (tag: TagInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tags')
        .insert({ ...tag, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      afterTag();
      toast.success('Etiqueta creada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear etiqueta');
    },
  });
}

export function useUpdateTag() {
  const { afterTag } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TagInsert> }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      afterTag();
      toast.success('Etiqueta actualizada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar etiqueta');
    },
  });
}

export function useDeleteTag() {
  const { afterTag } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      afterTag();
      toast.success('Etiqueta eliminada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar etiqueta');
    },
  });
}

export function useTagsWithExpenseCount() {
  return useQuery({
    queryKey: ['tags-with-expense-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (tagsError) throw tagsError;

      const { data: expenseTags, error: etError } = await supabase
        .from('expense_tags')
        .select('tag_id');

      if (etError) throw etError;

      const countMap: Record<string, number> = {};
      expenseTags?.forEach(et => {
        countMap[et.tag_id] = (countMap[et.tag_id] || 0) + 1;
      });

      return (tags || []).map(tag => ({
        ...tag,
        expenseCount: countMap[tag.id] || 0,
      }));
    },
  });
}

export function useSeedDefaultTags() {
  const { afterTag } = useInvalidateRelated();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existingTags } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingTags && existingTags.length > 0) {
        throw new Error('Tags already exist');
      }

      const tagsToInsert = DEFAULT_TAGS.map(tag => ({
        name: tag.name,
        color: tag.color,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('tags')
        .insert(tagsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterTag();
      toast.success('Etiquetas predeterminadas creadas');
    },
    onError: (error: Error) => {
      if (error.message !== 'Tags already exist') {
        toast.error(error.message || 'Error al crear etiquetas');
      }
    },
  });
}
