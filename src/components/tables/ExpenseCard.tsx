import { memo, useMemo } from 'react';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { ExpenseWithRelations } from '@/types/expense.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  CameraOff,
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
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ExpenseCardProps {
  expense: ExpenseWithRelations;
  onEdit: (expense: ExpenseWithRelations) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
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

function getCompletenessStatus(expense: ExpenseWithRelations, language: string) {
  const missingItems: string[] = [];
  const reimbursementType = (expense as any).reimbursement_type || 'pending_classification';
  
  if (reimbursementType === 'pending_classification') {
    missingItems.push(language === 'es' ? 'Clasificación' : 'Classification');
  }
  
  if (reimbursementType === 'client_reimbursable') {
    if (!expense.client_id) {
      missingItems.push(language === 'es' ? 'Cliente' : 'Client');
    }
  }
  
  if (!expense.category) {
    missingItems.push(language === 'es' ? 'Categoría' : 'Category');
  }
  
  const isComplete = missingItems.length === 0;
  
  return { isComplete, missingItems };
}

export const ExpenseCard = memo(function ExpenseCard({ expense, onEdit, onDelete, selectable, selected, onSelect }: ExpenseCardProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useFormatCurrency();
  
  const config = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const statusLabel = t(config.labelKey);
  
  const reimbursementType = (expense as any).reimbursement_type || 'pending_classification';
  const reimbursementConfig = REIMBURSEMENT_CONFIG[reimbursementType] || REIMBURSEMENT_CONFIG.pending_classification;
  const ReimbursementIcon = reimbursementConfig.icon;
  
  const completeness = getCompletenessStatus(expense, language);

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      !completeness.isComplete && "border-l-4 border-l-yellow-500"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {selectable && (
            <div className="shrink-0 pt-1">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(expense.id, !!checked)}
              />
            </div>
          )}

          {/* Receipt thumbnail */}
          <div className="shrink-0 relative">
            <ReceiptPhotoViewer documentId={expense.document_id} size="sm" />
            {!expense.document_id && (
              <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-orange-100 dark:bg-orange-900/50 animate-pulse">
                <CameraOff className="h-3 w-3 text-orange-600" />
              </div>
            )}
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row: Vendor + Amount */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{expense.vendor || t('expenses.noVendor')}</h4>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(expense.date + 'T12:00:00'), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-base">{formatCurrency(Number(expense.amount), { currency: expense.currency || undefined })}</p>
              </div>
            </div>
            
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              {/* Category */}
              {expense.category && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {getCategoryLabel(expense.category as any)}
                </Badge>
              )}
              
              {/* Reimbursement type */}
              <Badge className={cn(reimbursementConfig.bgColor, reimbursementConfig.color, 'border-0 gap-0.5 text-[10px] px-1.5 py-0')}>
                <ReimbursementIcon className="h-2.5 w-2.5" />
                {language === 'es' ? reimbursementConfig.label : reimbursementConfig.labelEn}
              </Badge>
              
              {/* Status */}
              <Badge className={cn(config.bgColor, config.color, 'border-0 gap-0.5 text-[10px] px-1.5 py-0')}>
                <StatusIcon className="h-2.5 w-2.5" />
                {statusLabel}
              </Badge>
            </div>
            
            {/* Client info if exists */}
            {expense.client && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 text-emerald-600" />
                <span className="truncate">{expense.client.name}</span>
              </div>
            )}
            
            {/* Completeness warning */}
            {!completeness.isComplete && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{language === 'es' ? 'Falta' : 'Missing'}: {completeness.missingItems.join(', ')}</span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="shrink-0">
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
      </CardContent>
    </Card>
  );
});
