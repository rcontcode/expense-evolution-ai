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
import { ProjectWithRelations, ProjectFormData } from '@/types/income.types';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project?: ProjectWithRelations;
}

export function ProjectDialog({ open, onClose, project }: ProjectDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const handleSubmit = async (data: ProjectFormData) => {
    if (project) {
      await updateMutation.mutateAsync({ id: project.id, data });
    } else {
      await createMutation.mutateAsync(data);
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
