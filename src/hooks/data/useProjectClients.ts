import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProjectClient {
  id: string;
  project_id: string;
  client_id: string;
  role: string;
  created_at: string;
  client?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
    status: string;
    color: string;
    description?: string;
  };
}

// Get all clients for a specific project
export function useProjectClients(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-clients', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          client:clients(id, name)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as ProjectClient[];
    },
    enabled: !!user && !!projectId,
  });
}

// Get all projects for a specific client
export function useClientProjects(clientId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('project_clients')
        .select(`
          *,
          project:projects(id, name, status, color, description)
        `)
        .eq('client_id', clientId);

      if (error) throw error;
      return data as ProjectClient[];
    },
    enabled: !!user && !!clientId,
  });
}

// Add client to project
export function useAddClientToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, clientId, role = 'participant' }: { projectId: string; clientId: string; role?: string }) => {
      const { data, error } = await supabase
        .from('project_clients')
        .insert({ project_id: projectId, client_id: clientId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-clients', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['client-projects', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Cliente agregado al proyecto');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Este cliente ya está asociado al proyecto');
      } else {
        toast.error('Error al agregar cliente');
      }
    },
  });
}

// Remove client from project
export function useRemoveClientFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, clientId }: { projectId: string; clientId: string }) => {
      const { error } = await supabase
        .from('project_clients')
        .delete()
        .eq('project_id', projectId)
        .eq('client_id', clientId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-clients', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['client-projects', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Cliente removido del proyecto');
    },
    onError: () => {
      toast.error('Error al remover cliente');
    },
  });
}

// Get projects with their client counts
export function useProjectsWithClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects-with-clients'],
    queryFn: async () => {
      // First get all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Then get all project_clients
      const { data: projectClients, error: pcError } = await supabase
        .from('project_clients')
        .select(`
          project_id,
          client:clients(id, name)
        `);

      if (pcError) throw pcError;

      // Merge the data
      return projects.map(project => ({
        ...project,
        clients: projectClients
          .filter(pc => pc.project_id === project.id)
          .map(pc => pc.client)
          .filter(Boolean),
        // Keep legacy client_id relationship
        legacy_client_id: project.client_id
      }));
    },
    enabled: !!user,
  });
}
