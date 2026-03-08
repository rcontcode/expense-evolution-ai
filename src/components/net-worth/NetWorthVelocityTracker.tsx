import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Rocket, Target, Calendar, TrendingUp, Zap, Flag } from 'lucide-react';

interface Snapshot {
  snapshot_date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

interface Props {
  snapshots: Snapshot[];
  currentNetWorth: number;
}

interface Milestone {
  target: number;
  label: string;
  eta: string;
  monthsAway: number;
  reached: boolean;
}

export function NetWorthVelocityTracker({ snapshots, currentNetWorth }: Props) {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const analysis = useMemo(() => {
    if (snapshots.length < 2) return null;

    const sorted = [...snapshots].sort((a, b) => 
      new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );

    // Monthly growth rates
    const monthlyChanges: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const monthDiff = (new Date(sorted[i].snapshot_date).getTime() - new Date(sorted[i - 1].snapshot_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthDiff > 0 && monthDiff < 3) {
        monthlyChanges.push(sorted[i].net_worth - sorted[i - 1].net_worth);
      }
    }

    if (monthlyChanges.length === 0) return null;

    const avgMonthlyGrowth = monthlyChanges.reduce((s, v) => s + v, 0) / monthlyChanges.length;
    const recentGrowth = monthlyChanges.length >= 3 
      ? monthlyChanges.slice(-3).reduce((s, v) => s + v, 0) / 3 
      : avgMonthlyGrowth;
    
    const growthRate = sorted[0].net_worth !== 0 
      ? (avgMonthlyGrowth / Math.abs(sorted[0].net_worth)) * 100 
      : 0;

    // Best and worst months
    const bestMonth = Math.max(...monthlyChanges);
    const worstMonth = Math.min(...monthlyChanges);
    const consistency = monthlyChanges.filter(c => c > 0).length / monthlyChanges.length * 100;

    // Milestones
    const milestoneTargets = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
    const milestones: Milestone[] = milestoneTargets
      .filter(t => t > currentNetWorth * 0.5) // Show relevant ones
      .slice(0, 4)
      .map(target => {
        const reached = currentNetWorth >= target;
        const gap = target - currentNetWorth;
        const monthsAway = recentGrowth > 0 ? Math.ceil(gap / recentGrowth) : -1;
        const etaDate = monthsAway > 0 ? new Date(Date.now() + monthsAway * 30 * 24 * 60 * 60 * 1000) : null;
        
        return {
          target,
          label: target >= 1000000 ? `$${(target / 1000000).toFixed(0)}M` : `$${(target / 1000).toFixed(0)}k`,
          eta: reached 
            ? (isEs ? '✅ Alcanzado' : '✅ Reached') 
            : etaDate 
              ? etaDate.toLocaleDateString(isEs ? 'es' : 'en', { month: 'short', year: 'numeric' })
              : (isEs ? 'N/A' : 'N/A'),
          monthsAway: reached ? 0 : monthsAway,
          reached,
        };
      });

    // Velocity score (0-100)
    const velocityScore = Math.min(100, Math.max(0,
      (consistency * 0.3) + 
      (Math.min(growthRate, 10) * 5) + 
      (recentGrowth > avgMonthlyGrowth ? 20 : 0)
    ));

    const velocityGrade = velocityScore >= 80 ? 'A' : velocityScore >= 60 ? 'B' : velocityScore >= 40 ? 'C' : velocityScore >= 20 ? 'D' : 'F';

    return {
      avgMonthlyGrowth,
      recentGrowth,
      growthRate,
      bestMonth,
      worstMonth,
      consistency,
      milestones,
      velocityScore,
      velocityGrade,
      monthsTracked: sorted.length,
    };
  }, [snapshots, currentNetWorth, isEs]);

  if (!analysis) return null;

  const formatCurrency = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1000) return `${n >= 0 ? '+' : ''}$${(n / 1000).toFixed(1)}k`;
    return `${n >= 0 ? '+' : ''}$${n.toFixed(0)}`;
  };

  const gradeColors: Record<string, string> = {
    A: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
    B: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    C: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
    D: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    F: 'bg-red-500/20 text-red-700 border-red-500/30',
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
              <Rocket className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle className="text-base">
              {isEs ? 'Velocidad Patrimonial' : 'Wealth Velocity'}
            </CardTitle>
          </div>
          <Badge className={`text-lg font-bold px-3 py-1 ${gradeColors[analysis.velocityGrade]}`}>
            {analysis.velocityGrade}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <TrendingUp className="h-3.5 w-3.5 mx-auto text-emerald-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Crecimiento/mes' : 'Growth/mo'}</p>
            <p className={`text-sm font-bold ${analysis.avgMonthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(analysis.avgMonthlyGrowth)}
            </p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <Zap className="h-3.5 w-3.5 mx-auto text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Tendencia reciente' : 'Recent trend'}</p>
            <p className={`text-sm font-bold ${analysis.recentGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(analysis.recentGrowth)}
            </p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <Target className="h-3.5 w-3.5 mx-auto text-blue-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Consistencia' : 'Consistency'}</p>
            <p className="text-sm font-bold text-foreground">{analysis.consistency.toFixed(0)}%</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <Calendar className="h-3.5 w-3.5 mx-auto text-purple-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Meses rastreados' : 'Months tracked'}</p>
            <p className="text-sm font-bold text-foreground">{analysis.monthsTracked}</p>
          </div>
        </div>

        {/* Milestones roadmap */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Flag className="h-3 w-3" />
            {isEs ? 'Hitos Patrimoniales' : 'Wealth Milestones'}
          </p>
          <div className="space-y-1.5">
            {analysis.milestones.map((milestone) => (
              <div 
                key={milestone.target} 
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  milestone.reached ? 'bg-emerald-500/10' : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    milestone.reached ? 'bg-emerald-500' : 
                    milestone.monthsAway > 0 && milestone.monthsAway <= 12 ? 'bg-amber-500' : 'bg-muted-foreground/30'
                  }`} />
                  <span className={`text-sm font-medium ${milestone.reached ? 'text-emerald-600 line-through' : ''}`}>
                    {milestone.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{milestone.eta}</span>
                  {!milestone.reached && milestone.monthsAway > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({milestone.monthsAway} {isEs ? 'meses' : 'mo'})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best/Worst insight */}
        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs">
            {isEs
              ? `📊 Tu mejor mes fue ${formatCurrency(analysis.bestMonth)} y el peor ${formatCurrency(analysis.worstMonth)}. ${
                  analysis.recentGrowth > analysis.avgMonthlyGrowth 
                    ? '🚀 Tu tendencia reciente supera tu promedio — ¡vas acelerando!' 
                    : '💡 Enfócate en mantener la consistencia para alcanzar tus hitos más rápido.'
                }`
              : `📊 Best month was ${formatCurrency(analysis.bestMonth)}, worst was ${formatCurrency(analysis.worstMonth)}. ${
                  analysis.recentGrowth > analysis.avgMonthlyGrowth 
                    ? '🚀 Your recent trend beats your average — you\'re accelerating!' 
                    : '💡 Focus on consistency to reach your milestones faster.'
                }`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
