import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Project, ProjectWithRelations, ProjectFormData } from '@/types/income.types';

export function useProjects(status?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProjectWithRelations[];
    },
    enabled: !!user,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const { error, data: newProject } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: data.name,
          description: data.description || null,
          status: data.status,
          client_id: data.client_id || null,
          budget: data.budget || null,
          start_date: data.start_date?.toISOString().split('T')[0] || null,
          end_date: data.end_date?.toISOString().split('T')[0] || null,
          color: data.color,
        })
        .select()
        .single();

      if (error) throw error;
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto creado');
    },
    onError: (error) => {
      toast.error('Error al crear proyecto');
      console.error(error);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectFormData> }) => {
      const updateData: any = { ...data };
      
      if (data.start_date) {
        updateData.start_date = data.start_date instanceof Date 
          ? data.start_date.toISOString().split('T')[0] 
          : data.start_date;
      }
      
      if (data.end_date) {
        updateData.end_date = data.end_date instanceof Date
          ? data.end_date.toISOString().split('T')[0]
          : data.end_date;
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar proyecto');
      console.error(error);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar proyecto');
      console.error(error);
    },
  });
}
