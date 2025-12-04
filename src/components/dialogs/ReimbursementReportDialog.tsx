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
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte de Reembolsos por Cliente</DialogTitle>
          <DialogDescription>
            Gastos reembolsables agrupados por cliente con totales y detalles
          </DialogDescription>
        </DialogHeader>
        <ClientReimbursementReport expenses={expenses} />
      </DialogContent>
    </Dialog>
  );
}
