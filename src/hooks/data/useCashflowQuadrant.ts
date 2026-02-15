import { useMemo } from 'react';
import { useIncome } from './useIncome';
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
  salary: 'E',
  bonus: 'E',
  freelance: 'S',
  client_payment: 'S',
  online_business: 'S',
  passive_royalties: 'B',
  investment_stocks: 'I',
  investment_crypto: 'I',
  investment_funds: 'I',
  passive_rental: 'I',
  gift: 'E',
  refund: 'E',
  other: 'S',
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

export function useCashflowQuadrant(language: 'es' | 'en' = 'es'): CashflowQuadrantResult {
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
          language === 'es'
            ? 'Comienza registrando tus ingresos para ver tu cuadrante actual'
            : 'Start recording your income to see your current quadrant',
          language === 'es'
            ? 'El objetivo es mover más ingresos hacia el cuadrante I (Inversor)'
            : 'The goal is to move more income toward the I (Investor) quadrant',
        ],
      };
    }

    const quadrantTotals: Record<QuadrantType, number> = { E: 0, S: 0, B: 0, I: 0 };
    
    incomeData.forEach(income => {
      const quadrant = INCOME_TO_QUADRANT[income.income_type] || 'S';
      quadrantTotals[quadrant] += income.amount;
    });

    const totalIncome = Object.values(quadrantTotals).reduce((a, b) => a + b, 0);

    const quadrants: QuadrantData[] = (['E', 'S', 'B', 'I'] as QuadrantType[]).map(type => ({
      ...QUADRANT_INFO[type],
      amount: quadrantTotals[type],
      percentage: totalIncome > 0 ? (quadrantTotals[type] / totalIncome) * 100 : 0,
    }));

    const dominantQuadrant = (Object.entries(quadrantTotals)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'E') as QuadrantType;

    const progressToI = totalIncome > 0 ? (quadrantTotals.I / totalIncome) * 100 : 0;

    const recommendations: string[] = [];
    
    if (quadrantTotals.E > quadrantTotals.I) {
      recommendations.push(language === 'es'
        ? 'Kiyosaki: "Los ricos no trabajan por dinero, hacen que el dinero trabaje para ellos"'
        : 'Kiyosaki: "The rich don\'t work for money, they make money work for them"');
    }
    
    if (dominantQuadrant === 'E') {
      recommendations.push(language === 'es'
        ? 'Considera desarrollar habilidades de freelance o invertir parte de tu salario'
        : 'Consider developing freelance skills or investing part of your salary');
      recommendations.push(language === 'es'
        ? 'Destina al menos 10% de tu ingreso a inversiones para comenzar a moverte al cuadrante I'
        : 'Allocate at least 10% of your income to investments to start moving to quadrant I');
    } else if (dominantQuadrant === 'S') {
      recommendations.push(language === 'es'
        ? 'Busca formas de sistematizar tu negocio para moverte al cuadrante B'
        : 'Find ways to systemize your business to move to quadrant B');
      recommendations.push(language === 'es'
        ? 'Invierte en activos que generen ingresos pasivos'
        : 'Invest in assets that generate passive income');
    } else if (dominantQuadrant === 'B') {
      recommendations.push(language === 'es'
        ? '¡Excelente! Ahora enfócate en invertir las ganancias de tu negocio'
        : 'Excellent! Now focus on investing your business profits');
      recommendations.push(language === 'es'
        ? 'Diversifica en diferentes tipos de inversiones'
        : 'Diversify across different types of investments');
    } else if (dominantQuadrant === 'I') {
      recommendations.push(language === 'es'
        ? '¡Felicidades! Estás en el cuadrante de la libertad financiera'
        : 'Congratulations! You\'re in the financial freedom quadrant');
      recommendations.push(language === 'es'
        ? 'Continúa diversificando y reinvirtiendo tus ganancias'
        : 'Continue diversifying and reinvesting your earnings');
    }

    if (progressToI < 10) {
      recommendations.push(language === 'es'
        ? 'Meta: Lograr que al menos 10% de tus ingresos sean del cuadrante I'
        : 'Goal: Get at least 10% of your income from quadrant I');
    } else if (progressToI < 25) {
      recommendations.push(language === 'es'
        ? 'Buen progreso. Meta: Lograr 25% de ingresos del cuadrante I'
        : 'Good progress. Goal: Reach 25% income from quadrant I');
    } else if (progressToI < 50) {
      recommendations.push(language === 'es'
        ? '¡Vas muy bien! Meta: 50% de ingresos pasivos'
        : 'Doing great! Goal: 50% passive income');
    }

    return {
      quadrants,
      totalIncome,
      dominantQuadrant,
      progressToI,
      recommendations,
    };
  }, [incomeData, language]);

  return {
    ...result,
    isLoading,
  };
}
