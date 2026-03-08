import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useExpenses } from '@/hooks/data/useExpenses';
import { motion } from 'framer-motion';
import { parseISO, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Store, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

interface MerchantProfile {
  name: string;
  normalizedName: string;
  totalSpent: number;
  transactionCount: number;
  avgAmount: number;
  lastDate: string;
  firstDate: string;
  frequency: string; // 'weekly' | 'biweekly' | 'monthly' | 'irregular'
  trend: 'increasing' | 'decreasing' | 'stable';
  recentAvg: number;
  olderAvg: number;
}

export function MerchantIntelligence() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();
  const [showAll, setShowAll] = useState(false);

  const merchants = useMemo<MerchantProfile[]>(() => {
    const items: { date: string; amount: number; vendor: string }[] = [];
    const matchedIds = new Set(transactions?.filter(t => t.matched_expense_id).map(t => t.matched_expense_id) || []);

    (expenses || []).forEach(e => {
      if (!e.deleted_at && (e.vendor || e.description)) {
        items.push({ date: e.date, amount: Math.abs(Number(e.amount)), vendor: e.vendor || e.description || '' });
      }
    });
    (transactions || []).forEach(t => {
      if (!t.matched_expense_id && t.description) {
        items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)), vendor: t.description });
      }
    });

    if (items.length === 0) return [];

    // Group by normalized vendor name
    const groups: Record<string, { amounts: number[]; dates: string[]; name: string }> = {};
    items.forEach(i => {
      const normalized = i.vendor.toLowerCase().trim().replace(/[#\d]+$/g, '').trim();
      if (!normalized || normalized.length < 2) return;
      if (!groups[normalized]) groups[normalized] = { amounts: [], dates: [], name: i.vendor };
      groups[normalized].amounts.push(i.amount);
      groups[normalized].dates.push(i.date);
    });

    return Object.entries(groups)
      .filter(([, g]) => g.amounts.length >= 2)
      .map(([key, g]) => {
        const sortedDates = [...g.dates].sort();
        const total = g.amounts.reduce((s, a) => s + a, 0);
        const avg = total / g.amounts.length;

        // Frequency detection
        const intervals: number[] = [];
        for (let i = 1; i < sortedDates.length; i++) {
          intervals.push(differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1])));
        }
        const avgInterval = intervals.length > 0 ? intervals.reduce((s, a) => s + a, 0) / intervals.length : 0;
        let frequency: MerchantProfile['frequency'] = 'irregular';
        if (avgInterval >= 5 && avgInterval <= 10) frequency = 'weekly';
        else if (avgInterval >= 12 && avgInterval <= 18) frequency = 'biweekly';
        else if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';

        // Trend: compare recent half vs older half
        const mid = Math.floor(g.amounts.length / 2);
        const olderHalf = g.amounts.slice(0, mid);
        const recentHalf = g.amounts.slice(mid);
        const olderAvg = olderHalf.reduce((s, a) => s + a, 0) / (olderHalf.length || 1);
        const recentAvg = recentHalf.reduce((s, a) => s + a, 0) / (recentHalf.length || 1);
        const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
        const trend: MerchantProfile['trend'] = changePercent > 15 ? 'increasing' : changePercent < -15 ? 'decreasing' : 'stable';

        return {
          name: g.name,
          normalizedName: key,
          totalSpent: total,
          transactionCount: g.amounts.length,
          avgAmount: avg,
          lastDate: sortedDates[sortedDates.length - 1],
          firstDate: sortedDates[0],
          frequency,
          trend,
          recentAvg,
          olderAvg,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions, expenses]);

  if (merchants.length === 0) return null;

  const visible = showAll ? merchants : merchants.slice(0, 8);
  const totalMerchantSpend = merchants.reduce((s, m) => s + m.totalSpent, 0);

  const freqLabels: Record<string, { es: string; en: string }> = {
    weekly: { es: 'Semanal', en: 'Weekly' },
    biweekly: { es: 'Quincenal', en: 'Biweekly' },
    monthly: { es: 'Mensual', en: 'Monthly' },
    irregular: { es: 'Irregular', en: 'Irregular' },
  };

  const trendIcons = {
    increasing: <TrendingUp className="h-3 w-3 text-destructive" />,
    decreasing: <TrendingDown className="h-3 w-3 text-emerald-500" />,
    stable: null,
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-3/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-chart-1 to-chart-3 shadow-lg shadow-chart-1/25">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                {l ? '🏪 Inteligencia de Comercios' : '🏪 Merchant Intelligence'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {merchants.length} {l ? 'comercios frecuentes detectados' : 'frequent merchants detected'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {fc(totalMerchantSpend)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 relative">
        <ScrollArea className={showAll ? "max-h-[500px]" : ""}>
          <div className="space-y-2">
            {visible.map((m, i) => {
              const pct = totalMerchantSpend > 0 ? (m.totalSpent / totalMerchantSpend) * 100 : 0;
              return (
                <motion.div
                  key={m.normalizedName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate capitalize">{m.normalizedName}</p>
                      {trendIcons[m.trend]}
                      {m.frequency !== 'irregular' && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {l ? freqLabels[m.frequency].es : freqLabels[m.frequency].en}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>{m.transactionCount}x</span>
                      <span>~{fc(m.avgAmount)}/{l ? 'vez' : 'each'}</span>
                      <span>{format(parseISO(m.lastDate), 'dd MMM', { locale: l ? es : undefined })}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{fc(m.totalSpent)}</p>
                    <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {merchants.length > 8 && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAll(!showAll)}>
            {showAll ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {showAll
              ? (l ? 'Ver menos' : 'Show less')
              : (l ? `Ver ${merchants.length - 8} más` : `Show ${merchants.length - 8} more`)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
