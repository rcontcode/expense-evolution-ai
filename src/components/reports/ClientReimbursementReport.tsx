import { useMemo, useState } from 'react';
import { ExpenseWithRelations } from '@/types/expense.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { getCategoryLabelByLanguage, getCategoryColor } from '@/lib/constants/expense-categories';
import { 
  Building2,
  DollarSign, 
  FileText, 
  Download,
  Calendar,
  CalendarIcon,
  X,
  TrendingUp,
  Receipt,
  PieChartIcon,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Users,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { exportReimbursementReportWithCharts } from '@/lib/export/reimbursement-excel-export';
import { exportReimbursementToPDF } from '@/lib/export/pdf-export';

interface ClientReimbursementReportProps {
  expenses: ExpenseWithRelations[];
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  expenses: ExpenseWithRelations[];
  total: number;
  count: number;
  categories: Record<string, { count: number; total: number }>;
}

const REIMBURSABLE_STATUSES = ['reimbursable', 'pending', 'under_review', 'client_reimbursable'];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(280, 70%, 55%)',
  'hsl(200, 75%, 50%)',
  'hsl(30, 85%, 55%)',
];

export function ClientReimbursementReport({ expenses }: ClientReimbursementReportProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { formatCurrency, formatCompact } = useFormatCurrency();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { clientGroups, totalReimbursable, totalExpenses, filteredExpenses, categoryTotals, averagePerExpense } = useMemo(() => {
    // First filter by date range
    let filtered = expenses;
    if (dateRange.from && dateRange.to) {
      filtered = expenses.filter((e) => {
        const expenseDate = parseISO(e.date);
        return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to! });
      });
    } else if (dateRange.from) {
      filtered = expenses.filter((e) => parseISO(e.date) >= dateRange.from!);
    } else if (dateRange.to) {
      filtered = expenses.filter((e) => parseISO(e.date) <= dateRange.to!);
    }

    // Then filter reimbursable with client
    const reimbursableExpenses = filtered.filter(
      (e) => e.client_id && (REIMBURSABLE_STATUSES.includes(e.status || '') || REIMBURSABLE_STATUSES.includes(e.reimbursement_type || ''))
    );

    const grouped = reimbursableExpenses.reduce((acc, expense) => {
      const clientId = expense.client_id || 'unknown';
      const clientName = expense.client?.name || 'Cliente desconocido';

      if (!acc[clientId]) {
        acc[clientId] = {
          clientId,
          clientName,
          expenses: [],
          total: 0,
          count: 0,
          categories: {},
        };
      }

      acc[clientId].expenses.push(expense);
      acc[clientId].total += Number(expense.amount);
      acc[clientId].count += 1;

      const category = expense.category || 'other';
      if (!acc[clientId].categories[category]) {
        acc[clientId].categories[category] = { count: 0, total: 0 };
      }
      acc[clientId].categories[category].count += 1;
      acc[clientId].categories[category].total += Number(expense.amount);

      return acc;
    }, {} as Record<string, ClientGroup>);

    const groups = Object.values(grouped).sort((a, b) => b.total - a.total);
    const total = groups.reduce((sum, g) => sum + g.total, 0);
    const expenseCount = groups.reduce((sum, g) => sum + g.count, 0);

    // Calculate category totals across all clients
    const catTotals: Record<string, number> = {};
    reimbursableExpenses.forEach(e => {
      const cat = e.category || 'other';
      catTotals[cat] = (catTotals[cat] || 0) + Number(e.amount);
    });

    return {
      clientGroups: groups,
      totalReimbursable: total,
      totalExpenses: expenseCount,
      filteredExpenses: reimbursableExpenses,
      categoryTotals: catTotals,
      averagePerExpense: expenseCount > 0 ? total / expenseCount : 0,
    };
  }, [expenses, dateRange]);

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  // Prepare chart data
  const categoryChartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([category, total]) => ({
        name: getCategoryLabelByLanguage(category, language === 'es' ? 'es' : 'en'),
        value: total,
        category,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [categoryTotals]);

  const clientChartData = useMemo(() => {
    return clientGroups.slice(0, 6).map((group, index) => ({
      name: group.clientName.length > 12 ? group.clientName.slice(0, 12) + '...' : group.clientName,
      total: group.total,
      count: group.count,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [clientGroups]);

  const chartConfig: ChartConfig = {
    total: { label: 'Total', color: 'hsl(var(--chart-1))' },
    value: { label: 'Monto', color: 'hsl(var(--chart-1))' },
  };

  // Excel export is handled by exportProfessionalReport using exceljs

  const exportProfessionalReport = async () => {
    await exportReimbursementReportWithCharts({
      clientGroups,
      totalReimbursable,
      totalExpenses,
      filteredExpenses,
      categoryTotals,
      averagePerExpense,
      dateRange,
      language
    });
  };

  const exportPDFReport = () => {
    exportReimbursementToPDF(
      clientGroups,
      totalReimbursable,
      filteredExpenses,
      categoryTotals,
      dateRange
    );
  };

  if (clientGroups.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150" />
            <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mt-6">
            {language === 'es' ? '📋 No hay gastos reembolsables' : '📋 No reimbursable expenses'}
          </h3>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            {language === 'es' 
              ? 'Asigna gastos a clientes con estado reembolsable para generar reportes profesionales'
              : 'Assign expenses to clients with reimbursable status to generate professional reports'}
          </p>
          {/* Show how many could be classified */}
          {expenses.filter(e => e.reimbursement_type === 'pending_classification' && !e.deleted_at).length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-700 text-center max-w-md">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                ⚡ <strong>{expenses.filter(e => e.reimbursement_type === 'pending_classification' && !e.deleted_at).length}</strong> {language === 'es' ? 'gastos sin clasificar podrían ser reembolsables' : 'unclassified expenses could be reimbursable'}
              </p>
              <div className="flex gap-2 justify-center mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300 shadow-sm"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-quick-classify'));
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Clasificar Rápido' : 'Quick Classify'}
                </Button>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {language === 'es' ? 'Paso 1: Agregar gastos' : 'Step 1: Add expenses'}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {language === 'es' ? 'Paso 2: Asignar clientes' : 'Step 2: Assign clients'}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {language === 'es' ? 'Paso 3: Clasificar' : 'Step 3: Classify'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/80 to-chart-2 p-6 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">
                {language === 'es' ? '📊 Reporte de Reembolsos' : '📊 Reimbursement Report'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {formatCurrency(totalReimbursable)}
            </h2>
            <p className="text-sm opacity-80 mt-1">
              {language === 'es' 
                ? `💰 Total a facturar • ${totalExpenses} gastos • ${clientGroups.length} cliente(s)`
                : `💰 Total to bill • ${totalExpenses} expenses • ${clientGroups.length} client(s)`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={exportPDFReport} 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button 
              onClick={exportProfessionalReport} 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="mr-2 h-4 w-4" />
              Excel Pro
            </Button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{language === 'es' ? '📅 Período del reporte:' : '📅 Report period:'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button variant="ghost" size="icon" onClick={clearDateRange} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {dateRange.from && dateRange.to && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {format(dateRange.from, "dd MMM", { locale: dateLocale })} - {format(dateRange.to, "dd MMM yyyy", { locale: dateLocale })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards con diseño mejorado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{language === 'es' ? '🏢 Clientes' : '🏢 Clients'}</p>
                <p className="text-3xl font-bold mt-1">{clientGroups.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{language === 'es' ? 'con gastos reembolsables' : 'with reimbursable expenses'}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{language === 'es' ? '🧾 Total Gastos' : '🧾 Total Expenses'}</p>
                <p className="text-3xl font-bold mt-1">{totalExpenses}</p>
                <p className="text-xs text-muted-foreground mt-1">{language === 'es' ? 'registrados en período' : 'recorded in period'}</p>
              </div>
              <div className="p-3 rounded-xl bg-chart-2/10 group-hover:bg-chart-2/20 transition-colors">
                <Receipt className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 to-transparent" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{language === 'es' ? '📊 Promedio' : '📊 Average'}</p>
                <p className="text-3xl font-bold mt-1">{formatCompact(averagePerExpense)}</p>
                <p className="text-xs text-muted-foreground mt-1">{language === 'es' ? 'por gasto' : 'per expense'}</p>
              </div>
              <div className="p-3 rounded-xl bg-chart-3/10 group-hover:bg-chart-3/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{language === 'es' ? '💰 Total a Facturar' : '💰 Total to Bill'}</p>
                <p className="text-3xl font-bold mt-1 text-success">{formatCurrency(totalReimbursable)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  <p className="text-xs text-success">{language === 'es' ? '✅ Listo para cobrar' : '✅ Ready to collect'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/20 group-hover:bg-success/30 transition-colors">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Distribución por Categoría */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <PieChartIcon className="h-4 w-4 text-chart-1" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? '🎯 Distribución por Categoría' : '🎯 Distribution by Category'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Desglose de gastos por tipo' : 'Expense breakdown by type'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getCategoryColor(entry.category) || CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatCurrency(Number(value)), language === 'es' ? 'Monto' : 'Amount']}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                {language === 'es' ? 'Sin datos de categorías' : 'No category data'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Comparación por Cliente */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <BarChart3 className="h-4 w-4 text-chart-2" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? '📊 Comparación por Cliente' : '📊 Comparison by Client'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Top clientes por monto reembolsable' : 'Top clients by reimbursable amount'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clientChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={clientChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))" 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    fontSize={12}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    width={80}
                    fontSize={11}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                  />
                  <Bar 
                    dataKey="total" 
                    radius={[0, 4, 4, 0]}
                    fill="hsl(var(--chart-1))"
                  >
                    {clientChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                {language === 'es' ? 'Sin datos de clientes' : 'No client data'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Groups con tabla profesional */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {language === 'es' ? '📋 Detalle por Cliente' : '📋 Detail by Client'}
          </h3>
          <Badge variant="outline" className="text-xs">
            {clientGroups.length} {language === 'es' ? 'cliente(s) en reporte' : 'client(s) in report'}
          </Badge>
        </div>

        {clientGroups.map((group, groupIndex) => {
          const maxCategoryTotal = Math.max(...Object.values(group.categories).map(c => c.total));
          const clientPercentage = totalReimbursable > 0 ? (group.total / totalReimbursable) * 100 : 0;
          
          return (
            <Card key={group.clientId} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: CHART_COLORS[groupIndex % CHART_COLORS.length] }}
                      >
                        {group.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border-2 border-success">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{group.clientName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                         <Badge variant="secondary" className="text-xs">
                          {group.count} {language === 'es' ? 'gastos' : 'expenses'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {clientPercentage.toFixed(1)}% {language === 'es' ? 'del total' : 'of total'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold" style={{ color: CHART_COLORS[groupIndex % CHART_COLORS.length] }}>
                      {formatCurrency(group.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">{language === 'es' ? 'Total a reembolsar' : 'Total to reimburse'}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-4">
                {/* Category breakdown con barras de progreso */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {language === 'es' ? '🏷️ Desglose por categoría' : '🏷️ Breakdown by category'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(group.categories)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([category, data]) => {
                        const percentage = (data.total / maxCategoryTotal) * 100;
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{getCategoryLabelByLanguage(category, language === 'es' ? 'es' : 'en')}</span>
                              <span className="text-muted-foreground">{data.count} • {formatCurrency(data.total)}</span>
                            </div>
                            <Progress 
                              value={percentage} 
                              className="h-2"
                              style={{ 
                                '--progress-background': getCategoryColor(category) || 'hsl(var(--primary))'
                              } as React.CSSProperties}
                            />
                          </div>
                        );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Expense table */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {language === 'es' ? '🧾 Detalle de gastos' : '🧾 Expense detail'}
                  </p>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">{language === 'es' ? 'Fecha' : 'Date'}</TableHead>
                          <TableHead className="font-semibold">{language === 'es' ? 'Vendedor' : 'Vendor'}</TableHead>
                          <TableHead className="font-semibold">{language === 'es' ? 'Categoría' : 'Category'}</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">{language === 'es' ? 'Descripción' : 'Description'}</TableHead>
                          <TableHead className="font-semibold text-right">{language === 'es' ? 'Monto' : 'Amount'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.expenses.slice(0, 10).map((expense, idx) => (
                          <TableRow 
                            key={expense.id}
                            className={cn(
                              "transition-colors",
                              idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                            )}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {format(new Date(expense.date), 'dd MMM yyyy', { locale: dateLocale })}
                              </div>
                            </TableCell>
                            <TableCell>{expense.vendor || '—'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${getCategoryColor(expense.category || 'other')}20`,
                                  color: getCategoryColor(expense.category || 'other'),
                                  borderColor: getCategoryColor(expense.category || 'other')
                                }}
                              >
                                {getCategoryLabelByLanguage(expense.category || 'other', language === 'es' ? 'es' : 'en')}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                              {expense.description || '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${Number(expense.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {group.expenses.length > 10 && (
                      <div className="p-3 bg-muted/30 text-center text-sm text-muted-foreground border-t">
                        +{group.expenses.length - 10} {language === 'es' ? 'gastos adicionales (ver Excel para lista completa)' : 'additional expenses (see Excel for full list)'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer con resumen */}
      <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{language === 'es' ? '✅ Reporte listo para exportar' : '✅ Report ready to export'}</p>
                <p className="text-sm text-muted-foreground">
                  {clientGroups.length} {language === 'es' ? 'clientes' : 'clients'} • {totalExpenses} {language === 'es' ? 'gastos' : 'expenses'} • ${totalReimbursable.toLocaleString('es-MX', { minimumFractionDigits: 2 })} total
                </p>
              </div>
            </div>
            <Button onClick={exportProfessionalReport} className="gap-2 shadow-lg shadow-primary/20">
              <Download className="h-4 w-4" />
              {language === 'es' ? '📥 Descargar Reporte Excel Pro' : '📥 Download Excel Pro Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
