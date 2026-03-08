import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useMileage } from '@/hooks/data/useMileage';
import { useClients } from '@/hooks/data/useClients';
import { TrendingUp, TrendingDown, Target, Crown, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ClientProfit {
  id: string;
  name: string;
  income: number;
  expenses: number;
  mileageCost: number;
  netProfit: number;
  roi: number; // (income - costs) / costs * 100
  trend: 'up' | 'down' | 'stable';
  invoiceCount: number;
  avgInvoice: number;
  lastActivity: string;
}

const CRA_RATE_PER_KM = 0.70; // 2024 CRA rate

export function ClientProfitabilityRadar() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { data: clients } = useClients();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: mileage } = useMileage();
  const [sortBy, setSortBy] = useState<'profit' | 'roi'>('profit');

  const clientProfits = useMemo(() => {
    if (!clients?.length) return [];

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    return clients.map(client => {
      const clientIncome = income?.filter(i => i.client_id === client.id) || [];
      const clientExpenses = expenses?.filter(e => e.client_id === client.id) || [];
      const clientMileage = mileage?.filter(m => m.client_id === client.id) || [];

      const totalIncome = clientIncome.reduce((s, i) => s + Number(i.amount), 0);
      const totalExpenses = clientExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalMileageKm = clientMileage.reduce((s, m) => s + Number(m.kilometers), 0);
      const mileageCost = totalMileageKm * CRA_RATE_PER_KM;
      const totalCosts = totalExpenses + mileageCost;
      const netProfit = totalIncome - totalCosts;
      const roi = totalCosts > 0 ? ((totalIncome - totalCosts) / totalCosts) * 100 : totalIncome > 0 ? 999 : 0;

      // Trend: compare last 3 months vs prior 3 months
      const recentIncome = clientIncome
        .filter(i => new Date(i.date) >= threeMonthsAgo)
        .reduce((s, i) => s + Number(i.amount), 0);
      const priorIncome = clientIncome
        .filter(i => new Date(i.date) >= sixMonthsAgo && new Date(i.date) < threeMonthsAgo)
        .reduce((s, i) => s + Number(i.amount), 0);
      
      const trend: 'up' | 'down' | 'stable' = 
        recentIncome > priorIncome * 1.1 ? 'up' : 
        recentIncome < priorIncome * 0.9 ? 'down' : 'stable';

      const allDates = [
        ...clientIncome.map(i => i.date),
        ...clientExpenses.map(e => e.date),
      ].sort().reverse();

      return {
        id: client.id,
        name: client.name,
        income: totalIncome,
        expenses: totalExpenses,
        mileageCost,
        netProfit,
        roi,
        trend,
        invoiceCount: clientIncome.length,
        avgInvoice: clientIncome.length > 0 ? totalIncome / clientIncome.length : 0,
        lastActivity: allDates[0] || '',
      } as ClientProfit;
    }).filter(c => c.income > 0 || c.expenses > 0)
      .sort((a, b) => sortBy === 'profit' ? b.netProfit - a.netProfit : b.roi - a.roi);
  }, [clients, expenses, income, mileage, sortBy]);

  if (!clientProfits.length) return null;

  const totalProfit = clientProfits.reduce((s, c) => s + c.netProfit, 0);
  const topClient = clientProfits[0];
  const lossClients = clientProfits.filter(c => c.netProfit < 0);
  const maxProfit = Math.max(...clientProfits.map(c => Math.abs(c.netProfit)), 1);

  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(0)}`;
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
    if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-base">
              {isEs ? 'Radar de Rentabilidad' : 'Profitability Radar'}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge 
              variant={sortBy === 'profit' ? 'default' : 'outline'} 
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setSortBy('profit')}
            >
              {isEs ? 'Ganancia' : 'Profit'}
            </Badge>
            <Badge 
              variant={sortBy === 'roi' ? 'default' : 'outline'} 
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setSortBy('roi')}
            >
              ROI
            </Badge>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Ganancia Total' : 'Total Profit'}</p>
            <p className={`text-sm font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <div className="flex items-center justify-center gap-1">
              <Crown className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] text-muted-foreground">{isEs ? 'Mejor' : 'Top'}</p>
            </div>
            <p className="text-sm font-bold truncate">{topClient?.name}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <p className="text-[10px] text-muted-foreground">{isEs ? 'En Pérdida' : 'At Loss'}</p>
            </div>
            <p className="text-sm font-bold text-red-600">{lossClients.length}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {clientProfits.slice(0, 8).map((client, idx) => (
          <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            {/* Rank */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              idx === 0 ? 'bg-amber-500/20 text-amber-700' :
              idx === 1 ? 'bg-slate-300/30 text-slate-600' :
              idx === 2 ? 'bg-orange-400/20 text-orange-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {idx + 1}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{client.name}</span>
                <TrendIcon trend={client.trend} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Progress 
                  value={Math.min(Math.abs(client.netProfit) / maxProfit * 100, 100)} 
                  className={`h-1.5 flex-1 ${client.netProfit < 0 ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${client.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(client.netProfit)}
              </p>
              <Tooltip>
                <TooltipTrigger>
                  <p className="text-[10px] text-muted-foreground">
                    ROI {client.roi > 500 ? '∞' : `${client.roi.toFixed(0)}%`}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-0.5">
                    <p>{isEs ? 'Ingresos' : 'Income'}: {formatCurrency(client.income)}</p>
                    <p>{isEs ? 'Gastos' : 'Expenses'}: {formatCurrency(client.expenses)}</p>
                    {client.mileageCost > 0 && (
                      <p>{isEs ? 'Kilometraje' : 'Mileage'}: {formatCurrency(client.mileageCost)}</p>
                    )}
                    <p>{isEs ? 'Facturas' : 'Invoices'}: {client.invoiceCount} (avg {formatCurrency(client.avgInvoice)})</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}

        {lossClients.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
            <p className="text-xs text-red-600 font-medium">
              {isEs 
                ? `⚠️ ${lossClients.length} cliente${lossClients.length > 1 ? 's' : ''} generando pérdida. Considera renegociar tarifas o reducir gastos asociados.`
                : `⚠️ ${lossClients.length} client${lossClients.length > 1 ? 's' : ''} at a loss. Consider renegotiating rates or cutting associated costs.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
