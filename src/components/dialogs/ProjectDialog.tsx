import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateProject, useUpdateProject } from '@/hooks/data/useProjects';
import { useAddClientToProject } from '@/hooks/data/useProjectClients';
import { ProjectWithRelations, ProjectFormData } from '@/types/income.types';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project?: ProjectWithRelations;
  defaultClientId?: string;
}

export function ProjectDialog({ open, onClose, project, defaultClientId }: ProjectDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const addClientToProject = useAddClientToProject();

  const handleSubmit = async (data: ProjectFormData) => {
    if (project) {
      await updateMutation.mutateAsync({ id: project.id, data });
    } else {
      const newProject = await createMutation.mutateAsync(data);
      // If we have a defaultClientId, link the project to that client
      if (defaultClientId && newProject?.id) {
        await addClientToProject.mutateAsync({ 
          projectId: newProject.id, 
          clientId: defaultClientId 
        });
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {project ? t('income.editProject') : t('income.newProject')}
          </DialogTitle>
          <DialogDescription>
            {project ? t('income.editProjectDescription') : t('income.createProjectDescription')}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          project={project}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
