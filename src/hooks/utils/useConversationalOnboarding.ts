import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpsertFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Conversational onboarding question flow
export interface OnboardingQuestion {
  id: string;
  question: { es: string; en: string };
  phoenixIntro: { es: string; en: string };
  options: OnboardingOption[];
  field: string;
  allowMultiple?: boolean;
  allowCustom?: boolean;
}

export interface OnboardingOption {
  id: string;
  label: { es: string; en: string };
  description?: { es: string; en: string };
  value: string;
  icon?: string;
}

export interface OnboardingState {
  currentStep: number;
  responses: Record<string, string | string[]>;
  isComplete: boolean;
  isLoading: boolean;
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'goal',
    question: {
      es: '¿Cuál es tu principal meta financiera?',
      en: 'What is your main financial goal?'
    },
    phoenixIntro: {
      es: '¡Hola! 👋 Soy Phoenix, tu asistente financiero personal. Para ayudarte mejor, me gustaría conocerte un poco.',
      en: 'Hello! 👋 I\'m Phoenix, your personal financial assistant. To help you better, I\'d like to get to know you a bit.'
    },
    options: [
      { id: 'debt', label: { es: 'Salir de deudas', en: 'Get out of debt' }, value: 'debt_free', icon: '💪' },
      { id: 'save', label: { es: 'Ahorrar más', en: 'Save more' }, value: 'savings', icon: '💰' },
      { id: 'retire', label: { es: 'Retiro temprano (FIRE)', en: 'Early retirement (FIRE)' }, value: 'fire', icon: '🔥' },
      { id: 'passive', label: { es: 'Ingresos pasivos', en: 'Passive income' }, value: 'passive_income', icon: '📈' },
      { id: 'organize', label: { es: 'Organizar mis finanzas', en: 'Organize my finances' }, value: 'organization', icon: '📊' },
    ],
    field: 'passions',
    allowMultiple: true,
  },
  {
    id: 'experience',
    question: {
      es: '¿Cómo describirías tu experiencia con dinero e inversiones?',
      en: 'How would you describe your experience with money and investments?'
    },
    phoenixIntro: {
      es: 'Excelente elección. Ahora, para calibrar mis explicaciones...',
      en: 'Great choice. Now, to calibrate my explanations...'
    },
    options: [
      { 
        id: 'beginner', 
        label: { es: 'Principiante', en: 'Beginner' }, 
        description: { es: 'Estoy empezando a aprender', en: 'I\'m just starting to learn' },
        value: 'beginner', 
        icon: '🌱' 
      },
      { 
        id: 'intermediate', 
        label: { es: 'Intermedio', en: 'Intermediate' }, 
        description: { es: 'Conozco lo básico', en: 'I know the basics' },
        value: 'intermediate', 
        icon: '📚' 
      },
      { 
        id: 'advanced', 
        label: { es: 'Avanzado', en: 'Advanced' }, 
        description: { es: 'Tengo experiencia significativa', en: 'I have significant experience' },
        value: 'advanced', 
        icon: '🎓' 
      },
    ],
    field: 'financial_education_level',
  },
  {
    id: 'risk',
    question: {
      es: '¿Qué te incomoda más: perder dinero o perder oportunidades?',
      en: 'What bothers you more: losing money or missing opportunities?'
    },
    phoenixIntro: {
      es: 'Entender tu relación con el riesgo me ayudará a darte mejores consejos.',
      en: 'Understanding your relationship with risk will help me give you better advice.'
    },
    options: [
      { 
        id: 'conservative', 
        label: { es: 'Perder dinero', en: 'Losing money' }, 
        description: { es: 'Prefiero seguridad', en: 'I prefer safety' },
        value: 'conservative', 
        icon: '🛡️' 
      },
      { 
        id: 'moderate', 
        label: { es: 'Ambos por igual', en: 'Both equally' }, 
        description: { es: 'Balance es clave', en: 'Balance is key' },
        value: 'moderate', 
        icon: '⚖️' 
      },
      { 
        id: 'aggressive', 
        label: { es: 'Perder oportunidades', en: 'Missing opportunities' }, 
        description: { es: 'Acepto más riesgo', en: 'I accept more risk' },
        value: 'aggressive', 
        icon: '🚀' 
      },
    ],
    field: 'risk_tolerance',
  },
  {
    id: 'time',
    question: {
      es: '¿Cuánto tiempo puedes dedicar a tus finanzas cada semana?',
      en: 'How much time can you dedicate to your finances each week?'
    },
    phoenixIntro: {
      es: 'Esto me ayudará a sugerirte acciones realistas.',
      en: 'This will help me suggest realistic actions.'
    },
    options: [
      { 
        id: 'minimal', 
        label: { es: 'Menos de 1 hora', en: 'Less than 1 hour' }, 
        value: 'minimal', 
        icon: '⏱️' 
      },
      { 
        id: 'moderate', 
        label: { es: '1-3 horas', en: '1-3 hours' }, 
        value: 'part_time', 
        icon: '🕐' 
      },
      { 
        id: 'significant', 
        label: { es: 'Más de 3 horas', en: 'More than 3 hours' }, 
        value: 'full_time', 
        icon: '📅' 
      },
    ],
    field: 'time_availability',
  },
  {
    id: 'capital',
    question: {
      es: '¿Tienes algún ahorro o capital disponible para invertir?',
      en: 'Do you have any savings or capital available to invest?'
    },
    phoenixIntro: {
      es: 'No te preocupes, esto es solo para contextualizar mis consejos.',
      en: 'Don\'t worry, this is just to contextualize my advice.'
    },
    options: [
      { id: 'none', label: { es: 'Aún no tengo ahorros', en: 'No savings yet' }, value: '0', icon: '🌱' },
      { id: 'small', label: { es: 'Menos de $5,000', en: 'Less than $5,000' }, value: '2500', icon: '💵' },
      { id: 'medium', label: { es: '$5,000 - $25,000', en: '$5,000 - $25,000' }, value: '15000', icon: '💰' },
      { id: 'large', label: { es: 'Más de $25,000', en: 'More than $25,000' }, value: '50000', icon: '🏦' },
    ],
    field: 'available_capital',
  },
  {
    id: 'monthly',
    question: {
      es: '¿Cuánto podrías apartar mensualmente para tus metas?',
      en: 'How much could you set aside monthly for your goals?'
    },
    phoenixIntro: {
      es: 'Último paso! Esto me permitirá calcular proyecciones realistas.',
      en: 'Last step! This will allow me to calculate realistic projections.'
    },
    options: [
      { id: 'tight', label: { es: 'Menos de $100', en: 'Less than $100' }, value: '50', icon: '🪙' },
      { id: 'modest', label: { es: '$100 - $500', en: '$100 - $500' }, value: '300', icon: '💵' },
      { id: 'good', label: { es: '$500 - $1,500', en: '$500 - $1,500' }, value: '1000', icon: '💰' },
      { id: 'great', label: { es: 'Más de $1,500', en: 'More than $1,500' }, value: '2000', icon: '🎯' },
    ],
    field: 'monthly_investment_capacity',
  },
];

export function useConversationalOnboarding() {
  const { user } = useAuth();
  const upsertProfile = useUpsertFinancialProfile();
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    responses: {},
    isComplete: false,
    isLoading: false,
  });

  const currentQuestion = ONBOARDING_QUESTIONS[state.currentStep];
  const totalSteps = ONBOARDING_QUESTIONS.length;
  const progress = ((state.currentStep) / totalSteps) * 100;

  const selectOption = useCallback((optionValue: string) => {
    if (!currentQuestion) return;
    
    const field = currentQuestion.field;
    
    if (currentQuestion.allowMultiple) {
      // Toggle selection for multi-select
      setState(prev => {
        const currentValues = (prev.responses[field] as string[]) || [];
        const newValues = currentValues.includes(optionValue)
          ? currentValues.filter(v => v !== optionValue)
          : [...currentValues, optionValue];
        
        return {
          ...prev,
          responses: { ...prev.responses, [field]: newValues },
        };
      });
    } else {
      // Single select - move to next
      setState(prev => ({
        ...prev,
        responses: { ...prev.responses, [field]: optionValue },
      }));
    }
  }, [currentQuestion]);

  const nextStep = useCallback(() => {
    if (state.currentStep < totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      // Complete onboarding
      saveProfile();
    }
  }, [state.currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const saveProfile = useCallback(async () => {
    if (!user) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const responses = state.responses;
      
      // Build profile data from responses
      const profileData = {
        passions: Array.isArray(responses.passions) ? responses.passions : [responses.passions].filter(Boolean),
        financial_education_level: responses.financial_education_level as string,
        risk_tolerance: responses.risk_tolerance as string,
        time_availability: responses.time_availability as string,
        available_capital: parseFloat(responses.available_capital as string) || 0,
        monthly_investment_capacity: parseFloat(responses.monthly_investment_capacity as string) || 0,
      };
      
      // Save financial profile
      await upsertProfile.mutateAsync(profileData);
      
      // Mark onboarding as completed
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      setState(prev => ({ ...prev, isComplete: true, isLoading: false }));
      toast.success('¡Perfil completado! 🎉');
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Error al guardar el perfil');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, state.responses, upsertProfile]);

  const getPersonalizedSummary = useCallback((lang: 'es' | 'en') => {
    const responses = state.responses;
    
    const goalLabels: Record<string, { es: string; en: string }> = {
      debt_free: { es: 'liberarte de deudas', en: 'become debt-free' },
      savings: { es: 'aumentar tus ahorros', en: 'increase your savings' },
      fire: { es: 'alcanzar la independencia financiera', en: 'achieve financial independence' },
      passive_income: { es: 'generar ingresos pasivos', en: 'generate passive income' },
      organization: { es: 'organizar tus finanzas', en: 'organize your finances' },
    };
    
    const goals = Array.isArray(responses.passions) ? responses.passions : [responses.passions];
    const goalText = goals
      .filter(Boolean)
      .map(g => goalLabels[g]?.[lang] || g)
      .join(lang === 'es' ? ' y ' : ' and ');
    
    const riskLabels: Record<string, { es: string; en: string }> = {
      conservative: { es: 'conservador', en: 'conservative' },
      moderate: { es: 'moderado', en: 'moderate' },
      aggressive: { es: 'orientado al crecimiento', en: 'growth-oriented' },
    };
    
    const riskText = riskLabels[responses.risk_tolerance as string]?.[lang] || '';
    
    if (lang === 'es') {
      return `Basado en tus respuestas, tu meta es ${goalText}. Tienes un perfil de riesgo ${riskText}. ¡Vamos a trabajar juntos para lograrlo!`;
    } else {
      return `Based on your answers, your goal is to ${goalText}. You have a ${riskText} risk profile. Let's work together to achieve it!`;
    }
  }, [state.responses]);

  return {
    state,
    currentQuestion,
    totalSteps,
    progress,
    selectOption,
    nextStep,
    previousStep,
    saveProfile,
    getPersonalizedSummary,
    questions: ONBOARDING_QUESTIONS,
  };
}
