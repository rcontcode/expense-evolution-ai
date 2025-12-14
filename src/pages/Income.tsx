import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIncome, useIncomeSummary, useDeleteIncome } from '@/hooks/data/useIncome';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { useProjects } from '@/hooks/data/useProjects';
import { INCOME_CATEGORIES, INCOME_GROUPS, getIncomeCategory } from '@/lib/constants/income-categories';
import { IncomeDialog } from '@/components/dialogs/IncomeDialog';
import { ProjectDialog } from '@/components/dialogs/ProjectDialog';
import { IncomeWithRelations, ProjectWithRelations } from '@/types/income.types';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { PageHeader } from '@/components/PageHeader';
import {
  Plus,
  TrendingUp,
  DollarSign,
  Wallet,
  PiggyBank,
  FolderKanban,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Repeat,
} from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Income() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeWithRelations | undefined>();
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'income' | 'project'>('income');

  const { data: incomeList, isLoading: incomeLoading } = useIncome();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: summary } = useIncomeSummary();
  const deleteIncomeMutation = useDeleteIncome();

  // Listen for voice command actions
  useEffect(() => {
    const handleVoiceAction = (event: CustomEvent<{ action: string }>) => {
      if (event.detail.action === 'add-income') {
        setSelectedIncome(undefined);
        setIncomeDialogOpen(true);
      }
    };

    window.addEventListener('voice-command-action', handleVoiceAction as EventListener);
    return () => {
      window.removeEventListener('voice-command-action', handleVoiceAction as EventListener);
    };
  }, []);


  const handleEditIncome = (income: IncomeWithRelations) => {
    setSelectedIncome(income);
    setIncomeDialogOpen(true);
  };

  const handleEditProject = (project: ProjectWithRelations) => {
    setSelectedProject(project);
    setProjectDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId && deleteType === 'income') {
      deleteIncomeMutation.mutate(deleteId);
    }
    setDeleteId(null);
  };

  const handleCloseIncomeDialog = () => {
    setIncomeDialogOpen(false);
    setSelectedIncome(undefined);
  };

  const handleCloseProjectDialog = () => {
    setProjectDialogOpen(false);
    setSelectedProject(undefined);
  };

  // Group income by type for summary
  const incomeByGroup = INCOME_GROUPS.map(group => {
    const categories = INCOME_CATEGORIES.filter(c => c.group === group.key);
    const total = categories.reduce((sum, cat) => {
      return sum + (summary?.byType[cat.value] || 0);
    }, 0);
    return { ...group, total, categories };
  }).filter(g => g.total > 0);

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <PageHeader
          title={t('income.title')}
          description={t('income.description')}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setProjectDialogOpen(true)}>
              <FolderKanban className="mr-2 h-4 w-4" />
              {t('income.newProject')}
            </Button>
            <Button onClick={() => setIncomeDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('income.addIncome')}
            </Button>
          </div>
        </PageHeader>

        {/* Mentor Quote Banner */}
        <MentorQuoteBanner context="income" className="mb-2" />

        {/* Contextual Page Guide */}
        <PageContextGuide
          {...PAGE_GUIDES.income}
          actions={[
            { icon: Plus, title: { es: 'Agregar Ingreso', en: 'Add Income' }, description: { es: 'Nuevo registro', en: 'New entry' }, action: () => setIncomeDialogOpen(true) },
            { icon: FolderKanban, title: { es: 'Nuevo Proyecto', en: 'New Project' }, description: { es: 'Organizar trabajo', en: 'Organize work' }, action: () => setProjectDialogOpen(true) },
            { icon: TrendingUp, title: { es: 'Ver Resumen', en: 'View Summary' }, description: { es: 'Por categoría', en: 'By category' }, path: '/dashboard' },
            { icon: DollarSign, title: { es: 'Balance', en: 'Balance' }, description: { es: 'Ingresos vs gastos', en: 'Income vs expenses' }, path: '/dashboard' }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('income.totalIncome')}</CardTitle>
              <DollarSign className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">
                ${summary?.totalIncome.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">{t('income.thisYear')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('income.taxableIncome')}</CardTitle>
              <Wallet className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">
                ${summary?.taxableIncome.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">{t('income.subjectToTax')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('income.nonTaxable')}</CardTitle>
              <PiggyBank className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">
                ${summary?.nonTaxableIncome.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">{t('income.taxExempt')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('income.transactions')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.count || 0}</div>
              <p className="text-xs text-muted-foreground">{t('income.entries')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Income by Group */}
        {incomeByGroup.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('income.byCategory')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incomeByGroup.map(group => (
                <div key={group.key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {language === 'es' ? group.label : group.labelEn}
                    </span>
                    <span className="text-muted-foreground">
                      ${group.total.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(group.total / (summary?.totalIncome || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="income" className="space-y-4">
          <TabsList>
            <TabsTrigger value="income">{t('income.incomeTab')}</TabsTrigger>
            <TabsTrigger value="projects">{t('income.projectsTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            {incomeLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t('common.loading')}
                </CardContent>
              </Card>
            ) : incomeList && incomeList.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('income.date')}</TableHead>
                      <TableHead>{t('income.type')}</TableHead>
                      <TableHead>{t('income.source')}</TableHead>
                      <TableHead>{t('income.project')}</TableHead>
                      <TableHead className="text-right">{t('income.amount')}</TableHead>
                      <TableHead>{t('income.recurrence')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeList.map((income) => {
                      const category = getIncomeCategory(income.income_type);
                      return (
                        <TableRow key={income.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(income.date), 'PP', { locale: dateLocale })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              style={{ backgroundColor: category?.color }} 
                              className="text-white"
                            >
                              {category?.icon} {language === 'es' ? category?.label : category?.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{income.source || income.description || '-'}</div>
                              {income.client && (
                                <div className="text-xs text-muted-foreground">
                                  {income.client.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {income.project ? (
                              <Badge 
                                variant="outline" 
                                style={{ borderColor: income.project.color, color: income.project.color }}
                              >
                                {income.project.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-chart-1">
                            ${Number(income.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {income.recurrence !== 'one_time' && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Repeat className="h-3 w-3" />
                                <span className="text-xs capitalize">{income.recurrence}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditIncome(income)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDeleteId(income.id);
                                    setDeleteType('income');
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('income.noIncome')}</p>
                  <p className="text-sm text-muted-foreground">{t('income.startTracking')}</p>
                  <Button onClick={() => setIncomeDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('income.addFirstIncome')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects">
            {projectsLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t('common.loading')}
                </CardContent>
              </Card>
            ) : projects && projects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {project.client && (
                        <CardDescription>{project.client.name}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {project.description && (
                          <p className="text-muted-foreground line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('income.budget')}:</span>
                          <span className="font-medium">
                            {project.budget ? `$${Number(project.budget).toFixed(2)}` : '-'}
                          </span>
                        </div>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('income.noProjects')}</p>
                  <p className="text-sm text-muted-foreground">{t('income.createProject')}</p>
                  <Button onClick={() => setProjectDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('income.addFirstProject')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <IncomeDialog 
          open={incomeDialogOpen} 
          onClose={handleCloseIncomeDialog}
          income={selectedIncome}
        />
        <ProjectDialog 
          open={projectDialogOpen} 
          onClose={handleCloseProjectDialog}
          project={selectedProject}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('common.actionCannotBeUndone')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
