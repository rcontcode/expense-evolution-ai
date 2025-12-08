import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Landmark, 
  User,
  ArrowRight,
  FileWarning
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExpenseWithRelations } from '@/types/expense.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CompletenessCardProps {
  expenses: ExpenseWithRelations[];
  isLoading?: boolean;
}

interface CompletenessStats {
  total: number;
  complete: number;
  incomplete: number;
  byType: {
    clientReimbursable: { total: number; complete: number };
    craDeductible: { total: number; complete: number };
    personal: { total: number; complete: number };
    pendingClassification: number;
  };
  issues: {
    noClassification: number;
    noClient: number;
    noContract: number;
    noCategory: number;
  };
}

function calculateCompleteness(expense: ExpenseWithRelations): boolean {
  const reimbursementType = (expense as any).reimbursement_type || 'pending_classification';
  
  if (reimbursementType === 'pending_classification') return false;
  if (!expense.category) return false;
  
  if (reimbursementType === 'client_reimbursable') {
    if (!expense.client_id) return false;
    if (!(expense as any).contract_id) return false;
  }
  
  return true;
}

function getCompletenessStats(expenses: ExpenseWithRelations[]): CompletenessStats {
  const stats: CompletenessStats = {
    total: expenses.length,
    complete: 0,
    incomplete: 0,
    byType: {
      clientReimbursable: { total: 0, complete: 0 },
      craDeductible: { total: 0, complete: 0 },
      personal: { total: 0, complete: 0 },
      pendingClassification: 0,
    },
    issues: {
      noClassification: 0,
      noClient: 0,
      noContract: 0,
      noCategory: 0,
    },
  };

  expenses.forEach(expense => {
    const reimbursementType = (expense as any).reimbursement_type || 'pending_classification';
    const isComplete = calculateCompleteness(expense);
    
    if (isComplete) {
      stats.complete++;
    } else {
      stats.incomplete++;
    }

    // Count by type
    switch (reimbursementType) {
      case 'client_reimbursable':
        stats.byType.clientReimbursable.total++;
        if (isComplete) stats.byType.clientReimbursable.complete++;
        break;
      case 'cra_deductible':
        stats.byType.craDeductible.total++;
        if (isComplete) stats.byType.craDeductible.complete++;
        break;
      case 'personal':
        stats.byType.personal.total++;
        if (isComplete) stats.byType.personal.complete++;
        break;
      case 'pending_classification':
        stats.byType.pendingClassification++;
        break;
    }

    // Count issues
    if (reimbursementType === 'pending_classification') {
      stats.issues.noClassification++;
    }
    if (reimbursementType === 'client_reimbursable' && !expense.client_id) {
      stats.issues.noClient++;
    }
    if (reimbursementType === 'client_reimbursable' && !(expense as any).contract_id) {
      stats.issues.noContract++;
    }
    if (!expense.category) {
      stats.issues.noCategory++;
    }
  });

  return stats;
}

export function CompletenessCard({ expenses, isLoading }: CompletenessCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const stats = useMemo(() => getCompletenessStats(expenses), [expenses]);
  const completenessPercentage = stats.total > 0 
    ? Math.round((stats.complete / stats.total) * 100) 
    : 100;

  const hasIssues = stats.incomplete > 0;

  return (
    <Card className={cn(
      "border-2 transition-colors",
      hasIssues 
        ? "border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-900/10" 
        : "border-green-500/30 bg-green-50/30 dark:bg-green-900/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            <CardTitle className="text-lg">
              {language === 'es' ? 'Completitud para Reportes' : 'Report Readiness'}
            </CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(hasIssues ? '/expenses?incomplete=true' : '/expenses')}
            className={cn(
              hasIssues 
                ? "text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/30"
                : "text-green-700 border-green-300 hover:bg-green-100 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/30"
            )}
          >
            {hasIssues 
              ? (language === 'es' ? 'Ver incompletos' : 'View incomplete')
              : (language === 'es' ? 'Ver gastos' : 'View expenses')
            }
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'es' ? 'Gastos listos para reportes' : 'Expenses ready for reports'}
            </span>
            <span className="font-medium">{stats.complete} / {stats.total}</span>
          </div>
          <Progress 
            value={completenessPercentage} 
            className={cn(
              "h-3",
              completenessPercentage === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-yellow-500"
            )}
          />
          <p className="text-xs text-muted-foreground text-right">
            {completenessPercentage}% {language === 'es' ? 'completo' : 'complete'}
          </p>
        </div>

        {/* By Reimbursement Type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Client Reimbursable */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                {language === 'es' ? 'Cliente' : 'Client'}
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.byType.clientReimbursable.complete}
              <span className="text-sm font-normal text-blue-400">
                /{stats.byType.clientReimbursable.total}
              </span>
            </div>
            <p className="text-xs text-blue-600/70">
              {language === 'es' ? 'listos' : 'ready'}
            </p>
          </div>

          {/* CRA Deductible */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">CRA</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.byType.craDeductible.complete}
              <span className="text-sm font-normal text-green-400">
                /{stats.byType.craDeductible.total}
              </span>
            </div>
            <p className="text-xs text-green-600/70">
              {language === 'es' ? 'listos' : 'ready'}
            </p>
          </div>

          {/* Personal */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {language === 'es' ? 'Personal' : 'Personal'}
              </span>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.byType.personal.complete}
              <span className="text-sm font-normal opacity-60">
                /{stats.byType.personal.total}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              {language === 'es' ? 'listos' : 'ready'}
            </p>
          </div>

          {/* Pending Classification */}
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <FileWarning className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                {language === 'es' ? 'Sin clasificar' : 'Unclassified'}
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.byType.pendingClassification}
            </div>
            <p className="text-xs text-yellow-600/70">
              {language === 'es' ? 'pendientes' : 'pending'}
            </p>
          </div>
        </div>

        {/* Issues Summary */}
        {hasIssues && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {language === 'es' ? 'Problemas detectados:' : 'Issues detected:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.issues.noClassification > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
                  {stats.issues.noClassification} {language === 'es' ? 'sin clasificar' : 'unclassified'}
                </Badge>
              )}
              {stats.issues.noClient > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
                  {stats.issues.noClient} {language === 'es' ? 'sin cliente' : 'no client'}
                </Badge>
              )}
              {stats.issues.noContract > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">
                  {stats.issues.noContract} {language === 'es' ? 'sin contrato' : 'no contract'}
                </Badge>
              )}
              {stats.issues.noCategory > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">
                  {stats.issues.noCategory} {language === 'es' ? 'sin categoría' : 'no category'}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* All Complete Message */}
        {!hasIssues && stats.total > 0 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 pt-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">
              {language === 'es' 
                ? '¡Todos los gastos están listos para generar reportes!' 
                : 'All expenses are ready for report generation!'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}