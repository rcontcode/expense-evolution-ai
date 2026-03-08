import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, TrendingUp, Bell, CheckCircle, XCircle, Info, Zap, DollarSign, Calendar, ArrowUp, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { format, parseISO, differenceInDays, subMonths, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'high_variance' | 'new_recurring' | 'unusual_amount' | 'duplicate' | 'spike' | 'weekend_spike' | 'monthly_spike';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  amount?: number;
  historicalAvg?: number;
  percentageChange?: number;
  vendor?: string;
  date?: string;
}

export function AnomalyAlerts() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  const alerts = useMemo(() => {
    const detectedAlerts: Alert[] = [];
    const now = new Date();

    // Unify both data sources
    const items: { date: string; amount: number; description: string; source: string }[] = [];
    const matchedIds = new Set(transactions?.filter(t => t.matched_expense_id).map(t => t.matched_expense_id) || []);

    (expenses || []).forEach(e => {
      if (!e.deleted_at) {
        items.push({ date: e.date, amount: Math.abs(Number(e.amount)), description: (e.vendor || e.description || 'Unknown').toLowerCase().trim(), source: 'expense' });
      }
    });
    (transactions || []).forEach(t => {
      if (!t.matched_expense_id) {
        items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)), description: (t.description || 'Unknown').toLowerCase().trim(), source: 'bank' });
      }
    });

    if (items.length === 0) return [];

    // Group by vendor
    const vendorGroups: Record<string, { amounts: number[]; dates: string[]; description: string }> = {};
    items.forEach(i => {
      const key = i.description;
      if (!vendorGroups[key]) vendorGroups[key] = { amounts: [], dates: [], description: i.description };
      vendorGroups[key].amounts.push(i.amount);
      vendorGroups[key].dates.push(i.date);
    });

    Object.entries(vendorGroups).forEach(([key, group]) => {
      if (group.amounts.length < 2) return;

      const sortedDates = [...group.dates].sort();
      const lastAmount = group.amounts[group.amounts.length - 1];
      const avgAmount = group.amounts.slice(0, -1).reduce((a, b) => a + b, 0) / (group.amounts.length - 1);

      // High variance
      if (group.amounts.length >= 3 && avgAmount > 0) {
        const pctChange = ((lastAmount - avgAmount) / avgAmount) * 100;

        if (pctChange > 30) {
          detectedAlerts.push({
            id: `high-${key}`,
            type: 'high_variance',
            severity: pctChange > 50 ? 'critical' : 'warning',
            title: l ? `Cobro alto: ${group.description}` : `High charge: ${group.description}`,
            description: l
              ? `Último cobro ${fc(lastAmount)} es ${pctChange.toFixed(0)}% más alto que el promedio ${fc(avgAmount)}`
              : `Last charge ${fc(lastAmount)} is ${pctChange.toFixed(0)}% higher than avg ${fc(avgAmount)}`,
            amount: lastAmount, historicalAvg: avgAmount, percentageChange: pctChange,
            vendor: group.description, date: sortedDates[sortedDates.length - 1],
          });
        }

        // Spike (>100%)
        if (pctChange > 100) {
          detectedAlerts.push({
            id: `spike-${key}`,
            type: 'spike',
            severity: 'critical',
            title: l ? `⚠️ Pico de gasto: ${group.description}` : `⚠️ Spending spike: ${group.description}`,
            description: l ? 'Más del doble de lo normal. Verifica si es correcto.' : 'More than double the normal amount. Please verify.',
            amount: lastAmount, historicalAvg: avgAmount, percentageChange: pctChange,
            vendor: group.description, date: sortedDates[sortedDates.length - 1],
          });
        }
      }

      // New recurring
      if (group.amounts.length === 2) {
        const daysBetween = differenceInDays(parseISO(sortedDates[1]), parseISO(sortedDates[0]));
        if (daysBetween >= 25 && daysBetween <= 35) {
          const variance = Math.abs(group.amounts[0] - group.amounts[1]) / Math.max(group.amounts[0], group.amounts[1]);
          if (variance < 0.15) {
            detectedAlerts.push({
              id: `new-recurring-${key}`,
              type: 'new_recurring',
              severity: 'info',
              title: l ? `Nuevo recurrente: ${group.description}` : `New recurring: ${group.description}`,
              description: l
                ? `2 cobros similares (~${fc(avgAmount)}) con ~30 días de diferencia`
                : `2 similar charges (~${fc(avgAmount)}) about 30 days apart`,
              amount: lastAmount, vendor: group.description,
            });
          }
        }
      }

      // Duplicate
      for (let i = 1; i < group.amounts.length; i++) {
        const daysApart = Math.abs(differenceInDays(parseISO(group.dates[i]), parseISO(group.dates[i - 1])));
        if (daysApart <= 1 && group.amounts[i] === group.amounts[i - 1]) {
          detectedAlerts.push({
            id: `duplicate-${key}-${i}`,
            type: 'duplicate',
            severity: 'warning',
            title: l ? `Posible duplicado: ${group.description}` : `Possible duplicate: ${group.description}`,
            description: l
              ? `2 cobros de ${fc(group.amounts[i])} en días consecutivos`
              : `2 charges of ${fc(group.amounts[i])} on consecutive days`,
            amount: group.amounts[i], vendor: group.description, date: group.dates[i],
          });
        }
      }
    });

    // Weekend spending spike detection
    const weekendItems = items.filter(i => {
      const d = parseISO(i.date);
      const day = getDay(d);
      return day === 0 || day === 6;
    });
    const weekdayItems = items.filter(i => {
      const d = parseISO(i.date);
      const day = getDay(d);
      return day >= 1 && day <= 5;
    });
    if (weekendItems.length > 0 && weekdayItems.length > 0) {
      const avgWeekend = weekendItems.reduce((s, i) => s + i.amount, 0) / Math.max(weekendItems.length, 1);
      const avgWeekday = weekdayItems.reduce((s, i) => s + i.amount, 0) / Math.max(weekdayItems.length, 1);
      if (avgWeekday > 0 && avgWeekend > avgWeekday * 1.5) {
        const pct = ((avgWeekend - avgWeekday) / avgWeekday) * 100;
        detectedAlerts.push({
          id: 'weekend-spike',
          type: 'weekend_spike',
          severity: pct > 100 ? 'warning' : 'info',
          title: l ? '🎉 Gastas más los fines de semana' : '🎉 Weekend spending is higher',
          description: l
            ? `Promedio fin de semana ${fc(avgWeekend)} vs ${fc(avgWeekday)} entre semana (+${pct.toFixed(0)}%)`
            : `Weekend avg ${fc(avgWeekend)} vs ${fc(avgWeekday)} weekday (+${pct.toFixed(0)}%)`,
          percentageChange: pct,
        });
      }
    }

    // Monthly spending spike: current month vs average of previous months
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const currentMonthItems = items.filter(i => {
      const d = parseISO(i.date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    const currentMonthTotal = currentMonthItems.reduce((s, i) => s + i.amount, 0);
    
    // Get previous 3 months totals
    const prevMonthTotals: number[] = [];
    for (let m = 1; m <= 3; m++) {
      const ms = startOfMonth(subMonths(now, m));
      const me = endOfMonth(subMonths(now, m));
      const monthTotal = items.filter(i => {
        const d = parseISO(i.date);
        return d >= ms && d <= me;
      }).reduce((s, i) => s + i.amount, 0);
      if (monthTotal > 0) prevMonthTotals.push(monthTotal);
    }
    
    if (prevMonthTotals.length >= 2) {
      const avgPrev = prevMonthTotals.reduce((s, t) => s + t, 0) / prevMonthTotals.length;
      // Pro-rate current month
      const dayOfMonth = now.getDate();
      const daysInMonth = endOfMonth(now).getDate();
      const projectedTotal = (currentMonthTotal / dayOfMonth) * daysInMonth;
      
      if (avgPrev > 0 && projectedTotal > avgPrev * 1.3) {
        const pct = ((projectedTotal - avgPrev) / avgPrev) * 100;
        detectedAlerts.push({
          id: 'monthly-spike',
          type: 'monthly_spike',
          severity: pct > 50 ? 'critical' : 'warning',
          title: l ? '📈 Mes inusualmente alto' : '📈 Unusually high month',
          description: l
            ? `Proyectado: ${fc(projectedTotal)} vs promedio ${fc(avgPrev)} (+${pct.toFixed(0)}%)`
            : `Projected: ${fc(projectedTotal)} vs avg ${fc(avgPrev)} (+${pct.toFixed(0)}%)`,
          amount: projectedTotal, historicalAvg: avgPrev, percentageChange: pct,
        });
      }
    }

    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return detectedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [transactions, expenses, l, fc]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  const visibleAlerts = showDismissed ? alerts : alerts.filter(a => !dismissedAlerts.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;
  const infoCount = visibleAlerts.filter(a => a.severity === 'info').length;

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'border-l-4 border-l-destructive bg-destructive/5';
      case 'warning': return 'border-l-4 border-l-amber-500 bg-amber-500/5';
      case 'info': return 'border-l-4 border-l-blue-500 bg-blue-500/5';
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {l ? 'Alertas y Anomalías' : 'Alerts & Anomalies'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
            <p className="font-medium">{l ? '¡Todo en orden!' : 'All clear!'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {l ? 'No se detectaron anomalías' : 'No anomalies detected'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              {l ? 'Alertas y Anomalías' : 'Alerts & Anomalies'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">{criticalCount} {l ? 'críticas' : 'critical'}</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">{warningCount} {l ? 'advertencias' : 'warnings'}</Badge>
              )}
              {infoCount > 0 && (
                <Badge variant="outline" className="text-xs">{infoCount} info</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowDismissed(!showDismissed)} className="text-xs">
            {showDismissed ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showDismissed ? (l ? 'Ocultar' : 'Hide') : (l ? 'Todas' : 'All')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {visibleAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  getSeverityStyles(alert.severity),
                  dismissedAlerts.has(alert.id) && 'opacity-50'
                )}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                        
                        {alert.percentageChange && alert.percentageChange > 0 && (
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="flex items-center gap-1 text-destructive">
                              <ArrowUp className="h-3 w-3" />+{alert.percentageChange.toFixed(0)}%
                            </span>
                            {alert.date && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(alert.date), 'dd MMM', { locale: l ? es : undefined })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!dismissedAlerts.has(alert.id) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => dismissAlert(alert.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
