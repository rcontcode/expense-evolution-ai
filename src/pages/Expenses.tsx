import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, Download, Sparkles, FileText, Users, Camera, Filter, Upload, BarChart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useExpensesRealtime } from '@/hooks/data/useExpensesRealtime';
import { ExpensesTable } from '@/components/tables/ExpensesTable';
import { ExpenseFilters } from '@/components/filters/ExpenseFilters';
import { ExpenseDialog } from '@/components/dialogs/ExpenseDialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { ReimbursementReportDialog } from '@/components/dialogs/ReimbursementReportDialog';
import { BulkAssignDialog } from '@/components/dialogs/BulkAssignDialog';
import { ExpenseFilters as Filters, ExpenseWithRelations } from '@/types/expense.types';
import { Card, CardContent } from '@/components/ui/card';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { SetupProgressBanner } from '@/components/guidance/SetupProgressBanner';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageHeader } from '@/components/PageHeader';

export default function Expenses() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Filters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [reimbursementReportOpen, setReimbursementReportOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithRelations | undefined>();

  // Track expenses page visit for missions
  usePageVisitTracker('view_expenses');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  const { data: expenses, isLoading } = useExpenses(filters);
  const { data: allExpenses } = useExpenses({});

  // Listen for voice command actions
  useEffect(() => {
    const handleVoiceAction = (event: CustomEvent<{ action: string }>) => {
      if (event.detail.action === 'add-expense') {
        setSelectedExpense(undefined);
        setDialogOpen(true);
      }
    };

    window.addEventListener('voice-command-action', handleVoiceAction as EventListener);
    return () => {
      window.removeEventListener('voice-command-action', handleVoiceAction as EventListener);
    };
  }, []);

  const handleEdit = (expense: ExpenseWithRelations) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedExpense(undefined);
  };

  const handleCreate = () => {
    setSelectedExpense(undefined);
    setDialogOpen(true);
  };

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="p-8 space-y-6">
          <PageHeader
            title={t('expenses.title')}
            description={t('expenses.manageExpenses')}
          >
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setBulkAssignOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                {t('expenses.bulkAssign')}
              </Button>
              <InfoTooltip content={TOOLTIP_CONTENT.reimbursementReport} variant="wrapper" side="bottom">
                <Button variant="outline" onClick={() => setReimbursementReportOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('reimbursements.title')}
                </Button>
              </InfoTooltip>
              <InfoTooltip content={TOOLTIP_CONTENT.exportButton} variant="wrapper" side="bottom">
                <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('common.export')}
                </Button>
              </InfoTooltip>
              <InfoTooltip content={TOOLTIP_CONTENT.addExpense} variant="wrapper" side="bottom">
                <Button variant="outline" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('expenses.addExpense')}
                </Button>
              </InfoTooltip>
              <InfoTooltip content={TOOLTIP_CONTENT.quickCapture} variant="wrapper" side="bottom">
                <Button onClick={() => setQuickCaptureOpen(true)} className="bg-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('quickCapture.title')}
                </Button>
              </InfoTooltip>
            </div>
          </PageHeader>

          {/* Mentor Quote Banner */}
          <MentorQuoteBanner context="expenses" className="mb-2" />

          {/* Contextual Page Guide */}
          <PageContextGuide
            {...PAGE_GUIDES.expenses}
            actions={[
              { icon: Camera, title: { es: 'Captura Rápida', en: 'Quick Capture' }, description: { es: 'Foto de recibo', en: 'Receipt photo' }, action: () => setQuickCaptureOpen(true) },
              { icon: Plus, title: { es: 'Agregar Manual', en: 'Add Manual' }, description: { es: 'Nuevo gasto', en: 'New expense' }, action: handleCreate },
              { icon: Users, title: { es: 'Asignar en Lote', en: 'Bulk Assign' }, description: { es: 'Múltiples gastos', en: 'Multiple expenses' }, action: () => setBulkAssignOpen(true) },
              { icon: Download, title: { es: 'Exportar', en: 'Export' }, description: { es: 'Para CRA o Excel', en: 'For CRA or Excel' }, action: () => setExportDialogOpen(true) }
            ]}
          />

          {/* Setup Progress Banner - Compact */}
          <SetupProgressBanner variant="compact" />

          <div className="flex items-center gap-2">
            <ExpenseFilters filters={filters} onChange={setFilters} />
            <InfoTooltip content={TOOLTIP_CONTENT.expenseFilters} />
          </div>

        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">{t('expenses.loadingExpenses')}</p>
            </CardContent>
          </Card>
        ) : expenses && expenses.length > 0 ? (
          <ExpensesTable expenses={expenses} onEdit={handleEdit} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('expenses.noExpenses')}</p>
              <p className="text-sm text-muted-foreground">
                {t('expenses.startByUploading')}
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {t('expenses.addFirstExpense')}
              </Button>
            </CardContent>
          </Card>
        )}

        <ExpenseDialog open={dialogOpen} onClose={handleClose} expense={selectedExpense} />
        <ExportDialog 
          open={exportDialogOpen} 
          onClose={() => setExportDialogOpen(false)} 
          expenses={allExpenses || []} 
        />
        <QuickCaptureDialog 
          open={quickCaptureOpen} 
          onClose={() => setQuickCaptureOpen(false)} 
        />
          <ReimbursementReportDialog
            open={reimbursementReportOpen}
            onClose={() => setReimbursementReportOpen(false)}
            expenses={allExpenses || []}
          />
          <BulkAssignDialog
            open={bulkAssignOpen}
            onClose={() => setBulkAssignOpen(false)}
            expenses={allExpenses || []}
          />
        </div>
      </TooltipProvider>
    </Layout>
  );
}
