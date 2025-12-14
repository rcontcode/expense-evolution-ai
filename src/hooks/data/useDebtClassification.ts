import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClassifiedDebt {
  id: string;
  name: string;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  debt_type: 'good' | 'bad';
  generates_income: boolean;
  monthly_income_generated: number;
  category: string;
  netCost: number; // Monthly cost minus income generated
  roi: number; // Return on investment (for good debt)
}

export interface DebtClassificationData {
  goodDebt: ClassifiedDebt[];
  badDebt: ClassifiedDebt[];
  totalGoodDebt: number;
  totalBadDebt: number;
  totalDebt: number;
  goodDebtRatio: number;
  totalMonthlyFromGoodDebt: number;
  netMonthlyCostBadDebt: number;
  recommendations: string[];
  isLoading: boolean;
}

export function useDebtClassification(): DebtClassificationData {
  const { user } = useAuth();

  const { data: liabilities, isLoading } = useQuery({
    queryKey: ['liabilities-classified', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .eq('user_id', user.id)
        .order('current_balance', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const result = useMemo(() => {
    if (!liabilities || liabilities.length === 0) {
      return {
        goodDebt: [],
        badDebt: [],
        totalGoodDebt: 0,
        totalBadDebt: 0,
        totalDebt: 0,
        goodDebtRatio: 0,
        totalMonthlyFromGoodDebt: 0,
        netMonthlyCostBadDebt: 0,
        recommendations: [
          'No tienes deudas registradas. ¡Excelente posición!',
          'Si tienes deudas, agrégalas para clasificarlas como buenas o malas',
        ],
      };
    }

    const classifiedDebts: ClassifiedDebt[] = liabilities.map(liability => {
      const monthlyPayment = liability.minimum_payment || 0;
      const monthlyIncomeGenerated = liability.monthly_income_generated || 0;
      const netCost = monthlyPayment - monthlyIncomeGenerated;
      const isGoodDebt = liability.debt_type === 'good' || liability.generates_income;
      
      // Calculate ROI for good debt
      let roi = 0;
      if (isGoodDebt && monthlyPayment > 0) {
        roi = ((monthlyIncomeGenerated - monthlyPayment) / monthlyPayment) * 100;
      }

      return {
        id: liability.id,
        name: liability.name,
        current_balance: liability.current_balance,
        interest_rate: liability.interest_rate,
        minimum_payment: liability.minimum_payment,
        debt_type: isGoodDebt ? 'good' : 'bad',
        generates_income: liability.generates_income || false,
        monthly_income_generated: monthlyIncomeGenerated,
        category: liability.category,
        netCost,
        roi,
      };
    });

    const goodDebt = classifiedDebts.filter(d => d.debt_type === 'good');
    const badDebt = classifiedDebts.filter(d => d.debt_type === 'bad');

    const totalGoodDebt = goodDebt.reduce((sum, d) => sum + d.current_balance, 0);
    const totalBadDebt = badDebt.reduce((sum, d) => sum + d.current_balance, 0);
    const totalDebt = totalGoodDebt + totalBadDebt;
    const goodDebtRatio = totalDebt > 0 ? (totalGoodDebt / totalDebt) * 100 : 0;

    const totalMonthlyFromGoodDebt = goodDebt.reduce((sum, d) => sum + d.monthly_income_generated, 0);
    const netMonthlyCostBadDebt = badDebt.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);

    // Generate recommendations based on Kiyosaki's principles
    const recommendations: string[] = [];

    if (totalBadDebt > totalGoodDebt) {
      recommendations.push('Kiyosaki: "La deuda mala te hace más pobre, la buena te hace más rico"');
      recommendations.push('Prioriza pagar la deuda mala antes de adquirir más deuda');
    }

    if (badDebt.length > 0) {
      const highestInterestBad = badDebt.sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))[0];
      if (highestInterestBad) {
        recommendations.push(`Paga primero "${highestInterestBad.name}" (${highestInterestBad.interest_rate}% interés)`);
      }
    }

    if (goodDebt.length > 0 && totalMonthlyFromGoodDebt > 0) {
      recommendations.push(`Tu deuda buena genera $${totalMonthlyFromGoodDebt.toFixed(0)}/mes en ingresos`);
    }

    if (goodDebtRatio < 50 && totalDebt > 0) {
      recommendations.push('Meta: Convierte tu estructura de deuda a más de 50% deuda buena');
    }

    if (netMonthlyCostBadDebt > 0) {
      recommendations.push(`Estás pagando $${netMonthlyCostBadDebt.toFixed(0)}/mes en deuda que no genera ingresos`);
    }

    return {
      goodDebt,
      badDebt,
      totalGoodDebt,
      totalBadDebt,
      totalDebt,
      goodDebtRatio,
      totalMonthlyFromGoodDebt,
      netMonthlyCostBadDebt,
      recommendations,
    };
  }, [liabilities]);

  return {
    ...result,
    isLoading,
  };
}

export function useUpdateDebtType() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      debt_type, 
      generates_income, 
      monthly_income_generated 
    }: { 
      id: string; 
      debt_type: 'good' | 'bad'; 
      generates_income?: boolean;
      monthly_income_generated?: number;
    }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('liabilities')
        .update({
          debt_type,
          generates_income: generates_income ?? (debt_type === 'good'),
          monthly_income_generated: monthly_income_generated ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities-classified'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast.success('Clasificación de deuda actualizada');
    },
  });
}
