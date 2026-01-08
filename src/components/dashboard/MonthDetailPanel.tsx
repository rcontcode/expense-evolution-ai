import { useMemo, useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale,
  Plus,
  DollarSign,
  Receipt,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PieChart,
  ArrowRight,
  Wallet,
  Camera
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

// Lazy load heavier components
const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));

interface MonthDetailPanelProps {
  year: number;
  month: number;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(25, 95%, 53%)',
  'hsl(339, 90%, 51%)',
];

export function MonthDetailPanel({
  year,
  month,
  onAddIncome,
  onAddExpense,
}: MonthDetailPanelProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [showTools, setShowTools] = useState(false);
  
  // Calculate date range for the selected month
  const dateRange = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }, [year, month]);
  
  // Previous month date range for comparison
  const prevDateRange = useMemo(() => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end };
  }, [year, month]);
  
  // Fetch data for the selected month
  const { data: expenses, isLoading: expensesLoading } = useExpenses({ dateRange });
  const { data: prevExpenses } = useExpenses({ dateRange: prevDateRange });
  const { data: income, isLoading: incomeLoading } = useIncome({ year, month: month + 1 });
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  const { data: prevIncome } = useIncome({ year: prevYear, month: prevMonth });
  const { data: stats } = useDashboardStats();
  
  const isLoading = expensesLoading || incomeLoading;
  
  // Calculate totals
  const totals = useMemo(() => {
    const totalIncome = income?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const balance = totalIncome - totalExpenses;
    
    const prevTotalIncome = prevIncome?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const prevTotalExpenses = prevExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    
    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;
    const expenseChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      balance,
      incomeChange,
      expenseChange,
      prevTotalIncome,
      prevTotalExpenses,
    };
  }, [income, expenses, prevIncome, prevExpenses]);
  
  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses?.forEach((expense) => {
      const cat = expense.category || 'other';
      categories[cat] = (categories[cat] || 0) + Number(expense.amount);
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);
  
  // Pending documents count
  const pendingDocs = useMemo(() => {
    return expenses?.filter(e => !e.category || !e.vendor).length || 0;
  }, [expenses]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-CA', {
      style: 'currency',
      currency: profile?.country === 'CL' ? 'CLP' : 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const fullMonthNames = language === 'es'
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const categoryLabels: Record<string, string> = language === 'es' 
    ? {
        supplies: 'Suministros',
        travel: 'Viajes',
        meals: 'Comidas',
        equipment: 'Equipos',
        software: 'Software',
        professional_services: 'Servicios Prof.',
        marketing: 'Marketing',
        utilities: 'Servicios',
        rent: 'Arriendo',
        insurance: 'Seguros',
        other: 'Otros',
      }
    : {
        supplies: 'Supplies',
        travel: 'Travel',
        meals: 'Meals',
        equipment: 'Equipment',
        software: 'Software',
        professional_services: 'Prof. Services',
        marketing: 'Marketing',
        utilities: 'Utilities',
        rent: 'Rent',
        insurance: 'Insurance',
        other: 'Other',
      };

  const isPositive = totals.balance >= 0;

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card via-card to-accent/5 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Month title */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isPositive ? "bg-success/10" : "bg-destructive/10"
            )}>
              <Wallet className={cn("h-5 w-5", isPositive ? "text-success" : "text-destructive")} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                {fullMonthNames[month]} {year}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {language === 'es' ? 'Detalle del mes' : 'Month details'}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button onClick={onAddIncome} size="sm" variant="outline" className="gap-1.5 border-success/30 text-success hover:bg-success/10">
              <Plus className="h-4 w-4" />
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Ingreso' : 'Income'}</span>
            </Button>
            <Button onClick={onAddExpense} size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
              <Plus className="h-4 w-4" />
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Gasto' : 'Expense'}</span>
            </Button>
            <Button 
              onClick={() => navigate('/mobile-capture')} 
              size="sm" 
              className="gap-1.5 bg-primary"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Capturar' : 'Capture'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Balance cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Income */}
          <div className="p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success/80">
                  {language === 'es' ? 'Ingresos' : 'Income'}
                </span>
              </div>
              {totals.incomeChange !== 0 && (
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  totals.incomeChange > 0 ? "text-success border-success/30" : "text-destructive border-destructive/30"
                )}>
                  {totals.incomeChange > 0 ? '+' : ''}{totals.incomeChange.toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-success">
              {isLoading ? '...' : formatCurrency(totals.totalIncome)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'es' ? 'vs mes anterior' : 'vs prev month'}: {formatCurrency(totals.prevTotalIncome)}
            </p>
          </div>
          
          {/* Expenses */}
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive/80">
                  {language === 'es' ? 'Gastos' : 'Expenses'}
                </span>
              </div>
              {totals.expenseChange !== 0 && (
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  totals.expenseChange > 0 ? "text-destructive border-destructive/30" : "text-success border-success/30"
                )}>
                  {totals.expenseChange > 0 ? '+' : ''}{totals.expenseChange.toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-destructive">
              {isLoading ? '...' : formatCurrency(totals.totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'es' ? 'vs mes anterior' : 'vs prev month'}: {formatCurrency(totals.prevTotalExpenses)}
            </p>
          </div>
          
          {/* Balance */}
          <div className={cn(
            "p-4 rounded-xl border-2",
            isPositive 
              ? "bg-gradient-to-br from-success/10 to-success/5 border-success/40" 
              : "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/40"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Scale className={cn("h-4 w-4", isPositive ? "text-success" : "text-destructive")} />
              <span className={cn("text-sm font-semibold", isPositive ? "text-success" : "text-destructive")}>
                Balance
              </span>
            </div>
            <p className={cn("text-2xl font-bold", isPositive ? "text-success" : "text-destructive")}>
              {isLoading ? '...' : formatCurrency(totals.balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPositive 
                ? (language === 'es' ? '✓ Mes positivo' : '✓ Positive month')
                : (language === 'es' ? '⚠ Déficit' : '⚠ Deficit')
              }
            </p>
          </div>
        </div>
        
        {/* Alerts section */}
        {(pendingDocs > 0 || (stats?.pendingDocs || 0) > 0) && (
          <div className="flex flex-wrap gap-2">
            {pendingDocs > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/expenses')}
                className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 animate-pulse"
              >
                <AlertCircle className="h-4 w-4" />
                {pendingDocs} {language === 'es' ? 'gastos incompletos' : 'incomplete expenses'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
            {(stats?.pendingDocs || 0) > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/chaos')}
                className="gap-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
              >
                <FileText className="h-4 w-4" />
                {stats?.pendingDocs} {language === 'es' ? 'documentos por revisar' : 'docs to review'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        
        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie chart */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {language === 'es' ? 'Por Categoría' : 'By Category'}
                </span>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={50}
                      paddingAngle={2}
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => categoryLabels[label] || label}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top categories list */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {language === 'es' ? 'Top Gastos' : 'Top Expenses'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => navigate('/expenses')}
                >
                  {language === 'es' ? 'Ver todo' : 'View all'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {categoryBreakdown.slice(0, 4).map((cat, index) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-xs flex-1 truncate">
                      {categoryLabels[cat.name] || cat.name}
                    </span>
                    <span className="text-xs font-medium">
                      {formatCurrency(cat.value)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({((cat.value / totals.totalExpenses) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Collapsible tools section */}
        <Collapsible open={showTools} onOpenChange={setShowTools}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              {showTools ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {language === 'es' ? 'Herramientas de presupuesto' : 'Budget tools'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <Suspense fallback={<Skeleton className="h-48" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <GlobalBudgetCard />
                <BudgetAlertsCard />
              </div>
            </Suspense>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
