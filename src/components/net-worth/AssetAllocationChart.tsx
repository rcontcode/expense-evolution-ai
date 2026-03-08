import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { es: string; en: string; color: string }> = {
  real_estate: { es: 'Inmuebles', en: 'Real Estate', color: 'hsl(var(--primary))' },
  cash: { es: 'Efectivo', en: 'Cash', color: 'hsl(var(--chart-1))' },
  stocks: { es: 'Acciones', en: 'Stocks', color: 'hsl(var(--chart-2))' },
  crypto: { es: 'Crypto', en: 'Crypto', color: 'hsl(var(--chart-3))' },
  bonds: { es: 'Bonos', en: 'Bonds', color: 'hsl(var(--chart-4))' },
  vehicle: { es: 'Vehículos', en: 'Vehicles', color: 'hsl(var(--chart-5))' },
  savings: { es: 'Ahorros', en: 'Savings', color: 'hsl(142 76% 36%)' },
  retirement: { es: 'Retiro', en: 'Retirement', color: 'hsl(280 67% 55%)' },
  other: { es: 'Otros', en: 'Other', color: 'hsl(var(--muted-foreground))' },
};

interface Props {
  assets: { category: string; current_value: number; name: string; is_liquid?: boolean | null }[];
}

export function AssetAllocationChart({ assets }: Props) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();

  const data = useMemo(() => {
    const catMap: Record<string, number> = {};
    assets.forEach(a => {
      const cat = a.category.toLowerCase();
      const key = Object.keys(CATEGORY_CONFIG).find(k => cat.includes(k)) || 'other';
      catMap[key] = (catMap[key] || 0) + a.current_value;
    });

    const total = Object.values(catMap).reduce((s, v) => s + v, 0);
    return Object.entries(catMap)
      .map(([key, value]) => ({
        name: l ? CATEGORY_CONFIG[key]?.es || key : CATEGORY_CONFIG[key]?.en || key,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: CATEGORY_CONFIG[key]?.color || 'hsl(var(--muted))',
        key,
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets, l]);

  const liquidTotal = assets.filter(a => a.is_liquid).reduce((s, a) => s + a.current_value, 0);
  const illiquidTotal = assets.filter(a => !a.is_liquid).reduce((s, a) => s + a.current_value, 0);
  const total = liquidTotal + illiquidTotal;
  const liquidPct = total > 0 ? (liquidTotal / total) * 100 : 0;

  if (data.length === 0) return null;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-chart-2/3" />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/20">
            <PieChartIcon className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-base">
            {l ? '📊 Distribución de Activos' : '📊 Asset Allocation'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => fc(value)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5">
            {data.slice(0, 6).map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate flex-1">{item.name}</span>
                <span className="font-medium tabular-nums">{item.pct.toFixed(0)}%</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Liquidity bar */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{l ? 'Líquido' : 'Liquid'}: {fc(liquidTotal)}</span>
            <span>{l ? 'Ilíquido' : 'Illiquid'}: {fc(illiquidTotal)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${liquidPct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-emerald-500 rounded-l-full"
            />
            <div className="h-full flex-1 bg-amber-500/60 rounded-r-full" />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {liquidPct.toFixed(0)}% {l ? 'líquido' : 'liquid'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
