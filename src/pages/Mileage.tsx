import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Car, Plus, Download, MapPin, DollarSign, Upload, BarChart3, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useMileage, useMileageSummary, MileageWithClient, useDeleteMileage } from '@/hooks/data/useMileage';
import { MileageDialog } from '@/components/dialogs/MileageDialog';
import { MileageTable } from '@/components/tables/MileageTable';
import { MileageCard } from '@/components/mileage/MileageCard';
import { MileageSummaryCard } from '@/components/dashboard/MileageSummaryCard';
import { MileageDeductionMaximizer } from '@/components/mileage/MileageDeductionMaximizer';
import { MileageImportDialog } from '@/components/mileage/MileageImportDialog';
import { MileageMonthlyChart } from '@/components/mileage/MileageMonthlyChart';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { SectionEmptyState } from '@/components/guidance/SectionEmptyState';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Mileage() {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedMileage, setSelectedMileage] = useState<MileageWithClient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMileage = useDeleteMileage();

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

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMileage.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Calculate running YTD for each record
  const sortedRecords = [...(mileageRecords || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Layout>
      <TooltipProvider>
        <div className="page-container section-gap p-4 sm:p-8">
          <PageHeader
            title={t('mileage.title')}
            description={!isMobile ? t('mileage.description') : undefined}
          >
            <div className="flex items-center gap-2">
              {/* Year navigation */}
              <div className="flex items-center gap-1" data-highlight="year-selector">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  disabled={selectedYear <= currentYear - 4}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[80px] sm:w-[100px] h-8 sm:h-9 text-sm">
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  disabled={selectedYear >= currentYear}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {isMobile ? (
                <>
                  <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('mileage.import')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-highlight="import-button">
                    <Upload className="mr-2 h-4 w-4" />
                    {t('mileage.import')}
                  </Button>
                  <InfoTooltip content={TOOLTIP_CONTENT.addTrip} variant="wrapper">
                    <Button onClick={handleCreate} data-highlight="add-trip-button">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('mileage.addTrip')}
                    </Button>
                  </InfoTooltip>
                </>
              )}
            </div>
          </PageHeader>

          {/* Contextual Page Guide - hidden on mobile */}
          {!isMobile && (
            <PageContextGuide
              {...PAGE_GUIDES.mileage}
              actions={[
                { icon: Plus, title: { es: 'Nuevo Viaje', en: 'New Trip' }, description: { es: 'Registrar', en: 'Log trip' }, action: handleCreate },
                { icon: Car, title: { es: 'Ver Resumen', en: 'View Summary' }, description: { es: 'Deducciones', en: 'Deductions' }, action: () => {} },
                { icon: DollarSign, title: { es: 'Cálculo CRA', en: 'CRA Calculation' }, description: { es: 'Tarifas 2024', en: '2024 rates' }, path: '/dashboard' },
                { icon: Download, title: { es: 'Exportar', en: 'Export' }, description: { es: 'Para impuestos', en: 'For taxes' }, path: '/dashboard' }
              ]}
            />
          )}

          {/* Monthly Chart - hidden on mobile */}
          {!isMobile && mileageRecords && mileageRecords.length > 0 && (
            <MileageMonthlyChart data={mileageRecords} year={selectedYear} />
          )}

          {/* Deduction Maximizer */}
          <MileageDeductionMaximizer />

          <Tabs defaultValue="records" className="space-y-4" data-highlight="mileage-table">
            <TabsList className="h-9">
              <TabsTrigger value="records" className="text-xs sm:text-sm">
                {isMobile ? <Car className="h-4 w-4" /> : t('mileage.tripsTab')}
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-xs sm:text-sm">
                {isMobile ? <BarChart3 className="h-4 w-4" /> : t('mileage.summaryTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : mileageRecords && mileageRecords.length > 0 ? (
                isMobile ? (
                  <div className="space-y-3">
                    {sortedRecords.map((record, index) => {
                      const ytdKm = sortedRecords
                        .slice(0, index)
                        .reduce((sum, r) => sum + parseFloat(r.kilometers.toString()), 0);
                      return (
                        <MileageCard
                          key={record.id}
                          record={record}
                          ytdKm={ytdKm}
                          onEdit={handleEdit}
                          onDelete={setDeleteId}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <MileageTable data={mileageRecords} onEdit={handleEdit} />
                )
              ) : (
                <SectionEmptyState 
                  section="mileage" 
                  onAction={handleCreate}
                  showSampleDataButton={true}
                />
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              {summaryLoading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : summary ? (
                <div data-highlight="mileage-summary">
                  <MileageSummaryCard summary={summary} />
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Car className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                    <p className="text-base sm:text-lg font-medium">{t('mileage.noRecords')}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">{t('mileage.addTripsForSummary')}</p>
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

          <MileageImportDialog
            open={importDialogOpen}
            onClose={() => setImportDialogOpen(false)}
          />

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('mileage.deleteConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>{t('mileage.deleteWarning')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </Layout>
  );
}
