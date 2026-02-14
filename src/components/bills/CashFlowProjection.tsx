import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { getMonthlyEquivalent, BILL_CATEGORY_CONFIG, type BillCategory } from '@/lib/constants/bill-categories';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend, Area, AreaChart, ReferenceLine } from 'recharts';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

export function CashFlowProjection() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency, formatCompact } = useFormatCurrency();
  const { data: bills } = useRecurringBills();

  const projection = useMemo(() => {
    if (!bills || bills.length === 0) return { months: [], categoryBreakdown: [], avgMonthly: 0 };

    const active = bills.filter(b => b.status === 'active');
    const now = new Date();
    const months: { name: string; total: number; critical: number; high: number; medium: number; low: number }[] = [];

    for (let i = 0; i < 6; i++) {
      const month = addMonths(now, i);
      const monthName = format(month, 'MMM yy', { locale: l ? es : undefined });

      let total = 0;
      let critical = 0;
      let high = 0;
      let medium = 0;
      let low = 0;

      active.forEach(bill => {
        const monthlyAmt = getMonthlyEquivalent(Number(bill.amount), bill.frequency, bill.frequency_months || undefined);
        total += monthlyAmt;

        switch (bill.priority) {
          case 'critical': critical += monthlyAmt; break;
          case 'high': high += monthlyAmt; break;
          case 'medium': medium += monthlyAmt; break;
          case 'low': low += monthlyAmt; break;
          default: medium += monthlyAmt;
        }
      });

      months.push({ name: monthName, total, critical, high, medium, low });
    }

    // Category breakdown for donut-like summary
    const catMap: Record<string, number> = {};
    active.forEach(bill => {
      const monthly = getMonthlyEquivalent(Number(bill.amount), bill.frequency, bill.frequency_months || undefined);
      catMap[bill.category] = (catMap[bill.category] || 0) + monthly;
    });

    const categoryBreakdown = Object.entries(catMap)
      .map(([cat, amount]) => ({
        category: cat,
        label: BILL_CATEGORY_CONFIG[cat as BillCategory]?.[l ? 'es' : 'en'] || cat,
        icon: BILL_CATEGORY_CONFIG[cat as BillCategory]?.icon || '📋',
        amount,
        color: BILL_CATEGORY_CONFIG[cat as BillCategory]?.color || 'hsl(0,0%,50%)',
      }))
      .sort((a, b) => b.amount - a.amount);

    const avgMonthly = months.reduce((s, m) => s + m.total, 0) / months.length;

    return { months, categoryBreakdown, avgMonthly };
  }, [bills, l]);

  if (!bills || bills.length === 0) {
    return null;
  }

  const priorityColors = {
    critical: 'hsl(0, 80%, 50%)',
    high: 'hsl(25, 80%, 50%)',
    medium: 'hsl(45, 80%, 50%)',
    low: 'hsl(130, 50%, 45%)',
  };

  return (
    <div className="space-y-4">
      {/* Projection Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {l ? 'Proyección 6 Meses' : '6-Month Projection'}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {l ? 'Promedio:' : 'Avg:'} {formatCurrency(projection.avgMonthly)}/{l ? 'mes' : 'mo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projection.months} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => formatCompact(v)}
                  className="text-muted-foreground"
                  width={70}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'critical' ? (l ? 'Crítico' : 'Critical')
                      : name === 'high' ? (l ? 'Alto' : 'High')
                      : name === 'medium' ? (l ? 'Medio' : 'Medium')
                      : (l ? 'Bajo' : 'Low')
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === 'critical' ? (l ? 'Crítico' : 'Critical')
                      : value === 'high' ? (l ? 'Alto' : 'High')
                      : value === 'medium' ? (l ? 'Medio' : 'Medium')
                      : (l ? 'Bajo' : 'Low')
                  }
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <ReferenceLine
                  y={projection.avgMonthly}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
                <Bar dataKey="critical" stackId="a" fill={priorityColors.critical} radius={[0, 0, 0, 0]} />
                <Bar dataKey="high" stackId="a" fill={priorityColors.high} radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill={priorityColors.medium} radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="a" fill={priorityColors.low} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top expense categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {l ? '🏆 Top Categorías de Gasto Fijo' : '🏆 Top Fixed Expense Categories'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {projection.categoryBreakdown.slice(0, 6).map((cat, i) => {
            const pct = projection.avgMonthly > 0 ? (cat.amount / projection.avgMonthly) * 100 : 0;
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <span className="text-lg w-7 text-center">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{cat.label}</span>
                    <span className="font-semibold">{formatCurrency(cat.amount)}<span className="text-xs text-muted-foreground font-normal">/{l ? 'mes' : 'mo'}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.06 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{pct.toFixed(1)}%</div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
