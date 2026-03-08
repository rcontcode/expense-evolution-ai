import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { ExpenseWithRelations } from '@/types/expense.types';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Layers, AlertCircle, Receipt, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_EMOJI: Record<string, string> = {
  meals: '🍽️', travel: '✈️', equipment: '🔧', software: '💻', mileage: '🚗',
  home_office: '🏠', professional_services: '👔', office_supplies: '📎',
  utilities: '⚡', fuel: '⛽', other: '📦',
};

interface Props {
  expenses: ExpenseWithRelations[];
}

export function ExpenseInsightsSummary({ expenses }: Props) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc, formatCompact } = useFormatCurrency();

  const insights = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthExpenses = expenses.filter(e => {
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd && !e.deleted_at;
    });

    const monthTotal = monthExpenses.reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
    const avgExpense = monthExpenses.length > 0 ? monthTotal / monthExpenses.length : 0;

    // Top category
    const catMap: Record<string, number> = {};
    monthExpenses.forEach(e => {
      const cat = e.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(e.amount));
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    // Issues
    const uncategorized = expenses.filter(e => !e.category && !e.deleted_at).length;
    const noReceipt = expenses.filter(e => !e.document_id && !e.deleted_at).length;

    // Previous month comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = endOfMonth(prevMonthStart);
    const prevMonthTotal = expenses
      .filter(e => {
        const d = parseISO(e.date);
        return d >= prevMonthStart && d <= prevMonthEnd && !e.deleted_at;
      })
      .reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
    const monthChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

    return {
      monthTotal,
      monthCount: monthExpenses.length,
      avgExpense,
      topCategory: topCat ? { name: topCat[0], total: topCat[1] } : null,
      uncategorized,
      noReceipt,
      monthChange,
    };
  }, [expenses]);

  if (!insights) return null;

  const cards = [
    {
      icon: DollarSign,
      label: l ? 'Este mes' : 'This month',
      value: fc(insights.monthTotal),
      sub: `${insights.monthCount} ${l ? 'gastos' : 'expenses'}`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: TrendingUp,
      label: l ? 'vs mes anterior' : 'vs last month',
      value: `${insights.monthChange > 0 ? '+' : ''}${insights.monthChange.toFixed(0)}%`,
      sub: l ? 'Tendencia mensual' : 'Monthly trend',
      color: insights.monthChange > 10 ? 'text-destructive' : insights.monthChange < -5 ? 'text-emerald-600' : 'text-muted-foreground',
      bg: insights.monthChange > 10 ? 'bg-destructive/10' : insights.monthChange < -5 ? 'bg-emerald-500/10' : 'bg-muted/50',
    },
    {
      icon: Layers,
      label: l ? 'Top categoría' : 'Top category',
      value: insights.topCategory ? `${CATEGORY_EMOJI[insights.topCategory.name] || '📦'} ${formatCompact(insights.topCategory.total)}` : '—',
      sub: insights.topCategory?.name || '',
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      icon: insights.uncategorized > 0 ? AlertCircle : Receipt,
      label: l ? 'Atención' : 'Attention',
      value: `${insights.uncategorized + insights.noReceipt}`,
      sub: l
        ? `${insights.uncategorized} sin categoría · ${insights.noReceipt} sin recibo`
        : `${insights.uncategorized} uncategorized · ${insights.noReceipt} no receipt`,
      color: (insights.uncategorized + insights.noReceipt) > 0 ? 'text-amber-600' : 'text-emerald-600',
      bg: (insights.uncategorized + insights.noReceipt) > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
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
