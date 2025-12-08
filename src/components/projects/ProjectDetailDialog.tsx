import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Building2,
  Calendar,
  Target,
  Calculator,
  BarChart3
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { ProjectFinancialOverview } from './ProjectFinancialOverview';

interface ProjectDetailDialogProps {
  open: boolean;
  onClose: () => void;
  project: any;
}

export function ProjectDetailDialog({ open, onClose, project }: ProjectDetailDialogProps) {
  const { language } = useLanguage();
  const { data: allExpenses } = useExpenses();
  const { data: allIncome } = useIncome();

  // Filter expenses and income for this project
  const projectExpenses = useMemo(() => 
    allExpenses?.filter(e => e.project_id === project?.id) || [],
    [allExpenses, project?.id]
  );

  const projectIncome = useMemo(() => 
    allIncome?.filter(i => i.project_id === project?.id) || [],
    [allIncome, project?.id]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const expenses = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const income = projectIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    return {
      expenses,
      income,
      netBalance: income - expenses,
      budgetUsed: project?.budget ? (expenses / project.budget) * 100 : 0,
      budgetRemaining: project?.budget ? Math.max(project.budget - expenses, 0) : 0
    };
  }, [projectExpenses, projectIncome, project?.budget]);

  // Generate monthly trend data for the last 6 months
  const trendData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 5),
      end: endOfMonth(now)
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthExpenses = projectExpenses
        .filter(e => {
          const date = parseISO(e.date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const monthIncome = projectIncome
        .filter(i => {
          const date = parseISO(i.date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      return {
        month: format(month, 'MMM', { locale: language === 'es' ? es : undefined }),
        fullMonth: format(month, 'MMMM yyyy', { locale: language === 'es' ? es : undefined }),
        expenses: monthExpenses,
        income: monthIncome,
        balance: monthIncome - monthExpenses
      };
    });
  }, [projectExpenses, projectIncome, language]);

  // Category breakdown for expenses
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    projectExpenses.forEach(e => {
      const cat = e.category || 'other';
      categories[cat] = (categories[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [projectExpenses]);

  if (!project) return null;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; labelEn: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      active: { label: 'Activo', labelEn: 'Active', variant: 'default' },
      completed: { label: 'Completado', labelEn: 'Completed', variant: 'secondary' },
      on_hold: { label: 'En Pausa', labelEn: 'On Hold', variant: 'outline' },
      cancelled: { label: 'Cancelado', labelEn: 'Cancelled', variant: 'destructive' },
    };
    const statusConfig = config[status] || config.active;
    return <Badge variant={statusConfig.variant}>{language === 'es' ? statusConfig.label : statusConfig.labelEn}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-8 rounded-full"
              style={{ backgroundColor: project.color || '#3B82F6' }}
            />
            <div>
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              )}
            </div>
            <div className="ml-auto">
              {getStatusBadge(project.status || 'active')}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {language === 'es' ? 'Resumen' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {language === 'es' ? 'Panorama Financiero' : 'Financial Overview'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    {language === 'es' ? 'Ingresos' : 'Income'}
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${totals.income.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    {language === 'es' ? 'Gastos' : 'Expenses'}
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    ${totals.expenses.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    {totals.netBalance >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {language === 'es' ? 'Balance' : 'Balance'}
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(totals.netBalance).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              {project.budget && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Target className="h-4 w-4" />
                      {language === 'es' ? 'Presupuesto' : 'Budget'}
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      ${totals.budgetRemaining.toLocaleString()}
                    </p>
                    <Progress value={Math.min(totals.budgetUsed, 100)} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {totals.budgetUsed.toFixed(0)}% {language === 'es' ? 'usado' : 'used'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === 'es' ? 'Tendencia Gastos vs Ingresos' : 'Expenses vs Income Trend'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.some(d => d.expenses > 0 || d.income > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        name={language === 'es' ? 'Ingresos' : 'Income'}
                        stroke="hsl(142, 76%, 36%)" 
                        fill="url(#incomeGradient)" 
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        name={language === 'es' ? 'Gastos' : 'Expenses'}
                        stroke="hsl(0, 84%, 60%)" 
                        fill="url(#expenseGradient)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {language === 'es' 
                    ? 'No hay datos de gastos o ingresos para este proyecto'
                    : 'No expense or income data for this project'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Row: Category Breakdown and Project Info */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'es' ? 'Gastos por Categoría' : 'Expenses by Category'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                        <Tooltip 
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="hsl(var(--primary))" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    {language === 'es' ? 'Sin gastos registrados' : 'No expenses recorded'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'es' ? 'Información del Proyecto' : 'Project Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates */}
                {(project.start_date || project.end_date) && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      {project.start_date && format(new Date(project.start_date), 'PP', { locale: language === 'es' ? es : undefined })}
                      {project.start_date && project.end_date && ' - '}
                      {project.end_date && format(new Date(project.end_date), 'PP', { locale: language === 'es' ? es : undefined })}
                    </div>
                  </div>
                )}

                {/* Budget */}
                {project.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium">${project.budget.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">
                        {language === 'es' ? 'presupuesto total' : 'total budget'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Clients */}
                {project.clients && project.clients.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4" />
                      {language === 'es' ? 'Clientes asociados' : 'Associated clients'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.clients.map((client: any) => (
                        <Badge key={client.id} variant="outline">
                          {client.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-2xl font-bold">{projectExpenses.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' ? 'Gastos registrados' : 'Expenses recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{projectIncome.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' ? 'Ingresos registrados' : 'Income recorded'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="financial" className="mt-4">
            <ProjectFinancialOverview 
              projectId={project.id} 
              projectName={project.name} 
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
