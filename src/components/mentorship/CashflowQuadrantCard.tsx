import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCashflowQuadrant, QuadrantType } from '@/hooks/data/useCashflowQuadrant';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, User, Building2, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

const QUADRANT_ICONS: Record<QuadrantType, React.ReactNode> = {
  E: <Briefcase className="h-5 w-5" />,
  S: <User className="h-5 w-5" />,
  B: <Building2 className="h-5 w-5" />,
  I: <TrendingUp className="h-5 w-5" />,
};

export function CashflowQuadrantCard() {
  const { language } = useLanguage();
  const { quadrants, totalIncome, dominantQuadrant, progressToI, recommendations, isLoading } = useCashflowQuadrant();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Cuadrante del Flujo de Dinero' : 'Cashflow Quadrant'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Kiyosaki
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {language === 'es' 
            ? 'E-S-B-I: Tu camino hacia la libertad financiera'
            : 'E-S-B-I: Your path to financial freedom'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quadrant Grid */}
        <div className="grid grid-cols-2 gap-2">
          {quadrants.map((quadrant) => (
            <div
              key={quadrant.type}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                quadrant.type === dominantQuadrant 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-border/50 bg-muted/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-full ${
                  quadrant.type === 'I' ? 'bg-primary/20 text-primary' :
                  quadrant.type === 'B' ? 'bg-accent/20 text-accent-foreground' :
                  quadrant.type === 'S' ? 'bg-yellow-500/20 text-yellow-600' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {QUADRANT_ICONS[quadrant.type]}
                </div>
                <span className="font-bold text-lg">{quadrant.type}</span>
              </div>
              <p className="text-xs font-medium">
                {language === 'es' ? quadrant.nameEs : quadrant.name}
              </p>
              <p className="text-sm font-semibold mt-1">
                {formatCurrency(quadrant.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {quadrant.percentage.toFixed(1)}%
              </p>
              {quadrant.type === dominantQuadrant && (
                <Badge className="absolute -top-2 -right-2 text-[10px]" variant="default">
                  {language === 'es' ? 'Actual' : 'Current'}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Progress to I */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              {language === 'es' ? 'Progreso hacia Cuadrante I' : 'Progress to Quadrant I'}
            </span>
            <span className="font-semibold">{progressToI.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(progressToI, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {progressToI >= 100 
              ? (language === 'es' ? '¡Eres un Inversor!' : "You're an Investor!")
              : progressToI >= 50
              ? (language === 'es' ? '¡Vas por buen camino!' : 'Great progress!')
              : progressToI >= 25
              ? (language === 'es' ? 'Sigue construyendo ingresos pasivos' : 'Keep building passive income')
              : (language === 'es' ? 'Comienza a invertir para moverte al cuadrante I' : 'Start investing to move to quadrant I')
            }
          </p>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {language === 'es' ? 'Recomendaciones' : 'Recommendations'}
            </div>
            <ul className="space-y-1">
              {recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <LegalDisclaimer variant="education" size="compact" />
      </CardContent>
    </Card>
  );
}
