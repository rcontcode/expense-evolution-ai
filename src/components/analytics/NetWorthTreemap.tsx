import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useAssets, useLiabilities, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '@/hooks/data/useNetWorth';
import { ChevronLeft, Layers, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TreemapNode {
  name: string;
  value: number;
  color: string;
  children?: TreemapNode[];
  category?: string;
  type?: 'asset' | 'liability';
}

const ASSET_COLORS: Record<string, string> = {
  cash: 'hsl(142, 76%, 36%)',
  investments: 'hsl(142, 76%, 46%)',
  real_estate: 'hsl(142, 76%, 56%)',
  crypto: 'hsl(142, 76%, 40%)',
  business: 'hsl(142, 76%, 50%)',
  retirement: 'hsl(142, 76%, 45%)',
  other: 'hsl(142, 76%, 60%)',
};

const LIABILITY_COLORS: Record<string, string> = {
  mortgage: 'hsl(0, 84%, 40%)',
  car_loan: 'hsl(0, 84%, 50%)',
  student_loan: 'hsl(0, 84%, 45%)',
  credit_card: 'hsl(0, 84%, 55%)',
  personal_loan: 'hsl(0, 84%, 48%)',
  business_loan: 'hsl(0, 84%, 42%)',
  other: 'hsl(0, 84%, 60%)',
};

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, color, depth } = props;
  
  if (width < 30 || height < 30) return null;
  
  const formatValue = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        rx={4}
        style={{ 
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        className="hover:opacity-80"
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(14, width / 8)}
            fontWeight="600"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {name?.length > 15 ? name.substring(0, 12) + '...' : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(12, width / 10)}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {formatValue(value)}
          </text>
        </>
      )}
    </g>
  );
};

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
    total: language === 'es' ? 'Total' : 'Total',
    netWorth: language === 'es' ? 'Patrimonio Neto' : 'Net Worth',
    back: language === 'es' ? 'Volver' : 'Back',
    clickDrilldown: language === 'es' ? 'Haz clic en una categoría para ver detalles' : 'Click a category to see details',
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

  const { treemapData, totalAssets, totalLiabilities, netWorth } = useMemo(() => {
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

    let data: TreemapNode[] = [];

    if (drilldownCategory && drilldownType) {
      if (drilldownType === 'asset' && assetsByCategory[drilldownCategory]) {
        data = assetsByCategory[drilldownCategory].map(asset => ({
          name: asset.name,
          value: Number(asset.current_value || 0),
          color: ASSET_COLORS[drilldownCategory] || ASSET_COLORS.other,
          type: 'asset' as const,
        }));
      } else if (drilldownType === 'liability' && liabilitiesByCategory[drilldownCategory]) {
        data = liabilitiesByCategory[drilldownCategory].map(liability => ({
          name: liability.name,
          value: Number(liability.current_balance || 0),
          color: LIABILITY_COLORS[drilldownCategory] || LIABILITY_COLORS.other,
          type: 'liability' as const,
        }));
      }
    } else {
      const assetNodes: TreemapNode[] = Object.entries(assetsByCategory).map(([cat, items]) => ({
        name: getCategoryLabel(cat),
        value: items.reduce((sum, a) => sum + Number(a.current_value || 0), 0),
        color: ASSET_COLORS[cat] || ASSET_COLORS.other,
        category: cat,
        type: 'asset' as const,
      })).filter(n => n.value > 0);

      const liabilityNodes: TreemapNode[] = Object.entries(liabilitiesByCategory).map(([cat, items]) => ({
        name: getCategoryLabel(cat),
        value: items.reduce((sum, l) => sum + Number(l.current_balance || 0), 0),
        color: LIABILITY_COLORS[cat] || LIABILITY_COLORS.other,
        category: cat,
        type: 'liability' as const,
      })).filter(n => n.value > 0);

      data = [...assetNodes, ...liabilityNodes];
    }

    return { treemapData: data, totalAssets, totalLiabilities, netWorth };
  }, [assets, liabilities, drilldownCategory, drilldownType, t]);

  const handleClick = (data: any) => {
    if (!drilldownCategory && data?.category) {
      setDrilldownCategory(data.category);
      setDrilldownType(data.type);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / (drilldownType === 'liability' ? totalLiabilities : totalAssets)) * 100).toFixed(1);
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t.title}
            {drilldownCategory && (
              <Badge variant="secondary" className="ml-2">
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
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xs text-muted-foreground">{t.assets}</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">{t.liabilities}</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${netWorth >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'} border`}>
            <Wallet className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">{t.netWorth}</p>
            <p className={`text-lg font-bold ${netWorth >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(netWorth)}
            </p>
          </div>
        </div>

        {/* Treemap */}
        {treemapData.length > 0 ? (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  aspectRatio={4 / 3}
                  stroke="hsl(var(--background))"
                  content={<CustomTreemapContent />}
                  onClick={handleClick}
                >
                  <Tooltip content={<CustomTooltip />} />
                </Treemap>
              </ResponsiveContainer>
            </div>
            {!drilldownCategory && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                {t.clickDrilldown}
              </p>
            )}
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t.noData}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-muted-foreground">{t.assets}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-muted-foreground">{t.liabilities}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
