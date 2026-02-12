import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssets, useLiabilities } from '@/hooks/data/useNetWorth';
import { ChevronLeft, ChevronRight, Layers, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BarItem {
  name: string;
  value: number;
  percent: number;
  color: string;
  bgColor: string;
  category?: string;
  type?: 'asset' | 'liability';
}

const ASSET_COLORS: Record<string, { bar: string; bg: string }> = {
  cash: { bar: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
  investments: { bar: 'bg-teal-500', bg: 'bg-teal-500/10' },
  real_estate: { bar: 'bg-cyan-600', bg: 'bg-cyan-600/10' },
  crypto: { bar: 'bg-sky-500', bg: 'bg-sky-500/10' },
  business: { bar: 'bg-green-600', bg: 'bg-green-600/10' },
  retirement: { bar: 'bg-emerald-700', bg: 'bg-emerald-700/10' },
  other: { bar: 'bg-emerald-400', bg: 'bg-emerald-400/10' },
};

const LIABILITY_COLORS: Record<string, { bar: string; bg: string }> = {
  mortgage: { bar: 'bg-red-600', bg: 'bg-red-600/10' },
  car_loan: { bar: 'bg-rose-500', bg: 'bg-rose-500/10' },
  student_loan: { bar: 'bg-orange-500', bg: 'bg-orange-500/10' },
  credit_card: { bar: 'bg-amber-600', bg: 'bg-amber-600/10' },
  personal_loan: { bar: 'bg-red-500', bg: 'bg-red-500/10' },
  business_loan: { bar: 'bg-rose-700', bg: 'bg-rose-700/10' },
  other: { bar: 'bg-red-400', bg: 'bg-red-400/10' },
};

function formatCompact(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

export function NetWorthTreemap() {
  const { language } = useLanguage();
  const { data: assets = [] } = useAssets();
  const { data: liabilities = [] } = useLiabilities();
  const [drilldownCategory, setDrilldownCategory] = useState<string | null>(null);
  const [drilldownType, setDrilldownType] = useState<'asset' | 'liability' | null>(null);

  const t = useMemo(() => ({
    title: language === 'es' ? 'Mapa de Patrimonio' : 'Net Worth Map',
    assets: language === 'es' ? 'Activos' : 'Assets',
    liabilities: language === 'es' ? 'Pasivos' : 'Liabilities',
    netWorth: language === 'es' ? 'Patrimonio Neto' : 'Net Worth',
    back: language === 'es' ? 'Volver' : 'Back',
    tapHint: language === 'es' ? 'Toca una categoría para ver detalles' : 'Tap a category for details',
    noData: language === 'es' ? 'No hay datos de patrimonio' : 'No net worth data',
    addData: language === 'es' ? 'Agrega activos y pasivos en la página de Patrimonio' : 'Add assets and liabilities in the Net Worth page',
    categories: {
      cash: language === 'es' ? 'Efectivo' : 'Cash',
      investments: language === 'es' ? 'Inversiones' : 'Investments',
      real_estate: language === 'es' ? 'Bienes Raíces' : 'Real Estate',
      crypto: language === 'es' ? 'Criptomonedas' : 'Crypto',
      business: language === 'es' ? 'Negocios' : 'Business',
      retirement: language === 'es' ? 'Jubilación' : 'Retirement',
      mortgage: language === 'es' ? 'Hipoteca' : 'Mortgage',
      car_loan: language === 'es' ? 'Préstamo Auto' : 'Car Loan',
      student_loan: language === 'es' ? 'Préstamo Estudiantil' : 'Student Loan',
      credit_card: language === 'es' ? 'Tarjeta Crédito' : 'Credit Card',
      personal_loan: language === 'es' ? 'Préstamo Personal' : 'Personal Loan',
      business_loan: language === 'es' ? 'Préstamo Negocio' : 'Business Loan',
      other: language === 'es' ? 'Otros' : 'Other',
    }
  }), [language]);

  const getCategoryLabel = (category: string): string => {
    return t.categories[category as keyof typeof t.categories] || category;
  };

  const { formatCompact: formatCurrency } = useFormatCurrency();

  const { items, totalAssets, totalLiabilities, netWorth } = useMemo(() => {
    const assetsByCategory = assets.reduce((acc, asset) => {
      const cat = asset.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(asset);
      return acc;
    }, {} as Record<string, typeof assets>);

    const liabilitiesByCategory = liabilities.reduce((acc, liability) => {
      const cat = liability.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(liability);
      return acc;
    }, {} as Record<string, typeof liabilities>);

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.current_balance || 0), 0);
    const netWorth = totalAssets - totalLiabilities;

    let data: BarItem[] = [];

    if (drilldownCategory && drilldownType) {
      const total = drilldownType === 'asset' ? totalAssets : totalLiabilities;
      if (drilldownType === 'asset' && assetsByCategory[drilldownCategory]) {
        const colors = ASSET_COLORS[drilldownCategory] || ASSET_COLORS.other;
        data = assetsByCategory[drilldownCategory].map(asset => ({
          name: asset.name,
          value: Number(asset.current_value || 0),
          color: colors.bar,
          bgColor: colors.bg,
          type: 'asset' as const,
          percent: total > 0 ? (Number(asset.current_value || 0) / total) * 100 : 0,
        }));
      } else if (drilldownType === 'liability' && liabilitiesByCategory[drilldownCategory]) {
        const colors = LIABILITY_COLORS[drilldownCategory] || LIABILITY_COLORS.other;
        data = liabilitiesByCategory[drilldownCategory].map(liability => ({
          name: liability.name,
          value: Number(liability.current_balance || 0),
          color: colors.bar,
          bgColor: colors.bg,
          type: 'liability' as const,
          percent: total > 0 ? (Number(liability.current_balance || 0) / total) * 100 : 0,
        }));
      }
    } else {
      const grandTotal = totalAssets + totalLiabilities;

      const assetNodes: BarItem[] = Object.entries(assetsByCategory).map(([cat, catItems]) => {
        const colors = ASSET_COLORS[cat] || ASSET_COLORS.other;
        const val = catItems.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
        return {
          name: getCategoryLabel(cat),
          value: val,
          color: colors.bar,
          bgColor: colors.bg,
          category: cat,
          type: 'asset' as const,
          percent: grandTotal > 0 ? (val / grandTotal) * 100 : 0,
        };
      }).filter(n => n.value > 0);

      const liabilityNodes: BarItem[] = Object.entries(liabilitiesByCategory).map(([cat, catItems]) => {
        const colors = LIABILITY_COLORS[cat] || LIABILITY_COLORS.other;
        const val = catItems.reduce((sum, l) => sum + Number(l.current_balance || 0), 0);
        return {
          name: getCategoryLabel(cat),
          value: val,
          color: colors.bar,
          bgColor: colors.bg,
          category: cat,
          type: 'liability' as const,
          percent: grandTotal > 0 ? (val / grandTotal) * 100 : 0,
        };
      }).filter(n => n.value > 0);

      data = [...assetNodes, ...liabilityNodes];
    }

    data.sort((a, b) => b.value - a.value);
    return { items: data, totalAssets, totalLiabilities, netWorth };
  }, [assets, liabilities, drilldownCategory, drilldownType, t]);

  const handleClick = (item: BarItem) => {
    if (!drilldownCategory && item.category) {
      setDrilldownCategory(item.category);
      setDrilldownType(item.type || null);
    }
  };

  const handleBack = () => {
    setDrilldownCategory(null);
    setDrilldownType(null);
  };

  const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 1;

  // Stacked bar data
  const stackedAssetPercent = (totalAssets + totalLiabilities) > 0
    ? (totalAssets / (totalAssets + totalLiabilities)) * 100
    : 50;

  if (assets.length === 0 && liabilities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noData}</p>
            <p className="text-sm">{t.addData}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5" />
            {t.title}
            {drilldownCategory && (
              <Badge variant="secondary" className="ml-1">
                {getCategoryLabel(drilldownCategory)}
              </Badge>
            )}
          </CardTitle>
          {drilldownCategory && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.back}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-[10px] text-muted-foreground">{t.assets}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <TrendingDown className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-[10px] text-muted-foreground">{t.liabilities}</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totalLiabilities)}</p>
          </div>
          <div className={cn(
            "text-center p-2.5 rounded-lg border",
            netWorth >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'
          )}>
            <Wallet className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-[10px] text-muted-foreground">{t.netWorth}</p>
            <p className={cn("text-sm font-bold", netWorth >= 0 ? 'text-primary' : 'text-destructive')}>
              {formatCurrency(netWorth)}
            </p>
          </div>
        </div>

        {/* Stacked Overview Bar */}
        {!drilldownCategory && (totalAssets > 0 || totalLiabilities > 0) && (
          <div className="mb-4">
            <div className="flex h-3 rounded-full overflow-hidden border border-border">
              {totalAssets > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stackedAssetPercent}%` }}
                />
              )}
              {totalLiabilities > 0 && (
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${100 - stackedAssetPercent}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {t.assets} {stackedAssetPercent.toFixed(0)}%
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                {t.liabilities} {(100 - stackedAssetPercent).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Bar List */}
        {items.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={drilldownCategory || 'root'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {items.map((item, i) => {
                const barWidth = Math.max((item.value / maxValue) * 100, 4);
                const canDrill = !drilldownCategory && item.category;

                return (
                  <motion.button
                    key={item.name + i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleClick(item)}
                    disabled={!canDrill}
                    className={cn(
                      "w-full text-left rounded-lg p-2.5 transition-all duration-150 group border",
                      "border-border/50 hover:border-border",
                      canDrill && "cursor-pointer hover:bg-accent/50 active:scale-[0.99]",
                      !canDrill && "cursor-default",
                    )}
                  >
                    {/* Top row: name + value */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", item.color)} />
                        <span className="text-sm font-semibold truncate text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-bold text-foreground">
                          {formatCompact(item.value)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 font-semibold",
                            item.type === 'asset'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/15 text-red-700 dark:text-red-400'
                          )}
                        >
                          {item.percent.toFixed(1)}%
                        </Badge>
                        {canDrill && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", item.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            {t.noData}
          </div>
        )}

        {/* Hint */}
        {!drilldownCategory && items.length > 0 && (
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            {t.tapHint}
          </p>
        )}

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">{t.assets}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">{t.liabilities}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
