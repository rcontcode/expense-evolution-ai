import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Car, Plus, Download } from 'lucide-react';
import { useMileage, useMileageSummary, MileageWithClient } from '@/hooks/data/useMileage';
import { MileageDialog } from '@/components/dialogs/MileageDialog';
import { MileageTable } from '@/components/tables/MileageTable';
import { MileageSummaryCard } from '@/components/dashboard/MileageSummaryCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Mileage() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMileage, setSelectedMileage] = useState<MileageWithClient | null>(null);

  const { data: mileageRecords, isLoading } = useMileage(selectedYear);
  const { data: summary, isLoading: summaryLoading } = useMileageSummary(selectedYear);

  const handleEdit = (mileage: MileageWithClient) => {
    setSelectedMileage(mileage);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedMileage(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedMileage(null);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('mileage.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('mileage.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('mileage.addTrip')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">{t('mileage.tripsTab')}</TabsTrigger>
            <TabsTrigger value="summary">{t('mileage.summaryTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : mileageRecords && mileageRecords.length > 0 ? (
              <MileageTable data={mileageRecords} onEdit={handleEdit} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('mileage.noRecords')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('mileage.startTracking')}</p>
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('mileage.addFirstTrip')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {summaryLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : summary ? (
              <MileageSummaryCard summary={summary} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('mileage.noRecords')}</p>
                  <p className="text-sm text-muted-foreground">{t('mileage.addTripsForSummary')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <MileageDialog
          open={dialogOpen}
          onClose={handleClose}
          mileage={selectedMileage}
          yearToDateKm={summary?.yearToDateKm || 0}
        />
      </div>
    </Layout>
  );
}
