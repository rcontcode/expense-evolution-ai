import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ExpenseFormValues } from '@/lib/validations/expense.schema';
import { useCreateExpense, useUpdateExpense } from '@/hooks/data/useExpenses';
import { ExpenseWithRelations } from '@/types/expense.types';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseWithRelations;
}

export function ExpenseDialog({ open, onClose, expense }: ExpenseDialogProps) {
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const handleSubmit = (data: ExpenseFormValues) => {
    const expenseData = {
      date: data.date.toISOString().split('T')[0],
      vendor: data.vendor,
      amount: data.amount,
      category: data.category,
      description: data.description || null,
      notes: data.notes || null,
      client_id: data.client_id === '__none__' ? null : data.client_id || null,
      status: data.status || 'pending',
      currency: 'CAD',
    };

    if (expense) {
      updateMutation.mutate(
        { id: expense.id, updates: expenseData },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(expenseData as any, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
  );
}
