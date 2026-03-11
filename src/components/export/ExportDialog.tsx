import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { exportExpenses, ExportOptions } from '@/lib/export/expense-export';
import { exportT2125Report } from '@/lib/export/t2125-export';
import { exportT2125ToPDF, exportExpensesToPDF, PDFExportOptions } from '@/lib/export/pdf-export';
import { exportTaxReport } from '@/lib/export/tax-report-export';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/data/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useCountryContext } from '@/hooks/utils/useCountryContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, Download, Loader2, FileCheck, FileJson, FileType, FileWarning, Sparkles, Receipt } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: ExpenseWithRelations[];
}

export function ExportDialog({ open, onClose, expenses }: ExportDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { currentCountry } = useCountryContext();
  const [exportType, setExportType] = useState<'general' | 't2125' | 'tax_report'>('general');
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json' | 'pdf'>('xlsx');
  const [t2125Format, setT2125Format] = useState<'xlsx' | 'pdf'>('xlsx');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Fetch documents for tax report checklist
  const { data: userDocuments } = useQuery({
    queryKey: ['documents-for-export', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('documents')
        .select('file_name, extracted_data, created_at')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user && open,
  });

  // Get available years from expenses
  const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let filteredExpenses = expenses;
      const selectedYear = yearFilter !== 'all' ? parseInt(yearFilter) : undefined;
      
      if (selectedYear) {
        filteredExpenses = expenses.filter(e => new Date(e.date).getFullYear() === selectedYear);
      }

      if (filteredExpenses.length === 0) {
        toast({
          title: t('export.noData'),
          description: t('export.noDataDescription'),
          variant: 'destructive',
        });
        return;
      }

      // PDF options with user/business info
      const pdfOptions: PDFExportOptions = {
        language: language as 'es' | 'en',
        year: selectedYear,
        isDraft,
        userName: profile?.full_name || undefined,
        businessName: profile?.business_name || undefined,
        businessNumber: profile?.business_number || undefined,
        country: profile?.country || 'CA',  // ExportDialog uses profile for business info context
      };

      if (exportType === 'tax_report') {
        await exportTaxReport(filteredExpenses, {
          year: selectedYear,
          country: profile?.country || 'CA',
          province: profile?.province || undefined,
          language: language as 'es' | 'en',
          userName: profile?.full_name || undefined,
          businessName: profile?.business_name || undefined,
          businessNumber: profile?.business_number || undefined,
          documents: userDocuments || [],
        });
      } else if (exportType === 't2125') {
        if (t2125Format === 'pdf') {
          exportT2125ToPDF(filteredExpenses, selectedYear, pdfOptions);
        } else {
          await exportT2125Report(filteredExpenses, selectedYear);
        }
      } else {
        if (format === 'pdf') {
          exportExpensesToPDF(filteredExpenses, pdfOptions);
        } else {
          const options: ExportOptions = {
            format,
            year: selectedYear,
            language: language as 'es' | 'en',
            country: currentCountry,
            userName: profile?.full_name || undefined,
            businessName: profile?.business_name || undefined,
          };
          await exportExpenses(filteredExpenses, options);
        }
      }

      toast({
        title: t('export.success'),
        description: t('export.successDescription'),
      });

      onClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Export failed',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCount = yearFilter === 'all' 
    ? expenses.length 
    : expenses.filter(e => new Date(e.date).getFullYear() === parseInt(yearFilter)).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('export.title')}
          </DialogTitle>
          <DialogDescription>
            {t('export.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={exportType} onValueChange={(v) => setExportType(v as 'general' | 't2125' | 'tax_report')} className="py-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t('export.generalExport')}</TabsTrigger>
            <TabsTrigger value="t2125">{t('export.t2125Report')}</TabsTrigger>
            <TabsTrigger value="tax_report" className="gap-1">
              <Receipt className="h-3 w-3" />
              {language === 'es' ? 'Contador' : 'Accountant'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>{t('export.format')}</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'xlsx' | 'json' | 'pdf')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Excel (.xlsx)</p>
                      <p className="text-xs text-muted-foreground">{t('export.excelDescription')}</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileType className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">PDF (.pdf)</p>
                      <p className="text-xs text-muted-foreground">Documento profesional para enviar a clientes</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">CSV (.csv)</p>
                      <p className="text-xs text-muted-foreground">{t('export.csvDescription')}</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileJson className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">JSON (.json)</p>
                      <p className="text-xs text-muted-foreground">Formato estructurado para integraciones</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="t2125" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-start gap-3">
                <FileCheck className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">{t('export.t2125Title')}</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {t('export.t2125Description')}
                  </p>
                  <ul className="text-xs text-green-600 dark:text-green-400 mt-2 space-y-1">
                    <li>• {t('export.t2125Feature1')}</li>
                    <li>• {t('export.t2125Feature2')}</li>
                    <li>• {t('export.t2125Feature3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* T2125 Format Selection */}
            <div className="space-y-3">
              <Label>Formato de exportación</Label>
              <RadioGroup value={t2125Format} onValueChange={(v) => setT2125Format(v as 'xlsx' | 'pdf')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="xlsx" id="t2125-xlsx" />
                  <Label htmlFor="t2125-xlsx" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Excel (.xlsx)</p>
                      <p className="text-xs text-muted-foreground">Detalle completo con múltiples hojas</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="pdf" id="t2125-pdf" />
                  <Label htmlFor="t2125-pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileType className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">PDF (.pdf)</p>
                      <p className="text-xs text-muted-foreground">Resumen profesional para tu contador</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="tax_report" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <Receipt className="h-6 w-6 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-900 dark:text-emerald-100">
                    {language === 'es' ? 'Reporte Fiscal para Contador' : 'Tax Report for Accountant'}
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {language === 'es' 
                      ? 'Excel completo con todo lo que tu contador necesita para la declaración de impuestos.'
                      : 'Complete Excel with everything your accountant needs for tax filing.'}
                  </p>
                  <ul className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 space-y-1">
                    <li>• {language === 'es' ? 'Resumen por categoría con tasas de deducción' : 'Category summary with deduction rates'}</li>
                    <li>• {language === 'es' ? 'Detalle completo de gastos con comprobantes' : 'Full expense detail with receipt status'}</li>
                    <li>• {language === 'es' ? 'Checklist de documentos fiscales (CRA/SII)' : 'Tax document checklist (CRA/SII)'}</li>
                    <li>• {language === 'es' ? 'Lista de gastos sin comprobante' : 'Missing receipt list'}</li>
                    <li>• {language === 'es' ? 'Estimación de ahorro fiscal e ITC/IVA' : 'Tax savings estimate & ITC/IVA'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Year Filter - Common for all tabs */}
          <div className="space-y-2 mt-4">
            <Label>{t('export.yearFilter')}</Label>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('export.allYears')}</SelectItem>
                {years.length === 0 && (
                  <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                )}
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Draft toggle - for PDF formats */}
          {(format === 'pdf' || t2125Format === 'pdf') && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">{language === 'es' ? 'Marcar como Borrador' : 'Mark as Draft'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Agrega marca de agua "BORRADOR"' : 'Adds "DRAFT" watermark'}
                  </p>
                </div>
              </div>
              <Switch checked={isDraft} onCheckedChange={setIsDraft} />
            </div>
          )}

          {/* Data Quality Warnings */}
          {(() => {
            const filtered = yearFilter === 'all' ? expenses : expenses.filter(e => new Date(e.date).getFullYear() === parseInt(yearFilter));
            const unclassified = filtered.filter(e => e.reimbursement_type === 'pending_classification').length;
            const noClient = filtered.filter(e => !e.client_id && e.reimbursement_type === 'client_reimbursable').length;
            const noReceipt = filtered.filter(e => !e.document_id).length;
            const hasWarnings = unclassified > 0;
            
            return hasWarnings ? (
              <div className="p-4 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-700 mt-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <div className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-800">
                    <FileWarning className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold">
                    {language === 'es' ? '⚠️ Datos incompletos detectados' : '⚠️ Incomplete data detected'}
                  </p>
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 ml-1">
                  {unclassified > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <strong>{unclassified}</strong> {language === 'es' ? 'gastos sin clasificar — no aparecerán en reportes' : 'unclassified expenses — won\'t appear in reports'}
                    </li>
                  )}
                  {exportType === 't2125' && unclassified > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {language === 'es' ? 'El reporte T2125 mostrará $0 deducible' : 'T2125 report will show $0 deductible'}
                    </li>
                  )}
                  {noClient > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <strong>{noClient}</strong> {language === 'es' ? 'gastos reembolsables sin cliente' : 'reimbursable expenses without client'}
                    </li>
                  )}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30 font-medium"
                  onClick={() => {
                    onClose();
                    setTimeout(() => window.dispatchEvent(new CustomEvent('open-quick-classify')), 300);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === 'es' ? `Clasificar ${unclassified} gastos primero` : `Classify ${unclassified} expenses first`}
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-700 mt-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <FileCheck className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    {language === 'es' ? '✓ Todos los gastos están clasificados' : '✓ All expenses are classified'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg mt-4">
            <p className="text-sm">
              <span className="font-medium">{filteredCount}</span> {t('export.expensesToExport')}
            </p>
            {exportType === 'general' && format === 'xlsx' && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('export.includesTaxSummary')}
              </p>
            )}
            {exportType === 't2125' && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('export.t2125Includes')}
              </p>
            )}
            {exportType === 'tax_report' && (
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'es' 
                  ? '✓ 4 hojas: Resumen • Detalle • Checklist Docs • Sin Comprobante' 
                  : '✓ 4 sheets: Summary • Detail • Doc Checklist • Missing Receipts'}
              </p>
            )}
            {format === 'pdf' && exportType === 'general' && (
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'es' ? '✓ Logo EvoFinz • Datos de empresa • Bilingüe' : '✓ EvoFinz logo • Business data • Bilingual'}
              </p>
            )}
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting || filteredCount === 0}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('export.exporting')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('export.exportButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
