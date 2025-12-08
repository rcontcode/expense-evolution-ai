import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  FolderKanban, 
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClientProjects, useRemoveClientFromProject } from '@/hooks/data/useProjectClients';
import { ProjectDialog } from '@/components/dialogs/ProjectDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClientProjectsSectionProps {
  clientId: string;
}

export function ClientProjectsSection({ clientId }: ClientProjectsSectionProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: clientProjects, isLoading } = useClientProjects(clientId);
  const removeClient = useRemoveClientFromProject();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [removeProjectId, setRemoveProjectId] = useState<string | null>(null);

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleRemove = async () => {
    if (removeProjectId) {
      await removeClient.mutateAsync({ projectId: removeProjectId, clientId });
      setRemoveProjectId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; labelEn: string; variant: 'default' | 'secondary' | 'outline' }> = {
      active: { label: 'Activo', labelEn: 'Active', variant: 'default' },
      completed: { label: 'Completado', labelEn: 'Completed', variant: 'secondary' },
      on_hold: { label: 'En Pausa', labelEn: 'On Hold', variant: 'outline' },
    };
    const statusConfig = config[status] || config.active;
    return (
      <Badge variant={statusConfig.variant} className="text-[10px]">
        {language === 'es' ? statusConfig.label : statusConfig.labelEn}
      </Badge>
    );
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FolderKanban className="h-4 w-4" />
          {language === 'es' ? 'Proyectos Asociados' : 'Associated Projects'}
        </h3>
        <Button variant="outline" size="sm" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {language === 'es' ? 'Agregar' : 'Add'}
        </Button>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="h-16" />
        </Card>
      ) : clientProjects && clientProjects.length > 0 ? (
        <div className="space-y-2">
          {clientProjects.map((pc) => {
            const project = pc.project;
            if (!project) return null;

            return (
              <Card key={pc.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  <div 
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{project.name}</span>
                      {getStatusBadge(project.status || 'active')}
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('/projects')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {language === 'es' ? 'Ver todos' : 'View all'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {language === 'es' ? 'Editar' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setRemoveProjectId(project.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {language === 'es' ? 'Quitar de cliente' : 'Remove from client'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === 'es' 
                ? 'Sin proyectos asociados'
                : 'No associated projects'}
            </p>
            <Button variant="link" size="sm" onClick={handleCreate} className="mt-1">
              {language === 'es' ? 'Crear primer proyecto' : 'Create first project'}
            </Button>
          </CardContent>
        </Card>
      )}

      <ProjectDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        defaultClientId={clientId}
      />

      <AlertDialog open={!!removeProjectId} onOpenChange={() => setRemoveProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'es' ? '¿Quitar proyecto?' : 'Remove project?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'es'
                ? 'El proyecto no se eliminará, solo se desvinculará de este cliente.'
                : 'The project will not be deleted, only unlinked from this client.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>
              {language === 'es' ? 'Quitar' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
