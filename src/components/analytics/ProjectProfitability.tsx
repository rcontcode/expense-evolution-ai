import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjects } from '@/hooks/data/useProjects';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { Briefcase, TrendingUp, TrendingDown, ArrowUpDown, ChevronUp, ChevronDown, AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectMetrics {
  id: string;
  name: string;
  color: string;
  status: string;
  budget: number | null;
  income: number;
  expenses: number;
  margin: number;
  marginPercent: number;
  roi: number;
  budgetUsed: number;
  performance: 'excellent' | 'good' | 'warning' | 'poor';
}

type SortField = 'name' | 'income' | 'expenses' | 'margin' | 'marginPercent' | 'roi';
type SortDirection = 'asc' | 'desc';

const translations = {
  es: {
    title: 'Rentabilidad por Proyecto',
    description: 'Análisis comparativo de ingresos, gastos, margen y ROI por proyecto',
    project: 'Proyecto',
    income: 'Ingresos',
    expenses: 'Gastos',
    margin: 'Margen',
    marginPercent: 'Margen %',
    roi: 'ROI',
    budget: 'Presupuesto',
    budgetUsed: 'Usado',
    noProjects: 'No hay proyectos para analizar',
    createProject: 'Crea proyectos y asigna gastos e ingresos para ver la rentabilidad',
    performance: {
      excellent: 'Excelente',
      good: 'Bueno',
      warning: 'Atención',
      poor: 'Deficiente'
    },
    status: {
      active: 'Activo',
      completed: 'Completado',
      on_hold: 'En pausa',
      cancelled: 'Cancelado'
    },
    summary: {
      totalIncome: 'Ingresos Totales',
      totalExpenses: 'Gastos Totales',
      totalMargin: 'Margen Total',
      avgRoi: 'ROI Promedio',
      profitableProjects: 'Proyectos Rentables',
      unprofitableProjects: 'Proyectos con Pérdidas'
    },
    tooltips: {
      margin: 'Ingresos - Gastos',
      marginPercent: '(Margen / Ingresos) × 100',
      roi: '(Margen / Gastos) × 100'
    }
  },
  en: {
    title: 'Project Profitability',
    description: 'Comparative analysis of income, expenses, margin and ROI by project',
    project: 'Project',
    income: 'Income',
    expenses: 'Expenses',
    margin: 'Margin',
    marginPercent: 'Margin %',
    roi: 'ROI',
    budget: 'Budget',
    budgetUsed: 'Used',
    noProjects: 'No projects to analyze',
    createProject: 'Create projects and assign expenses and income to see profitability',
    performance: {
      excellent: 'Excellent',
      good: 'Good',
      warning: 'Warning',
      poor: 'Poor'
    },
    status: {
      active: 'Active',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled'
    },
    summary: {
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      totalMargin: 'Total Margin',
      avgRoi: 'Average ROI',
      profitableProjects: 'Profitable Projects',
      unprofitableProjects: 'Unprofitable Projects'
    },
    tooltips: {
      margin: 'Income - Expenses',
      marginPercent: '(Margin / Income) × 100',
      roi: '(Margin / Expenses) × 100'
    }
  }
};

export function ProjectProfitability() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const [sortField, setSortField] = useState<SortField>('margin');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const isLoading = projectsLoading || expensesLoading || incomeLoading;

  const projectMetrics = useMemo(() => {
    return projects.map(project => {
      const projectExpenses = expenses
        .filter(e => e.project_id === project.id)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const projectIncome = income
        .filter(i => i.project_id === project.id)
        .reduce((sum, i) => sum + i.amount, 0);

      const margin = projectIncome - projectExpenses;
      const marginPercent = projectIncome > 0 ? (margin / projectIncome) * 100 : 0;
      const roi = projectExpenses > 0 ? (margin / projectExpenses) * 100 : projectIncome > 0 ? 100 : 0;
      const budgetUsed = project.budget && project.budget > 0 
        ? (projectExpenses / project.budget) * 100 
        : 0;

      // Determine performance level
      let performance: 'excellent' | 'good' | 'warning' | 'poor';
      if (marginPercent >= 30) performance = 'excellent';
      else if (marginPercent >= 10) performance = 'good';
      else if (marginPercent >= 0) performance = 'warning';
      else performance = 'poor';

      return {
        id: project.id,
        name: project.name,
        color: project.color || '#3B82F6',
        status: project.status || 'active',
        budget: project.budget,
        income: projectIncome,
        expenses: projectExpenses,
        margin,
        marginPercent,
        roi,
        budgetUsed,
        performance
      } as ProjectMetrics;
    });
  }, [projects, expenses, income]);

  const sortedMetrics = useMemo(() => {
    return [...projectMetrics].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const numA = Number(aValue) || 0;
      const numB = Number(bValue) || 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }, [projectMetrics, sortField, sortDirection]);

  const summary = useMemo(() => {
    const totalIncome = projectMetrics.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = projectMetrics.reduce((sum, p) => sum + p.expenses, 0);
    const totalMargin = totalIncome - totalExpenses;
    const avgRoi = projectMetrics.length > 0
      ? projectMetrics.reduce((sum, p) => sum + p.roi, 0) / projectMetrics.length
      : 0;
    const profitableProjects = projectMetrics.filter(p => p.margin > 0).length;
    const unprofitableProjects = projectMetrics.filter(p => p.margin < 0).length;

    return { totalIncome, totalExpenses, totalMargin, avgRoi, profitableProjects, unprofitableProjects };
  }, [projectMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'warning': return <MinusCircle className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getPerformanceBadge = (performance: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-500/20 text-green-500 border-green-500/30',
      good: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      poor: 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    return colors[performance] || colors.warning;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Briefcase className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">{t.noProjects}</p>
            <p className="text-sm">{t.createProject}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              {summary.profitableProjects} {t.summary.profitableProjects.toLowerCase()}
            </Badge>
            {summary.unprofitableProjects > 0 && (
              <Badge variant="outline" className="text-red-500 border-red-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {summary.unprofitableProjects} {t.summary.unprofitableProjects.toLowerCase()}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-xs text-muted-foreground">{t.summary.totalIncome}</div>
            <div className="text-lg font-bold text-green-500">{formatCurrency(summary.totalIncome)}</div>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-muted-foreground">{t.summary.totalExpenses}</div>
            <div className="text-lg font-bold text-red-500">{formatCurrency(summary.totalExpenses)}</div>
          </div>
          <div className={`p-4 rounded-lg ${summary.totalMargin >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border`}>
            <div className="text-xs text-muted-foreground">{t.summary.totalMargin}</div>
            <div className={`text-lg font-bold ${summary.totalMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(summary.totalMargin)}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${summary.avgRoi >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
            <div className="text-xs text-muted-foreground">{t.summary.avgRoi}</div>
            <div className={`text-lg font-bold ${summary.avgRoi >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
              {summary.avgRoi.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => handleSort('name')}>
                    {t.project}
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => handleSort('income')}>
                    {t.income}
                    {getSortIcon('income')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => handleSort('expenses')}>
                    {t.expenses}
                    {getSortIcon('expenses')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => handleSort('margin')}>
                        {t.margin}
                        {getSortIcon('margin')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.tooltips.margin}</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => handleSort('marginPercent')}>
                        {t.marginPercent}
                        {getSortIcon('marginPercent')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.tooltips.marginPercent}</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => handleSort('roi')}>
                        {t.roi}
                        {getSortIcon('roi')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.tooltips.roi}</TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-center">{t.budget}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {t.status[project.status as keyof typeof t.status] || project.status}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-500">
                    {formatCurrency(project.income)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-500">
                    {formatCurrency(project.expenses)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${project.margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(project.margin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {getPerformanceIcon(project.performance)}
                      <Badge variant="outline" className={getPerformanceBadge(project.performance)}>
                        {project.marginPercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${project.roi >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                    {project.roi.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    {project.budget ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{formatCurrency(project.expenses)}</span>
                          <span className="text-muted-foreground">/ {formatCurrency(project.budget)}</span>
                        </div>
                        <Progress 
                          value={Math.min(100, project.budgetUsed)} 
                          className={`h-2 ${project.budgetUsed > 100 ? '[&>div]:bg-red-500' : project.budgetUsed > 80 ? '[&>div]:bg-yellow-500' : ''}`}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                          {project.budgetUsed.toFixed(0)}% {t.budgetUsed.toLowerCase()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
