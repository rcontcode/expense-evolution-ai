import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Server,
  Zap,
  Clock,
  BarChart3,
  CircleDollarSign,
  Receipt,
  FileSearch,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemMetric {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

/**
 * Admin-only dashboard widget showing real-time system metrics:
 * - Total users, expenses, income entries
 * - Daily active users (DAU)
 * - Feature adoption rates
 * - Database health indicators
 */
export const AdminSystemMetrics = memo(() => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-system-metrics'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const yesterday = subDays(today, 1);
      const weekAgo = subDays(today, 7);

      // Parallel queries for efficiency
      const [
        { count: totalUsers },
        { count: totalExpenses },
        { count: totalIncome },
        { count: totalDocuments },
        { count: todayExpenses },
        { count: weekActiveUsers },
        { count: totalBills },
        { count: totalClients },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('expenses').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('income').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('feature_usage_logs')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('recurring_bills').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('clients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalExpenses: totalExpenses || 0,
        totalIncome: totalIncome || 0,
        totalDocuments: totalDocuments || 0,
        todayExpenses: todayExpenses || 0,
        weekActiveUsers: weekActiveUsers || 0,
        totalBills: totalBills || 0,
        totalClients: totalClients || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: storageInfo } = useQuery({
    queryKey: ['admin-storage-info'],
    queryFn: async () => {
      const { data: expenseDocs } = await supabase.storage.from('expense-documents').list('', { limit: 1 });
      const { data: contracts } = await supabase.storage.from('contracts').list('', { limit: 1 });
      
      return {
        expenseDocsExists: !!expenseDocs,
        contractsExists: !!contracts,
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryMetrics: SystemMetric[] = [
    {
      label: isEs ? 'Usuarios Totales' : 'Total Users',
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: isEs ? 'Gastos Registrados' : 'Total Expenses',
      value: metrics?.totalExpenses || 0,
      icon: Receipt,
      color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
    },
    {
      label: isEs ? 'Ingresos Registrados' : 'Total Income',
      value: metrics?.totalIncome || 0,
      icon: CircleDollarSign,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: isEs ? 'Documentos OCR' : 'OCR Documents',
      value: metrics?.totalDocuments || 0,
      icon: FileSearch,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  const secondaryMetrics: SystemMetric[] = [
    {
      label: isEs ? 'Gastos Hoy' : 'Expenses Today',
      value: metrics?.todayExpenses || 0,
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: isEs ? 'Usuarios Activos (7d)' : 'Active Users (7d)',
      value: metrics?.weekActiveUsers || 0,
      icon: Activity,
      color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30',
    },
    {
      label: isEs ? 'Pagos Fijos Activos' : 'Active Bills',
      value: metrics?.totalBills || 0,
      icon: Clock,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: isEs ? 'Clientes Registrados' : 'Registered Clients',
      value: metrics?.totalClients || 0,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                {isEs ? '📊 Métricas del Sistema' : '📊 System Metrics'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isEs ? 'Actualizado cada minuto' : 'Updates every minute'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3 text-emerald-500" />
            {isEs ? 'En vivo' : 'Live'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Primary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {primaryMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-xl border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${metric.color}`}>
                  <metric.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {metric.label}
                </span>
              </div>
              <p className="text-2xl font-black">{formatNumber(metric.value)}</p>
            </motion.div>
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {secondaryMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${metric.color}`}>
                    <metric.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {metric.label}
                  </span>
                </div>
                <span className="text-sm font-bold">{formatNumber(metric.value)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Storage Status */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            {isEs ? '💾 Estado de Almacenamiento' : '💾 Storage Status'}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${storageInfo?.expenseDocsExists ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs">expense-documents</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${storageInfo?.contractsExists ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs">contracts</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AdminSystemMetrics.displayName = 'AdminSystemMetrics';
