import { useMemo } from "react";
import { useExpenses } from "@/hooks/data/useExpenses";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

interface BudgetSuggestionOptions {
  monthsToConsider?: number;
  marginPercent?: number;
}

interface CategorySuggestion {
  category: string;
  averageSpent: number;
  suggestedBudget: number;
  monthsWithData: number;
}

interface BudgetSuggestions {
  globalSuggestion: number;
  globalAverage: number;
  categorySuggestions: Record<string, CategorySuggestion>;
  isLoading: boolean;
}

export function useBudgetSuggestions(options?: BudgetSuggestionOptions): BudgetSuggestions {
  const monthsToConsider = options?.monthsToConsider ?? 3;
  const marginPercent = options?.marginPercent ?? 10;
  
  // Calculate date range for the last N months
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, monthsToConsider));
  const endDate = endOfMonth(subMonths(now, 1)); // Up to end of last month
  
  const { data: expenses = [], isLoading } = useExpenses({
    dateRange: { start: startDate, end: endDate }
  });

  const suggestions = useMemo(() => {
    if (expenses.length === 0) {
      return {
        globalSuggestion: 0,
        globalAverage: 0,
        categorySuggestions: {}
      };
    }

    // Group expenses by month
    const monthlyTotals: number[] = [];
    const categoryMonthlyTotals: Record<string, number[]> = {};
    
    for (let i = monthsToConsider; i >= 1; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
      });
      
      const monthTotal = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      monthlyTotals.push(monthTotal);
      
      // Group by category
      const categoryTotals: Record<string, number> = {};
      monthExpenses.forEach(exp => {
        const cat = exp.category || "other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
      });
      
      Object.entries(categoryTotals).forEach(([category, total]) => {
        if (!categoryMonthlyTotals[category]) {
          categoryMonthlyTotals[category] = [];
        }
        categoryMonthlyTotals[category].push(total);
      });
    }
    
    // Calculate global suggestion
    const globalAverage = monthlyTotals.reduce((sum, t) => sum + t, 0) / (monthlyTotals.length || 1);
    const globalSuggestion = globalAverage * (1 + marginPercent / 100);
    
    // Calculate category suggestions
    const categorySuggestions: Record<string, CategorySuggestion> = {};
    
    Object.entries(categoryMonthlyTotals).forEach(([category, totals]) => {
      const avg = totals.reduce((sum, t) => sum + t, 0) / (totals.length || 1);
      const suggestion = avg * (1 + marginPercent / 100);
      
      categorySuggestions[category] = {
        category,
        averageSpent: avg,
        suggestedBudget: Math.round(suggestion),
        monthsWithData: totals.length
      };
    });
    
    return {
      globalSuggestion: Math.round(globalSuggestion),
      globalAverage: Math.round(globalAverage),
      categorySuggestions
    };
  }, [expenses, monthsToConsider, marginPercent]);

  return {
    ...suggestions,
    isLoading
  };
}

// Helper function to get suggestion for a specific category
export function getCategorySuggestion(
  suggestions: BudgetSuggestions,
  category: string
): CategorySuggestion | null {
  return suggestions.categorySuggestions[category] || null;
}
