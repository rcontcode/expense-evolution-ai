import { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryLabelByLanguage, ExpenseCategory } from '@/lib/constants/expense-categories';
import { format, getDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string | null;
}

interface SpendingHeatmapProps {
  expenses: Expense[];
  isLoading?: boolean;
}

const DAYS_OF_WEEK = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

const CATEGORIES: ExpenseCategory[] = [
  'meals', 'travel', 'fuel', 'equipment', 'software', 
  'professional_services', 'office_supplies', 'utilities', 
  'advertising', 'materials', 'other'
];

export const SpendingHeatmap = memo(({ expenses, isLoading }: SpendingHeatmapProps) => {
  const { t, language } = useLanguage();
  
  const heatmapData = useMemo(() => {
    const matrix: Record<string, Record<number, { total: number; count: number; expenses: Expense[] }>> = {};
    
    // Initialize matrix
    CATEGORIES.forEach(category => {
      matrix[category] = {};
      for (let day = 0; day < 7; day++) {
        matrix[category][day] = { total: 0, count: 0, expenses: [] };
      }
    });
    
    // Populate with expense data
    expenses.forEach(expense => {
      const category = (expense.category as ExpenseCategory) || 'other';
      if (!CATEGORIES.includes(category)) return;
      
      const dayOfWeek = getDay(new Date(expense.date));
      if (matrix[category] && matrix[category][dayOfWeek]) {
        matrix[category][dayOfWeek].total += expense.amount;
        matrix[category][dayOfWeek].count += 1;
        matrix[category][dayOfWeek].expenses.push(expense);
      }
    });
    
    return matrix;
  }, [expenses]);
  
  const maxValue = useMemo(() => {
    let max = 0;
    Object.values(heatmapData).forEach(categoryData => {
      Object.values(categoryData).forEach(cell => {
        if (cell.total > max) max = cell.total;
      });
    });
    return max || 1;
  }, [heatmapData]);
  
  const getIntensity = (value: number): string => {
    if (value === 0) return 'bg-muted/30';
    const ratio = value / maxValue;
    if (ratio < 0.2) return 'bg-emerald-500/20';
    if (ratio < 0.4) return 'bg-emerald-500/40';
    if (ratio < 0.6) return 'bg-amber-500/50';
    if (ratio < 0.8) return 'bg-orange-500/60';
    return 'bg-red-500/70';
  };
  
  const days = DAYS_OF_WEEK[language] || DAYS_OF_WEEK.es;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <div className="h-5 w-40 bg-muted animate-pulse rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 {language === 'es' ? 'Mapa de Calor de Gastos' : 'Spending Heatmap'}
        </CardTitle>
        <CardDescription>
          {language === 'es' 
            ? 'Patrones de gasto por día de la semana y categoría' 
            : 'Spending patterns by day of week and category'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header row with days */}
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                {language === 'es' ? 'Categoría' : 'Category'}
              </div>
              {days.map((day, idx) => (
                <div key={idx} className="text-xs font-medium text-center text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Data rows */}
            <TooltipProvider>
              {CATEGORIES.map(category => (
                <div key={category} className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 mb-1">
                  <div className="text-xs truncate pr-2 flex items-center">
                    {getCategoryLabelByLanguage(category, language)}
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map(day => {
                    const cell = heatmapData[category]?.[day] || { total: 0, count: 0, expenses: [] };
                    return (
                      <Tooltip key={day}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`h-8 rounded cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${getIntensity(cell.total)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {getCategoryLabelByLanguage(category, language)} - {days[day]}
                            </p>
                            <p className="text-sm">
                              {language === 'es' ? 'Total' : 'Total'}: ${cell.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cell.count} {language === 'es' ? 'transacciones' : 'transactions'}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">
                {language === 'es' ? 'Menos' : 'Less'}
              </span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-muted/30" />
                <div className="w-4 h-4 rounded bg-emerald-500/20" />
                <div className="w-4 h-4 rounded bg-emerald-500/40" />
                <div className="w-4 h-4 rounded bg-amber-500/50" />
                <div className="w-4 h-4 rounded bg-orange-500/60" />
                <div className="w-4 h-4 rounded bg-red-500/70" />
              </div>
              <span className="text-xs text-muted-foreground">
                {language === 'es' ? 'Más' : 'More'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SpendingHeatmap.displayName = 'SpendingHeatmap';
