import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssets, useLiabilities } from '@/hooks/data/useNetWorth';
import { ChevronLeft, Layers, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TreemapItem {
  name: string;
  value: number;
  color: string;
  textColor: string;
  category?: string;
  type?: 'asset' | 'liability';
  percent: number;
}

const ASSET_STYLES: Record<string, { bg: string; text: string }> = {
  cash: { bg: 'bg-emerald-600', text: 'text-white' },
  investments: { bg: 'bg-emerald-500', text: 'text-white' },
  real_estate: { bg: 'bg-teal-600', text: 'text-white' },
  crypto: { bg: 'bg-cyan-700', text: 'text-white' },
  business: { bg: 'bg-green-600', text: 'text-white' },
  retirement: { bg: 'bg-emerald-700', text: 'text-white' },
  other: { bg: 'bg-emerald-400', text: 'text-white' },
};

const LIABILITY_STYLES: Record<string, { bg: string; text: string }> = {
  mortgage: { bg: 'bg-red-700', text: 'text-white' },
  car_loan: { bg: 'bg-red-600', text: 'text-white' },
  student_loan: { bg: 'bg-rose-700', text: 'text-white' },
  credit_card: { bg: 'bg-orange-600', text: 'text-white' },
  personal_loan: { bg: 'bg-red-500', text: 'text-white' },
  business_loan: { bg: 'bg-rose-800', text: 'text-white' },
  other: { bg: 'bg-red-400', text: 'text-white' },
};

interface Rect {
  item: TreemapItem;
  x: number;
  y: number;
  w: number;
  h: number;
}

function squarify(items: TreemapItem[], containerWidth: number, containerHeight: number): Rect[] {
  if (items.length === 0) return [];
  const totalValue = items.reduce((s, i) => s + i.value, 0);
  if (totalValue === 0) return [];

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const rects: Rect[] = [];
  const totalArea = containerWidth * containerHeight;

  function worst(row: TreemapItem[], sideLen: number): number {
    const rowSum = row.reduce((s, r) => s + r.value, 0);
    let maxRatio = 0;
    for (const r of row) {
      const area = (r.value / totalValue) * totalArea;
      const rowArea = (rowSum / totalValue) * totalArea;
      const rowSide = rowArea / sideLen;
      const itemSide = area / rowSide;
      const ratio = Math.max(rowSide / Math.max(itemSide, 0.01), itemSide / Math.max(rowSide, 0.01));
      maxRatio = Math.max(maxRatio, ratio);
    }
    return maxRatio;
  }

  function layoutRow(row: TreemapItem[], x: number, y: number, w: number, h: number) {
    const rowSum = row.reduce((s, r) => s + r.value, 0);
    const rowArea = (rowSum / totalValue) * totalArea;
    const isHorizontal = w >= h;
    
    if (isHorizontal) {
      const rowWidth = rowArea / h;
      let offsetY = 0;
      for (const item of row) {
        const itemArea = (item.value / totalValue) * totalArea;
        const itemHeight = itemArea / rowWidth;
        rects.push({ item, x, y: y + offsetY, w: rowWidth, h: itemHeight });
        offsetY += itemHeight;
      }
      return { x: x + rowWidth, y, w: w - rowWidth, h };
    } else {
      const rowHeight = rowArea / w;
      let offsetX = 0;
      for (const item of row) {
        const itemArea = (item.value / totalValue) * totalArea;
        const itemWidth = itemArea / rowHeight;
        rects.push({ item, x: x + offsetX, y, w: itemWidth, h: rowHeight });
        offsetX += itemWidth;
      }
      return { x, y: y + rowHeight, w, h: h - rowHeight };
    }
  }

  function process(data: TreemapItem[], x: number, y: number, w: number, h: number) {
    if (data.length === 0) return;
    if (data.length === 1) {
      rects.push({ item: data[0], x, y, w, h });
      return;
    }

    const sideLen = Math.min(w, h);
    let row: TreemapItem[] = [data[0]];
    let remaining = data.slice(1);

    for (let i = 0; i < remaining.length; i++) {
      const newRow = [...row, remaining[i]];
      if (worst(newRow, sideLen) <= worst(row, sideLen)) {
        row = newRow;
      } else {
        break;
      }
    }

    remaining = data.slice(row.length);
    const bounds = layoutRow(row, x, y, w, h);
    process(remaining, bounds.x, bounds.y, bounds.w, bounds.h);
  }

  process(sorted, 0, 0, containerWidth, containerHeight);
  return rects;
}

function formatCompact(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function NetWorthTreemap() {
  const { language } = useLanguage();
  const { data: assets = [] } = useAssets();
  const { data: liabilities = [] } = useLiabilities();
  const [drilldownCategory, setDrilldownCategory] = useState<string | null>(null);
  const [drilldownType, setDrilldownType] = useState<'asset' | 'liability' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => ({
    title: language === 'es' ? 'Mapa de Patrimonio' : 'Net Worth Map',
    assets: language === 'es' ? 'Activos' : 'Assets',
    liabilities: language === 'es' ? 'Pasivos' : 'Liabilities',
    netWorth: language === 'es' ? 'Patrimonio Neto' : 'Net Worth',
    back: language === 'es' ? 'Volver' : 'Back',
    clickDrilldown: language === 'es' ? 'Toca una categoría para ver detalles' : 'Tap a category for details',
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
    const grandTotal = totalAssets + totalLiabilities;

    let data: TreemapItem[] = [];

    if (drilldownCategory && drilldownType) {
      const total = drilldownType === 'asset' ? totalAssets : totalLiabilities;
      if (drilldownType === 'asset' && assetsByCategory[drilldownCategory]) {
        const styles = ASSET_STYLES[drilldownCategory] || ASSET_STYLES.other;
        data = assetsByCategory[drilldownCategory].map(asset => ({
          name: asset.name,
          value: Number(asset.current_value || 0),
          color: styles.bg,
          textColor: styles.text,
          type: 'asset' as const,
          percent: total > 0 ? (Number(asset.current_value || 0) / total) * 100 : 0,
        }));
      } else if (drilldownType === 'liability' && liabilitiesByCategory[drilldownCategory]) {
        const styles = LIABILITY_STYLES[drilldownCategory] || LIABILITY_STYLES.other;
        data = liabilitiesByCategory[drilldownCategory].map(liability => ({
          name: liability.name,
          value: Number(liability.current_balance || 0),
          color: styles.bg,
          textColor: styles.text,
          type: 'liability' as const,
          percent: total > 0 ? (Number(liability.current_balance || 0) / total) * 100 : 0,
        }));
      }
    } else {
      const assetNodes: TreemapItem[] = Object.entries(assetsByCategory).map(([cat, catItems]) => {
        const styles = ASSET_STYLES[cat] || ASSET_STYLES.other;
        const val = catItems.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
        return {
          name: getCategoryLabel(cat),
          value: val,
          color: styles.bg,
          textColor: styles.text,
          category: cat,
          type: 'asset' as const,
          percent: grandTotal > 0 ? (val / grandTotal) * 100 : 0,
        };
      }).filter(n => n.value > 0);

      const liabilityNodes: TreemapItem[] = Object.entries(liabilitiesByCategory).map(([cat, catItems]) => {
        const styles = LIABILITY_STYLES[cat] || LIABILITY_STYLES.other;
        const val = catItems.reduce((sum, l) => sum + Number(l.current_balance || 0), 0);
        return {
          name: getCategoryLabel(cat),
          value: val,
          color: styles.bg,
          textColor: styles.text,
          category: cat,
          type: 'liability' as const,
          percent: grandTotal > 0 ? (val / grandTotal) * 100 : 0,
        };
      }).filter(n => n.value > 0);

      data = [...assetNodes, ...liabilityNodes];
    }

    return { items: data, totalAssets, totalLiabilities, netWorth };
  }, [assets, liabilities, drilldownCategory, drilldownType, t]);

  const handleClick = (item: TreemapItem) => {
    if (!drilldownCategory && item.category) {
      setDrilldownCategory(item.category);
      setDrilldownType(item.type || null);
    }
  };

  const handleBack = () => {
    setDrilldownCategory(null);
    setDrilldownType(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Compute layout
  const W = 500;
  const H = 280;
  const rects = useMemo(() => squarify(items, W, H), [items]);

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

        {/* Custom HTML Treemap */}
        {items.length > 0 ? (
          <TooltipProvider delayDuration={200}>
            <div 
              ref={containerRef}
              className="relative w-full rounded-lg overflow-hidden border border-border"
              style={{ aspectRatio: `${W}/${H}` }}
            >
              {rects.map((rect, i) => {
                const pctX = (rect.x / W) * 100;
                const pctY = (rect.y / H) * 100;
                const pctW = (rect.w / W) * 100;
                const pctH = (rect.h / H) * 100;
                const isSmall = pctW < 12 || pctH < 15;

                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleClick(rect.item)}
                        className={cn(
                          "absolute flex flex-col items-center justify-center p-1.5 transition-all duration-150",
                          "hover:brightness-110 hover:z-10 active:scale-[0.98]",
                          rect.item.color, rect.item.textColor,
                        )}
                        style={{
                          left: `${pctX}%`,
                          top: `${pctY}%`,
                          width: `${pctW}%`,
                          height: `${pctH}%`,
                          boxShadow: 'inset 0 0 0 1.5px hsl(var(--background))',
                        }}
                      >
                        {!isSmall && (
                          <>
                            <span className="text-[11px] font-bold leading-tight text-center truncate w-full px-1">
                              {rect.item.name}
                            </span>
                            <span className="text-[10px] font-semibold opacity-90 leading-tight">
                              {formatCompact(rect.item.value)}
                            </span>
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{rect.item.name}</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(rect.item.value)} ({rect.item.percent.toFixed(1)}%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {!drilldownCategory && (
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                {t.clickDrilldown}
              </p>
            )}
          </TooltipProvider>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            {t.noData}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">{t.assets}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-600" />
            <span className="text-xs text-muted-foreground">{t.liabilities}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}