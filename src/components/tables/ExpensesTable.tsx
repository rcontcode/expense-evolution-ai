import { useState, useCallback, memo, CSSProperties, ReactElement } from 'react';
import { List } from 'react-window';
import { ExpenseWithRelations } from '@/types/expense.types';
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

const ROW_HEIGHT = 72;
const TABLE_HEIGHT = 600;

// Props that react-window will provide + our custom props
interface ExpenseRowCustomProps {
  expenses: ExpenseWithRelations[];
  onEdit: (expense: ExpenseWithRelations) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

// Full row props including react-window's injected props
interface ExpenseRowProps extends ExpenseRowCustomProps {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: CSSProperties;
}

function ExpenseRowComponent({ index, style, expenses, onEdit, onDelete, t }: ExpenseRowProps): ReactElement {
  const expense = expenses[index];
  const config = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const statusLabel = t(config.labelKey);

  return (
    <div 
      style={style} 
      className="flex items-center border-b border-border hover:bg-muted/50 transition-colors"
    >
      {/* Date */}
      <div className="w-[12%] px-4 font-medium text-sm">
        {format(new Date(expense.date), 'MMM dd, yyyy')}
      </div>
      
      {/* Vendor */}
      <div className="w-[18%] px-4">
        <div className="font-medium text-sm truncate">{expense.vendor}</div>
        {expense.description && (
          <div className="text-xs text-muted-foreground truncate">{expense.description}</div>
        )}
      </div>
      
      {/* Category */}
      <div className="w-[12%] px-4 text-sm truncate">
        {getCategoryLabel(expense.category as any)}
      </div>
      
      {/* Client */}
      <div className="w-[14%] px-4">
        {expense.client ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-sm truncate">{expense.client.name}</span>
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
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted shrink-0">
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
      </div>
      
      {/* Tags */}
      <div className="w-[12%] px-4">
        <div className="flex flex-wrap gap-1">
          {expense.tags && expense.tags.length > 0 ? (
            expense.tags.slice(0, 2).map((tag) => (
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
          {expense.tags && expense.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{expense.tags.length - 2}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Amount */}
      <div className="w-[10%] px-4 text-right font-medium text-sm">
        ${Number(expense.amount).toFixed(2)}
      </div>
      
      {/* Status */}
      <div className="w-[14%] px-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${config.bgColor} ${config.color} border-0 gap-1.5`}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="truncate">{statusLabel}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('expenseTable.statusLabel')}: {statusLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Actions */}
      <div className="w-[8%] px-4 flex justify-end">
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
              onClick={() => onDelete(expense.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export const ExpensesTable = memo(function ExpensesTable({ expenses, onEdit }: ExpensesTableProps) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteExpense();

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteMutation]);

  const handleSetDeleteId = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('expenses.noExpensesFound')}</p>
      </div>
    );
  }

  // Use virtualization only for large lists
  const useVirtualization = expenses.length > 50;
  const listHeight = useVirtualization 
    ? Math.min(TABLE_HEIGHT, expenses.length * ROW_HEIGHT)
    : expenses.length * ROW_HEIGHT;

  const rowProps: ExpenseRowCustomProps = {
    expenses,
    onEdit,
    onDelete: handleSetDeleteId,
    t,
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        {/* Header */}
        <div className="flex items-center bg-muted/50 border-b border-border font-medium text-sm text-muted-foreground">
          <div className="w-[12%] px-4 py-3">{t('expenses.date')}</div>
          <div className="w-[18%] px-4 py-3">{t('expenses.vendor')}</div>
          <div className="w-[12%] px-4 py-3">{t('expenses.category')}</div>
          <div className="w-[14%] px-4 py-3">{t('expenses.client')}</div>
          <div className="w-[12%] px-4 py-3">{t('expenses.tags')}</div>
          <div className="w-[10%] px-4 py-3 text-right">{t('expenses.amount')}</div>
          <div className="w-[14%] px-4 py-3">{t('expenses.status')}</div>
          <div className="w-[8%] px-4 py-3"></div>
        </div>
        
        {/* Virtualized Body */}
        {useVirtualization ? (
          <List<ExpenseRowCustomProps>
            style={{ height: listHeight, width: '100%' }}
            rowCount={expenses.length}
            rowHeight={ROW_HEIGHT}
            rowProps={rowProps}
            rowComponent={ExpenseRowComponent}
          />
        ) : (
          <div>
            {expenses.map((expense, index) => (
              <ExpenseRowComponent
                key={expense.id}
                ariaAttributes={{
                  "aria-posinset": index + 1,
                  "aria-setsize": expenses.length,
                  role: "listitem",
                }}
                index={index}
                style={{ height: ROW_HEIGHT }}
                expenses={expenses}
                onEdit={onEdit}
                onDelete={handleSetDeleteId}
                t={t}
              />
            ))}
          </div>
        )}
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
});
