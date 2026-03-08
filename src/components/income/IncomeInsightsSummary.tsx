import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useIncome, useIncomeSummary } from '@/hooks/data/useIncome';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, PieChart, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export function IncomeInsightsSummary() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc, formatCompact } = useFormatCurrency();
  const { data: income } = useIncome();
  const { data: summary } = useIncomeSummary();

  const insights = useMemo(() => {
    if (!income || income.length === 0) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthIncome = income.filter((i: any) => {
      const d = parseISO(i.date);
      return d >= monthStart && d <= monthEnd;
    });
    const monthTotal = monthIncome.reduce((s: number, i: any) => s + Math.abs(Number(i.amount)), 0);

    // Previous month
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = endOfMonth(prevStart);
    const prevTotal = income
      .filter((i: any) => {
        const d = parseISO(i.date);
        return d >= prevStart && d <= prevEnd;
      })
      .reduce((s: number, i: any) => s + Math.abs(Number(i.amount)), 0);
    const monthChange = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : 0;

    // Source diversification
    const sourceMap: Record<string, number> = {};
    monthIncome.forEach((i: any) => {
      const src = i.category || 'other';
      sourceMap[src] = (sourceMap[src] || 0) + Math.abs(Number(i.amount));
    });
    const sourceCount = Object.keys(sourceMap).length;
    const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0];

    // Recurring income (same client appears 2+ months)
    const recurringClients = new Set<string>();
    const clientMonths: Record<string, Set<string>> = {};
    income.forEach((i: any) => {
      if (!i.client_id) return;
      const month = parseISO(i.date).toISOString().substring(0, 7);
      if (!clientMonths[i.client_id]) clientMonths[i.client_id] = new Set();
      clientMonths[i.client_id].add(month);
    });
    Object.entries(clientMonths).forEach(([cid, months]) => {
      if (months.size >= 2) recurringClients.add(cid);
    });

    return { monthTotal, monthCount: monthIncome.length, monthChange, sourceCount, topSource, recurringCount: recurringClients.size };
  }, [income]);

  if (!insights) return null;

  const cards = [
    {
      icon: DollarSign,
      label: l ? 'Ingresos del mes' : 'Month income',
      value: fc(insights.monthTotal),
      sub: `${insights.monthCount} ${l ? 'registros' : 'entries'}`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: TrendingUp,
      label: l ? 'vs mes anterior' : 'vs last month',
      value: `${insights.monthChange > 0 ? '+' : ''}${insights.monthChange.toFixed(0)}%`,
      sub: l ? 'Tendencia mensual' : 'Monthly trend',
      color: insights.monthChange >= 0 ? 'text-emerald-600' : 'text-destructive',
      bg: insights.monthChange >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10',
    },
    {
      icon: PieChart,
      label: l ? 'Diversificación' : 'Diversification',
      value: `${insights.sourceCount} ${l ? 'fuentes' : 'sources'}`,
      sub: insights.topSource ? `Top: ${insights.topSource[0]}` : '',
      color: insights.sourceCount >= 3 ? 'text-emerald-600' : 'text-amber-600',
      bg: insights.sourceCount >= 3 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
    },
    {
      icon: Repeat,
      label: l ? 'Recurrentes' : 'Recurring',
      value: `${insights.recurringCount}`,
      sub: l ? 'Clientes con ingreso regular' : 'Clients with regular income',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start gap-2.5">
                <div className={cn("p-1.5 rounded-lg shrink-0", card.bg)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className={cn("text-lg font-bold leading-tight", card.color)}>{card.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate capitalize">{card.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
