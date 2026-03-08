import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useExpenses } from '@/hooks/data/useExpenses';
import { motion } from 'framer-motion';
import { parseISO, format, subMonths } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { AlertTriangle, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Anomaly {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  zScore: number;
  avgForCategory: number;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export function SpendingAnomalyDetector() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: expenses } = useExpenses();

  const anomalies = useMemo(() => {
    if (!expenses || expenses.length < 10) return [];

    const active = expenses.filter((e: any) => !e.deleted_at);
    const sixMonthsAgo = subMonths(new Date(), 6);

    // Group by category for statistical analysis
    const catStats: Record<string, { amounts: number[]; mean: number; stdDev: number }> = {};

    active.forEach((e: any) => {
      const cat = e.category || 'other';
      if (!catStats[cat]) catStats[cat] = { amounts: [], mean: 0, stdDev: 0 };
      catStats[cat].amounts.push(Math.abs(Number(e.amount)));
    });

    // Calculate mean and std dev per category
    Object.values(catStats).forEach(stat => {
      if (stat.amounts.length < 3) return;
      stat.mean = stat.amounts.reduce((s, a) => s + a, 0) / stat.amounts.length;
      const variance = stat.amounts.reduce((s, a) => s + Math.pow(a - stat.mean, 2), 0) / stat.amounts.length;
      stat.stdDev = Math.sqrt(variance);
    });

    // Vendor frequency analysis
    const vendorFreq: Record<string, number> = {};
    active.forEach((e: any) => {
      if (e.vendor) vendorFreq[e.vendor] = (vendorFreq[e.vendor] || 0) + 1;
    });

    const results: Anomaly[] = [];

    active.forEach((e: any) => {
      const cat = e.category || 'other';
      const amount = Math.abs(Number(e.amount));
      const stat = catStats[cat];
      if (!stat || stat.amounts.length < 3 || stat.stdDev === 0) return;

      const zScore = (amount - stat.mean) / stat.stdDev;

      // Flag if z-score > 2 (significantly above average for category)
      if (zScore > 2) {
        const severity = zScore > 3.5 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
        const reason = l
          ? `${(zScore).toFixed(1)}x por encima del promedio en "${cat}" (prom: ${fc(stat.mean)})`
          : `${(zScore).toFixed(1)}x above average for "${cat}" (avg: ${fc(stat.mean)})`;

        results.push({
          id: e.id,
          vendor: e.vendor || (l ? 'Sin proveedor' : 'No vendor'),
          amount,
          date: e.date,
          category: cat,
          zScore,
          avgForCategory: stat.mean,
          reason,
          severity,
        });
      }
    });

    // Also flag duplicate-like patterns (same vendor + same amount within 3 days)
    const sorted = [...active].sort((a: any, b: any) => a.date.localeCompare(b.date));
    for (let i = 1; i < sorted.length; i++) {
      const prev: any = sorted[i - 1];
      const curr: any = sorted[i];
      if (
        prev.vendor && curr.vendor &&
        prev.vendor === curr.vendor &&
        Math.abs(Number(prev.amount)) === Math.abs(Number(curr.amount)) &&
        Math.abs(new Date(curr.date).getTime() - new Date(prev.date).getTime()) <= 3 * 86400000
      ) {
        if (!results.find(r => r.id === curr.id)) {
          results.push({
            id: curr.id,
            vendor: curr.vendor,
            amount: Math.abs(Number(curr.amount)),
            date: curr.date,
            category: curr.category || 'other',
            zScore: 0,
            avgForCategory: 0,
            reason: l ? `Posible duplicado: mismo monto y proveedor en 3 días` : `Possible duplicate: same amount & vendor within 3 days`,
            severity: 'high',
          });
        }
      }
    }

    return results.sort((a, b) => b.severity.localeCompare(a.severity) || b.zScore - a.zScore).slice(0, 10);
  }, [expenses, l, fc]);

  if (anomalies.length === 0) return null;

  const highCount = anomalies.filter(a => a.severity === 'high').length;

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            {l ? 'Detector de Anomalías' : 'Anomaly Detector'}
          </div>
          <div className="flex gap-1.5">
            {highCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {highCount} {l ? 'críticas' : 'critical'}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {anomalies.length} {l ? 'detectadas' : 'detected'}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {l
            ? 'Análisis estadístico (z-score) de tus gastos para detectar patrones inusuales'
            : 'Statistical analysis (z-score) of your spending to detect unusual patterns'}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {anomalies.map((anomaly, i) => {
          const severityColors = {
            high: 'border-destructive/30 bg-destructive/5',
            medium: 'border-amber-500/30 bg-amber-500/5',
            low: 'border-muted bg-muted/20',
          };
          const severityIcons = {
            high: '🔴',
            medium: '🟡',
            low: '🟢',
          };

          return (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn("p-3 rounded-lg border", severityColors[anomaly.severity])}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{severityIcons[anomaly.severity]}</span>
                  <span className="text-sm font-medium truncate">{anomaly.vendor}</span>
                  <Badge variant="secondary" className="text-[9px] capitalize shrink-0">{anomaly.category}</Badge>
                </div>
                <span className="text-sm font-bold text-destructive shrink-0">{fc(anomaly.amount)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{anomaly.reason}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {format(parseISO(anomaly.date), 'PP', { locale: l ? es : enUS })}
              </p>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
