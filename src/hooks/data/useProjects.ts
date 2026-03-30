import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project, ProjectWithRelations, ProjectFormData } from '@/types/income.types';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

export function useProjects(status?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`*, client:clients(id, name)`)
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);

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
  const { user } = useAuth();
  const { afterProject } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: ProjectFormData & { entity_id?: string }) => {
      const { error, data: newProject } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id, name: data.name, description: data.description || null,
          status: data.status, client_id: data.client_id || null, budget: data.budget || null,
          start_date: data.start_date?.toISOString().split('T')[0] || null,
          end_date: data.end_date?.toISOString().split('T')[0] || null,
          color: data.color, entity_id: data.entity_id || defaultEntityId || null,
        })
        .select().single();

      if (error) throw error;
      await insertAuditLog(user!.id, {
        action: 'create', entity_type: 'project', entity_id: newProject.id,
        entity_name: data.name, new_values: { name: data.name, status: data.status },
      });
      return newProject;
    },
    onSuccess: () => {
      afterProject();
      t.success('Proyecto creado', 'Project created');
    },
    onError: () => {
      t.error('Error al crear proyecto', 'Error creating project');
    },
  });
}

export function useUpdateProject() {
  const { afterProject } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectFormData> }) => {
      const updateData: any = { ...data };
      if (data.start_date) {
        updateData.start_date = data.start_date instanceof Date ? data.start_date.toISOString().split('T')[0] : data.start_date;
      }
      if (data.end_date) {
        updateData.end_date = data.end_date instanceof Date ? data.end_date.toISOString().split('T')[0] : data.end_date;
      }
      const { error } = await supabase.from('projects').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      afterProject();
      t.success('Proyecto actualizado', 'Project updated');
    },
    onError: () => {
      t.error('Error al actualizar proyecto', 'Error updating project');
    },
  });
}

export function useDeleteProject() {
  const { user } = useAuth();
  const { afterProjectDelete } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('projects').select('name').eq('id', id).eq('user_id', user.id).maybeSingle();
      const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'project', entity_id: id,
        entity_name: existing?.name || null,
      });
    },
    onSuccess: () => {
      afterProjectDelete();
      t.success('Proyecto movido a la papelera', 'Project moved to trash');
    },
    onError: () => {
      t.error('Error al eliminar proyecto', 'Error deleting project');
    },
  });
}

export function useDuplicateProject() {
  const { user } = useAuth();
  const { afterProject } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data: originalProject, error: fetchError } = await supabase
        .from('projects').select('*').eq('id', projectId).maybeSingle();
      if (fetchError) throw fetchError;
      if (!originalProject) throw new Error('Project not found');

      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: `${originalProject.name} (copia)`,
          description: originalProject.description, status: 'active',
          client_id: originalProject.client_id, budget: originalProject.budget,
          start_date: null, end_date: null, color: originalProject.color,
        })
        .select().single();
      if (insertError) throw insertError;

      const { data: projectClients, error: pcFetchError } = await supabase
        .from('project_clients').select('client_id, role').eq('project_id', projectId);
      if (pcFetchError) throw pcFetchError;

      if (projectClients && projectClients.length > 0) {
        const { error: pcInsertError } = await supabase
          .from('project_clients')
          .insert(projectClients.map(pc => ({ project_id: newProject.id, client_id: pc.client_id, role: pc.role })));
        if (pcInsertError) throw pcInsertError;
      }
      return newProject;
    },
    onSuccess: () => {
      afterProject();
      t.success('Proyecto duplicado', 'Project duplicated');
    },
    onError: () => {
      t.error('Error al duplicar proyecto', 'Error duplicating project');
    },
  });
}
