import { useMemo } from 'react';
import { useIncome } from './useIncome';
import { useExpenses } from './useExpenses';
import { useAuth } from '@/contexts/AuthContext';

export type QuadrantType = 'E' | 'S' | 'B' | 'I';

export interface QuadrantData {
  type: QuadrantType;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface CashflowQuadrantResult {
  quadrants: QuadrantData[];
  totalIncome: number;
  dominantQuadrant: QuadrantType;
  progressToI: number;
  recommendations: string[];
  isLoading: boolean;
}

// Map income types to quadrants based on Kiyosaki's model
const INCOME_TO_QUADRANT: Record<string, QuadrantType> = {
  // E - Employee
  salary: 'E',
  bonus: 'E',
  
  // S - Self-Employed
  freelance: 'S',
  client_payment: 'S',
  online_business: 'S',
  
  // B - Business Owner (systems-based income)
  // Note: We'll consider passive royalties and some online businesses as B
  passive_royalties: 'B',
  
  // I - Investor
  investment_stocks: 'I',
  investment_crypto: 'I',
  investment_funds: 'I',
  passive_rental: 'I',
  gift: 'E', // Default to E
  refund: 'E', // Not really income
  other: 'S', // Default to S
};

const QUADRANT_INFO: Record<QuadrantType, Omit<QuadrantData, 'amount' | 'percentage'>> = {
  E: {
    type: 'E',
    name: 'Employee',
    nameEs: 'Empleado',
    description: 'You trade time for money. Job security but limited growth.',
    descriptionEs: 'Intercambias tiempo por dinero. Seguridad laboral pero crecimiento limitado.',
    color: 'hsl(var(--destructive))',
    icon: 'Briefcase',
  },
  S: {
    type: 'S',
    name: 'Self-Employed',
    nameEs: 'Autoempleado',
    description: 'You own a job. More control but still trading time.',
    descriptionEs: 'Eres dueño de un trabajo. Más control pero sigues intercambiando tiempo.',
    color: 'hsl(var(--warning))',
    icon: 'User',
  },
  B: {
    type: 'B',
    name: 'Business Owner',
    nameEs: 'Dueño de Negocio',
    description: 'You own a system. Others work for you.',
    descriptionEs: 'Eres dueño de un sistema. Otros trabajan para ti.',
    color: 'hsl(var(--accent))',
    icon: 'Building2',
  },
  I: {
    type: 'I',
    name: 'Investor',
    nameEs: 'Inversor',
    description: 'Money works for you. True financial freedom.',
    descriptionEs: 'El dinero trabaja para ti. Verdadera libertad financiera.',
    color: 'hsl(var(--primary))',
    icon: 'TrendingUp',
  },
};

export function useCashflowQuadrant(): CashflowQuadrantResult {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const { data: incomeData, isLoading } = useIncome({ year: currentYear });

  const result = useMemo(() => {
    if (!incomeData || incomeData.length === 0) {
      return {
        quadrants: Object.values(QUADRANT_INFO).map(q => ({
          ...q,
          amount: 0,
          percentage: 0,
        })),
        totalIncome: 0,
        dominantQuadrant: 'E' as QuadrantType,
        progressToI: 0,
        recommendations: [
          'Comienza registrando tus ingresos para ver tu cuadrante actual',
          'El objetivo es mover más ingresos hacia el cuadrante I (Inversor)',
        ],
      };
    }

    // Calculate income by quadrant
    const quadrantTotals: Record<QuadrantType, number> = { E: 0, S: 0, B: 0, I: 0 };
    
    incomeData.forEach(income => {
      const quadrant = INCOME_TO_QUADRANT[income.income_type] || 'S';
      quadrantTotals[quadrant] += income.amount;
    });

    const totalIncome = Object.values(quadrantTotals).reduce((a, b) => a + b, 0);

    // Build quadrant data
    const quadrants: QuadrantData[] = (['E', 'S', 'B', 'I'] as QuadrantType[]).map(type => ({
      ...QUADRANT_INFO[type],
      amount: quadrantTotals[type],
      percentage: totalIncome > 0 ? (quadrantTotals[type] / totalIncome) * 100 : 0,
    }));

    // Find dominant quadrant
    const dominantQuadrant = (Object.entries(quadrantTotals)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'E') as QuadrantType;

    // Calculate progress to I (percentage of income from investments)
    const progressToI = totalIncome > 0 ? (quadrantTotals.I / totalIncome) * 100 : 0;

    // Generate recommendations based on current position
    const recommendations: string[] = [];
    
    if (quadrantTotals.E > quadrantTotals.I) {
      recommendations.push('Kiyosaki: "Los ricos no trabajan por dinero, hacen que el dinero trabaje para ellos"');
    }
    
    if (dominantQuadrant === 'E') {
      recommendations.push('Considera desarrollar habilidades de freelance o invertir parte de tu salario');
      recommendations.push('Destina al menos 10% de tu ingreso a inversiones para comenzar a moverte al cuadrante I');
    } else if (dominantQuadrant === 'S') {
      recommendations.push('Busca formas de sistematizar tu negocio para moverte al cuadrante B');
      recommendations.push('Invierte en activos que generen ingresos pasivos');
    } else if (dominantQuadrant === 'B') {
      recommendations.push('¡Excelente! Ahora enfócate en invertir las ganancias de tu negocio');
      recommendations.push('Diversifica en diferentes tipos de inversiones');
    } else if (dominantQuadrant === 'I') {
      recommendations.push('¡Felicidades! Estás en el cuadrante de la libertad financiera');
      recommendations.push('Continúa diversificando y reinvirtiendo tus ganancias');
    }

    if (progressToI < 10) {
      recommendations.push('Meta: Lograr que al menos 10% de tus ingresos sean del cuadrante I');
    } else if (progressToI < 25) {
      recommendations.push('Buen progreso. Meta: Lograr 25% de ingresos del cuadrante I');
    } else if (progressToI < 50) {
      recommendations.push('¡Vas muy bien! Meta: 50% de ingresos pasivos');
    }

    return {
      quadrants,
      totalIncome,
      dominantQuadrant,
      progressToI,
      recommendations,
    };
  }, [incomeData]);

  return {
    ...result,
    isLoading,
  };
}
