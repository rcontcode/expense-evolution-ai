import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpsertLifeProfile, useMarkSectionComplete, LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { useElevenLabsTTS } from '@/hooks/utils/useElevenLabsTTS';
import { useVoicePreferences } from '@/hooks/utils/useVoicePreferences';
import { useVoiceAssistant } from '@/hooks/utils/useVoiceAssistant';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Extended questions organized by section
const EXTENDED_QUESTIONS: Record<LifeProfileSection, ExtendedQuestion[]> = {
  family: [
    {
      id: 'children',
      question: { es: '¿Tienes hijos?', en: 'Do you have children?' },
      intro: { es: '¡Los hijos son la motivación más poderosa! 💪 Cuéntame:', en: 'Kids are the most powerful motivation! 💪 Tell me:' },
      field: 'has_children',
      type: 'single',
      options: [
        { id: 'yes', label: { es: '¡Sí, soy padre/madre!', en: "Yes, I'm a parent!" }, value: 'true', icon: '👨‍👧‍👦' },
        { id: 'no', label: { es: 'No todavía', en: 'Not yet' }, value: 'false', icon: '🙋' },
        { id: 'planning', label: { es: 'En los planes...', en: 'In the plans...' }, value: 'planning', icon: '🍼' },
      ],
    },
    {
      id: 'pets',
      question: { es: '¿Y mascotas? ¡También cuentan!', en: 'And pets? They count too!' },
      intro: { es: '🐾 ¡Los peluditos también son familia! Y sí, ¡también afectan el presupuesto!', en: '🐾 Fur babies are family too! And yes, they affect the budget!' },
      field: 'pets',
      type: 'multiple',
      options: [
        { id: 'dog', label: { es: 'Perrito 🐕', en: 'Dog 🐕' }, value: 'dog', icon: '🐕' },
        { id: 'cat', label: { es: 'Gatito 🐱', en: 'Cat 🐱' }, value: 'cat', icon: '🐱' },
        { id: 'other', label: { es: 'Otra mascota', en: 'Other pet' }, value: 'other', icon: '🐾' },
        { id: 'none', label: { es: 'Sin mascotas', en: 'No pets' }, value: 'none', icon: '🏠' },
      ],
    },
  ],
  work: [
    {
      id: 'job_title',
      question: { es: '¿A qué te dedicas?', en: "What do you do?" },
      intro: { es: '💼 ¡Cuéntame de tu trabajo! Esto me ayuda a darte tips específicos para tu situación:', en: '💼 Tell me about your work! This helps me give you tips specific to your situation:' },
      field: 'job_title',
      type: 'text',
      placeholder: { es: 'Ej: Ingeniero, Diseñador, Emprendedor...', en: 'E.g.: Engineer, Designer, Entrepreneur...' },
    },
    {
      id: 'side_hustle',
      question: { es: '¿Tienes algún proyecto extra o "side hustle"?', en: 'Do you have any side projects or "side hustle"?' },
      intro: { es: '🚀 ¡Los proyectos paralelos pueden ser un game-changer financiero!', en: '🚀 Side projects can be a financial game-changer!' },
      field: 'side_hustle',
      type: 'single',
      options: [
        { id: 'yes', label: { es: '¡Sí, tengo uno!', en: 'Yes, I have one!' }, value: 'true', icon: '🚀' },
        { id: 'no', label: { es: 'No, pero me interesa', en: 'No, but interested' }, value: 'interested', icon: '🤔' },
        { id: 'none', label: { es: 'Enfocado 100% en mi trabajo', en: '100% focused on my job' }, value: 'false', icon: '💼' },
      ],
    },
  ],
  lifestyle: [
    {
      id: 'hobbies',
      question: { es: '¿Qué te APASIONA hacer?', en: 'What do you LOVE doing?' },
      intro: { es: '🎉 ¡Ahora sí! Cuéntame qué te hace vibrar fuera del trabajo. ¡Puedes elegir varias!', en: "🎉 Now we're talking! Tell me what makes you tick outside of work. Pick as many as you want!" },
      field: 'hobbies',
      type: 'multiple',
      options: [
        { id: 'reading', label: { es: 'Leer', en: 'Reading' }, value: 'reading', icon: '📖' },
        { id: 'travel', label: { es: 'Viajar', en: 'Travel' }, value: 'travel', icon: '✈️' },
        { id: 'musician', label: { es: 'Tocar música', en: 'Play music' }, value: 'musician', icon: '🎸' },
        { id: 'dj', label: { es: 'DJ / Producción', en: 'DJ / Production' }, value: 'dj', icon: '🎧' },
        { id: 'dancing', label: { es: 'Bailar', en: 'Dancing' }, value: 'dancing', icon: '💃' },
        { id: 'cooking', label: { es: 'Cocinar', en: 'Cooking' }, value: 'cooking', icon: '👨‍🍳' },
        { id: 'gaming', label: { es: 'Gaming', en: 'Gaming' }, value: 'gaming', icon: '🎮' },
        { id: 'art', label: { es: 'Arte/Foto', en: 'Art/Photo' }, value: 'art', icon: '🎨' },
        { id: 'gardening', label: { es: 'Jardinería', en: 'Gardening' }, value: 'gardening', icon: '🌱' },
        { id: 'movies', label: { es: 'Cine/Series', en: 'Movies/TV' }, value: 'movies', icon: '🎬' },
      ],
    },
    {
      id: 'sports',
      question: { es: '¿Mueves el cuerpo?', en: 'Do you move your body?' },
      intro: { es: '💪 ¡El deporte es la mejor inversión! Invertir en salud es ahorrar en doctores. ¿Qué practicas?', en: "💪 Sports are the best investment! Investing in health saves on doctors. What do you practice?" },
      field: 'sports',
      type: 'multiple',
      options: [
        { id: 'gym', label: { es: 'Gym/CrossFit', en: 'Gym/CrossFit' }, value: 'gym', icon: '🏋️' },
        { id: 'running', label: { es: 'Running', en: 'Running' }, value: 'running', icon: '🏃' },
        { id: 'soccer', label: { es: 'Fútbol', en: 'Soccer' }, value: 'soccer', icon: '⚽' },
        { id: 'hockey', label: { es: 'Hockey', en: 'Hockey' }, value: 'hockey', icon: '🏒' },
        { id: 'tennis', label: { es: 'Tenis/Padel', en: 'Tennis/Padel' }, value: 'tennis', icon: '🎾' },
        { id: 'swimming', label: { es: 'Natación', en: 'Swimming' }, value: 'swimming', icon: '🏊' },
        { id: 'cycling', label: { es: 'Ciclismo', en: 'Cycling' }, value: 'cycling', icon: '🚴' },
        { id: 'yoga', label: { es: 'Yoga', en: 'Yoga' }, value: 'yoga', icon: '🧘' },
        { id: 'martial', label: { es: 'Artes marciales', en: 'Martial arts' }, value: 'martial_arts', icon: '🥋' },
        { id: 'skiing', label: { es: 'Esquí/Snow', en: 'Ski/Snow' }, value: 'skiing', icon: '⛷️' },
        { id: 'basketball', label: { es: 'Basketball', en: 'Basketball' }, value: 'basketball', icon: '🏀' },
        { id: 'none', label: { es: 'No por ahora 😅', en: 'Not yet 😅' }, value: 'none', icon: '🛋️' },
      ],
    },
    {
      id: 'daily_routine',
      question: { es: '¿Eres de mañanas o de noches?', en: 'Morning person or night owl?' },
      intro: { es: '⏰ ¡Tu ritmo diario influye en cómo manejas tu dinero!', en: '⏰ Your daily rhythm influences how you handle money!' },
      field: 'daily_routine',
      type: 'single',
      options: [
        { id: 'morning', label: { es: '¡Madrugador!', en: 'Morning person!' }, value: 'morning_person', icon: '🌅' },
        { id: 'night', label: { es: 'Noctámbulo', en: 'Night owl' }, value: 'night_owl', icon: '🌙' },
        { id: 'flexible', label: { es: 'Depende del día', en: 'Depends' }, value: 'flexible', icon: '⏰' },
      ],
    },
  ],
  dreams: [
    {
      id: 'what_drives_you',
      question: { es: '¿Qué te hace saltar de la cama cada mañana?', en: 'What makes you jump out of bed every morning?' },
      intro: { es: '🔥 ¡Esta es LA pregunta! Quiero saber qué te MUEVE, qué te da energía:', en: "🔥 This is THE question! I want to know what MOVES you, what gives you energy:" },
      field: 'passions',
      type: 'multiple',
      options: [
        { id: 'family_love', label: { es: 'El amor a mi familia', en: 'Love for my family' }, value: 'family_love', icon: '❤️' },
        { id: 'personal_growth', label: { es: 'Superarme cada día', en: 'Growing every day' }, value: 'personal_growth', icon: '📈' },
        { id: 'passion_project', label: { es: 'Un proyecto que amo', en: 'A project I love' }, value: 'passion_project', icon: '🚀' },
        { id: 'helping_others', label: { es: 'Ayudar a otros', en: 'Helping others' }, value: 'helping_others', icon: '🤝' },
        { id: 'adventure', label: { es: '¡Nuevas aventuras!', en: 'New adventures!' }, value: 'adventure', icon: '🌄' },
        { id: 'legacy', label: { es: 'Dejar huella', en: 'Leave a mark' }, value: 'legacy', icon: '🏛️' },
      ],
    },
    {
      id: 'who_you_fight_for',
      question: { es: '¿Por quién luchas cada día?', en: 'Who do you fight for every day?' },
      intro: { es: '💪 Esta respuesta es tu COMBUSTIBLE cuando las cosas se ponen difíciles. ¿Por quién te esfuerzas?', en: "💪 This answer is your FUEL when things get tough. Who do you push for?" },
      field: 'motivations',
      type: 'multiple',
      options: [
        { id: 'children', label: { es: '¡Por mis hijos!', en: 'For my kids!' }, value: 'children', icon: '👶' },
        { id: 'partner', label: { es: 'Por mi pareja', en: 'For my partner' }, value: 'partner', icon: '💑' },
        { id: 'parents', label: { es: 'Por mis padres', en: 'For my parents' }, value: 'parents', icon: '👨‍👩‍👦' },
        { id: 'myself', label: { es: '¡Por mí mismo!', en: 'For myself!' }, value: 'myself', icon: '💪' },
        { id: 'future_family', label: { es: 'Mi futura familia', en: 'My future family' }, value: 'future_family', icon: '🏠' },
        { id: 'community', label: { es: 'Mi comunidad', en: 'My community' }, value: 'community', icon: '🌍' },
      ],
    },
    {
      id: 'life_dreams',
      question: { es: '¿Cuál es ESE sueño que te quita el sueño?', en: "What's THAT dream that keeps you up at night?" },
      intro: { es: '✨ ¡Ahora sí! Ese sueño grande, ese "algún día"... ¡Cuéntamelo todo!', en: "✨ Now we're talking! That big dream, that 'someday'... Tell me everything!" },
      field: 'life_dreams',
      type: 'multiple',
      options: [
        { id: 'home', label: { es: '¡Mi propia casa!', en: 'My own home!' }, value: 'own_home', icon: '🏠' },
        { id: 'travel', label: { es: 'Recorrer el mundo', en: 'See the world' }, value: 'travel_world', icon: '🌍' },
        { id: 'retire', label: { es: 'Retirarme joven', en: 'Retire young' }, value: 'retire_early', icon: '🏖️' },
        { id: 'business', label: { es: 'Mi propio negocio', en: 'My own business' }, value: 'start_business', icon: '🚀' },
        { id: 'freedom', label: { es: '¡Libertad total!', en: 'Total freedom!' }, value: 'financial_freedom', icon: '🦅' },
        { id: 'education', label: { es: 'Estudiar algo nuevo', en: 'Study something new' }, value: 'education', icon: '🎓' },
        { id: 'kids_future', label: { es: 'Futuro de mis hijos', en: "My kids' future" }, value: 'kids_future', icon: '👨‍👧‍👦' },
      ],
    },
  ],
  psychology: [
    {
      id: 'money_personality',
      question: { es: '¿Cómo te llevas con el dinero?', en: 'How do you get along with money?' },
      intro: { es: '🧠 ¡Sin filtros! Ser honesto aquí te ayudará a entender tus patrones financieros:', en: "🧠 No filters! Being honest here will help you understand your financial patterns:" },
      field: 'money_personality',
      type: 'single',
      options: [
        { id: 'saver', label: { es: 'Ahorro todo', en: 'I save everything' }, value: 'saver', icon: '🐿️' },
        { id: 'spender', label: { es: 'Me lo gasto', en: 'I spend it' }, value: 'spender', icon: '🛍️' },
        { id: 'avoider', label: { es: 'Prefiero no pensar', en: 'I avoid thinking about it' }, value: 'avoider', icon: '🙈' },
        { id: 'worrier', label: { es: 'Me preocupo mucho', en: 'I worry a lot' }, value: 'worrier', icon: '😰' },
        { id: 'planner', label: { es: 'Planifico todo', en: 'I plan everything' }, value: 'planner', icon: '📋' },
      ],
    },
    {
      id: 'fears',
      question: { es: '¿Qué te quita el sueño financieramente?', en: 'What keeps you up at night financially?' },
      intro: { es: '💪 Conocer tus miedos es el primer paso para vencerlos. ¡Aquí estoy para ayudarte!', en: "💪 Knowing your fears is the first step to conquering them. I'm here to help!" },
      field: 'biggest_fears',
      type: 'multiple',
      options: [
        { id: 'debt', label: { es: 'Quedar endeudado', en: 'Getting into debt' }, value: 'debt', icon: '📉' },
        { id: 'job_loss', label: { es: 'Perder mi trabajo', en: 'Losing my job' }, value: 'job_loss', icon: '💼' },
        { id: 'emergency', label: { es: 'Emergencia inesperada', en: 'Unexpected emergency' }, value: 'emergency', icon: '🚨' },
        { id: 'retirement', label: { es: 'No poder retirarme', en: "Can't retire" }, value: 'no_retirement', icon: '👴' },
      ],
    },
  ],
};

interface ExtendedQuestion {
  id: string;
  question: { es: string; en: string };
  intro: { es: string; en: string };
  field: string;
  type: 'single' | 'multiple' | 'text';
  options?: { id: string; label: { es: string; en: string }; value: string; icon?: string }[];
  placeholder?: { es: string; en: string };
}

interface ProfileExtenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: LifeProfileSection;
  onComplete?: () => void;
}

export function ProfileExtenderDialog({ 
  open, 
  onOpenChange, 
  section,
  onComplete 
}: ProfileExtenderDialogProps) {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const voicePrefs = useVoicePreferences();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const hasSpokenRef = useRef<string | null>(null);
  const handleOptionSelectRef = useRef<(value: string) => void>(() => {});
  
  const questions = EXTENDED_QUESTIONS[section] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  
  const upsertLifeProfile = useUpsertLifeProfile();
  const markSectionComplete = useMarkSectionComplete();
  
  // speakAcknowledgmentRef to break circular dependency
  const speakAcknowledgmentRef = useRef<(field: string, value: string) => void>(() => {});

  // Voice transcript handler - match spoken words to options with fuzzy matching
  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (!currentQuestion) return;
    
    const lower = transcript.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Handle TEXT type questions - accept any spoken text as the answer
    if (currentQuestion.type === 'text') {
      const cleanedText = transcript.trim();
      if (cleanedText.length > 0) {
        setResponses(prev => ({ ...prev, [currentQuestion.field]: cleanedText }));
        setTextInput(cleanedText);
        setInterimText('');
        
        // Speak acknowledgment and auto-advance
        speakAcknowledgmentRef.current(currentQuestion.field, cleanedText);
        setTimeout(() => {
          if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
            hasSpokenRef.current = null;
          } else {
            handleComplete();
          }
        }, 2500);
      }
      return;
    }
    
    // For option-based questions
    if (!currentQuestion.options) return;
    
    // Negation patterns → select "none"/"no" options
    const negationPatterns = [
      'no tengo', 'ninguno', 'ninguna', 'nada', 'sin ', 'no hay',
      'don\'t have', 'no pets', 'none', 'i have no', 'not yet',
      'no no', 'ni perros', 'ni gatos',
    ];
    const isNegation = negationPatterns.some(p => lower.includes(p));
    
    if (isNegation) {
      const noneOption = currentQuestion.options.find(opt =>
        ['none', 'no', 'false'].includes(opt.value) ||
        opt.id === 'none' || opt.id === 'no'
      );
      if (noneOption) {
        handleOptionSelectRef.current(noneOption.value);
        setInterimText('');
        return;
      }
    }
    
    // Keyword-based fuzzy matching for each option
    const keywordMap: Record<string, string[]> = {
      dog: ['perro', 'perrito', 'perrita', 'dog', 'puppy', 'can'],
      cat: ['gato', 'gatito', 'gatita', 'cat', 'kitten', 'michi'],
      other: ['otra', 'otro', 'other', 'hamster', 'pajaro', 'pez', 'conejo', 'tortuga', 'loro'],
      yes: ['si', 'sip', 'yes', 'claro', 'por supuesto', 'obvio', 'afirmativo'],
      no: ['no', 'nah', 'nel', 'nope'],
      planning: ['planes', 'planning', 'futuro', 'algun dia', 'pensando'],
    };
    
    // Try keyword match first
    for (const opt of currentQuestion.options) {
      const keywords = keywordMap[opt.id] || [];
      if (keywords.some(kw => lower.includes(kw))) {
        handleOptionSelectRef.current(opt.value);
        setInterimText('');
        return;
      }
    }
    
    // Fallback: exact label match
    const matchedOption = currentQuestion.options.find(opt => {
      const esLabel = opt.label.es.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '');
      const enLabel = opt.label.en.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '');
      return lower.includes(esLabel) || lower.includes(enLabel);
    });
    
    if (matchedOption) {
      handleOptionSelectRef.current(matchedOption.value);
      setInterimText('');
    } else {
      // Show feedback that voice was heard but not understood
      setInterimText(
        lang === 'es'
          ? `"${transcript}" — Toca una opción o intenta de nuevo`
          : `"${transcript}" — Tap an option or try again`
      );
    }
  }, [currentQuestion, lang, currentStep, questions.length]);
  
  // Voice setup
  const selectedPremiumVoiceId = voicePrefs.getPremiumVoiceId(lang) || undefined;
  const elevenLabsTTS = useElevenLabsTTS({
    voiceId: selectedPremiumVoiceId,
    lang,
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender,
  });
  
  const voiceAssistant = useVoiceAssistant({
    speechSpeed: voicePrefs.speechSpeed,
    volume: voicePrefs.volume,
    pitch: voicePrefs.pitch,
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender,
    selectedVoiceName: voicePrefs.selectedVoiceName,
    premiumSpeak: elevenLabsTTS.speak,
    isPremiumSpeaking: elevenLabsTTS.isSpeaking,
    onTranscript: handleVoiceTranscript,
    onInterimTranscript: setInterimText,
  });
  
  // Conversational acknowledgment after an answer
  const speakAcknowledgment = useCallback((field: string, value: string) => {
    const acks: Record<string, { es: string; en: string }> = {
      job_title: { 
        es: `¡${value}! ¡Qué interesante! Eso me ayuda mucho a personalizar tu experiencia financiera. ¡Vamos con la siguiente!`, 
        en: `${value}! How interesting! That helps me personalize your financial experience. Let's move on!`
      },
      side_hustle: {
        es: '¡Perfecto! Tener claro esto me ayuda a guiarte mejor.',
        en: 'Perfect! Knowing this helps me guide you better.'
      },
      has_children: {
        es: '¡Entendido! Esto cambia totalmente la estrategia financiera.',
        en: 'Got it! This completely changes the financial strategy.'
      },
      pets: {
        es: '¡Los peluditos también cuentan en el presupuesto! Anotado.',
        en: 'Fur babies count in the budget too! Noted.'
      },
      hobbies: {
        es: '¡Me encanta! Tus pasiones dicen mucho de cómo manejas el dinero.',
        en: 'Love it! Your passions say a lot about how you handle money.'
      },
    };
    const ack = acks[field] || {
      es: '¡Perfecto! Anotado. ¡Seguimos!',
      en: 'Perfect! Noted. Let\'s continue!'
    };
    voiceAssistant.speak(ack[lang]);
  }, [lang, voiceAssistant]);

  // Keep ref in sync
  useEffect(() => {
    speakAcknowledgmentRef.current = speakAcknowledgment;
  }, [speakAcknowledgment]);

  const isSpeaking = voiceAssistant.isSpeaking || elevenLabsTTS.isSpeaking;
  const isListening = voiceAssistant.isListening;
  const canListen = !isSpeaking && !isTyping;
  
  // Speak question when it changes
  useEffect(() => {
    if (!open || !currentQuestion) return;
    
    const questionKey = `${section}-${currentQuestion.id}`;
    if (hasSpokenRef.current === questionKey) return;
    hasSpokenRef.current = questionKey;
    
    const timeout = setTimeout(() => {
      const text = `${currentQuestion.intro[lang]}. ${currentQuestion.question[lang]}`;
      voiceAssistant.speak(text);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [open, currentQuestion, section, lang]);
  
  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setResponses({});
      setTextInput('');
      hasSpokenRef.current = null;
    }
  }, [open, section]);

  // Reset text input on step change
  useEffect(() => {
    setTextInput(responses[currentQuestion?.field || ''] as string || '');
  }, [currentStep]);
  
  const handleOptionSelect = useCallback((value: string) => {
    if (!currentQuestion) return;
    
    if (currentQuestion.type === 'multiple') {
      const current = (responses[currentQuestion.field] as string[]) || [];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setResponses(prev => ({ ...prev, [currentQuestion.field]: newValues }));
    } else {
      setResponses(prev => ({ ...prev, [currentQuestion.field]: value }));
      
      // Speak acknowledgment and auto-advance for single select
      setIsTyping(true);
      speakAcknowledgment(currentQuestion.field, value);
      setTimeout(() => {
        setIsTyping(false);
        if (currentStep < questions.length - 1) {
          setCurrentStep(prev => prev + 1);
          hasSpokenRef.current = null;
        } else {
          handleComplete();
        }
      }, 2000);
    }
  }, [currentQuestion, responses, currentStep, questions.length]);
  
  // Update ref when function changes
  useEffect(() => {
    handleOptionSelectRef.current = handleOptionSelect;
  }, [handleOptionSelect]);
  
  // Toggle microphone
  const toggleListening = useCallback(() => {
    if (isListening) {
      voiceAssistant.stopListening();
    } else {
      voiceAssistant.startListening();
    }
  }, [isListening, voiceAssistant]);

  const handleNext = useCallback(() => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      hasSpokenRef.current = null;
    } else {
      handleComplete();
    }
  }, [currentStep, questions.length]);
  
  const handleComplete = useCallback(async () => {
    try {
      // Convert boolean strings to actual booleans
      const processedResponses = { ...responses };
      for (const [key, value] of Object.entries(processedResponses)) {
        if (value === 'true') processedResponses[key] = true as any;
        else if (value === 'false') processedResponses[key] = false as any;
      }
      
      await upsertLifeProfile.mutateAsync(processedResponses);
      await markSectionComplete.mutateAsync(section);
      
      voiceAssistant.speak(lang === 'es' ? '¡Excelente! Sección completada.' : 'Excellent! Section completed.');
      toast.success(lang === 'es' ? '¡Sección completada!' : 'Section completed!');
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profile section:', error);
      toast.error(lang === 'es' ? 'Error al guardar' : 'Error saving');
    }
  }, [responses, section, upsertLifeProfile, markSectionComplete, lang, onComplete, onOpenChange]);
  
  const isOptionSelected = (value: string) => {
    const response = responses[currentQuestion?.field || ''];
    if (Array.isArray(response)) return response.includes(value);
    return response === value;
  };
  
  const hasResponse = () => {
    const response = responses[currentQuestion?.field || ''];
    if (Array.isArray(response)) return response.length > 0;
    return !!response;
  };
  
  if (!currentQuestion) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoenixLogo variant="mini" state="flames" />
            {lang === 'es' ? 'Completando perfil' : 'Completing profile'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{lang === 'es' ? 'Pregunta' : 'Question'} {currentStep + 1}/{questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Phoenix intro */}
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
              {isSpeaking && (
                <Volume2 className="h-4 w-4 text-primary animate-pulse mt-0.5" />
              )}
              <p className="text-sm">{currentQuestion.intro[lang]}</p>
            </div>
            
            <h3 className="text-lg font-medium">{currentQuestion.question[lang]}</h3>
            
            {/* Options */}
            {currentQuestion.options && (
              <div className="grid gap-2">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.value)}
                    disabled={isTyping || isSpeaking}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isOptionSelected(option.value)
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {option.icon && <span className="text-xl">{option.icon}</span>}
                    <span className="font-medium">{option.label[lang]}</span>
                    {isOptionSelected(option.value) && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
            
            {/* Text input for free-text questions */}
            {currentQuestion.type === 'text' && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && textInput.trim()) {
                        setResponses(prev => ({ ...prev, [currentQuestion.field]: textInput.trim() }));
                        speakAcknowledgment(currentQuestion.field, textInput.trim());
                        setTimeout(() => {
                          if (currentStep < questions.length - 1) {
                            setCurrentStep(prev => prev + 1);
                            hasSpokenRef.current = null;
                          } else {
                            handleComplete();
                          }
                        }, 2500);
                      }
                    }}
                    placeholder={currentQuestion.placeholder?.[lang] || ''}
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    disabled={isTyping || isSpeaking}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (textInput.trim()) {
                      setResponses(prev => ({ ...prev, [currentQuestion.field]: textInput.trim() }));
                      speakAcknowledgment(currentQuestion.field, textInput.trim());
                      setTimeout(() => {
                        if (currentStep < questions.length - 1) {
                          setCurrentStep(prev => prev + 1);
                          hasSpokenRef.current = null;
                        } else {
                          handleComplete();
                        }
                      }, 2500);
                    }
                  }}
                  disabled={!textInput.trim() || isTyping || isSpeaking}
                  className="w-full"
                >
                  {lang === 'es' ? 'Confirmar' : 'Confirm'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            
            {/* Voice input section */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {/* Microphone button */}
              <motion.button
                onClick={toggleListening}
                disabled={!canListen}
                className={cn(
                  "p-4 rounded-full transition-all shadow-lg",
                  isListening
                    ? "bg-primary text-primary-foreground shadow-primary/40 animate-pulse"
                    : canListen
                      ? "bg-muted hover:bg-primary/20 hover:text-primary"
                      : "bg-muted opacity-50 cursor-not-allowed"
                )}
                whileHover={canListen ? { scale: 1.05 } : {}}
                whileTap={canListen ? { scale: 0.95 } : {}}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </motion.button>
              
              {/* Status text */}
              <span className="text-sm text-muted-foreground">
                {isListening 
                  ? (lang === 'es' ? 'Escuchando...' : 'Listening...')
                  : (lang === 'es' ? 'Toca para hablar' : 'Tap to speak')
                }
              </span>
            </div>
            
            {/* Live transcript */}
            {interimText && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-muted-foreground italic bg-muted/50 px-3 py-2 rounded-lg"
              >
                "{interimText}"
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation for multi-select */}
        {currentQuestion.type === 'multiple' && (
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(prev => Math.max(0, prev - 1));
                hasSpokenRef.current = null;
              }}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {lang === 'es' ? 'Atrás' : 'Back'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!hasResponse()}
            >
              {currentStep === questions.length - 1 
                ? (lang === 'es' ? 'Completar' : 'Complete')
                : (lang === 'es' ? 'Siguiente' : 'Next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
