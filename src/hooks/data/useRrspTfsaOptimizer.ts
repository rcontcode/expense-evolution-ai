import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useFinancialProfile } from './useFinancialProfile';
import { useIncome } from './useIncome';
import { toast } from 'sonner';

interface TfsaRrspRecommendation {
  recommended: number;
  taxSavings: number;
  reasoning: string;
}

interface OptimizationResult {
  recommendations: {
    tfsa: TfsaRrspRecommendation;
    rrsp: TfsaRrspRecommendation;
    priority: 'tfsa' | 'rrsp' | 'both';
    strategy: string;
    projections: {
      year1: number;
      year5: number;
      year10: number;
    };
  };
  taxInfo: {
    marginalRates: {
      federal: number;
      provincial: number;
      combined: number;
    };
    rrspRoom: number;
    tfsaLimit: number;
  };
}

export function useRrspTfsaOptimizer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = useProfile();
  const { data: financialProfile } = useFinancialProfile();
  const { data: incomeData } = useIncome();

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

      if (!profile?.province) {
        throw new Error('Por favor completa tu provincia en el perfil de negocio para cálculos fiscales precisos.');
      }

      const { data, error: fnError } = await supabase.functions.invoke('optimize-rrsp-tfsa', {
        body: {
          annualIncome,
          province: profile.province,
          workTypes: profile.work_types || [],
          currentSavings: financialProfile?.available_capital || 0,
          monthlyInvestmentCapacity: financialProfile?.monthly_investment_capacity || 0
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('Análisis TFSA/RRSP completado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar opciones';
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
