import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Download, Sparkles, FileText, Users, Camera, Search, MoreHorizontal, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useExpensesRealtime } from '@/hooks/data/useExpensesRealtime';
import { useExpenseDuplicates } from '@/hooks/data/useExpenseDuplicates';
import { ExpensesTable } from '@/components/tables/ExpensesTable';
import { ExpenseFilters } from '@/components/filters/ExpenseFilters';
import { ExpenseDialog } from '@/components/dialogs/ExpenseDialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { ReimbursementReportDialog } from '@/components/dialogs/ReimbursementReportDialog';
import { BulkAssignDialog } from '@/components/dialogs/BulkAssignDialog';
import { QuickClassifyDialog } from '@/components/dialogs/QuickClassifyDialog';
import { LinkReceiptDialog } from '@/components/dialogs/LinkReceiptDialog';
import { ExpenseBulkActions } from '@/components/expenses/ExpenseBulkActions';
import { ExpenseHealthPanel } from '@/components/expenses/ExpenseHealthPanel';
import { ExpenseReviewCenter } from '@/components/expenses/ExpenseReviewCenter';
import { ExpenseFilters as Filters, ExpenseWithRelations } from '@/types/expense.types';
import { Card, CardContent } from '@/components/ui/card';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { SetupProgressBanner } from '@/components/guidance/SetupProgressBanner';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MiniWorkflow } from '@/components/guidance/WorkflowVisualizer';
import { SectionEmptyState } from '@/components/guidance/SectionEmptyState';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileActionBar } from '@/components/mobile';
import { useDeleteExpense } from '@/hooks/data/useExpenses';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Expenses() {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [reimbursementReportOpen, setReimbursementReportOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [quickClassifyOpen, setQuickClassifyOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithRelations | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [linkReceiptOpen, setLinkReceiptOpen] = useState(false);
  const [linkReceiptExpenseIds, setLinkReceiptExpenseIds] = useState<string[]>([]);

  // Track expenses page visit for missions
  usePageVisitTracker('view_expenses');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  // Support nudges/deep links: /expenses?incomplete=true
  useEffect(() => {
    const incomplete = searchParams.get('incomplete');
    const shouldEnable = incomplete === 'true' || incomplete === '1';
    if (!shouldEnable) return;

    setFilters((current) => (current.onlyIncomplete ? current : { ...current, onlyIncomplete: true }));
  }, [searchParams]);

  const { data: expenses, isLoading } = useExpenses(filters);
  const { data: allExpenses } = useExpenses({});
  const deleteMutation = useDeleteExpense();
  const duplicates = useExpenseDuplicates(allExpenses || []);

  // Listen for voice command actions and dialog events
  useEffect(() => {
    const handleVoiceAction = (event: CustomEvent<{ action: string }>) => {
      if (event.detail.action === 'add-expense') {
        setSelectedExpense(undefined);
        setDialogOpen(true);
      }
    };
    const handleOpenBulkAssign = () => setBulkAssignOpen(true);
    const handleOpenQuickClassify = () => setQuickClassifyOpen(true);
    const handleOpenExport = () => setExportDialogOpen(true);

    window.addEventListener('voice-command-action', handleVoiceAction as EventListener);
    window.addEventListener('open-bulk-assign', handleOpenBulkAssign);
    window.addEventListener('open-quick-classify', handleOpenQuickClassify);
    window.addEventListener('open-export-dialog', handleOpenExport);
    return () => {
      window.removeEventListener('voice-command-action', handleVoiceAction as EventListener);
      window.removeEventListener('open-bulk-assign', handleOpenBulkAssign);
      window.removeEventListener('open-quick-classify', handleOpenQuickClassify);
      window.removeEventListener('open-export-dialog', handleOpenExport);
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

  const handleOpenLinkReceipt = useCallback((expenseIds: string[]) => {
    setLinkReceiptExpenseIds(expenseIds);
    setLinkReceiptOpen(true);
  }, []);

  const handleSelectExpenses = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleDeleteDuplicate = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="page-container section-gap">
          <PageHeader
            title={t('expenses.title')}
            description={t('expenses.manageExpenses')}
          >
            {/* Mobile: Compact action bar */}
            {isMobile ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setQuickCaptureOpen(true)} className="bg-primary">
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('common.export')}
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setBulkAssignOpen(true)}>
                      <Users className="mr-2 h-4 w-4" />
                      {t('expenses.bulkAssign')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuickClassifyOpen(true)}>
                      <Zap className="mr-2 h-4 w-4" />
                      {language === 'es' ? 'Clasificar Rápido' : 'Quick Classify'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setReimbursementReportOpen(true)}>
                      <FileText className="mr-2 h-4 w-4" />
                      {t('reimbursements.title')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* Desktop: Full button bar */
              <div className="flex gap-2 flex-wrap">
                <InfoTooltip content={TOOLTIP_CONTENT.bulkAssign} variant="wrapper" side="bottom">
                  <Button variant="outline" size="sm" onClick={() => setBulkAssignOpen(true)} data-highlight="bulk-assign-button">
                    <Users className="mr-2 h-4 w-4" />
                    {t('expenses.bulkAssign')}
                  </Button>
                </InfoTooltip>
                <Button variant="outline" size="sm" onClick={() => setQuickClassifyOpen(true)} className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30">
                  <Zap className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">{language === 'es' ? 'Clasificar' : 'Classify'}</span>
                </Button>
                <InfoTooltip content={TOOLTIP_CONTENT.reimbursementReport} variant="wrapper" side="bottom">
                  <Button variant="outline" size="sm" onClick={() => setReimbursementReportOpen(true)} data-highlight="reimbursement-report">
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">{t('reimbursements.title')}</span>
                  </Button>
                </InfoTooltip>
                <InfoTooltip content={TOOLTIP_CONTENT.exportButton} variant="wrapper" side="bottom">
                  <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)} data-highlight="export-button">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('common.export')}</span>
                  </Button>
                </InfoTooltip>
                <InfoTooltip content={TOOLTIP_CONTENT.addExpense} variant="wrapper" side="bottom">
                  <Button variant="outline" size="sm" onClick={handleCreate} data-highlight="add-expense-button">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('expenses.addExpense')}</span>
                  </Button>
                </InfoTooltip>
                <InfoTooltip content={TOOLTIP_CONTENT.quickCapture} variant="wrapper" side="bottom">
                  <Button size="sm" onClick={() => setQuickCaptureOpen(true)} className="bg-primary" data-highlight="quick-capture">
                    <Sparkles className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('quickCapture.title')}</span>
                  </Button>
                </InfoTooltip>
              </div>
            )}
          </PageHeader>

          {/* Guides and banners - collapsed on mobile */}
          {!isMobile && (
            <>
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

              {/* Workflow Visualizer - Expense Capture Flow */}
              <MiniWorkflow workflowId="expense-capture" />

              {/* Setup Progress Banner - Compact */}
              <SetupProgressBanner variant="compact" />
            </>
          )}

          <div data-highlight="expense-filters">
            <ExpenseFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Health Panel - Data quality issues */}
          {allExpenses && allExpenses.length > 0 && (
            <ExpenseHealthPanel
              expenses={allExpenses}
              duplicates={duplicates}
              onOpenClassify={() => setQuickClassifyOpen(true)}
              onOpenLinkReceipt={handleOpenLinkReceipt}
              onSelectExpenses={handleSelectExpenses}
              onDeleteDuplicate={handleDeleteDuplicate}
            />
          )}

          {/* Unified Review Center */}
          {allExpenses && allExpenses.length > 0 && (
            <ExpenseReviewCenter
              expenses={allExpenses}
              onExportReady={() => setExportDialogOpen(true)}
            />
          )}

        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <p className="text-muted-foreground text-sm">{t('expenses.loadingExpenses')}</p>
            </CardContent>
          </Card>
        ) : expenses && expenses.length > 0 ? (
          <div data-highlight="expenses-table">
            <ExpensesTable
              expenses={expenses}
              onEdit={handleEdit}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>
        ) : (
          <SectionEmptyState 
            section="expenses" 
            onAction={handleCreate}
            secondaryAction={{
              label: { es: 'Captura Rápida', en: 'Quick Capture' },
              onClick: () => setQuickCaptureOpen(true)
            }}
            showSampleDataButton={true}
          />
        )}

        {/* Bulk Actions floating bar */}
        <ExpenseBulkActions
          selectedIds={selectedIds}
          expenses={allExpenses || []}
          onClearSelection={() => setSelectedIds(new Set())}
          onClassifySelected={() => setQuickClassifyOpen(true)}
          onAssignSelected={() => setBulkAssignOpen(true)}
        />

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
          <QuickClassifyDialog
            open={quickClassifyOpen}
            onClose={() => setQuickClassifyOpen(false)}
            expenses={allExpenses || []}
          />
          <LinkReceiptDialog
            open={linkReceiptOpen}
            onClose={() => setLinkReceiptOpen(false)}
            expenseIds={linkReceiptExpenseIds}
            expenses={allExpenses || []}
          />
        </div>
      </TooltipProvider>
    </Layout>
  );
}
