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
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Building2, 
  Landmark, 
  User, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  FileCheck,
  Ban
} from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExpensesTableProps {
  expenses: ExpenseWithRelations[];
  onEdit: (expense: ExpenseWithRelations) => void;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; labelKey: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', labelKey: 'expenseStatuses.pending' },
  classified: { icon: FileCheck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', labelKey: 'expenseStatuses.classified' },
  deductible: { icon: Landmark, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', labelKey: 'expenseStatuses.deductible' },
  non_deductible: { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', labelKey: 'expenseStatuses.non_deductible' },
  reimbursable: { icon: Building2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', labelKey: 'expenseStatuses.reimbursable' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', labelKey: 'expenseStatuses.rejected' },
  under_review: { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', labelKey: 'expenseStatuses.under_review' },
  finalized: { icon: CheckCircle2, color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/30', labelKey: 'expenseStatuses.finalized' },
};

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
                  {expense.client ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <span className="font-medium text-sm">{expense.client.name}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('expenseTable.clientAssociated')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground text-sm">{t('expenseTable.personal')}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('expenseTable.personalExpense')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
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
                  {(() => {
                    const config = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;
                    const statusLabel = t(config.labelKey);
                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={`${config.bgColor} ${config.color} border-0 gap-1.5`}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{statusLabel}</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('expenseTable.statusLabel')}: {statusLabel}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })()}
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