import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/PageHeader';
import { 
  Plus, 
  FolderKanban, 
  Search, 
  Users, 
  Calendar as CalendarIcon,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  Copy,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectsWithClients } from '@/hooks/data/useProjectClients';
import { useDeleteProject, useDuplicateProject } from '@/hooks/data/useProjects';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { ProjectDialog } from '@/components/dialogs/ProjectDialog';
import { ProjectDetailDialog } from '@/components/projects/ProjectDetailDialog';
import { ProjectFinancialOverview } from '@/components/projects/ProjectFinancialOverview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
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
import { es } from 'date-fns/locale';
import { SetupProgressBanner } from '@/components/guidance/SetupProgressBanner';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos', labelEn: 'All' },
  { value: 'active', label: 'Activo', labelEn: 'Active' },
  { value: 'on_hold', label: 'En Pausa', labelEn: 'On Hold' },
  { value: 'completed', label: 'Completado', labelEn: 'Completed' },
  { value: 'cancelled', label: 'Cancelado', labelEn: 'Cancelled' },
];

export default function Projects() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [detailProject, setDetailProject] = useState<any>(null);
  const [financialProject, setFinancialProject] = useState<any>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>();
  
  const { data: projects, isLoading } = useProjectsWithClients();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: clients } = useClients();
  const deleteProject = useDeleteProject();
  const duplicateProject = useDuplicateProject();

  // Calculate project financials
  const projectFinancials = useMemo(() => {
    const financials: Record<string, { expenses: number; income: number }> = {};
    
    projects?.forEach(p => {
      financials[p.id] = { expenses: 0, income: 0 };
    });
    
    expenses?.forEach(e => {
      if (e.project_id && financials[e.project_id]) {
        financials[e.project_id].expenses += Number(e.amount) || 0;
      }
    });
    
    income?.forEach(i => {
      if (i.project_id && financials[i.project_id]) {
        financials[i.project_id].income += Number(i.amount) || 0;
      }
    });
    
    return financials;
  }, [projects, expenses, income]);

  // Apply filters
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(p => {
      // Search filter
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      // Client filter
      const matchesClient = clientFilter === 'all' || 
        p.clients?.some((c: any) => c.id === clientFilter) ||
        p.client_id === clientFilter;
      
      // Date filter
      let matchesDate = true;
      if (startDateFilter && p.start_date) {
        matchesDate = new Date(p.start_date) >= startDateFilter;
      }
      if (endDateFilter && p.end_date && matchesDate) {
        matchesDate = new Date(p.end_date) <= endDateFilter;
      }
      
      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });
  }, [projects, searchQuery, statusFilter, clientFilter, startDateFilter, endDateFilter]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    clientFilter !== 'all',
    !!startDateFilter,
    !!endDateFilter
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('all');
    setClientFilter('all');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleDuplicate = (project: any) => {
    duplicateProject.mutate(project.id);
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
        <PageHeader
          title={language === 'es' ? 'Proyectos' : 'Projects'}
          description={language === 'es' 
            ? 'Organiza tu trabajo por proyectos y asigna múltiples clientes'
            : 'Organize your work by projects and assign multiple clients'}
        >
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {language === 'es' ? 'Nuevo Proyecto' : 'New Project'}
          </Button>
        </PageHeader>

        <SetupProgressBanner variant="compact" />

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'es' ? 'Buscar proyectos...' : 'Search projects...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {language === 'es' ? 'Filtros' : 'Filters'}
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Estado' : 'Status'}</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {language === 'es' ? opt.label : opt.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client Filter */}
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Cliente' : 'Client'}</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === 'es' ? 'Todos' : 'All'}
                        </SelectItem>
                        {clients?.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date Filter */}
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Desde' : 'From'}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDateFilter 
                            ? format(startDateFilter, 'PP', { locale: language === 'es' ? es : undefined })
                            : (language === 'es' ? 'Seleccionar' : 'Select')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDateFilter}
                          onSelect={setStartDateFilter}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date Filter */}
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Hasta' : 'To'}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDateFilter 
                            ? format(endDateFilter, 'PP', { locale: language === 'es' ? es : undefined })
                            : (language === 'es' ? 'Seleccionar' : 'Select')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDateFilter}
                          onSelect={setEndDateFilter}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex justify-end mt-4">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
            {filteredProjects.map((project) => {
              const financials = projectFinancials[project.id] || { expenses: 0, income: 0 };
              const netBalance = financials.income - financials.expenses;
              const budgetUsed = project.budget 
                ? Math.min((financials.expenses / project.budget) * 100, 100) 
                : 0;
              const budgetRemaining = project.budget 
                ? Math.max(project.budget - financials.expenses, 0) 
                : 0;

              return (
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
                          <DropdownMenuItem onClick={() => setDetailProject(project)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {language === 'es' ? 'Ver detalles' : 'View details'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {language === 'es' ? 'Editar' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {language === 'es' ? 'Duplicar' : 'Duplicate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                            {project.clients.slice(0, 2).map((client: any) => (
                              <Badge key={client.id} variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {client.name}
                              </Badge>
                            ))}
                            {project.clients.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.clients.length - 2}
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
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {project.start_date && format(new Date(project.start_date), 'MMM d, yyyy')}
                          {project.start_date && project.end_date && ' - '}
                          {project.end_date && format(new Date(project.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>{language === 'es' ? 'Ingresos' : 'Income'}</span>
                        </div>
                        <span className="font-medium text-green-600">
                          ${financials.income.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-red-600">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          <span>{language === 'es' ? 'Gastos' : 'Expenses'}</span>
                        </div>
                        <span className="font-medium text-red-600">
                          ${financials.expenses.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>{language === 'es' ? 'Balance' : 'Balance'}</span>
                        <span className={cn(
                          netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Budget Progress */}
                    {project.budget && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {language === 'es' ? 'Presupuesto' : 'Budget'}
                          </span>
                          <span className="font-medium">
                            ${budgetRemaining.toLocaleString()} {language === 'es' ? 'restante' : 'remaining'}
                          </span>
                        </div>
                        <Progress 
                          value={budgetUsed} 
                          className={cn(
                            "h-2",
                            budgetUsed > 90 && "[&>div]:bg-red-500",
                            budgetUsed > 75 && budgetUsed <= 90 && "[&>div]:bg-amber-500"
                          )}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>${financials.expenses.toLocaleString()} {language === 'es' ? 'usado' : 'used'}</span>
                          <span>${project.budget.toLocaleString()} {language === 'es' ? 'total' : 'total'}</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Financial Overview Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 gap-2"
                      onClick={() => setFinancialProject(project)}
                    >
                      <PieChart className="h-4 w-4" />
                      {language === 'es' ? 'Panorama Financiero' : 'Financial Overview'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {language === 'es' ? 'No hay proyectos' : 'No projects'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {activeFiltersCount > 0
                  ? (language === 'es' ? 'No se encontraron proyectos con los filtros actuales' : 'No projects found with current filters')
                  : (language === 'es' ? 'Crea tu primer proyecto para organizar tu trabajo' : 'Create your first project to organize your work')
                }
              </p>
              {activeFiltersCount > 0 ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                </Button>
              ) : (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'es' ? 'Crear Proyecto' : 'Create Project'}
                </Button>
              )}
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

        <ProjectDetailDialog
          open={!!detailProject}
          onClose={() => setDetailProject(null)}
          project={detailProject}
        />

        {/* Quick Financial Overview Dialog */}
        <Dialog open={!!financialProject} onOpenChange={() => setFinancialProject(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {language === 'es' ? 'Panorama Financiero' : 'Financial Overview'}
                {financialProject && (
                  <span className="text-muted-foreground font-normal">
                    — {financialProject.name}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            {financialProject && (
              <ProjectFinancialOverview 
                projectId={financialProject.id} 
                projectName={financialProject.name}
              />
            )}
          </DialogContent>
        </Dialog>

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
