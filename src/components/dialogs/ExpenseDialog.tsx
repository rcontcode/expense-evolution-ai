import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ExpenseFormValues } from '@/lib/validations/expense.schema';
import { useCreateExpense, useUpdateExpense, useAddExpenseTags } from '@/hooks/data/useExpenses';
import { ExpenseWithRelations } from '@/types/expense.types';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseWithRelations;
}

export function ExpenseDialog({ open, onClose, expense }: ExpenseDialogProps) {
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const addTagsMutation = useAddExpenseTags();

  const handleSubmit = async (data: ExpenseFormValues & { tagIds?: string[] }) => {
    const { tagIds, ...formData } = data;
    
    const expenseData = {
      date: formData.date.toISOString().split('T')[0],
      vendor: formData.vendor,
      amount: formData.amount,
      category: formData.category,
      description: formData.description || null,
      notes: formData.notes || null,
      client_id: formData.client_id === '__none__' ? null : formData.client_id || null,
      status: formData.status || 'pending',
      currency: 'CAD',
    };

    try {
      let expenseId: string;
      
      if (expense) {
        const updated = await updateMutation.mutateAsync({ id: expense.id, updates: expenseData });
        expenseId = updated.id;
      } else {
        const created = await createMutation.mutateAsync(expenseData as any);
        expenseId = created.id;
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
