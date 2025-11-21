import { useState } from 'react';
import { ExpenseWithRelations } from '@/types/expense.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { getCategoryLabel } from '@/lib/constants/expense-categories';
import { useDeleteExpense } from '@/hooks/data/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExpensesTableProps {
  expenses: ExpenseWithRelations[];
  onEdit: (expense: ExpenseWithRelations) => void;
}

export function ExpensesTable({ expenses, onEdit }: ExpensesTableProps) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteExpense();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deductible':
        return 'bg-green-500';
      case 'non_deductible':
        return 'bg-red-500';
      case 'reimbursable':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('expenses.noExpensesFound')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('expenses.date')}</TableHead>
              <TableHead>{t('expenses.vendor')}</TableHead>
              <TableHead>{t('expenses.category')}</TableHead>
              <TableHead>{t('expenses.client')}</TableHead>
              <TableHead>{t('expenses.tags')}</TableHead>
              <TableHead className="text-right">{t('expenses.amount')}</TableHead>
              <TableHead>{t('expenses.status')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {format(new Date(expense.date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{expense.vendor}</div>
                    {expense.description && (
                      <div className="text-sm text-muted-foreground">{expense.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getCategoryLabel(expense.category as any)}</TableCell>
                <TableCell>
                  {expense.client?.name || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {expense.tags && expense.tags.length > 0 ? (
                      expense.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          style={{ backgroundColor: tag.color || '#3B82F6' }}
                          className="text-white text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${Number(expense.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(expense.status)}>
                    {expense.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(expense.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('expenses.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('expenses.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
