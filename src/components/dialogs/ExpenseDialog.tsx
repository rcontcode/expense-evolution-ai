import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ExpenseFormValues } from '@/lib/validations/expense.schema';
import { useCreateExpense, useUpdateExpense, useAddExpenseTags } from '@/hooks/data/useExpenses';
import { ExpenseWithRelations } from '@/types/expense.types';
import { usePlanLimits } from '@/hooks/data/usePlanLimits';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useEntity } from '@/contexts/EntityContext';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseWithRelations;
}

export function ExpenseDialog({ open, onClose, expense }: ExpenseDialogProps) {
  const { currentEntity } = useEntity();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const addTagsMutation = useAddExpenseTags();
  const { canAddExpense, planType, usage, limits, incrementUsage, getUpgradePlan } = usePlanLimits();
  
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isEditing] = useState(!!expense);

  // Check limit on open (only for new expenses)
  useEffect(() => {
    if (open && !isEditing && !canAddExpense()) {
      setShowUpgradePrompt(true);
    }
  }, [open, isEditing, canAddExpense]);

  const handleSubmit = async (data: ExpenseFormValues & { tagIds?: string[] }) => {
    // Double-check limit before creating (not for edits)
    if (!isEditing && !canAddExpense()) {
      setShowUpgradePrompt(true);
      return;
    }

    const { tagIds, ...formData } = data;
    
    const expenseData = {
      date: formData.date.toISOString().split('T')[0],
      vendor: formData.vendor,
      amount: formData.amount,
      category: formData.category,
      description: formData.description || null,
      notes: formData.notes || null,
      client_id: formData.client_id === '__none__' ? null : formData.client_id || null,
      project_id: formData.project_id === '__none__' ? null : formData.project_id || null,
      contract_id: formData.contract_id === '__none__' ? null : formData.contract_id || null,
      status: formData.status || 'pending',
      reimbursement_type: formData.reimbursement_type || 'pending_classification',
      currency: currentEntity?.default_currency || 'CAD',
      entity_id: formData.entity_id || currentEntity?.id || null,
    };

    try {
      let expenseId: string;
      
      if (expense) {
        const updated = await updateMutation.mutateAsync({ id: expense.id, updates: expenseData });
        expenseId = updated.id;
      } else {
        const created = await createMutation.mutateAsync(expenseData as any);
        expenseId = created.id;
        // Increment usage counter after successful creation
        incrementUsage('expense');
      }
      
      // Update tags if tagIds were provided
      if (tagIds !== undefined) {
        await addTagsMutation.mutateAsync({ expenseId, tagIds });
      }
      
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleUpgradeClose = () => {
    setShowUpgradePrompt(false);
    if (!isEditing) {
      onClose(); // Close the expense dialog too if it was blocked
    }
  };

  return (
    <>
      <Dialog open={open && !showUpgradePrompt} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{expense ? 'Edit Expense' : 'Create New Expense'}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={expense}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={handleUpgradeClose}
        feature="expenses"
        currentPlan={planType}
        requiredPlan={getUpgradePlan() || undefined}
        usageType="expenses"
        currentUsage={usage.expenses_count}
        limit={limits.expenses_per_month === Infinity ? 0 : limits.expenses_per_month}
      />
    </>
  );
}
