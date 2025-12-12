import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { ArrowRight, Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FlowNode {
  id: string;
  label: string;
  value: number;
  color: string;
  type: 'income' | 'center' | 'expense';
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

const translations = {
  es: {
    title: 'Flujo de Dinero',
    description: 'Visualización del flujo desde fuentes de ingreso hasta destinos de gasto',
    income: 'Ingresos',
    expenses: 'Gastos',
    balance: 'Tu Cuenta',
    surplus: 'Ahorro',
    deficit: 'Déficit',
    noData: 'Agrega ingresos y gastos para ver el flujo',
    incomeTypes: {
      salary: 'Salario',
      client_payment: 'Pagos de Clientes',
      bonus: 'Bonos',
      gift: 'Regalos',
      refund: 'Reembolsos',
      investment_stocks: 'Inversiones (Acciones)',
      investment_crypto: 'Inversiones (Crypto)',
      investment_funds: 'Inversiones (Fondos)',
      passive_rental: 'Ingresos Pasivos (Renta)',
      passive_royalties: 'Ingresos Pasivos (Regalías)',
      online_business: 'Negocio Online',
      freelance: 'Freelance',
      other: 'Otros Ingresos'
    },
    expenseCategories: {
      office: 'Oficina',
      travel: 'Viajes',
      equipment: 'Equipamiento',
      software: 'Software',
      professional_services: 'Servicios Profesionales',
      meals_entertainment: 'Comidas y Entretenimiento',
      utilities: 'Servicios Básicos',
      insurance: 'Seguros',
      advertising: 'Publicidad',
      materials: 'Materiales',
      vehicle: 'Vehículo',
      home_office: 'Oficina en Casa',
      education: 'Educación',
      health: 'Salud',
      other: 'Otros Gastos'
    }
  },
  en: {
    title: 'Money Flow',
    description: 'Visualization of flow from income sources to expense destinations',
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Your Account',
    surplus: 'Savings',
    deficit: 'Deficit',
    noData: 'Add income and expenses to see the flow',
    incomeTypes: {
      salary: 'Salary',
      client_payment: 'Client Payments',
      bonus: 'Bonuses',
      gift: 'Gifts',
      refund: 'Refunds',
      investment_stocks: 'Investments (Stocks)',
      investment_crypto: 'Investments (Crypto)',
      investment_funds: 'Investments (Funds)',
      passive_rental: 'Passive Income (Rental)',
      passive_royalties: 'Passive Income (Royalties)',
      online_business: 'Online Business',
      freelance: 'Freelance',
      other: 'Other Income'
    },
    expenseCategories: {
      office: 'Office',
      travel: 'Travel',
      equipment: 'Equipment',
      software: 'Software',
      professional_services: 'Professional Services',
      meals_entertainment: 'Meals & Entertainment',
      utilities: 'Utilities',
      insurance: 'Insurance',
      advertising: 'Advertising',
      materials: 'Materials',
      vehicle: 'Vehicle',
      home_office: 'Home Office',
      education: 'Education',
      health: 'Health',
      other: 'Other Expenses'
    }
  }
};

const INCOME_COLORS: Record<string, string> = {
  salary: '#22c55e',
  client_payment: '#10b981',
  bonus: '#14b8a6',
  gift: '#06b6d4',
  refund: '#0ea5e9',
  investment_stocks: '#3b82f6',
  investment_crypto: '#6366f1',
  investment_funds: '#8b5cf6',
  passive_rental: '#a855f7',
  passive_royalties: '#d946ef',
  online_business: '#ec4899',
  freelance: '#f43f5e',
  other: '#64748b'
};

const EXPENSE_COLORS: Record<string, string> = {
  office: '#ef4444',
  travel: '#f97316',
  equipment: '#f59e0b',
  software: '#eab308',
  professional_services: '#84cc16',
  meals_entertainment: '#22c55e',
  utilities: '#10b981',
  insurance: '#14b8a6',
  advertising: '#06b6d4',
  materials: '#0ea5e9',
  vehicle: '#3b82f6',
  home_office: '#6366f1',
  education: '#8b5cf6',
  health: '#a855f7',
  other: '#64748b'
};

export function CashFlowSankey() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const isLoading = expensesLoading || incomeLoading;

  const flowData = useMemo(() => {
    // Group income by type
    const incomeByType: Record<string, number> = {};
    income.forEach(i => {
      const type = i.income_type || 'other';
      incomeByType[type] = (incomeByType[type] || 0) + i.amount;
    });

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const category = e.category || 'other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + e.amount;
    });

    const totalIncome = Object.values(incomeByType).reduce((sum, v) => sum + v, 0);
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);
    const balance = totalIncome - totalExpenses;

    // Create nodes
    const incomeNodes: FlowNode[] = Object.entries(incomeByType)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 income sources
      .map(([type, value]) => ({
        id: `income-${type}`,
        label: t.incomeTypes[type as keyof typeof t.incomeTypes] || type,
        value,
        color: INCOME_COLORS[type] || INCOME_COLORS.other,
        type: 'income' as const
      }));

    const expenseNodes: FlowNode[] = Object.entries(expensesByCategory)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 expense categories
      .map(([category, value]) => ({
        id: `expense-${category}`,
        label: t.expenseCategories[category as keyof typeof t.expenseCategories] || category,
        value,
        color: EXPENSE_COLORS[category] || EXPENSE_COLORS.other,
        type: 'expense' as const
      }));

    // Create links
    const incomeLinks: FlowLink[] = incomeNodes.map(node => ({
      source: node.id,
      target: 'account',
      value: node.value,
      color: node.color
    }));

    const expenseLinks: FlowLink[] = expenseNodes.map(node => ({
      source: 'account',
      target: node.id,
      value: node.value,
      color: node.color
    }));

    // Add savings/deficit node if there's a balance
    const balanceNode: FlowNode | null = balance !== 0 ? {
      id: 'balance',
      label: balance > 0 ? t.surplus : t.deficit,
      value: Math.abs(balance),
      color: balance > 0 ? '#22c55e' : '#ef4444',
      type: 'expense' as const
    } : null;

    const balanceLink: FlowLink | null = balance > 0 ? {
      source: 'account',
      target: 'balance',
      value: balance,
      color: '#22c55e'
    } : null;

    return {
      incomeNodes,
      expenseNodes,
      balanceNode,
      incomeLinks,
      expenseLinks,
      balanceLink,
      totalIncome,
      totalExpenses,
      balance
    };
  }, [income, expenses, t]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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

  const hasData = flowData.incomeNodes.length > 0 || flowData.expenseNodes.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate heights for visual representation
  const maxValue = Math.max(flowData.totalIncome, flowData.totalExpenses);
  const getHeight = (value: number) => Math.max(24, (value / maxValue) * 200);

  const allExpenseNodes = flowData.balanceNode 
    ? [...flowData.expenseNodes, flowData.balanceNode]
    : flowData.expenseNodes;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">{formatCurrency(flowData.totalIncome)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-red-500 font-medium">{formatCurrency(flowData.totalExpenses)}</span>
            </div>
            {flowData.balance !== 0 && (
              <div className="flex items-center gap-1">
                <PiggyBank className={`h-4 w-4 ${flowData.balance > 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`font-medium ${flowData.balance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(Math.abs(flowData.balance))}
                </span>
              </div>
            )}
          </div>
        </div>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-stretch justify-between gap-4 min-h-[400px] py-4">
          {/* Income Sources (Left) */}
          <div className="flex flex-col justify-center gap-2 w-1/3">
            <div className="text-sm font-medium text-muted-foreground mb-2 text-center">{t.income}</div>
            {flowData.incomeNodes.map((node) => (
              <Tooltip key={node.id}>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: `${node.color}20`,
                      borderLeft: `4px solid ${node.color}`,
                      minHeight: `${getHeight(node.value)}px`
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{node.label}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(node.value)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: node.color }} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{node.label}: {formatCurrency(node.value)}</p>
                  <p className="text-xs text-muted-foreground">
                    {((node.value / flowData.totalIncome) * 100).toFixed(1)}% {t.income.toLowerCase()}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Center Account Node */}
          <div className="flex flex-col items-center justify-center w-1/3">
            <div className="relative">
              {/* Flow lines from income */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-8">
                {flowData.incomeNodes.map((node, i) => (
                  <div
                    key={node.id}
                    className="absolute h-0.5 w-full"
                    style={{
                      backgroundColor: node.color,
                      opacity: 0.5,
                      top: `${(i / (flowData.incomeNodes.length - 1 || 1)) * 100}%`
                    }}
                  />
                ))}
              </div>

              {/* Central account circle */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-4 border-primary flex flex-col items-center justify-center shadow-lg">
                <Wallet className="h-8 w-8 text-primary mb-1" />
                <div className="text-xs font-medium text-center">{t.balance}</div>
                <div className={`text-sm font-bold ${flowData.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(flowData.balance)}
                </div>
              </div>

              {/* Flow lines to expenses */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-8">
                {allExpenseNodes.map((node, i) => (
                  <div
                    key={node.id}
                    className="absolute h-0.5 w-full"
                    style={{
                      backgroundColor: node.color,
                      opacity: 0.5,
                      top: `${(i / (allExpenseNodes.length - 1 || 1)) * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Expense Destinations (Right) */}
          <div className="flex flex-col justify-center gap-2 w-1/3">
            <div className="text-sm font-medium text-muted-foreground mb-2 text-center">{t.expenses}</div>
            {allExpenseNodes.map((node) => (
              <Tooltip key={node.id}>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: `${node.color}20`,
                      borderRight: `4px solid ${node.color}`,
                      minHeight: `${getHeight(node.value)}px`
                    }}
                  >
                    <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: node.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{node.label}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(node.value)}</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{node.label}: {formatCurrency(node.value)}</p>
                  {node.id !== 'balance' && (
                    <p className="text-xs text-muted-foreground">
                      {((node.value / flowData.totalExpenses) * 100).toFixed(1)}% {t.expenses.toLowerCase()}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Flow Summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t.income}: {formatCurrency(flowData.totalIncome)}
            </Badge>
            <Badge variant="outline" className="text-red-500 border-red-500/30">
              <TrendingDown className="h-3 w-3 mr-1" />
              {t.expenses}: {formatCurrency(flowData.totalExpenses)}
            </Badge>
            <Badge 
              variant="outline" 
              className={flowData.balance >= 0 ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}
            >
              <PiggyBank className="h-3 w-3 mr-1" />
              {flowData.balance >= 0 ? t.surplus : t.deficit}: {formatCurrency(Math.abs(flowData.balance))}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
