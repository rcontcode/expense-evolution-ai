import { useState, useCallback, memo, CSSProperties, ReactElement, useMemo } from 'react';
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
  Ban,
  AlertTriangle,
  FileText,
  FolderKanban
} from 'lucide-react';
import { ReceiptPhotoViewer } from '@/components/ReceiptPhotoViewer';
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
import { cn } from '@/lib/utils';

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

const REIMBURSEMENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string; labelEn: string }> = {
  pending_classification: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Sin clasificar', labelEn: 'Unclassified' },
  client_reimbursable: { icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Cliente', labelEn: 'Client' },
  cra_deductible: { icon: Landmark, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'CRA', labelEn: 'CRA' },
  personal: { icon: User, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Personal', labelEn: 'Personal' },
};

interface CompletenessResult {
  isComplete: boolean;
  percentage: number;
  missingItems: string[];
  tooltipText: string;
}

function getCompletenessStatus(expense: ExpenseWithRelations, language: string): CompletenessResult {
  const missingItems: string[] = [];
  const reimbursementType = (expense as any).reimbursement_type || 'pending_classification';
  
  // Check classification
  if (reimbursementType === 'pending_classification') {
    missingItems.push(language === 'es' ? 'Clasificación de reembolso' : 'Reimbursement classification');
  }
  
  // For client reimbursable, check client and contract
  if (reimbursementType === 'client_reimbursable') {
    if (!expense.client_id) {
      missingItems.push(language === 'es' ? 'Cliente' : 'Client');
    }
    if (!(expense as any).contract_id) {
      missingItems.push(language === 'es' ? 'Contrato' : 'Contract');
    }
  }
  
  // Check basic fields
  if (!expense.category) {
    missingItems.push(language === 'es' ? 'Categoría' : 'Category');
  }
  
  const totalChecks = reimbursementType === 'client_reimbursable' ? 4 : 2;
  const completedChecks = totalChecks - missingItems.length;
  const percentage = Math.round((completedChecks / totalChecks) * 100);
  
  const tooltipText = missingItems.length > 0
    ? `${language === 'es' ? 'Falta' : 'Missing'}: ${missingItems.join(', ')}`
    : language === 'es' ? 'Listo para reportes' : 'Ready for reports';
  
  return {
    isComplete: missingItems.length === 0,
    percentage,
    missingItems,
    tooltipText
  };
}

const ROW_HEIGHT = 72;
const TABLE_HEIGHT = 600;

// Props that react-window will provide + our custom props
interface ExpenseRowCustomProps {
  expenses: ExpenseWithRelations[];
  onEdit: (expense: ExpenseWithRelations) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
  language: string;
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

function ExpenseRowComponent({ index, style, expenses, onEdit, onDelete, t, language }: ExpenseRowProps): ReactElement {
  const expense = expenses[index];
  const config = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const statusLabel = t(config.labelKey);
  
  const reimbursementType = (expense as any).reimbursement_type || 'pending_classification';
  const reimbursementConfig = REIMBURSEMENT_CONFIG[reimbursementType] || REIMBURSEMENT_CONFIG.pending_classification;
  const ReimbursementIcon = reimbursementConfig.icon;
  
  const completeness = getCompletenessStatus(expense, language);

  return (
    <div 
      style={style} 
      className="flex items-center border-b border-border hover:bg-muted/50 transition-colors"
    >
      {/* Completeness Indicator */}
      <div className="w-[5%] px-2 flex justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full cursor-pointer transition-colors",
                completeness.isComplete 
                  ? "bg-green-100 dark:bg-green-900/30" 
                  : completeness.percentage >= 50 
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
              )}>
                {completeness.isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <span className={cn(
                    "text-xs font-bold",
                    completeness.percentage >= 50 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {completeness.percentage}%
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">
                  {completeness.isComplete 
                    ? (language === 'es' ? '✓ Listo para reportes' : '✓ Ready for reports')
                    : (language === 'es' ? '⚠ Información incompleta' : '⚠ Incomplete information')
                  }
                </p>
                {completeness.missingItems.length > 0 && (
                  <ul className="text-xs space-y-0.5">
                    {completeness.missingItems.map((item, idx) => (
                      <li key={idx} className="text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Receipt Photo */}
      <div className="w-[4%] px-1 flex justify-center">
        <ReceiptPhotoViewer documentId={expense.document_id} size="sm" />
      </div>

      {/* Date */}
      <div className="w-[8%] px-2 font-medium text-sm">
        {format(new Date(expense.date + 'T12:00:00'), 'MMM dd')}
      </div>
      
      {/* Vendor */}
      <div className="w-[14%] px-2">
        <div className="font-medium text-sm truncate">{expense.vendor}</div>
        {expense.description && (
          <div className="text-xs text-muted-foreground truncate">{expense.description}</div>
        )}
      </div>
      
      {/* Category */}
      <div className="w-[9%] px-2 text-sm truncate">
        {getCategoryLabel(expense.category as any)}
      </div>
      
      {/* Reimbursement Type */}
      <div className="w-[10%] px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={cn(reimbursementConfig.bgColor, reimbursementConfig.color, 'border-0 gap-1 text-xs')}>
                <ReimbursementIcon className="h-3 w-3" />
                <span className="truncate">{language === 'es' ? reimbursementConfig.label : reimbursementConfig.labelEn}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === 'es' ? 'Tipo de reembolso' : 'Reimbursement type'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Client + Contract */}
      <div className="w-[14%] px-2">
        {expense.client ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="font-medium text-xs truncate">{expense.client.name}</span>
            </div>
            {(expense as any).contract_id ? (
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="text-xs truncate">{language === 'es' ? 'Con contrato' : 'With contract'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="text-xs">{language === 'es' ? 'Sin contrato' : 'No contract'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">{t('expenseTable.personal')}</span>
          </div>
        )}
      </div>
      
      {/* Tags */}
      <div className="w-[10%] px-2">
        <div className="flex flex-wrap gap-0.5">
          {expense.tags && expense.tags.length > 0 ? (
            expense.tags.slice(0, 1).map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color || '#3B82F6' }}
                className="text-white text-xs px-1.5"
              >
                {tag.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
          {expense.tags && expense.tags.length > 1 && (
            <Badge variant="secondary" className="text-xs px-1">
              +{expense.tags.length - 1}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Amount */}
      <div className="w-[8%] px-2 text-right font-medium text-sm">
        ${Number(expense.amount).toFixed(2)}
      </div>
      
      {/* Status */}
      <div className="w-[12%] px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={cn(config.bgColor, config.color, 'border-0 gap-1 text-xs')}>
                <StatusIcon className="h-3 w-3" />
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
      <div className="w-[6%] px-2 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
  const { t, language } = useLanguage();
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

  // Calculate completeness stats
  const completenessStats = useMemo(() => {
    let complete = 0;
    let incomplete = 0;
    expenses.forEach(exp => {
      const status = getCompletenessStatus(exp, language);
      if (status.isComplete) complete++;
      else incomplete++;
    });
    return { complete, incomplete, total: expenses.length };
  }, [expenses, language]);

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
    language,
  };

  return (
    <>
      {/* Completeness Summary */}
      {completenessStats.incomplete > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {language === 'es' 
                ? `${completenessStats.incomplete} de ${completenessStats.total} gastos con información incompleta para reportes`
                : `${completenessStats.incomplete} of ${completenessStats.total} expenses with incomplete information for reports`
              }
            </span>
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        {/* Header */}
        <div className="flex items-center bg-muted/50 border-b border-border font-medium text-xs text-muted-foreground">
          <div className="w-[5%] px-2 py-3 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle2 className="h-4 w-4 mx-auto" />
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'es' ? 'Completitud para reportes' : 'Report readiness'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="w-[4%] px-1 py-3 text-center">{t('expenses.receipt')}</div>
          <div className="w-[8%] px-2 py-3">{t('expenses.date')}</div>
          <div className="w-[14%] px-2 py-3">{t('expenses.vendor')}</div>
          <div className="w-[9%] px-2 py-3">{t('expenses.category')}</div>
          <div className="w-[10%] px-2 py-3">{language === 'es' ? 'Reembolso' : 'Reimb.'}</div>
          <div className="w-[14%] px-2 py-3">{language === 'es' ? 'Cliente/Contrato' : 'Client/Contract'}</div>
          <div className="w-[10%] px-2 py-3">{t('expenses.tags')}</div>
          <div className="w-[8%] px-2 py-3 text-right">{t('expenses.amount')}</div>
          <div className="w-[12%] px-2 py-3">{t('expenses.status')}</div>
          <div className="w-[6%] px-2 py-3"></div>
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
                language={language}
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