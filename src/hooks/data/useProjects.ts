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

export function useCreateProject(defaultEntityId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ProjectFormData & { entity_id?: string }) => {
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
          entity_id: data.entity_id || defaultEntityId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['projects-with-clients'] });
      toast.success('Proyecto eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar proyecto');
      console.error(error);
    },
  });
}

export function useDuplicateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // First, get the project to duplicate
      const { data: originalProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;

      // Create the duplicate with a new name
      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: `${originalProject.name} (copia)`,
          description: originalProject.description,
          status: 'active',
          client_id: originalProject.client_id,
          budget: originalProject.budget,
          start_date: null, // Reset dates for new project
          end_date: null,
          color: originalProject.color,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Copy project_clients relationships
      const { data: projectClients, error: pcFetchError } = await supabase
        .from('project_clients')
        .select('client_id, role')
        .eq('project_id', projectId);

      if (pcFetchError) throw pcFetchError;

      if (projectClients && projectClients.length > 0) {
        const { error: pcInsertError } = await supabase
          .from('project_clients')
          .insert(
            projectClients.map(pc => ({
              project_id: newProject.id,
              client_id: pc.client_id,
              role: pc.role,
            }))
          );

        if (pcInsertError) throw pcInsertError;
      }

      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-clients'] });
      toast.success('Proyecto duplicado');
    },
    onError: (error) => {
      toast.error('Error al duplicar proyecto');
      console.error(error);
    },
  });
}
