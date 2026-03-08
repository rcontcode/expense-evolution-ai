import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { motion } from 'framer-motion';
import { Banknote, Link2, Store, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';

export function BankingInsightsSummary() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: transactions } = useBankTransactions();

  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTxns = transactions.filter(t => {
      const d = parseISO(t.transaction_date);
      return d >= monthStart && d <= monthEnd;
    });

    const totalVolume = monthTxns.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const matched = transactions.filter(t => t.status === 'matched').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const discrepancy = transactions.filter(t => t.status === 'discrepancy').length;
    const matchRate = transactions.length > 0 ? Math.round((matched / transactions.length) * 100) : 0;

    // Top merchant by frequency
    const merchantMap: Record<string, number> = {};
    transactions.forEach(t => {
      const desc = (t.description || 'Unknown').substring(0, 30);
      merchantMap[desc] = (merchantMap[desc] || 0) + 1;
    });
    const topMerchant = Object.entries(merchantMap).sort((a, b) => b[1] - a[1])[0];

    return { totalVolume, monthCount: monthTxns.length, matched, pending, discrepancy, matchRate, topMerchant };
  }, [transactions]);

  if (!insights) return null;

  const cards = [
    {
      icon: Banknote,
      label: l ? 'Volumen del mes' : 'Month volume',
      value: fc(insights.totalVolume),
      sub: `${insights.monthCount} ${l ? 'transacciones' : 'transactions'}`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Link2,
      label: l ? 'Tasa de conciliación' : 'Match rate',
      value: `${insights.matchRate}%`,
      sub: `${insights.matched} ${l ? 'conciliadas' : 'matched'} / ${insights.pending} ${l ? 'pendientes' : 'pending'}`,
      color: insights.matchRate >= 80 ? 'text-emerald-600' : insights.matchRate >= 50 ? 'text-primary' : 'text-amber-600',
      bg: insights.matchRate >= 80 ? 'bg-emerald-500/10' : insights.matchRate >= 50 ? 'bg-primary/10' : 'bg-amber-500/10',
    },
    {
      icon: Store,
      label: l ? 'Top comercio' : 'Top merchant',
      value: insights.topMerchant ? insights.topMerchant[0].substring(0, 18) : '—',
      sub: insights.topMerchant ? `${insights.topMerchant[1]} ${l ? 'veces' : 'times'}` : '',
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      icon: AlertTriangle,
      label: l ? 'Discrepancias' : 'Discrepancies',
      value: `${insights.discrepancy}`,
      sub: insights.discrepancy > 0 ? (l ? 'Requieren revisión' : 'Need review') : (l ? 'Todo limpio ✓' : 'All clean ✓'),
      color: insights.discrepancy > 0 ? 'text-destructive' : 'text-emerald-600',
      bg: insights.discrepancy > 0 ? 'bg-destructive/10' : 'bg-emerald-500/10',
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
                  <p className="text-[10px] text-muted-foreground truncate">{card.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
