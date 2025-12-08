import { useState } from 'react';
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
import { Loader2, CheckCircle2, Link2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project?: ProjectWithRelations;
  defaultClientId?: string;
}

type CreationStep = 'idle' | 'creating' | 'linking' | 'done';

export function ProjectDialog({ open, onClose, project, defaultClientId }: ProjectDialogProps) {
  const { t, language } = useLanguage();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const addClientToProject = useAddClientToProject();
  const [creationStep, setCreationStep] = useState<CreationStep>('idle');

  const triggerConfetti = () => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
    };

    confetti({
      ...defaults,
      particleCount: 50,
      scalar: 1.2,
      shapes: ['circle', 'square']
    });

    confetti({
      ...defaults,
      particleCount: 30,
      scalar: 0.8,
      shapes: ['circle']
    });
  };

  const handleSubmit = async (data: ProjectFormData) => {
    if (project) {
      await updateMutation.mutateAsync({ id: project.id, data });
      onClose();
    } else {
      try {
        setCreationStep('creating');
        const newProject = await createMutation.mutateAsync(data);
        
        // If we have a defaultClientId, link the project to that client
        if (defaultClientId && newProject?.id) {
          setCreationStep('linking');
          await addClientToProject.mutateAsync({ 
            projectId: newProject.id, 
            clientId: defaultClientId 
          });
        }
        
        setCreationStep('done');
        triggerConfetti();
        
        setTimeout(() => {
          setCreationStep('idle');
          onClose();
        }, 1200);
      } catch (error) {
        setCreationStep('idle');
      }
    }
  };

  const handleClose = () => {
    if (creationStep === 'idle' || creationStep === 'done') {
      setCreationStep('idle');
      onClose();
    }
  };

  const isProcessing = creationStep !== 'idle' && creationStep !== 'done';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {project ? t('income.editProject') : t('income.newProject')}
          </DialogTitle>
          <DialogDescription>
            {project ? t('income.editProjectDescription') : t('income.createProjectDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Creation Progress Indicator */}
        {creationStep !== 'idle' && defaultClientId && (
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              {creationStep === 'creating' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <span className={creationStep === 'creating' ? 'text-foreground' : 'text-muted-foreground'}>
                {language === 'es' ? 'Creando proyecto...' : 'Creating project...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {creationStep === 'linking' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : creationStep === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Link2 className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={creationStep === 'linking' ? 'text-foreground' : creationStep === 'done' ? 'text-muted-foreground' : 'text-muted-foreground/50'}>
                {language === 'es' ? 'Vinculando al cliente...' : 'Linking to client...'}
              </span>
            </div>
            {creationStep === 'done' && (
              <div className="flex items-center gap-2 mt-2 text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'es' ? '¡Proyecto creado y vinculado!' : 'Project created and linked!'}
              </div>
            )}
          </div>
        )}

        {creationStep === 'idle' && (
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isLoading={createMutation.isPending || updateMutation.isPending || isProcessing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
