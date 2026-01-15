import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface FinancialData {
  monthlyExpenses: number;
  monthlyIncome: number;
  yearlyExpenses: number;
  yearlyIncome: number;
  balance: number;
  pendingReceipts: number;
  clientCount: number;
  projectCount: number;
  deductibleTotal?: number;
  billableTotal?: number;
}

interface ContextInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  message: string;
  priority: number;
  actionCommand?: string;
}

interface SmartContextResult {
  insights: ContextInsight[];
  getTimeBasedGreeting: () => string;
  getMotivationalMessage: () => string;
  getSituationalSuggestion: () => string | null;
  getFollowUpSuggestions: (lastIntent: string | null) => string[];
}

/**
 * Hook for generating smart contextual insights and suggestions
 */
export function useSmartContext(
  financialData: FinancialData,
  language: 'es' | 'en'
): SmartContextResult {
  const location = useLocation();
  const isSpanish = language === 'es';

  // Generate insights based on financial data
  const insights = useMemo(() => {
    const insights: ContextInsight[] = [];

    // Savings rate analysis
    const savingsRate = financialData.monthlyIncome > 0
      ? ((financialData.monthlyIncome - financialData.monthlyExpenses) / financialData.monthlyIncome) * 100
      : 0;

    if (savingsRate > 50) {
      insights.push({
        type: 'achievement',
        message: isSpanish 
          ? `¡Impresionante! Ahorras el ${savingsRate.toFixed(0)}% de tus ingresos.`
          : `Impressive! You save ${savingsRate.toFixed(0)}% of your income.`,
        priority: 8,
        actionCommand: isSpanish ? 'calculador FIRE' : 'FIRE calculator',
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        type: 'warning',
        message: isSpanish
          ? 'Tu tasa de ahorro es baja. Considera revisar gastos.'
          : 'Your savings rate is low. Consider reviewing expenses.',
        priority: 9,
        actionCommand: isSpanish ? 'analiza mis gastos' : 'analyze my expenses',
      });
    }

    // Pending work
    if (financialData.pendingReceipts > 5) {
      insights.push({
        type: 'tip',
        message: isSpanish
          ? `Tienes ${financialData.pendingReceipts} recibos esperando revisión.`
          : `You have ${financialData.pendingReceipts} receipts awaiting review.`,
        priority: 7,
        actionCommand: isSpanish ? 'centro de revisión' : 'review center',
      });
    }

    // Balance status
    if (financialData.balance > financialData.yearlyIncome * 0.2) {
      insights.push({
        type: 'achievement',
        message: isSpanish
          ? '¡Excelente balance positivo este año!'
          : 'Excellent positive balance this year!',
        priority: 6,
      });
    }

    // Tax optimization opportunity
    if ((financialData.deductibleTotal || 0) > 1000) {
      insights.push({
        type: 'opportunity',
        message: isSpanish
          ? `Tienes $${financialData.deductibleTotal?.toLocaleString()} en gastos deducibles.`
          : `You have $${financialData.deductibleTotal?.toLocaleString()} in deductible expenses.`,
        priority: 7,
        actionCommand: isSpanish ? 'optimizador de impuestos' : 'tax optimizer',
      });
    }

    return insights.sort((a, b) => b.priority - a.priority);
  }, [financialData, isSpanish]);

  // Time-based greeting
  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return isSpanish ? '¡Buenos días!' : 'Good morning!';
    } else if (hour < 18) {
      return isSpanish ? '¡Buenas tardes!' : 'Good afternoon!';
    } else {
      return isSpanish ? '¡Buenas noches!' : 'Good evening!';
    }
  }, [isSpanish]);

  // Motivational messages based on data
  const getMotivationalMessage = useCallback(() => {
    const messages = isSpanish ? [
      "Cada gasto registrado te acerca al control total.",
      "La claridad financiera es poder.",
      "Pequeños hábitos crean grandes resultados.",
      "Tu futuro financiero empieza hoy.",
      "El conocimiento de tus números es libertad.",
    ] : [
      "Every tracked expense brings you closer to total control.",
      "Financial clarity is power.",
      "Small habits create big results.",
      "Your financial future starts today.",
      "Knowing your numbers is freedom.",
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }, [isSpanish]);

  // Situational suggestions based on current page and data
  const getSituationalSuggestion = useCallback((): string | null => {
    const path = location.pathname;

    const suggestions: Record<string, () => string | null> = {
      '/dashboard': () => {
        if (financialData.pendingReceipts > 0) {
          return isSpanish
            ? 'Tienes recibos pendientes. ¿Quieres revisarlos?'
            : 'You have pending receipts. Want to review them?';
        }
        return null;
      },
      '/expenses': () => {
        if (financialData.monthlyExpenses > financialData.monthlyIncome * 0.8) {
          return isSpanish
            ? 'Tus gastos están cerca de tus ingresos. Considera revisar categorías.'
            : 'Your expenses are close to your income. Consider reviewing categories.';
        }
        return null;
      },
      '/income': () => {
        if (financialData.clientCount === 0) {
          return isSpanish
            ? 'Agregar clientes te ayudará a organizar mejor tus ingresos.'
            : 'Adding clients will help you better organize your income.';
        }
        return null;
      },
    };

    return suggestions[path]?.() || null;
  }, [location.pathname, financialData, isSpanish]);

  // Follow-up suggestions based on last intent
  const getFollowUpSuggestions = useCallback((lastIntent: string | null): string[] => {
    if (!lastIntent) return [];

    const followUps: Record<string, string[]> = {
      navigate: isSpanish
        ? ['Explícame esta página', 'Qué puedo hacer aquí', 'Volver atrás']
        : ['Explain this page', 'What can I do here', 'Go back'],
      query: isSpanish
        ? ['Dame más detalles', 'Compara con el mes anterior', 'Cómo puedo mejorar']
        : ['Give me more details', 'Compare with last month', 'How can I improve'],
      clarify: isSpanish
        ? ['Sí, eso', 'Muéstrame las opciones', 'Cancelar']
        : ['Yes, that', 'Show me the options', 'Cancel'],
    };

    return followUps[lastIntent] || [];
  }, [isSpanish]);

  return {
    insights,
    getTimeBasedGreeting,
    getMotivationalMessage,
    getSituationalSuggestion,
    getFollowUpSuggestions,
  };
}
