import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { exportExpenses, ExportOptions } from '@/lib/export/expense-export';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: ExpenseWithRelations[];
}

export function ExportDialog({ open, onClose, expenses }: ExportDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Get available years from expenses
  const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let filteredExpenses = expenses;
      
      if (yearFilter !== 'all') {
        const year = parseInt(yearFilter);
        filteredExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
      }

      if (filteredExpenses.length === 0) {
        toast({
          title: t('export.noData'),
          description: t('export.noDataDescription'),
          variant: 'destructive',
        });
        return;
      }

      const options: ExportOptions = {
        format,
        year: yearFilter !== 'all' ? parseInt(yearFilter) : undefined,
      };

      exportExpenses(filteredExpenses, options);

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

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>{t('export.format')}</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'xlsx')}>
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
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">CSV (.csv)</p>
                    <p className="text-xs text-muted-foreground">{t('export.csvDescription')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
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

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{filteredCount}</span> {t('export.expensesToExport')}
            </p>
            {format === 'xlsx' && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('export.includesTaxSummary')}
              </p>
            )}
          </div>
        </div>

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
