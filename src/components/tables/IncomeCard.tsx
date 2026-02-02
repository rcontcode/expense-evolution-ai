import { memo } from 'react';
import { IncomeWithRelations } from '@/types/income.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Calendar,
  Repeat,
  Building2,
  FolderKanban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getIncomeCategory } from '@/lib/constants/income-categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface IncomeCardProps {
  income: IncomeWithRelations;
  onEdit: (income: IncomeWithRelations) => void;
  onDelete: (id: string) => void;
}

export const IncomeCard = memo(function IncomeCard({ income, onEdit, onDelete }: IncomeCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const category = getIncomeCategory(income.income_type);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div 
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: category?.color + '20', color: category?.color }}
          >
            {category?.icon || '💰'}
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header row: Source + Amount */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {income.source || income.description || (language === 'es' ? 'Ingreso' : 'Income')}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(income.date), 'MMM dd, yyyy', { locale: dateLocale })}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-base text-chart-1">${Number(income.amount).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{income.currency || 'CAD'}</p>
              </div>
            </div>
            
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              {/* Income Type */}
              <Badge 
                style={{ backgroundColor: category?.color }} 
                className="text-white text-[10px] px-1.5 py-0"
              >
                {language === 'es' ? category?.label : category?.labelEn}
              </Badge>
              
              {/* Recurrence */}
              {income.recurrence && income.recurrence !== 'one_time' && (
                <Badge variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0">
                  <Repeat className="h-2.5 w-2.5" />
                  {income.recurrence}
                </Badge>
              )}
              
              {/* Taxable indicator */}
              {!income.is_taxable && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {language === 'es' ? 'No gravable' : 'Non-taxable'}
                </Badge>
              )}
            </div>
            
            {/* Client/Project info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {income.client && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-emerald-600" />
                  <span className="truncate max-w-[100px]">{income.client.name}</span>
                </div>
              )}
              {income.project && (
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" style={{ color: income.project.color }} />
                  <span className="truncate max-w-[100px]">{income.project.name}</span>
                </div>
              )}
            </div>
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
                <DropdownMenuItem onClick={() => onEdit(income)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(income.id)}
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
