import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Car, TrendingUp, BadgeDollarSign, Globe, Settings } from 'lucide-react';
import { MileageSummary, CRA_MILEAGE_RATES, getSIIMileageRates, getCRAMileageRates } from '@/hooks/data/useMileage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface MileageSummaryCardProps {
  summary: MileageSummary;
}

export const MileageSummaryCard = ({ summary }: MileageSummaryCardProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isEs = language === 'es';
  const country = summary.country;
  const currentYear = new Date().getFullYear();

  const kmRemaining = Math.max(0, 5000 - summary.yearToDateKm);
  const isHighRateAvailable = summary.yearToDateKm < 5000;

  const craRates = getCRAMileageRates(currentYear);
  const siiRates = getSIIMileageRates(currentYear);

  return (
    <div className="space-y-4">
      {/* Summary Cards — always visible */}
      <div className={`grid gap-4 ${country ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.totalKm')}</CardTitle>
            <Car className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalKilometers.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalTrips} {t('mileage.trips')}
            </p>
          </CardContent>
        </Card>

        {/* Deduction card — only if country is set */}
        {country === 'CA' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('mileage.totalDeduction')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">
                ${summary.totalDeductibleAmount.toFixed(2)} CAD
              </div>
              <p className="text-xs text-muted-foreground">
                {t('mileage.craRates')}
              </p>
            </CardContent>
          </Card>
        )}

        {country === 'CL' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isEs ? 'Gasto deducible estimado' : 'Estimated deductible expense'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">
                ${summary.totalDeductibleAmount.toLocaleString()} CLP
              </div>
              <p className="text-xs text-muted-foreground">
                {isEs ? 'Estimación SII gastos presuntos' : 'SII presumed expenses estimate'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ITC card for CA / deduction note for CL / CTA for no country */}
        {country === 'CA' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('mileage.itcEstimate')}</CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                ${summary.itcClaimable.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('mileage.fuelHstEstimate')}
              </p>
            </CardContent>
          </Card>
        )}

        {country === 'CL' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isEs ? 'Promedio mensual' : 'Monthly average'}
              </CardTitle>
              <Car className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">
                {summary.totalTrips > 0 ? (summary.totalKilometers / Math.max(1, new Date().getMonth() + 1)).toFixed(0) : '0'} km
              </div>
              <p className="text-xs text-muted-foreground">
                {isEs ? 'Promedio km/mes este año' : 'Avg km/month this year'}
              </p>
            </CardContent>
          </Card>
        )}

        {!country && (
          <Card className="border-dashed border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isEs ? 'Deducciones fiscales' : 'Tax deductions'}
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {isEs 
                  ? 'Configura tu jurisdicción fiscal para ver deducciones y estimaciones de impuestos.' 
                  : 'Set up your tax jurisdiction to see deductions and tax estimates.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-3 w-3 mr-1" />
                {isEs ? 'Configurar' : 'Set up'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CRA Rates Info — only for Canada */}
      {country === 'CA' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t('mileage.craRatesTitle')}
              <Badge variant="outline" className="text-[10px]">🇨🇦 CRA</Badge>
            </CardTitle>
            <CardDescription>
              {t('mileage.craRatesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('mileage.first5000')}</div>
                <div className="text-lg font-bold">${craRates.first5000.toFixed(2)}/km</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('mileage.after5000')}</div>
                <div className="text-lg font-bold">${craRates.after5000.toFixed(2)}/km</div>
              </div>
            </div>

            {/* Progress to 5000km */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('mileage.progressTo5000')}</span>
                <span className={isHighRateAvailable ? 'text-chart-1' : 'text-muted-foreground'}>
                  {Math.min(summary.yearToDateKm, 5000).toFixed(0)} / 5,000 km
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-chart-1 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((summary.yearToDateKm / 5000) * 100, 100)}%` }}
                />
              </div>
              {isHighRateAvailable && (
                <p className="text-xs text-muted-foreground">
                  {kmRemaining.toFixed(0)} km {t('mileage.kmAtHighRate')}
                </p>
              )}
            </div>

            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open('https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/automobile/automobile-motor-vehicle-allowances/automobile-allowance-rates.html', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t('mileage.craGuide')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SII Rates Info — only for Chile */}
      {country === 'CL' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              {isEs ? 'Tarifa SII Kilometraje' : 'SII Mileage Rate'}
              <Badge variant="outline" className="text-[10px]">🇨🇱 SII</Badge>
            </CardTitle>
            <CardDescription>
              {isEs 
                ? 'Estimación basada en tabla de gastos presuntos del SII. Consulta con tu contador para valores exactos.'
                : 'Estimate based on SII presumed expense tables. Consult your accountant for exact values.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {isEs ? 'Tarifa estimada por km' : 'Estimated rate per km'}
              </div>
              <div className="text-lg font-bold">${siiRates.perKm} CLP/km</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isEs
                  ? '💡 Mantén un registro detallado (bitácora) de cada viaje con fecha, destino y motivo. El SII puede requerirlo como respaldo.'
                  : '💡 Keep a detailed log of each trip with date, destination and reason. SII may require it as backup.'}
              </p>
            </div>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open('https://www.sii.cl', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {isEs ? 'Consultar SII' : 'Check SII'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
