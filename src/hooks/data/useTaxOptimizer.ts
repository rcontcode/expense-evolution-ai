import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExpenses } from './useExpenses';
import { useProfile } from './useProfile';
import { TAX_DEDUCTION_RULES } from './useTaxCalculations';
import { toast } from 'sonner';

interface QuickInsight {
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface OptimizationResult {
  suggestions: string;
  quickInsights: QuickInsight[];
  summary: {
    totalExpenses: number;
    totalDeductible: number;
    potentialSavings: number;
    deductionRate: number;
  };
}

export function useTaxOptimizer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: expenses } = useExpenses();
  const { data: profile } = useProfile();

  const analyzeAndOptimize = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Aggregate expenses by category
      const categoryTotals = new Map<string, { total: number; count: number }>();
      
      (expenses || []).forEach(expense => {
        const category = expense.category || 'other';
        const current = categoryTotals.get(category) || { total: 0, count: 0 };
        categoryTotals.set(category, {
          total: current.total + Number(expense.amount),
          count: current.count + 1
        });
      });

      // Build expense summary with deduction rates
      const expenseSummary = Array.from(categoryTotals.entries()).map(([category, data]) => {
        const rule = TAX_DEDUCTION_RULES.find(r => r.category === category);
        return {
          category,
          total: data.total,
          count: data.count,
          deductionRate: rule?.deductionRate || 1.0
        };
      });

      const { data, error: fnError } = await supabase.functions.invoke('optimize-taxes', {
        body: {
          expenses: expenseSummary,
          workTypes: profile?.work_types || [],
          province: profile?.province || '',
          gstHstRegistered: profile?.gst_hst_registered || false,
          businessName: profile?.business_name
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('Análisis de optimización completado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar impuestos';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    result,
    error,
    analyzeAndOptimize,
    clearResult
  };
}
