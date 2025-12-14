import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Tag as TagIcon, Edit, Trash2, Sparkles, Filter, Receipt, Search, BarChart3, Lightbulb, ArrowRight, AlertCircle, Plane, RefreshCw, Star, Briefcase, User, ChartPie } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTagsWithExpenseCount, useDeleteTag, useSeedDefaultTags } from '@/hooks/data/useTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TagDialog } from '@/components/dialogs/TagDialog';
import { Tag } from '@/types/expense.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { TAG_COLOR_PALETTE, DEFAULT_TAGS } from '@/lib/constants/default-tags';
import { PageHeader } from '@/components/PageHeader';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MiniWorkflow } from '@/components/guidance/WorkflowVisualizer';
import { TagAnalytics } from '@/components/analytics/TagAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

const USE_CASE_EXAMPLES = [
  {
    icon: AlertCircle,
    color: '#EF4444',
    title: { es: 'Urgente', en: 'Urgent' },
    description: { es: 'Gastos que requieren atención inmediata', en: 'Expenses requiring immediate attention' },
  },
  {
    icon: RefreshCw,
    color: '#22C55E',
    title: { es: 'Reembolsado', en: 'Reimbursed' },
    description: { es: 'Ya te devolvieron el dinero', en: 'Money already returned' },
  },
  {
    icon: Lightbulb,
    color: '#EAB308',
    title: { es: 'Pendiente', en: 'Pending' },
    description: { es: 'Esperando aprobación', en: 'Waiting for approval' },
  },
  {
    icon: RefreshCw,
    color: '#3B82F6',
    title: { es: 'Recurrente', en: 'Recurring' },
    description: { es: 'Suscripciones mensuales', en: 'Monthly subscriptions' },
  },
  {
    icon: Star,
    color: '#8B5CF6',
    title: { es: 'Cliente Premium', en: 'Premium Client' },
    description: { es: 'Clientes importantes', en: 'Important clients' },
  },
  {
    icon: Plane,
    color: '#F97316',
    title: { es: 'Viaje de Negocios', en: 'Business Trip' },
    description: { es: 'Durante viajes de trabajo', en: 'During business trips' },
  },
];

const HOW_TO_STEPS = [
  {
    step: 1,
    icon: Plus,
    title: { es: 'Crea Etiquetas', en: 'Create Tags' },
    description: { es: 'Define nombre y color según tus necesidades', en: 'Define name and color based on your needs' },
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/40',
  },
  {
    step: 2,
    icon: Receipt,
    title: { es: 'Asigna a Gastos', en: 'Assign to Expenses' },
    description: { es: 'Desde el formulario de gastos, selecciona etiquetas', en: 'From the expense form, select tags' },
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
  },
  {
    step: 3,
    icon: Filter,
    title: { es: 'Filtra en Tablas', en: 'Filter in Tables' },
    description: { es: 'Usa etiquetas para encontrar gastos rápidamente', en: 'Use tags to find expenses quickly' },
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
  {
    step: 4,
    icon: BarChart3,
    title: { es: 'Analiza Patrones', en: 'Analyze Patterns' },
    description: { es: 'Ve estadísticas por etiqueta en el dashboard', en: 'See tag statistics in the dashboard' },
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
];

export default function Tags() {
  const { t, language } = useLanguage();
  const { data: tags, isLoading } = useTagsWithExpenseCount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteTag();
  const seedDefaultTags = useSeedDefaultTags();

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedTag(undefined);
  };

  const handleCreate = () => {
    setSelectedTag(undefined);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  // Find matching default tag for description
  const getTagDescription = (tagName: string) => {
    const defaultTag = DEFAULT_TAGS.find(dt => 
      dt.name.toLowerCase() === tagName.toLowerCase() || 
      dt.nameEn.toLowerCase() === tagName.toLowerCase()
    );
    if (defaultTag) {
      return language === 'es' ? defaultTag.description : defaultTag.descriptionEn;
    }
    return null;
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8 space-y-6">
          {/* Page Context Guide */}
          <PageContextGuide
            {...PAGE_GUIDES.tags}
            actions={[
              { 
                icon: Plus, 
                title: { es: 'Nueva Etiqueta', en: 'New Tag' }, 
                description: { es: 'Crea una nueva', en: 'Create a new one' },
                action: handleCreate
              },
              { 
                icon: Sparkles, 
                title: { es: 'Crear Predeterminadas', en: 'Create Defaults' }, 
                description: { es: '8 etiquetas útiles', en: '8 useful tags' },
                action: () => seedDefaultTags.mutate()
              },
              { 
                icon: Receipt, 
                title: { es: 'Ver Gastos', en: 'View Expenses' }, 
                description: { es: 'Asignar etiquetas', en: 'Assign tags' },
                path: '/expenses'
              },
              { 
                icon: BarChart3, 
                title: { es: 'Ver Dashboard', en: 'View Dashboard' }, 
                description: { es: 'Estadísticas', en: 'Statistics' },
                path: '/dashboard'
              },
            ]}
          />

          {/* Workflow Visualizer */}
          <MiniWorkflow workflowId="tag-management" />

          <PageHeader
            title={t('tags.title')}
            description={t('tags.description')}
          >
            <InfoTooltip content={TOOLTIP_CONTENT.createTag} variant="wrapper">
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('tags.createTag')}
              </Button>
            </InfoTooltip>
          </PageHeader>

          {/* Tabs for Tags and Analytics */}
          <Tabs defaultValue="tags" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                {language === 'es' ? 'Mis Etiquetas' : 'My Tags'}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <ChartPie className="h-4 w-4" />
                {language === 'es' ? 'Estadísticas' : 'Analytics'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tags" className="mt-6">
              {isLoading ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </CardContent>
            </Card>
          ) : tags && tags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => {
                const description = getTagDescription(tag.name);
                return (
                  <Card key={tag.id} className="group hover:shadow-md transition-all hover:border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <Badge
                            style={{ backgroundColor: tag.color || '#3B82F6' }}
                            className="text-white text-base px-3 py-1"
                          >
                            {tag.name}
                          </Badge>
                          {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Receipt className="h-3 w-3" />
                            <span>
                              {(tag as any).expenseCount || 0} {language === 'es' ? 'gastos' : 'expenses'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(tag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteId(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Empty State with Examples */}
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('tags.noTags')}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('tags.createFirst')}
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => seedDefaultTags.mutate()}
                      disabled={seedDefaultTags.isPending}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {language === 'es' ? 'Crear Predeterminadas' : 'Create Defaults'}
                    </Button>
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('tags.createTag')}
                    </Button>
                  </div>
                  
                  {/* Color Palette Preview */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2 text-center">
                      {language === 'es' ? 'Paleta de colores disponibles' : 'Available color palette'}
                    </p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {TAG_COLOR_PALETTE.map((item) => (
                        <div 
                          key={item.color} 
                          className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                          style={{ backgroundColor: item.color }}
                          title={language === 'es' ? item.name : item.nameEn}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Use Case Examples */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    {language === 'es' ? 'Ejemplos de Uso' : 'Usage Examples'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {USE_CASE_EXAMPLES.map((example, idx) => {
                      const Icon = example.icon;
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${example.color}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: example.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{example.title[language]}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{example.description[language]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* How to Use Tags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {language === 'es' ? '¿Cómo Usar Etiquetas?' : 'How to Use Tags?'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Connection line */}
                    <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-pink-200 via-purple-200 to-amber-200 dark:from-pink-800 dark:via-purple-800 dark:to-amber-800 z-0 hidden md:block" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                      {HOW_TO_STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                          <div key={step.step} className="flex flex-col items-center text-center group">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              "border-2 transition-all duration-200",
                              "group-hover:scale-110 group-hover:shadow-md",
                              step.bgColor,
                              "border-current"
                            )}>
                              <Icon className={cn("h-5 w-5", step.color)} />
                            </div>
                            <div className="mt-2">
                              <p className={cn("text-xs font-semibold", step.color)}>
                                {step.step}. {step.title[language]}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {step.description[language]}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <TagAnalytics />
            </TabsContent>
          </Tabs>

          <TagDialog open={dialogOpen} onClose={handleClose} tag={selectedTag} />

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('tags.deleteConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('tags.deleteTagWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </Layout>
  );
}
