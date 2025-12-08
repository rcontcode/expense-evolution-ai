import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  FolderKanban, 
  Search, 
  Users, 
  Calendar,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectsWithClients } from '@/hooks/data/useProjectClients';
import { useDeleteProject } from '@/hooks/data/useProjects';
import { ProjectDialog } from '@/components/dialogs/ProjectDialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { format } from 'date-fns';
import { SetupProgressBanner } from '@/components/guidance/SetupProgressBanner';

export default function Projects() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  
  const { data: projects, isLoading } = useProjectsWithClients();
  const deleteProject = useDeleteProject();

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteProjectId) {
      deleteProject.mutate(deleteProjectId);
      setDeleteProjectId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; labelEn: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      active: { label: 'Activo', labelEn: 'Active', variant: 'default' },
      completed: { label: 'Completado', labelEn: 'Completed', variant: 'secondary' },
      on_hold: { label: 'En Pausa', labelEn: 'On Hold', variant: 'outline' },
      cancelled: { label: 'Cancelado', labelEn: 'Cancelled', variant: 'destructive' },
    };
    const statusConfig = config[status] || config.active;
    return (
      <Badge variant={statusConfig.variant}>
        {language === 'es' ? statusConfig.label : statusConfig.labelEn}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-primary" />
              {language === 'es' ? 'Proyectos' : 'Projects'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'es' 
                ? 'Organiza tu trabajo por proyectos y asigna múltiples clientes'
                : 'Organize your work by projects and assign multiple clients'}
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {language === 'es' ? 'Nuevo Proyecto' : 'New Project'}
          </Button>
        </div>

        <SetupProgressBanner variant="compact" />

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'es' ? 'Buscar proyectos...' : 'Search projects...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: project.color || '#3B82F6' }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {language === 'es' ? 'Editar' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteProjectId(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {language === 'es' ? 'Eliminar' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(project.status || 'active')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Clients */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      {project.clients && project.clients.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {project.clients.slice(0, 3).map((client: any) => (
                            <Badge key={client.id} variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {client.name}
                            </Badge>
                          ))}
                          {project.clients.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.clients.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {language === 'es' ? 'Sin clientes' : 'No clients'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.start_date && format(new Date(project.start_date), 'MMM d, yyyy')}
                        {project.start_date && project.end_date && ' - '}
                        {project.end_date && format(new Date(project.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {/* Budget */}
                  {project.budget && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {language === 'es' ? 'No hay proyectos' : 'No projects'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'es' 
                  ? 'Crea tu primer proyecto para organizar tu trabajo'
                  : 'Create your first project to organize your work'}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Crear Proyecto' : 'Create Project'}
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
        />

        <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'es' ? '¿Eliminar proyecto?' : 'Delete project?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'es'
                  ? 'Esta acción no se puede deshacer. Se eliminará el proyecto y sus asociaciones con clientes.'
                  : 'This action cannot be undone. The project and its client associations will be deleted.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
