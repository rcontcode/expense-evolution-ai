import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAssets } from '@/hooks/data/useNetWorth';

import { ShieldCheck, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp, PieChart } from 'lucide-react';

interface AssetAllocation {
  category: string;
  label: { es: string; en: string };
  amount: number;
  percentage: number;
  riskWeight: number;
  color: string;
}

interface RiskProfile {
  score: number; // 0-100
  grade: string;
  label: { es: string; en: string };
  color: string;
  allocations: AssetAllocation[];
  diversificationScore: number;
  liquidityRatio: number;
  recommendations: { es: string; en: string }[];
}

const CATEGORY_CONFIG: Record<string, { label: { es: string; en: string }; riskWeight: number; color: string }> = {
  cash: { label: { es: 'Efectivo', en: 'Cash' }, riskWeight: 0.05, color: 'bg-emerald-500' },
  savings: { label: { es: 'Ahorros', en: 'Savings' }, riskWeight: 0.1, color: 'bg-green-500' },
  bonds: { label: { es: 'Bonos', en: 'Bonds' }, riskWeight: 0.25, color: 'bg-blue-500' },
  real_estate: { label: { es: 'Inmuebles', en: 'Real Estate' }, riskWeight: 0.4, color: 'bg-amber-500' },
  stocks: { label: { es: 'Acciones', en: 'Stocks' }, riskWeight: 0.7, color: 'bg-violet-500' },
  crypto: { label: { es: 'Cripto', en: 'Crypto' }, riskWeight: 0.95, color: 'bg-orange-500' },
  business: { label: { es: 'Negocio', en: 'Business' }, riskWeight: 0.6, color: 'bg-indigo-500' },
  vehicle: { label: { es: 'Vehículo', en: 'Vehicle' }, riskWeight: 0.3, color: 'bg-slate-500' },
  other: { label: { es: 'Otro', en: 'Other' }, riskWeight: 0.5, color: 'bg-gray-500' },
};

export function InvestmentRiskProfiler() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { data: assets } = useAssets();
  const { data: income } = useIncome();
  const [expanded, setExpanded] = useState(false);

  const profile = useMemo<RiskProfile>(() => {
    const allAssets = assets || [];
    const totalValue = allAssets.reduce((s, a) => s + Number(a.current_value), 0);

    // Group by category
    const categoryMap = new Map<string, number>();
    allAssets.forEach(a => {
      const cat = a.category || 'other';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(a.current_value));
    });

    const allocations: AssetAllocation[] = Array.from(categoryMap.entries())
      .map(([cat, amount]) => {
        const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        return {
          category: cat,
          label: config.label,
          amount,
          percentage: totalValue > 0 ? (amount / totalValue) * 100 : 0,
          riskWeight: config.riskWeight,
          color: config.color,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Weighted risk score (0=safest, 100=riskiest)
    const weightedRisk = totalValue > 0
      ? allocations.reduce((s, a) => s + a.riskWeight * a.percentage, 0)
      : 50;
    const score = Math.round(weightedRisk);

    // Diversification (Shannon entropy normalized)
    const entropy = allocations.reduce((s, a) => {
      const p = a.percentage / 100;
      return p > 0 ? s - p * Math.log2(p) : s;
    }, 0);
    const maxEntropy = allocations.length > 1 ? Math.log2(allocations.length) : 1;
    const diversificationScore = Math.round((entropy / maxEntropy) * 100);

    // Liquidity ratio
    const liquidAssets = allAssets.filter(a => a.is_liquid).reduce((s, a) => s + Number(a.current_value), 0);
    const liquidityRatio = totalValue > 0 ? (liquidAssets / totalValue) * 100 : 0;

    // Grade
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'E';
    const gradeConfig: Record<string, { label: { es: string; en: string }; color: string }> = {
      A: { label: { es: 'Muy Agresivo', en: 'Very Aggressive' }, color: 'text-destructive' },
      B: { label: { es: 'Agresivo', en: 'Aggressive' }, color: 'text-orange-500' },
      C: { label: { es: 'Moderado', en: 'Moderate' }, color: 'text-primary' },
      D: { label: { es: 'Conservador', en: 'Conservative' }, color: 'text-blue-500' },
      E: { label: { es: 'Muy Conservador', en: 'Very Conservative' }, color: 'text-success' },
    };

    // Generate recommendations
    const recs: { es: string; en: string }[] = [];
    const highRiskPct = allocations.filter(a => a.riskWeight >= 0.7).reduce((s, a) => s + a.percentage, 0);
    const lowRiskPct = allocations.filter(a => a.riskWeight <= 0.25).reduce((s, a) => s + a.percentage, 0);

    if (highRiskPct > 50) {
      recs.push({ es: `${highRiskPct.toFixed(0)}% en activos de alto riesgo. Considera diversificar hacia bonos o fondos indexados.`, en: `${highRiskPct.toFixed(0)}% in high-risk assets. Consider diversifying into bonds or index funds.` });
    }
    if (liquidityRatio < 20) {
      recs.push({ es: 'Tu liquidez es baja (<20%). Mantener un fondo de emergencia de 3-6 meses es clave.', en: 'Your liquidity is low (<20%). Keeping a 3-6 month emergency fund is key.' });
    }
    if (diversificationScore < 50) {
      recs.push({ es: 'Baja diversificación. Distribuir entre más clases de activos reduce riesgo.', en: 'Low diversification. Spreading across more asset classes reduces risk.' });
    }
    if (allocations.length === 1) {
      recs.push({ es: 'Todos tus activos están en una sola categoría. La diversificación es fundamental.', en: 'All your assets are in a single category. Diversification is fundamental.' });
    }
    if (score >= 40 && score <= 60 && diversificationScore >= 60) {
      recs.push({ es: '¡Buen balance! Tu portafolio tiene un perfil moderado con buena diversificación.', en: 'Good balance! Your portfolio has a moderate profile with good diversification.' });
    }
    if (recs.length === 0) {
      recs.push({ es: 'Tu portafolio se ve bien. Revisa trimestralmente para mantener el balance.', en: 'Your portfolio looks good. Review quarterly to maintain balance.' });
    }

    return {
      score,
      grade,
      label: gradeConfig[grade].label,
      color: gradeConfig[grade].color,
      allocations,
      diversificationScore,
      liquidityRatio,
      recommendations: recs,
    };
  }, [assets]);

  if (!assets || assets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                {l ? 'Perfil de Riesgo' : 'Risk Profile'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {l ? 'Análisis de tu portafolio de activos' : 'Asset portfolio analysis'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${profile.color}`}>{profile.grade}</p>
            <p className={`text-xs ${profile.color}`}>{profile.label[language]}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk meter */}
        <div className="relative h-3 rounded-full bg-gradient-to-r from-success via-warning to-destructive overflow-hidden">
          <div
            className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-lg transition-all"
            style={{ left: `${Math.min(98, profile.score)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{l ? 'Conservador' : 'Conservative'}</span>
          <span>{l ? 'Agresivo' : 'Aggressive'}</span>
        </div>

        {/* Allocation bars */}
        <div className="space-y-2">
          {profile.allocations.slice(0, expanded ? undefined : 4).map(alloc => (
            <div key={alloc.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${alloc.color}`} />
                  <span className="text-xs">{alloc.label[language]}</span>
                </div>
                <span className="text-xs font-medium">{alloc.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${alloc.color} transition-all`} style={{ width: `${alloc.percentage}%` }} />
              </div>
            </div>
          ))}
          {profile.allocations.length > 4 && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {expanded ? (l ? 'Menos' : 'Less') : `+${profile.allocations.length - 4} ${l ? 'más' : 'more'}`}
            </Button>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <PieChart className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{profile.diversificationScore}%</p>
            <p className="text-xs text-muted-foreground">{l ? 'Diversificación' : 'Diversification'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{profile.liquidityRatio.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{l ? 'Liquidez' : 'Liquidity'}</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          {profile.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <TrendingUp className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{rec[language]}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
