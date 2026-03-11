import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Users,
  RefreshCw, ArrowUpRight, Wallet, BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Props {
  language: 'es' | 'en';
}

interface RevenueData {
  mrr: number;
  arr: number;
  totalActiveSubscriptions: number;
  planBreakdown: Record<string, { count: number; mrr: number }>;
  revenue30d: number;
  revenueGrowth: number;
  balance: { available: number; pending: number };
  recentSubscriptions: Array<{
    id: string;
    email: string;
    plan: string;
    mrr: number;
    created: string;
    current_period_end: string;
  }>;
}

export function AdminRevenueDashboard({ language }: Props) {
  const isEs = language === 'es';

  const { data, isLoading, error, refetch } = useQuery<RevenueData>({
    queryKey: ['admin-stripe-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-revenue');
      if (error) throw error;
      return data as RevenueData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{isEs ? 'Cargando datos de Stripe...' : 'Loading Stripe data...'}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">{isEs ? 'Error al cargar datos de revenue' : 'Error loading revenue data'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planLabels: Record<string, string> = {
    premium_monthly: 'Premium (Mensual)',
    premium_annual: 'Premium (Anual)',
    pro_monthly: 'Pro (Mensual)',
    pro_annual: 'Pro (Anual)',
    bundle_monthly: 'Bundle (Mensual)',
    bundle_annual: 'Bundle (Anual)',
    other: 'Otros',
  };

  const planColors: Record<string, string> = {
    premium_monthly: 'bg-amber-500',
    premium_annual: 'bg-amber-600',
    pro_monthly: 'bg-violet-500',
    pro_annual: 'bg-violet-600',
    bundle_monthly: 'bg-emerald-500',
    bundle_annual: 'bg-emerald-600',
    other: 'bg-gray-500',
  };

  const totalPlanSubs = Object.values(data.planBreakdown).reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">Stripe Live</Badge>
          <span className="text-xs text-muted-foreground">{isEs ? 'Datos en tiempo real' : 'Real-time data'}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'MRR',
            value: `$${data.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            desc: isEs ? 'Ingreso mensual recurrente' : 'Monthly Recurring Revenue',
          },
          {
            label: 'ARR',
            value: `$${data.arr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: 'text-primary',
            desc: isEs ? 'Ingreso anual recurrente' : 'Annual Recurring Revenue',
          },
          {
            label: isEs ? 'Revenue 30d' : 'Revenue 30d',
            value: `$${data.revenue30d.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            icon: BarChart3,
            color: 'text-blue-600',
            desc: data.revenueGrowth >= 0
              ? `↑ ${data.revenueGrowth}% vs prev 30d`
              : `↓ ${Math.abs(data.revenueGrowth)}% vs prev 30d`,
          },
          {
            label: isEs ? 'Suscripciones' : 'Subscriptions',
            value: data.totalActiveSubscriptions.toString(),
            icon: Users,
            color: 'text-violet-600',
            desc: isEs ? 'Activas en Stripe' : 'Active on Stripe',
          },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  {kpi.label === 'Revenue 30d' && (
                    <Badge variant={data.revenueGrowth >= 0 ? 'default' : 'destructive'} className="text-[9px]">
                      {data.revenueGrowth >= 0 ? <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                      {data.revenueGrowth}%
                    </Badge>
                  )}
                </div>
                <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Balance & Plan Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stripe Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              {isEs ? 'Balance Stripe' : 'Stripe Balance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{isEs ? 'Disponible' : 'Available'}</span>
              <span className="text-lg font-bold text-emerald-600">
                ${data.balance.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{isEs ? 'Pendiente' : 'Pending'}</span>
              <span className="text-lg font-bold text-amber-600">
                ${data.balance.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plan Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {isEs ? 'Distribución de Planes' : 'Plan Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.planBreakdown)
              .filter(([, v]) => v.count > 0)
              .sort((a, b) => b[1].mrr - a[1].mrr)
              .map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${planColors[key] || 'bg-gray-400'}`} />
                      <span className="font-medium">{planLabels[key] || key}</span>
                      <Badge variant="outline" className="text-[9px]">{val.count}</Badge>
                    </div>
                    <span className="font-mono font-bold">${val.mrr.toFixed(2)}/mo</span>
                  </div>
                  <Progress value={totalPlanSubs > 0 ? (val.count / totalPlanSubs) * 100 : 0} className="h-1" />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {isEs ? 'Suscripciones Recientes' : 'Recent Subscriptions'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isEs ? 'Últimas 20 suscripciones activas' : 'Last 20 active subscriptions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1.5">
              {data.recentSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 p-2 rounded text-xs border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{sub.email}</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] shrink-0">{sub.plan}</Badge>
                  <span className="font-mono font-bold text-emerald-600 shrink-0">${sub.mrr}/mo</span>
                  <span className="text-muted-foreground shrink-0">{format(new Date(sub.created), 'dd/MM/yy')}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
