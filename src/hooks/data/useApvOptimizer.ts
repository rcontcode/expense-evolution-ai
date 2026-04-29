import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useFinancialProfile } from './useFinancialProfile';
import { useIncome } from './useIncome';
import { toast } from 'sonner';
import { useAIErrorHandler } from '@/hooks/utils/useAIErrorHandler';

interface ApvRecommendation {
  recommended: number;
  taxBenefit: number;
  reasoning: string;
}

interface ApvOptimizationResult {
  recommendations: {
    apvRegimenA: ApvRecommendation;
    apvRegimenB: ApvRecommendation;
    cuenta2: ApvRecommendation;
    priority: 'regimen_a' | 'regimen_b' | 'cuenta2' | 'mixed';
    strategy: string;
    projections: {
      year1: number;
      year5: number;
      year10: number;
    };
  };
  taxInfo: {
    marginalRate: number;
    annualTaxableIncome: number;
    apvLimitUF: number;
    apvLimitCLP: number;
  };
}

export function useApvOptimizer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ApvOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = useProfile();
  const { data: financialProfile } = useFinancialProfile();
  const { data: incomeData } = useIncome();
  const { handleAIError } = useAIErrorHandler();

  const analyzeOptimalContributions = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Calculate annual income from income records
      const currentYear = new Date().getFullYear();
      const annualIncome = (incomeData || [])
        .filter(inc => new Date(inc.date).getFullYear() === currentYear)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);

      if (!annualIncome || annualIncome === 0) {
        throw new Error('No se encontraron ingresos registrados para calcular recomendaciones. Por favor registra tus ingresos primero.');
      }

      const { data, error: fnError } = await supabase.functions.invoke('optimize-apv-chile', {
        body: {
          annualIncome,
          taxRegime: profile?.tax_regime || null,
          currentSavings: financialProfile?.available_capital || 0,
          monthlyInvestmentCapacity: financialProfile?.monthly_investment_capacity || 0
        }
      });

      if (fnError) {
        if (handleAIError(fnError, { feature: 'ai_credits', requiredPlan: 'pro' })) return;
        throw new Error(fnError.message);
      }

      if (data?.error) {
        if (handleAIError(data, { feature: 'ai_credits', requiredPlan: 'pro' })) return;
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('Análisis APV/Cuenta 2 completado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar opciones de ahorro';
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
    analyzeOptimalContributions,
    clearResult
  };
}
