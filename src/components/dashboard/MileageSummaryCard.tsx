import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Car, TrendingUp, BadgeDollarSign } from 'lucide-react';
import { MileageSummary, CRA_MILEAGE_RATES } from '@/hooks/data/useMileage';
import { useLanguage } from '@/contexts/LanguageContext';

interface MileageSummaryCardProps {
  summary: MileageSummary;
}

export const MileageSummaryCard = ({ summary }: MileageSummaryCardProps) => {
  const { t } = useLanguage();

  const kmRemaining = Math.max(0, 5000 - summary.yearToDateKm);
  const isHighRateAvailable = summary.yearToDateKm < 5000;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.totalDeduction')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              ${summary.totalDeductibleAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('mileage.craRates')}
            </p>
          </CardContent>
        </Card>

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
      </div>

      {/* CRA Rates Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            {t('mileage.craRatesTitle')}
          </CardTitle>
          <CardDescription>
            {t('mileage.craRatesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">{t('mileage.first5000')}</div>
              <div className="text-lg font-bold">${CRA_MILEAGE_RATES.first5000.toFixed(2)}/km</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">{t('mileage.after5000')}</div>
              <div className="text-lg font-bold">${CRA_MILEAGE_RATES.after5000.toFixed(2)}/km</div>
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
    </div>
  );
};
