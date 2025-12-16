import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientReimbursementReport } from '@/components/reports/ClientReimbursementReport';
import { ExpenseWithRelations } from '@/types/expense.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileSpreadsheet, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReimbursementReportDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: ExpenseWithRelations[];
}

export function ReimbursementReportDialog({
  open,
  onClose,
  expenses,
}: ReimbursementReportDialogProps) {
  const { t, language } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">
                  {language === 'es' ? 'Reporte de Reembolsos por Cliente' : 'Client Reimbursement Report'}
                </DialogTitle>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  Pro
                </Badge>
              </div>
              <DialogDescription className="mt-1">
                {language === 'es' 
                  ? 'Análisis completo de gastos reembolsables con gráficos y métricas detalladas'
                  : 'Complete analysis of reimbursable expenses with charts and detailed metrics'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4">
          <ClientReimbursementReport expenses={expenses} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
