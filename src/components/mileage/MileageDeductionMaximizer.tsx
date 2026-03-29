import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMileage, useMileageSummary } from '@/hooks/data/useMileage';
import { Car, DollarSign, CalendarDays, TrendingUp, AlertTriangle, Lightbulb, Route } from 'lucide-react';

const CRA_RATE_2024 = 0.70; // First 5,000 km
const CRA_RATE_2024_OVER = 0.64; // After 5,000 km
const SII_RATE = 0.15; // Approximate CLP rate per km

export function MileageDeductionMaximizer() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const currentYear = new Date().getFullYear();
  const { data: records } = useMileage(currentYear);
  const { data: summary } = useMileageSummary(currentYear);

  const analysis = useMemo(() => {
    if (!records?.length || !summary) return null;

    const totalKm = summary.yearToDateKm || summary.totalKilometers || 0;
    // All mileage tracked is considered business use for CRA purposes
    const businessKm = totalKm;
    const personalKm = 0;

    // CRA deduction calculation
    const first5k = Math.min(businessKm, 5000);
    const over5k = Math.max(businessKm - 5000, 0);
    const deduction = (first5k * CRA_RATE_2024) + (over5k * CRA_RATE_2024_OVER);

    // Business use ratio
    const businessRatio = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;

    // Monthly breakdown
    const monthlyKm: Record<number, number> = {};
    records.forEach(r => {
      const month = new Date(r.date).getMonth();
      monthlyKm[month] = (monthlyKm[month] || 0) + Number(r.kilometers);
    });

    const activeMonths = Object.keys(monthlyKm).length;
    const avgMonthlyKm = activeMonths > 0 ? businessKm / activeMonths : 0;
    const remainingMonths = 12 - new Date().getMonth();
    const projectedYearEnd = businessKm + (avgMonthlyKm * remainingMonths);
    const projectedDeduction = 
      (Math.min(projectedYearEnd, 5000) * CRA_RATE_2024) + 
      (Math.max(projectedYearEnd - 5000, 0) * CRA_RATE_2024_OVER);

    // Find gaps — months with no trips
    const currentMonth = new Date().getMonth();
    const missingMonths: string[] = [];
    const monthNames = isEs 
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m <= currentMonth; m++) {
      if (!monthlyKm[m]) missingMonths.push(monthNames[m]);
    }

    // Trips without business purpose (potential missed deductions)
    const tripsWithoutPurpose = records.filter(r => !r.purpose || r.purpose.trim() === '').length;

    // Tips
    const tips: string[] = [];
    if (businessRatio < 50 && personalKm > 0) {
      tips.push(isEs 
        ? 'Tip: Registra viajes al correo, banco, reuniones — muchos son deducibles'
        : 'Tip: Log trips to post office, bank, meetings — many are deductible');
    }
    if (tripsWithoutPurpose > 0) {
      tips.push(isEs 
        ? `${tripsWithoutPurpose} viaje(s) sin propósito registrado. Agrega la razón para fortalecer tu deducción ante el CRA`
        : `${tripsWithoutPurpose} trip(s) missing purpose. Add the reason to strengthen your CRA deduction`);
    }
    if (missingMonths.length > 0) {
      tips.push(isEs 
        ? `Sin registros en ${missingMonths.join(', ')}. ¿Olvidaste registrar viajes?`
        : `No records in ${missingMonths.join(', ')}. Did you forget to log trips?`);
    }
    if (projectedYearEnd > 5000 && businessKm < 5000) {
      tips.push(isEs 
        ? 'Vas camino a superar los 5,000 km. La tarifa baja a $0.64/km después — ¡maximiza ahora!'
        : 'On track to exceed 5,000 km. Rate drops to $0.64/km after — maximize now!');
    }

    return {
      totalKm,
      businessKm,
      businessRatio,
      deduction,
      projectedYearEnd,
      projectedDeduction,
      avgMonthlyKm,
      missingMonths,
      tripsWithoutPurpose,
      tips,
      activeMonths,
    };
  }, [records, summary, isEs]);

  if (!analysis) return null;

  const formatCurrency = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20">
              <Route className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-base">
              {isEs ? 'Maximizador de Deducciones' : 'Deduction Maximizer'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {currentYear}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key deduction metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-emerald-500/10">
            <DollarSign className="h-3.5 w-3.5 mx-auto text-emerald-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Deducción actual' : 'Current deduction'}</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(analysis.deduction)}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-blue-500/10">
            <TrendingUp className="h-3.5 w-3.5 mx-auto text-blue-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Proyectada' : 'Projected'}</p>
            <p className="text-sm font-bold text-blue-600">{formatCurrency(analysis.projectedDeduction)}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-amber-500/10">
            <Car className="h-3.5 w-3.5 mx-auto text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Km negocio' : 'Business km'}</p>
            <p className="text-sm font-bold">{analysis.businessKm.toLocaleString()}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-purple-500/10">
            <CalendarDays className="h-3.5 w-3.5 mx-auto text-purple-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Meses activos' : 'Active months'}</p>
            <p className="text-sm font-bold">{analysis.activeMonths}/12</p>
          </div>
        </div>

        {/* Business use ratio */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{isEs ? 'Uso de negocio' : 'Business use'}</span>
            <span className="font-medium">{analysis.businessRatio.toFixed(0)}%</span>
          </div>
          <Progress value={analysis.businessRatio} className="h-2 [&>div]:bg-sky-500" />
        </div>

        {/* 5,000 km threshold */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{isEs ? 'Umbral 5,000 km (tarifa alta)' : '5,000 km threshold (high rate)'}</span>
            <span className="font-medium">{Math.min(analysis.businessKm, 5000).toLocaleString()} / 5,000</span>
          </div>
          <Progress value={Math.min((analysis.businessKm / 5000) * 100, 100)} className="h-2 [&>div]:bg-emerald-500" />
        </div>

        {/* Actionable tips */}
        {analysis.tips.length > 0 && (
          <div className="space-y-1.5">
            {analysis.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Rate info */}
        <div className="p-2 rounded-lg bg-muted/50 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 border-amber-500/30 text-amber-600">
              {isEs ? 'Tasas 2024' : '2024 Rates'}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            CRA 2024: $0.70/km ({isEs ? 'primeros' : 'first'} 5,000) · $0.64/km ({isEs ? 'después' : 'after'})
          </p>
          <p className="text-[9px] text-muted-foreground/70">
            {isEs 
              ? 'Verifique tasas vigentes en canada.ca antes de declarar'
              : 'Verify current rates at canada.ca before filing'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
