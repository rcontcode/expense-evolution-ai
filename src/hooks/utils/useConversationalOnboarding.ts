import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpsertFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { useUpsertLifeProfile, useMarkSectionComplete, LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Conversational onboarding question flow
export interface OnboardingQuestion {
  id: string;
  question: { es: string; en: string };
  phoenixIntro: { es: string; en: string };
  options: OnboardingOption[];
  field: string;
  table: 'financial' | 'life' | 'profile'; // Which table to save to
  section?: LifeProfileSection; // For life profile sections
  allowMultiple?: boolean;
  allowCustom?: boolean;
  isOptional?: boolean; // Can be skipped
  stage: 'essential' | 'extended'; // Essential = must complete, Extended = can do later
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
  skippedSections: string[];
}

// ============= ESSENTIAL QUESTIONS (Must complete) =============
const ESSENTIAL_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'welcome',
    question: {
      es: '¿Cómo te gustaría que te llame?',
      en: 'What should I call you?'
    },
    phoenixIntro: {
      es: '¡¡Hooola!! 🔥 ¡Qué emoción conocerte! Soy Phoenix, tu mentor financiero personal, y estoy aquí para ayudarte a conquistar tus metas. ¡Vamos a hacer magia juntos! Primero, cuéntame:',
      en: "Hey there!! 🔥 I'm SO excited to meet you! I'm Phoenix, your personal financial mentor, and I'm here to help you conquer your goals. Let's make magic together! First, tell me:"
    },
    options: [
      { id: 'first_name', label: { es: 'Mi nombre', en: 'My first name' }, value: 'first_name', icon: '👤' },
      { id: 'nickname', label: { es: 'Un apodo especial', en: 'A special nickname' }, value: 'nickname', icon: '😊' },
    ],
    field: 'name_preference',
    table: 'profile',
    stage: 'essential',
  },
  {
    id: 'life_situation',
    question: {
      es: '¿Cuál describe mejor tu momento actual?',
      en: 'Which best describes your current moment?'
    },
    phoenixIntro: {
      es: '¡Genial! 🎉 Ahora cuéntame un poquito más de ti. Esto me ayuda a darte consejos que realmente te sirvan:',
      en: "Awesome! 🎉 Now tell me a bit more about yourself. This helps me give you advice that actually works for YOU:"
    },
    options: [
      { id: 'single', label: { es: 'Volando solo', en: 'Flying solo' }, description: { es: 'Enfocado en mí', en: 'Focused on me' }, value: 'single', icon: '🦅' },
      { id: 'partnered', label: { es: 'En equipo', en: 'Team player' }, description: { es: 'Con mi pareja', en: 'With my partner' }, value: 'partnered', icon: '💕' },
      { id: 'family', label: { es: 'Modo familia', en: 'Family mode' }, description: { es: 'Con hijos o dependientes', en: 'Kids or dependents' }, value: 'family', icon: '👨‍👩‍👧‍👦' },
    ],
    field: 'relationship_status',
    table: 'life',
    section: 'family',
    stage: 'essential',
  },
  {
    id: 'work_status',
    question: {
      es: '¿Cómo generas tu dinero?',
      en: 'How do you make your money?'
    },
    phoenixIntro: {
      es: '¡Perfecto! 💪 Ahora hablemos de lo que te mantiene ocupado. Tu tipo de trabajo cambia completamente las estrategias que te daré:',
      en: "Perfect! 💪 Now let's talk about what keeps you busy. Your work type totally changes the strategies I'll give you:"
    },
    options: [
      { id: 'employed', label: { es: 'Empleado', en: 'Employee' }, description: { es: 'En una empresa', en: 'At a company' }, value: 'employed', icon: '💼' },
      { id: 'self_employed', label: { es: 'Mi propio jefe', en: 'My own boss' }, description: { es: 'Freelance o negocio', en: 'Freelance or business' }, value: 'self_employed', icon: '🚀' },
      { id: 'mixed', label: { es: 'De todo un poco', en: 'A bit of everything' }, description: { es: 'Empleo + proyectos', en: 'Job + side projects' }, value: 'mixed', icon: '⚡' },
      { id: 'other', label: { es: 'Otra cosa', en: 'Something else' }, description: { es: 'Estudiante, retirado...', en: 'Student, retired...' }, value: 'other', icon: '🌟' },
    ],
    field: 'employment_status',
    table: 'life',
    section: 'work',
    stage: 'essential',
  },
  {
    id: 'goal',
    question: {
      es: '¿Cuál es tu misión financiera?',
      en: 'What is your financial mission?'
    },
    phoenixIntro: {
      es: '¡Ahora viene lo BUENO! 🔥 Cuéntame, ¿qué quieres lograr con tu dinero? ¡Puedes elegir varias opciones!',
      en: "NOW we're getting to the GOOD stuff! 🔥 Tell me, what do you want to achieve with your money? You can pick multiple!"
    },
    options: [
      { id: 'debt', label: { es: '¡Libertad de deudas!', en: 'Debt freedom!' }, value: 'debt_free', icon: '💪' },
      { id: 'save', label: { es: 'Ahorrar como campeón', en: 'Save like a champion' }, value: 'savings', icon: '💰' },
      { id: 'retire', label: { es: 'Retirarme joven (FIRE)', en: 'Early retirement (FIRE)' }, value: 'fire', icon: '🔥' },
      { id: 'passive', label: { es: 'Dinero trabajando por mí', en: 'Money working for me' }, value: 'passive_income', icon: '📈' },
      { id: 'organize', label: { es: 'Orden en mis finanzas', en: 'Financial order' }, value: 'organization', icon: '📊' },
    ],
    field: 'passions',
    table: 'financial',
    allowMultiple: true,
    stage: 'essential',
  },
  {
    id: 'experience',
    question: {
      es: '¿Qué tan cómodo te sientes con las finanzas?',
      en: 'How comfortable are you with finances?'
    },
    phoenixIntro: {
      es: '¡Ya casi terminamos! 🎯 Una última cosa: esto me ayuda a explicarte todo en el nivel correcto:',
      en: "We're almost done! 🎯 One last thing: this helps me explain everything at the right level for you:"
    },
    options: [
      { id: 'beginner', label: { es: 'Recién empezando', en: 'Just starting' }, description: { es: '¡Sin vergüenza, todos empezamos!', en: 'No shame, we all start somewhere!' }, value: 'beginner', icon: '🌱' },
      { id: 'intermediate', label: { es: 'Me defiendo', en: 'I get by' }, description: { es: 'Conozco lo básico', en: 'Know the basics' }, value: 'intermediate', icon: '📚' },
      { id: 'advanced', label: { es: 'Soy pro', en: "I'm a pro" }, description: { es: '¡Domino el tema!', en: 'I got this!' }, value: 'advanced', icon: '🏆' },
    ],
    field: 'financial_education_level',
    table: 'financial',
    stage: 'essential',
  },
];

// ============= EXTENDED QUESTIONS (Can do later) =============
const EXTENDED_QUESTIONS: OnboardingQuestion[] = [
  // === LIFESTYLE SECTION ===
  {
    id: 'hobbies',
    question: {
      es: '¿Qué te hace feliz fuera del trabajo?',
      en: 'What makes you happy outside of work?'
    },
    phoenixIntro: {
      es: '¡Oye, esto es SUPER importante! 🎉 Quiero conocer al humano detrás de los números. ¿Qué te apasiona? ¡Cuéntame todo!',
      en: "Hey, this is SUPER important! 🎉 I want to know the human behind the numbers. What are you passionate about? Tell me everything!"
    },
    options: [
      { id: 'sports', label: { es: 'Deportes', en: 'Sports' }, value: 'sports', icon: '⚽' },
      { id: 'gaming', label: { es: 'Videojuegos', en: 'Gaming' }, value: 'gaming', icon: '🎮' },
      { id: 'reading', label: { es: 'Lectura', en: 'Reading' }, value: 'reading', icon: '📖' },
      { id: 'travel', label: { es: 'Viajar', en: 'Travel' }, value: 'travel', icon: '✈️' },
      { id: 'musician', label: { es: 'Tocar música', en: 'Play music' }, value: 'musician', icon: '🎸' },
      { id: 'dancing', label: { es: 'Bailar', en: 'Dancing' }, value: 'dancing', icon: '💃' },
      { id: 'cooking', label: { es: 'Cocinar', en: 'Cooking' }, value: 'cooking', icon: '👨‍🍳' },
      { id: 'art', label: { es: 'Arte/Creatividad', en: 'Art/Creativity' }, value: 'art', icon: '🎨' },
      { id: 'outdoors', label: { es: 'Naturaleza', en: 'Nature' }, value: 'outdoors', icon: '🏕️' },
    ],
    field: 'hobbies',
    table: 'life',
    section: 'lifestyle',
    allowMultiple: true,
    isOptional: true,
    stage: 'extended',
  },
  // === DREAMS SECTION ===
  {
    id: 'dreams',
    question: {
      es: '¿Cuál es ESE sueño que te quita el sueño?',
      en: "What's THAT dream that keeps you up at night?"
    },
    phoenixIntro: {
      es: '¡Ahora sí! 🌟 Hablemos de lo que realmente importa. Ese sueño grande, ese "algún día"... ¡cuéntamelo!',
      en: "Now we're talking! 🌟 Let's discuss what really matters. That big dream, that 'someday'... tell me about it!"
    },
    options: [
      { id: 'home', label: { es: '¡Mi propia casa!', en: 'My own home!' }, value: 'own_home', icon: '🏠' },
      { id: 'travel_world', label: { es: 'Recorrer el mundo', en: 'See the world' }, value: 'travel_world', icon: '🌍' },
      { id: 'retire_early', label: { es: 'Retirarme joven', en: 'Retire young' }, value: 'retire_early', icon: '🏖️' },
      { id: 'business', label: { es: 'Mi propio imperio', en: 'My own empire' }, value: 'start_business', icon: '🚀' },
      { id: 'family_security', label: { es: 'Familia protegida', en: 'Family protected' }, value: 'family_security', icon: '🛡️' },
      { id: 'financial_freedom', label: { es: '¡Libertad total!', en: 'Total freedom!' }, value: 'financial_freedom', icon: '🦅' },
    ],
    field: 'life_dreams',
    table: 'life',
    section: 'dreams',
    allowMultiple: true,
    isOptional: true,
    stage: 'extended',
  },
  {
    id: 'motivations',
    question: {
      es: '¿Por quién te levantas cada mañana a luchar?',
      en: 'Who do you wake up fighting for every morning?'
    },
    phoenixIntro: {
      es: '💪 Esta es la pregunta más poderosa. Tu "para quién" es tu combustible cuando las cosas se ponen difíciles:',
      en: "💪 This is the most powerful question. Your 'for whom' is your fuel when things get tough:"
    },
    options: [
      { id: 'family', label: { es: 'Mi familia', en: 'My family' }, value: 'family', icon: '👨‍👩‍👧' },
      { id: 'children', label: { es: 'Mis hijos', en: 'My kids' }, value: 'children', icon: '👶' },
      { id: 'partner', label: { es: 'Mi pareja', en: 'My partner' }, value: 'partner', icon: '💕' },
      { id: 'myself', label: { es: '¡Por mí mismo!', en: 'For myself!' }, value: 'myself', icon: '💪' },
      { id: 'parents', label: { es: 'Mis padres', en: 'My parents' }, value: 'parents', icon: '👴👵' },
      { id: 'future', label: { es: 'Mi futuro yo', en: 'My future self' }, value: 'future_self', icon: '🌟' },
    ],
    field: 'motivations',
    table: 'life',
    section: 'dreams',
    allowMultiple: true,
    isOptional: true,
    stage: 'extended',
  },
  // === PSYCHOLOGY SECTION ===
  {
    id: 'money_personality',
    question: {
      es: '¿Cómo es tu relación con el dinero?',
      en: 'What\'s your relationship with money like?'
    },
    phoenixIntro: {
      es: 'Ser honesto aquí te ayudará a identificar patrones y mejorar.',
      en: 'Being honest here will help you identify patterns and improve.'
    },
    options: [
      { id: 'saver', label: { es: 'Ahorrador', en: 'Saver' }, description: { es: 'Guardo todo lo que puedo', en: 'Save everything I can' }, value: 'saver', icon: '🐿️' },
      { id: 'spender', label: { es: 'Gastador', en: 'Spender' }, description: { es: 'Disfruto gastar', en: 'Enjoy spending' }, value: 'spender', icon: '🛍️' },
      { id: 'avoider', label: { es: 'Evitador', en: 'Avoider' }, description: { es: 'Prefiero no pensar en ello', en: 'Prefer not to think about it' }, value: 'avoider', icon: '🙈' },
      { id: 'worrier', label: { es: 'Preocupado', en: 'Worrier' }, description: { es: 'Me estresa constantemente', en: 'Constantly stressed' }, value: 'worrier', icon: '😰' },
      { id: 'planner', label: { es: 'Planificador', en: 'Planner' }, description: { es: 'Lo tengo todo calculado', en: 'Have it all calculated' }, value: 'planner', icon: '📋' },
    ],
    field: 'money_personality',
    table: 'life',
    section: 'psychology',
    isOptional: true,
    stage: 'extended',
  },
  {
    id: 'fears',
    question: {
      es: '¿Cuál es tu mayor miedo financiero?',
      en: 'What\'s your biggest financial fear?'
    },
    phoenixIntro: {
      es: 'Conocer tus miedos me permite ayudarte a superarlos. 💪',
      en: 'Knowing your fears allows me to help you overcome them. 💪'
    },
    options: [
      { id: 'debt', label: { es: 'Quedar endeudado', en: 'Getting into debt' }, value: 'debt', icon: '📉' },
      { id: 'job_loss', label: { es: 'Perder mi trabajo', en: 'Losing my job' }, value: 'job_loss', icon: '💼' },
      { id: 'not_enough', label: { es: 'No ahorrar suficiente', en: 'Not saving enough' }, value: 'not_saving', icon: '🐌' },
      { id: 'emergency', label: { es: 'Emergencia inesperada', en: 'Unexpected emergency' }, value: 'emergency', icon: '🚨' },
      { id: 'retirement', label: { es: 'No poder retirarme', en: 'Can\'t retire' }, value: 'no_retirement', icon: '👴' },
      { id: 'family_burden', label: { es: 'Ser carga para mi familia', en: 'Being a burden' }, value: 'burden', icon: '😔' },
    ],
    field: 'biggest_fears',
    table: 'life',
    section: 'psychology',
    allowMultiple: true,
    isOptional: true,
    stage: 'extended',
  },
  // === FINANCIAL DETAILS ===
  {
    id: 'risk',
    question: {
      es: '¿Qué te incomoda más: perder dinero o perder oportunidades?',
      en: 'What bothers you more: losing money or missing opportunities?'
    },
    phoenixIntro: {
      es: 'Tu tolerancia al riesgo guiará mis recomendaciones de inversión.',
      en: 'Your risk tolerance will guide my investment recommendations.'
    },
    options: [
      { id: 'conservative', label: { es: 'Perder dinero', en: 'Losing money' }, description: { es: 'Prefiero seguridad', en: 'I prefer safety' }, value: 'conservative', icon: '🛡️' },
      { id: 'moderate', label: { es: 'Ambos por igual', en: 'Both equally' }, description: { es: 'Balance es clave', en: 'Balance is key' }, value: 'moderate', icon: '⚖️' },
      { id: 'aggressive', label: { es: 'Perder oportunidades', en: 'Missing opportunities' }, description: { es: 'Acepto más riesgo', en: 'I accept more risk' }, value: 'aggressive', icon: '🚀' },
    ],
    field: 'risk_tolerance',
    table: 'financial',
    isOptional: true,
    stage: 'extended',
  },
  {
    id: 'capital',
    question: {
      es: '¿Tienes algún ahorro o capital disponible?',
      en: 'Do you have any savings or capital available?'
    },
    phoenixIntro: {
      es: 'Esto es solo para contextualizar - no te preocupes, todo es confidencial.',
      en: 'This is just for context - don\'t worry, everything is confidential.'
    },
    options: [
      { id: 'none', label: { es: 'Aún no tengo ahorros', en: 'No savings yet' }, value: '0', icon: '🌱' },
      { id: 'small', label: { es: 'Menos de $5,000', en: 'Less than $5,000' }, value: '2500', icon: '💵' },
      { id: 'medium', label: { es: '$5,000 - $25,000', en: '$5,000 - $25,000' }, value: '15000', icon: '💰' },
      { id: 'large', label: { es: 'Más de $25,000', en: 'More than $25,000' }, value: '50000', icon: '🏦' },
    ],
    field: 'available_capital',
    table: 'financial',
    isOptional: true,
    stage: 'extended',
  },
];

// Combine all questions
const ALL_QUESTIONS = [...ESSENTIAL_QUESTIONS, ...EXTENDED_QUESTIONS];

export function useConversationalOnboarding() {
  const { user } = useAuth();
  const upsertFinancialProfile = useUpsertFinancialProfile();
  const upsertLifeProfile = useUpsertLifeProfile();
  const markSectionComplete = useMarkSectionComplete();
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    responses: {},
    isComplete: false,
    isLoading: false,
    skippedSections: [],
  });

  // Only show essential questions in onboarding, extended are for later
  const activeQuestions = ESSENTIAL_QUESTIONS;
  const currentQuestion = activeQuestions[state.currentStep];
  const totalSteps = activeQuestions.length;
  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  const selectOption = useCallback((optionValue: string) => {
    if (!currentQuestion) return;
    
    const field = currentQuestion.field;
    
    if (currentQuestion.allowMultiple) {
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
      setState(prev => ({
        ...prev,
        responses: { ...prev.responses, [field]: optionValue },
      }));
    }
  }, [currentQuestion]);

  const nextStep = useCallback(() => {
    if (state.currentStep < totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [state.currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const saveProfile = useCallback(async () => {
    if (!user) return false;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const responses = state.responses;
      
      // Separate responses by table
      const financialData: Record<string, unknown> = {};
      const lifeData: Record<string, unknown> = {};
      const sectionsCompleted: Set<string> = new Set();
      
      for (const question of activeQuestions) {
        const value = responses[question.field];
        if (value === undefined) continue;
        
        if (question.table === 'financial') {
          if (question.field === 'available_capital' || question.field === 'monthly_investment_capacity') {
            financialData[question.field] = parseFloat(value as string) || 0;
          } else {
            financialData[question.field] = value;
          }
        } else if (question.table === 'life') {
          lifeData[question.field] = value;
          if (question.section) {
            sectionsCompleted.add(question.section);
          }
        }
      }
      
      // Save financial profile
      if (Object.keys(financialData).length > 0) {
        await upsertFinancialProfile.mutateAsync(financialData);
      }
      
      // Save life profile
      if (Object.keys(lifeData).length > 0) {
        await upsertLifeProfile.mutateAsync({
          ...lifeData,
          sections_completed: Array.from(sectionsCompleted),
        } as any);
      }
      
      // Mark onboarding as completed
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      setState(prev => ({ ...prev, isComplete: true, isLoading: false }));
      toast.success('¡Perfil completado! 🎉');
      return true;
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Error al guardar el perfil');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user, state.responses, upsertFinancialProfile, upsertLifeProfile, activeQuestions]);

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
    
    const situationLabels: Record<string, { es: string; en: string }> = {
      single: { es: 'enfocándote en tu crecimiento personal', en: 'focusing on personal growth' },
      partnered: { es: 'construyendo junto a tu pareja', en: 'building together with your partner' },
      family: { es: 'cuidando de tu familia', en: 'taking care of your family' },
    };
    
    const situation = situationLabels[responses.relationship_status as string]?.[lang] || '';
    
    if (lang === 'es') {
      return `Tu meta es ${goalText}${situation ? `, ${situation}` : ''}. ¡Phoenix te acompañará en cada paso! Después podrás completar más detalles de tu perfil para consejos aún más personalizados.`;
    } else {
      return `Your goal is to ${goalText}${situation ? `, ${situation}` : ''}. Phoenix will accompany you every step of the way! You can complete more profile details later for even more personalized advice.`;
    }
  }, [state.responses]);

  const hasCurrentResponse = useCallback(() => {
    if (!currentQuestion) return false;
    const response = state.responses[currentQuestion.field];
    if (Array.isArray(response)) return response.length > 0;
    return !!response;
  }, [currentQuestion, state.responses]);

  const isLastStep = state.currentStep === totalSteps - 1;

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
    hasCurrentResponse,
    isLastStep,
    questions: activeQuestions,
    extendedQuestions: EXTENDED_QUESTIONS,
    allQuestions: ALL_QUESTIONS,
  };
}
