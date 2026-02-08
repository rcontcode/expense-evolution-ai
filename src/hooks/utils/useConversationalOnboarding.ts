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
      es: '¡Hola! 👋 Soy Phoenix, tu mentor financiero personal. Antes de empezar, quiero conocerte mejor.',
      en: 'Hello! 👋 I\'m Phoenix, your personal financial mentor. Before we begin, I want to get to know you better.'
    },
    options: [
      { id: 'first_name', label: { es: 'Mi nombre', en: 'My first name' }, value: 'first_name', icon: '👤' },
      { id: 'nickname', label: { es: 'Un apodo', en: 'A nickname' }, value: 'nickname', icon: '😊' },
    ],
    field: 'name_preference',
    table: 'profile',
    stage: 'essential',
  },
  {
    id: 'life_situation',
    question: {
      es: '¿Cuál describe mejor tu situación actual?',
      en: 'Which best describes your current situation?'
    },
    phoenixIntro: {
      es: 'Entender tu momento de vida me ayuda a darte consejos relevantes.',
      en: 'Understanding your life stage helps me give you relevant advice.'
    },
    options: [
      { id: 'single', label: { es: 'Soltero/a', en: 'Single' }, description: { es: 'Enfocado en mí', en: 'Focused on myself' }, value: 'single', icon: '🙋' },
      { id: 'partnered', label: { es: 'En pareja', en: 'In a relationship' }, description: { es: 'Compartiendo la vida', en: 'Sharing life' }, value: 'partnered', icon: '💑' },
      { id: 'family', label: { es: 'Con familia', en: 'With family' }, description: { es: 'Hijos o dependientes', en: 'Children or dependents' }, value: 'family', icon: '👨‍👩‍👧' },
    ],
    field: 'relationship_status',
    table: 'life',
    section: 'family',
    stage: 'essential',
  },
  {
    id: 'work_status',
    question: {
      es: '¿Cuál es tu situación laboral?',
      en: 'What\'s your work situation?'
    },
    phoenixIntro: {
      es: 'Tu tipo de trabajo influye en las estrategias que te recomendaré.',
      en: 'Your type of work influences the strategies I\'ll recommend.'
    },
    options: [
      { id: 'employed', label: { es: 'Empleado/a', en: 'Employed' }, description: { es: 'Trabajo para una empresa', en: 'Work for a company' }, value: 'employed', icon: '💼' },
      { id: 'self_employed', label: { es: 'Independiente', en: 'Self-employed' }, description: { es: 'Mi propio negocio', en: 'My own business' }, value: 'self_employed', icon: '🚀' },
      { id: 'mixed', label: { es: 'Ambos', en: 'Both' }, description: { es: 'Empleado + proyectos', en: 'Employee + side projects' }, value: 'mixed', icon: '⚡' },
      { id: 'other', label: { es: 'Otro', en: 'Other' }, description: { es: 'Estudiante, retirado, etc.', en: 'Student, retired, etc.' }, value: 'other', icon: '🌟' },
    ],
    field: 'employment_status',
    table: 'life',
    section: 'work',
    stage: 'essential',
  },
  {
    id: 'goal',
    question: {
      es: '¿Cuál es tu principal meta financiera?',
      en: 'What is your main financial goal?'
    },
    phoenixIntro: {
      es: 'Ahora lo importante: ¿qué quieres lograr con tu dinero?',
      en: 'Now the important part: what do you want to achieve with your money?'
    },
    options: [
      { id: 'debt', label: { es: 'Salir de deudas', en: 'Get out of debt' }, value: 'debt_free', icon: '💪' },
      { id: 'save', label: { es: 'Ahorrar más', en: 'Save more' }, value: 'savings', icon: '💰' },
      { id: 'retire', label: { es: 'Retiro temprano (FIRE)', en: 'Early retirement (FIRE)' }, value: 'fire', icon: '🔥' },
      { id: 'passive', label: { es: 'Ingresos pasivos', en: 'Passive income' }, value: 'passive_income', icon: '📈' },
      { id: 'organize', label: { es: 'Organizar mis finanzas', en: 'Organize my finances' }, value: 'organization', icon: '📊' },
    ],
    field: 'passions',
    table: 'financial',
    allowMultiple: true,
    stage: 'essential',
  },
  {
    id: 'experience',
    question: {
      es: '¿Cómo describirías tu experiencia financiera?',
      en: 'How would you describe your financial experience?'
    },
    phoenixIntro: {
      es: 'Para calibrar cómo te explico las cosas...',
      en: 'To calibrate how I explain things...'
    },
    options: [
      { id: 'beginner', label: { es: 'Principiante', en: 'Beginner' }, description: { es: 'Empezando a aprender', en: 'Just starting to learn' }, value: 'beginner', icon: '🌱' },
      { id: 'intermediate', label: { es: 'Intermedio', en: 'Intermediate' }, description: { es: 'Conozco lo básico', en: 'Know the basics' }, value: 'intermediate', icon: '📚' },
      { id: 'advanced', label: { es: 'Avanzado', en: 'Advanced' }, description: { es: 'Experiencia significativa', en: 'Significant experience' }, value: 'advanced', icon: '🎓' },
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
      es: '¿Qué te apasiona hacer en tu tiempo libre?',
      en: 'What do you love doing in your free time?'
    },
    phoenixIntro: {
      es: 'Conocer tus pasiones me ayuda a motivarte de forma más personal. 🎯',
      en: 'Knowing your passions helps me motivate you more personally. 🎯'
    },
    options: [
      { id: 'sports', label: { es: 'Deportes', en: 'Sports' }, value: 'sports', icon: '⚽' },
      { id: 'gaming', label: { es: 'Videojuegos', en: 'Gaming' }, value: 'gaming', icon: '🎮' },
      { id: 'reading', label: { es: 'Lectura', en: 'Reading' }, value: 'reading', icon: '📖' },
      { id: 'travel', label: { es: 'Viajar', en: 'Travel' }, value: 'travel', icon: '✈️' },
      { id: 'music', label: { es: 'Música', en: 'Music' }, value: 'music', icon: '🎵' },
      { id: 'cooking', label: { es: 'Cocinar', en: 'Cooking' }, value: 'cooking', icon: '👨‍🍳' },
      { id: 'art', label: { es: 'Arte/Creatividad', en: 'Art/Creativity' }, value: 'art', icon: '🎨' },
      { id: 'outdoors', label: { es: 'Aire libre', en: 'Outdoors' }, value: 'outdoors', icon: '🏕️' },
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
      es: '¿Cuál es tu mayor sueño en la vida?',
      en: 'What\'s your biggest dream in life?'
    },
    phoenixIntro: {
      es: 'Los sueños grandes necesitan planes financieros sólidos. ¿Cuál es el tuyo? ✨',
      en: 'Big dreams need solid financial plans. What\'s yours? ✨'
    },
    options: [
      { id: 'home', label: { es: 'Casa propia', en: 'Own a home' }, value: 'own_home', icon: '🏠' },
      { id: 'travel_world', label: { es: 'Viajar por el mundo', en: 'Travel the world' }, value: 'travel_world', icon: '🌍' },
      { id: 'retire_early', label: { es: 'Retirarme joven', en: 'Retire early' }, value: 'retire_early', icon: '🏖️' },
      { id: 'business', label: { es: 'Mi propio negocio', en: 'Start a business' }, value: 'start_business', icon: '🚀' },
      { id: 'family_security', label: { es: 'Seguridad familiar', en: 'Family security' }, value: 'family_security', icon: '👨‍👩‍👧‍👦' },
      { id: 'financial_freedom', label: { es: 'Libertad financiera', en: 'Financial freedom' }, value: 'financial_freedom', icon: '🦅' },
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
      es: '¿Qué te motiva a mejorar tus finanzas?',
      en: 'What motivates you to improve your finances?'
    },
    phoenixIntro: {
      es: 'Entender tu "por qué" es clave para mantenerte enfocado en los momentos difíciles.',
      en: 'Understanding your "why" is key to staying focused during tough times.'
    },
    options: [
      { id: 'family', label: { es: 'Mi familia', en: 'My family' }, value: 'family', icon: '👨‍👩‍👧' },
      { id: 'freedom', label: { es: 'Libertad', en: 'Freedom' }, value: 'freedom', icon: '🦅' },
      { id: 'security', label: { es: 'Seguridad', en: 'Security' }, value: 'security', icon: '🛡️' },
      { id: 'legacy', label: { es: 'Dejar legado', en: 'Leave a legacy' }, value: 'legacy', icon: '🌳' },
      { id: 'experiences', label: { es: 'Vivir experiencias', en: 'Live experiences' }, value: 'experiences', icon: '🎯' },
      { id: 'peace', label: { es: 'Tranquilidad', en: 'Peace of mind' }, value: 'peace', icon: '☮️' },
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
