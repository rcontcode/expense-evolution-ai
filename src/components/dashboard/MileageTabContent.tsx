import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, TrendingUp, BadgeDollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CRA_MILEAGE_RATES } from '@/hooks/data/useMileage';

interface MileageSummary {
  totalKilometers: number;
  totalTrips: number;
  totalDeductibleAmount: number;
  itcClaimable: number;
  yearToDateKm: number;
}

interface MileageTabContentProps {
  mileageSummary: MileageSummary | null | undefined;
  isLoading: boolean;
}

export const MileageTabContent = memo(({ mileageSummary, isLoading }: MileageTabContentProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!mileageSummary || mileageSummary.totalTrips === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{t('mileage.noRecords')}</p>
          <p className="text-sm text-muted-foreground mb-4">{t('mileage.startTracking')}</p>
          <Button onClick={() => navigate('/mileage')}>
            <Car className="mr-2 h-4 w-4" />
            {t('mileage.addFirstTrip')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mileage Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.totalKm')}</CardTitle>
            <Car className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mileageSummary.totalKilometers.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">
              {mileageSummary.totalTrips} {t('mileage.trips')} {t('dashboard.thisYear')}
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
              ${mileageSummary.totalDeductibleAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t('mileage.craRates')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mileage.itcEstimate')}</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              ${mileageSummary.itcClaimable.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t('mileage.fuelHstEstimate')}</p>
          </CardContent>
        </Card>
      </div>

      {/* CRA Rate Progress */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            {t('mileage.craRatesTitle')}
          </CardTitle>
          <CardDescription>{t('mileage.craRatesDescription')}</CardDescription>
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

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('mileage.progressTo5000')}</span>
              <span className={mileageSummary.yearToDateKm < 5000 ? 'text-chart-1' : 'text-muted-foreground'}>
                {Math.min(mileageSummary.yearToDateKm, 5000).toFixed(0)} / 5,000 km
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-chart-1 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((mileageSummary.yearToDateKm / 5000) * 100, 100)}%` }}
              />
            </div>
            {mileageSummary.yearToDateKm < 5000 && (
              <p className="text-xs text-muted-foreground">
                {(5000 - mileageSummary.yearToDateKm).toFixed(0)} km {t('mileage.kmAtHighRate')}
              </p>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/mileage')}
            className="w-full"
          >
            <Car className="mr-2 h-4 w-4" />
            {t('dashboard.viewAllMileage')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

MileageTabContent.displayName = 'MileageTabContent';
