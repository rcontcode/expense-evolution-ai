import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateIncome, useUpdateIncome } from '@/hooks/data/useIncome';
import { IncomeWithRelations, IncomeFormData } from '@/types/income.types';

interface IncomeDialogProps {
  open: boolean;
  onClose: () => void;
  income?: IncomeWithRelations;
}

export function IncomeDialog({ open, onClose, income }: IncomeDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();

  const handleSubmit = async (data: IncomeFormData) => {
    if (income) {
      await updateMutation.mutateAsync({ id: income.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {income ? t('income.editIncome') : t('income.addIncome')}
          </DialogTitle>
          <DialogDescription>
            {income ? t('income.editDescription') : t('income.addDescription')}
          </DialogDescription>
        </DialogHeader>
        <IncomeForm
          income={income}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
