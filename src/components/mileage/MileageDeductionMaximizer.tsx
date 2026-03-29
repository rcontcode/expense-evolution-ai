import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEntity } from '@/contexts/EntityContext';
import { useMileage, useMileageSummary, getCRAMileageRates, getSIIMileageRates } from '@/hooks/data/useMileage';
import { Car, DollarSign, CalendarDays, TrendingUp, Lightbulb, Route } from 'lucide-react';

export function MileageDeductionMaximizer() {
  const { language } = useLanguage();
  const { currentCountry } = useEntity();
  const isEs = language === 'es';
  const currentYear = new Date().getFullYear();
  const { data: records } = useMileage(currentYear);
  const { data: summary } = useMileageSummary(currentYear, currentCountry);

  const rates = getCRAMileageRates(currentYear);
  const siiRates = getSIIMileageRates(currentYear);

  const analysis = useMemo(() => {
    if (!records?.length || !summary) return null;

    const totalKm = summary.yearToDateKm || summary.totalKilometers || 0;
    const businessKm = totalKm;

    // Deduction calculation based on country
    let deduction = 0;
    let deductionCurrency = '';
    if (currentCountry === 'CA') {
      const first5k = Math.min(businessKm, 5000);
      const over5k = Math.max(businessKm - 5000, 0);
      deduction = (first5k * rates.first5000) + (over5k * rates.after5000);
      deductionCurrency = 'CAD';
    } else if (currentCountry === 'CL') {
      deduction = businessKm * siiRates.perKm;
      deductionCurrency = 'CLP';
    }

    const businessRatio = 100; // All logged trips assumed business

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

    let projectedDeduction = 0;
    if (currentCountry === 'CA') {
      projectedDeduction = (Math.min(projectedYearEnd, 5000) * rates.first5000) + 
        (Math.max(projectedYearEnd - 5000, 0) * rates.after5000);
    } else if (currentCountry === 'CL') {
      projectedDeduction = projectedYearEnd * siiRates.perKm;
    }

    // Find gaps
    const currentMonth = new Date().getMonth();
    const missingMonths: string[] = [];
    const monthNames = isEs 
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m <= currentMonth; m++) {
      if (!monthlyKm[m]) missingMonths.push(monthNames[m]);
    }

    const tripsWithoutPurpose = records.filter(r => !r.purpose || r.purpose.trim() === '').length;

    // Tips — universal + country-specific
    const tips: string[] = [];
    if (tripsWithoutPurpose > 0) {
      tips.push(isEs 
        ? `${tripsWithoutPurpose} viaje(s) sin propósito registrado. Agrega la razón para fortalecer tu registro`
        : `${tripsWithoutPurpose} trip(s) missing purpose. Add the reason to strengthen your records`);
    }
    if (missingMonths.length > 0) {
      tips.push(isEs 
        ? `Sin registros en ${missingMonths.join(', ')}. ¿Olvidaste registrar viajes?`
        : `No records in ${missingMonths.join(', ')}. Did you forget to log trips?`);
    }
    if (currentCountry === 'CA' && projectedYearEnd > 5000 && businessKm < 5000) {
      tips.push(isEs 
        ? `Vas camino a superar los 5,000 km. La tarifa baja a $${rates.after5000}/km después — ¡maximiza ahora!`
        : `On track to exceed 5,000 km. Rate drops to $${rates.after5000}/km after — maximize now!`);
    }
    if (currentCountry === 'CL') {
      tips.push(isEs
        ? 'El SII requiere bitácora de viajes con fecha, destino y motivo como respaldo de gastos'
        : 'SII requires trip logbook with date, destination and reason as expense backup');
    }

    return {
      totalKm, businessKm, businessRatio, deduction, deductionCurrency,
      projectedYearEnd, projectedDeduction,
      avgMonthlyKm, missingMonths, tripsWithoutPurpose, tips, activeMonths,
    };
  }, [records, summary, isEs, currentCountry, rates, siiRates]);

  if (!analysis) return null;

  const formatCurrency = (n: number, currency?: string) => {
    if (currency === 'CLP') return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} CLP`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const countryLabel = currentCountry === 'CA' ? '🇨🇦 CRA' : currentCountry === 'CL' ? '🇨🇱 SII' : null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20">
              <Route className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-base">
              {currentCountry 
                ? (isEs ? 'Maximizador de Deducciones' : 'Deduction Maximizer')
                : (isEs ? 'Resumen de Kilometraje' : 'Mileage Summary')}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {countryLabel && (
              <Badge variant="outline" className="text-[10px]">
                {countryLabel}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {currentYear}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key metrics */}
        <div className={`grid ${currentCountry ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
          {currentCountry && (
            <div className="text-center p-2.5 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-3.5 w-3.5 mx-auto text-emerald-500 mb-1" />
              <p className="text-[10px] text-muted-foreground">{isEs ? 'Deducción actual' : 'Current deduction'}</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(analysis.deduction, analysis.deductionCurrency)}</p>
            </div>
          )}
          {currentCountry && (
            <div className="text-center p-2.5 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-3.5 w-3.5 mx-auto text-blue-500 mb-1" />
              <p className="text-[10px] text-muted-foreground">{isEs ? 'Proyectada' : 'Projected'}</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(analysis.projectedDeduction, analysis.deductionCurrency)}</p>
            </div>
          )}
          <div className="text-center p-2.5 rounded-lg bg-amber-500/10">
            <Car className="h-3.5 w-3.5 mx-auto text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Km totales' : 'Total km'}</p>
            <p className="text-sm font-bold">{analysis.businessKm.toLocaleString()}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-purple-500/10">
            <CalendarDays className="h-3.5 w-3.5 mx-auto text-purple-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">{isEs ? 'Meses activos' : 'Active months'}</p>
            <p className="text-sm font-bold">{analysis.activeMonths}/12</p>
          </div>
        </div>

        {/* 5,000 km threshold — Canada only */}
        {currentCountry === 'CA' && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{isEs ? 'Umbral 5,000 km (tarifa alta)' : '5,000 km threshold (high rate)'}</span>
              <span className="font-medium">{Math.min(analysis.businessKm, 5000).toLocaleString()} / 5,000</span>
            </div>
            <Progress value={Math.min((analysis.businessKm / 5000) * 100, 100)} className="h-2 [&>div]:bg-emerald-500" />
          </div>
        )}

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
        {currentCountry === 'CA' && (
          <div className="p-2 rounded-lg bg-muted/50 text-center space-y-1">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 border-amber-500/30 text-amber-600">
              {isEs ? `Tasas CRA ${currentYear}` : `CRA ${currentYear} Rates`}
            </Badge>
            <p className="text-[10px] text-muted-foreground">
              ${rates.first5000}/km ({isEs ? 'primeros' : 'first'} 5,000) · ${rates.after5000}/km ({isEs ? 'después' : 'after'})
            </p>
            <p className="text-[9px] text-muted-foreground/70">
              {isEs ? 'Verifique tasas vigentes en canada.ca antes de declarar' : 'Verify current rates at canada.ca before filing'}
            </p>
          </div>
        )}

        {currentCountry === 'CL' && (
          <div className="p-2 rounded-lg bg-muted/50 text-center space-y-1">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 border-amber-500/30 text-amber-600">
              {isEs ? `Tarifa SII ${currentYear}` : `SII ${currentYear} Rate`}
            </Badge>
            <p className="text-[10px] text-muted-foreground">
              ${siiRates.perKm} CLP/km ({isEs ? 'estimación gastos presuntos' : 'presumed expense estimate'})
            </p>
            <p className="text-[9px] text-muted-foreground/70">
              {isEs ? 'Verifique con su contador. Valores referenciales.' : 'Verify with your accountant. Reference values.'}
            </p>
          </div>
        )}

        {!currentCountry && (
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground">
              {isEs 
                ? 'Configura una entidad fiscal para ver deducciones según tu jurisdicción (CRA 🇨🇦 / SII 🇨🇱)'
                : 'Set up a fiscal entity to see deductions for your jurisdiction (CRA 🇨🇦 / SII 🇨🇱)'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
