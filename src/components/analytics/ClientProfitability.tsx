import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientProfit {
  clientId: string;
  clientName: string;
  totalIncome: number;
  totalExpenses: number;
  margin: number;
  marginPercent: number;
  transactionCount: number;
  performance: 'excellent' | 'good' | 'warning' | 'poor';
}

type SortField = 'clientName' | 'totalIncome' | 'totalExpenses' | 'margin' | 'marginPercent';

export function ClientProfitability() {
  const { language } = useLanguage();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: clients } = useClients();
  const [sortField, setSortField] = useState<SortField>('margin');
  const [sortAsc, setSortAsc] = useState(false);

  const clientProfits = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    const profitMap = new Map<string, ClientProfit>();

    // Initialize all clients
    clients.forEach(client => {
      profitMap.set(client.id, {
        clientId: client.id,
        clientName: client.name,
        totalIncome: 0,
        totalExpenses: 0,
        margin: 0,
        marginPercent: 0,
        transactionCount: 0,
        performance: 'good'
      });
    });

    // Sum income by client
    income?.forEach(inc => {
      if (inc.client_id && profitMap.has(inc.client_id)) {
        const profit = profitMap.get(inc.client_id)!;
        profit.totalIncome += inc.amount;
        profit.transactionCount++;
      }
    });

    // Sum expenses by client
    expenses?.forEach(expense => {
      if (expense.client_id && profitMap.has(expense.client_id)) {
        const profit = profitMap.get(expense.client_id)!;
        profit.totalExpenses += expense.amount;
        profit.transactionCount++;
      }
    });

    // Calculate margins and performance
    const results = Array.from(profitMap.values()).map(profit => {
      profit.margin = profit.totalIncome - profit.totalExpenses;
      profit.marginPercent = profit.totalIncome > 0 
        ? (profit.margin / profit.totalIncome) * 100 
        : profit.totalExpenses > 0 ? -100 : 0;

      // Determine performance
      if (profit.marginPercent >= 50) {
        profit.performance = 'excellent';
      } else if (profit.marginPercent >= 20) {
        profit.performance = 'good';
      } else if (profit.marginPercent >= 0) {
        profit.performance = 'warning';
      } else {
        profit.performance = 'poor';
      }

      return profit;
    });

    // Filter clients with any activity
    const activeClients = results.filter(c => c.totalIncome > 0 || c.totalExpenses > 0);

    // Sort
    activeClients.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'clientName':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'totalIncome':
          comparison = a.totalIncome - b.totalIncome;
          break;
        case 'totalExpenses':
          comparison = a.totalExpenses - b.totalExpenses;
          break;
        case 'margin':
          comparison = a.margin - b.margin;
          break;
        case 'marginPercent':
          comparison = a.marginPercent - b.marginPercent;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return activeClients;
  }, [clients, income, expenses, sortField, sortAsc]);

  const totals = useMemo(() => {
    return clientProfits.reduce((acc, client) => ({
      totalIncome: acc.totalIncome + client.totalIncome,
      totalExpenses: acc.totalExpenses + client.totalExpenses,
      margin: acc.margin + client.margin
    }), { totalIncome: 0, totalExpenses: 0, margin: 0 });
  }, [clientProfits]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getPerformanceBadge = (performance: string) => {
    const config = {
      excellent: { label: language === 'es' ? 'Excelente' : 'Excellent', class: 'bg-emerald-500/20 text-emerald-600' },
      good: { label: language === 'es' ? 'Bueno' : 'Good', class: 'bg-blue-500/20 text-blue-600' },
      warning: { label: language === 'es' ? 'Regular' : 'Fair', class: 'bg-amber-500/20 text-amber-600' },
      poor: { label: language === 'es' ? 'Pérdida' : 'Loss', class: 'bg-red-500/20 text-red-600' }
    };
    const { label, class: className } = config[performance as keyof typeof config] || config.good;
    return <Badge className={className}>{label}</Badge>;
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 -ml-2 font-medium"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (clientProfits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {language === 'es' ? 'Rentabilidad por Cliente' : 'Client Profitability'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {language === 'es' 
              ? 'No hay datos de clientes para analizar. Asigna ingresos y gastos a clientes para ver su rentabilidad.'
              : 'No client data to analyze. Assign income and expenses to clients to see their profitability.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find top performer
  const topClient = clientProfits[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {language === 'es' ? 'Rentabilidad por Cliente' : 'Client Profitability'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              {language === 'es' ? 'Clientes Activos' : 'Active Clients'}
            </div>
            <p className="text-xl font-bold">{clientProfits.length}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              {language === 'es' ? 'Total Ingresos' : 'Total Income'}
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totals.totalIncome)}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" />
              {language === 'es' ? 'Total Gastos' : 'Total Expenses'}
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
          </div>
          <div className={`${totals.margin >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-lg p-3 text-center`}>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              {language === 'es' ? 'Margen Total' : 'Total Margin'}
            </div>
            <p className={`text-xl font-bold ${totals.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(totals.margin)}
            </p>
          </div>
        </div>

        {/* Top Performer */}
        {topClient && topClient.margin > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
            <Award className="h-5 w-5 text-amber-600" />
            <span className="text-sm">
              <strong>{topClient.clientName}</strong> {language === 'es' ? 'es tu cliente más rentable con' : 'is your most profitable client with'} {formatCurrency(topClient.margin)} {language === 'es' ? 'de margen' : 'margin'} ({topClient.marginPercent.toFixed(1)}%)
            </span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton field="clientName" label={language === 'es' ? 'Cliente' : 'Client'} /></TableHead>
                <TableHead className="text-right"><SortButton field="totalIncome" label={language === 'es' ? 'Ingresos' : 'Income'} /></TableHead>
                <TableHead className="text-right"><SortButton field="totalExpenses" label={language === 'es' ? 'Gastos' : 'Expenses'} /></TableHead>
                <TableHead className="text-right"><SortButton field="margin" label={language === 'es' ? 'Margen' : 'Margin'} /></TableHead>
                <TableHead className="text-right"><SortButton field="marginPercent" label="%" /></TableHead>
                <TableHead className="text-center">{language === 'es' ? 'Estado' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientProfits.map(client => (
                <TableRow key={client.clientId}>
                  <TableCell className="font-medium">{client.clientName}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrency(client.totalIncome)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(client.totalExpenses)}</TableCell>
                  <TableCell className={`text-right font-bold ${client.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(client.margin)}
                  </TableCell>
                  <TableCell className={`text-right ${client.marginPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {client.marginPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">{getPerformanceBadge(client.performance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
