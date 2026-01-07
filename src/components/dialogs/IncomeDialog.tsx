import { useState, useEffect } from 'react';
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
import { usePlanLimits } from '@/hooks/data/usePlanLimits';
import { UpgradePrompt } from '@/components/UpgradePrompt';

interface IncomeDialogProps {
  open: boolean;
  onClose: () => void;
  income?: IncomeWithRelations;
}

export function IncomeDialog({ open, onClose, income }: IncomeDialogProps) {
  const { t } = useLanguage();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const { canAddIncome, planType, usage, limits, incrementUsage, getUpgradePlan } = usePlanLimits();
  
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isEditing] = useState(!!income);

  // Check limit on open (only for new incomes)
  useEffect(() => {
    if (open && !isEditing && !canAddIncome()) {
      setShowUpgradePrompt(true);
    }
  }, [open, isEditing, canAddIncome]);

  const handleSubmit = async (data: IncomeFormData) => {
    // Double-check limit before creating (not for edits)
    if (!isEditing && !canAddIncome()) {
      setShowUpgradePrompt(true);
      return;
    }

    if (income) {
      await updateMutation.mutateAsync({ id: income.id, data });
    } else {
      await createMutation.mutateAsync(data);
      // Increment usage counter after successful creation
      incrementUsage('income');
    }
    onClose();
  };

  const handleUpgradeClose = () => {
    setShowUpgradePrompt(false);
    if (!isEditing) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open && !showUpgradePrompt} onOpenChange={onClose}>
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

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={handleUpgradeClose}
        feature="incomes"
        currentPlan={planType}
        requiredPlan={getUpgradePlan() || undefined}
        usageType="incomes"
        currentUsage={usage.incomes_count}
        limit={limits.incomes_per_month === Infinity ? 0 : limits.incomes_per_month}
      />
    </>
  );
}
