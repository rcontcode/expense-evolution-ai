import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useExpenses } from '@/hooks/data/useExpenses';
import { motion, AnimatePresence } from 'framer-motion';
import { parseISO, differenceInDays, startOfMonth, subMonths } from 'date-fns';
import { Store, TrendingUp, TrendingDown, Repeat, ChevronDown, ChevronUp, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorProfile {
  name: string;
  totalSpend: number;
  txCount: number;
  avgAmount: number;
  firstSeen: Date;
  lastSeen: Date;
  frequency: string; // weekly, monthly, quarterly, sporadic
  trend: number; // % change last 3 months vs prior 3
  categories: string[];
  loyaltyMonths: number;
  savingPotential: number; // estimated negotiation savings
}

function classifyFrequency(avgDaysBetween: number, l: boolean): string {
  if (avgDaysBetween <= 10) return l ? 'Semanal' : 'Weekly';
  if (avgDaysBetween <= 35) return l ? 'Mensual' : 'Monthly';
  if (avgDaysBetween <= 100) return l ? 'Trimestral' : 'Quarterly';
  return l ? 'Esporádico' : 'Sporadic';
}

export function VendorIntelligenceAnalyzer() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: expenses } = useExpenses();
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const vendors = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const now = new Date();
    const vendorMap: Record<string, { amounts: number[]; dates: Date[]; categories: Set<string> }> = {};

    expenses.forEach((e: any) => {
      if (e.deleted_at || !e.vendor) return;
      const vendor = e.vendor.trim();
      if (!vendorMap[vendor]) vendorMap[vendor] = { amounts: [], dates: [], categories: new Set() };
      vendorMap[vendor].amounts.push(Math.abs(Number(e.amount)));
      vendorMap[vendor].dates.push(parseISO(e.date));
      if (e.category) vendorMap[vendor].categories.add(e.category);
    });

    const threeMonthsAgo = subMonths(now, 3);
    const sixMonthsAgo = subMonths(now, 6);

    const profiles: VendorProfile[] = Object.entries(vendorMap)
      .filter(([_, data]) => data.amounts.length >= 2)
      .map(([name, data]) => {
        const sorted = data.dates.sort((a, b) => a.getTime() - b.getTime());
        const totalSpend = data.amounts.reduce((s, a) => s + a, 0);
        const avgAmount = totalSpend / data.amounts.length;

        // Frequency
        let avgDaysBetween = 365;
        if (sorted.length >= 2) {
          const gaps = sorted.slice(1).map((d, i) => differenceInDays(d, sorted[i]));
          avgDaysBetween = gaps.reduce((s, g) => s + g, 0) / gaps.length;
        }

        // Trend: last 3 months vs prior 3
        const recentSpend = data.amounts.filter((_, i) => data.dates[i] >= threeMonthsAgo).reduce((s, a) => s + a, 0);
        const priorSpend = data.amounts.filter((_, i) => data.dates[i] >= sixMonthsAgo && data.dates[i] < threeMonthsAgo).reduce((s, a) => s + a, 0);
        const trend = priorSpend > 0 ? ((recentSpend - priorSpend) / priorSpend) * 100 : 0;

        // Loyalty months
        const loyaltyMonths = sorted.length >= 2
          ? Math.round(differenceInDays(sorted[sorted.length - 1], sorted[0]) / 30)
          : 0;

        // Saving potential (5-15% for frequent, high-spend vendors)
        const savingRate = avgDaysBetween <= 35 && totalSpend > 500 ? 0.12 : avgDaysBetween <= 35 ? 0.08 : 0.05;
        const savingPotential = totalSpend * savingRate;

        return {
          name,
          totalSpend,
          txCount: data.amounts.length,
          avgAmount,
          firstSeen: sorted[0],
          lastSeen: sorted[sorted.length - 1],
          frequency: classifyFrequency(avgDaysBetween, l),
          trend,
          categories: Array.from(data.categories),
          loyaltyMonths,
          savingPotential,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend);

    return profiles;
  }, [expenses, l]);

  if (vendors.length === 0) return null;

  const topSavings = vendors.reduce((s, v) => s + v.savingPotential, 0);
  const displayVendors = showAll ? vendors : vendors.slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" />
            {l ? 'Inteligencia de Proveedores' : 'Vendor Intelligence'}
          </CardTitle>
          <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
            <Zap className="h-3 w-3 mr-1" />
            {l ? 'Ahorro potencial:' : 'Savings potential:'} {fc(topSavings)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {displayVendors.map((vendor, i) => {
          const isExpanded = expandedVendor === vendor.name;
          const spendPct = (vendor.totalSpend / (vendors[0]?.totalSpend || 1)) * 100;

          return (
            <motion.div
              key={vendor.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                onClick={() => setExpandedVendor(isExpanded ? null : vendor.name)}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground font-mono w-5">#{i + 1}</span>
                    <span className="text-sm font-medium truncate">{vendor.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{vendor.frequency}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold">{fc(vendor.totalSpend)}</span>
                    {vendor.trend !== 0 && (
                      <div className={cn("flex items-center text-[10px]", vendor.trend > 0 ? 'text-destructive' : 'text-emerald-600')}>
                        {vendor.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(vendor.trend).toFixed(0)}%
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </div>

                <Progress value={spendPct} className="h-1" />

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t text-xs">
                        <div>
                          <p className="text-muted-foreground">{l ? 'Transacciones' : 'Transactions'}</p>
                          <p className="font-semibold">{vendor.txCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{l ? 'Promedio' : 'Average'}</p>
                          <p className="font-semibold">{fc(vendor.avgAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{l ? 'Lealtad' : 'Loyalty'}</p>
                          <p className="font-semibold">{vendor.loyaltyMonths} {l ? 'meses' : 'months'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{l ? 'Ahorro estimado' : 'Est. savings'}</p>
                          <p className="font-semibold text-emerald-600">{fc(vendor.savingPotential)}</p>
                        </div>
                        {vendor.categories.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground mb-1">{l ? 'Categorías' : 'Categories'}</p>
                            <div className="flex flex-wrap gap-1">
                              {vendor.categories.map(c => (
                                <Badge key={c} variant="secondary" className="text-[9px] capitalize">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {vendor.trend > 15 && (
                          <div className="col-span-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                            <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                              💡 {l
                                ? `Gasto aumentó ${vendor.trend.toFixed(0)}% en 3 meses. Considera negociar o buscar alternativas.`
                                : `Spending up ${vendor.trend.toFixed(0)}% in 3 months. Consider negotiating or finding alternatives.`}
                            </p>
                          </div>
                        )}
                        {vendor.loyaltyMonths >= 6 && (
                          <div className="col-span-2 p-2 rounded bg-primary/5 border border-primary/20">
                            <p className="text-primary text-[11px]">
                              🤝 {l
                                ? `${vendor.loyaltyMonths} meses de lealtad. Tienes poder de negociación para pedir descuento.`
                                : `${vendor.loyaltyMonths} months of loyalty. You have leverage to negotiate a discount.`}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          );
        })}

        {vendors.length > 8 && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll(!showAll)}>
            {showAll ? (l ? 'Ver menos' : 'Show less') : `${l ? 'Ver todos' : 'Show all'} (${vendors.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
