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
      intro: { es: 'La familia es una gran motivación financiera.', en: 'Family is a great financial motivator.' },
      field: 'has_children',
      type: 'single',
      options: [
        { id: 'yes', label: { es: 'Sí', en: 'Yes' }, value: 'true', icon: '👨‍👧‍👦' },
        { id: 'no', label: { es: 'No', en: 'No' }, value: 'false', icon: '🙋' },
        { id: 'planning', label: { es: 'Planeando', en: 'Planning' }, value: 'planning', icon: '🍼' },
      ],
    },
    {
      id: 'pets',
      question: { es: '¿Tienes mascotas?', en: 'Do you have pets?' },
      intro: { es: 'Las mascotas también son parte del presupuesto familiar.', en: 'Pets are also part of the family budget.' },
      field: 'pets',
      type: 'multiple',
      options: [
        { id: 'dog', label: { es: 'Perro', en: 'Dog' }, value: 'dog', icon: '🐕' },
        { id: 'cat', label: { es: 'Gato', en: 'Cat' }, value: 'cat', icon: '🐱' },
        { id: 'other', label: { es: 'Otro', en: 'Other' }, value: 'other', icon: '🐾' },
        { id: 'none', label: { es: 'Ninguna', en: 'None' }, value: 'none', icon: '❌' },
      ],
    },
  ],
  work: [
    {
      id: 'job_title',
      question: { es: '¿Cuál es tu profesión o puesto?', en: 'What\'s your profession or job title?' },
      intro: { es: 'Conocer tu trabajo me ayuda a dar consejos más específicos.', en: 'Knowing your job helps me give more specific advice.' },
      field: 'job_title',
      type: 'text',
      placeholder: { es: 'Ej: Ingeniero de Software, Contador, Freelancer...', en: 'E.g.: Software Engineer, Accountant, Freelancer...' },
    },
    {
      id: 'side_hustle',
      question: { es: '¿Tienes algún proyecto extra o negocio secundario?', en: 'Do you have any side project or secondary business?' },
      intro: { es: 'Los ingresos extra pueden acelerar tus metas.', en: 'Extra income can accelerate your goals.' },
      field: 'side_hustle',
      type: 'single',
      options: [
        { id: 'yes', label: { es: 'Sí', en: 'Yes' }, value: 'true', icon: '🚀' },
        { id: 'no', label: { es: 'No, pero me interesa', en: 'No, but interested' }, value: 'interested', icon: '🤔' },
        { id: 'none', label: { es: 'No, enfocado en mi trabajo', en: 'No, focused on my job' }, value: 'false', icon: '💼' },
      ],
    },
  ],
  lifestyle: [
    {
      id: 'hobbies',
      question: { es: '¿Qué te apasiona hacer en tu tiempo libre?', en: 'What do you love doing in your free time?' },
      intro: { es: 'Tus pasiones me ayudan a motivarte de forma personal. 🎯', en: 'Your passions help me motivate you personally. 🎯' },
      field: 'hobbies',
      type: 'multiple',
      options: [
        { id: 'reading', label: { es: 'Lectura', en: 'Reading' }, value: 'reading', icon: '📖' },
        { id: 'travel', label: { es: 'Viajar', en: 'Travel' }, value: 'travel', icon: '✈️' },
        { id: 'musician', label: { es: 'Tocar instrumento', en: 'Play instrument' }, value: 'musician', icon: '🎸' },
        { id: 'dj', label: { es: 'DJ / Producción musical', en: 'DJ / Music production' }, value: 'dj', icon: '🎧' },
        { id: 'dancing', label: { es: 'Bailar', en: 'Dancing' }, value: 'dancing', icon: '💃' },
        { id: 'cooking', label: { es: 'Cocinar', en: 'Cooking' }, value: 'cooking', icon: '👨‍🍳' },
        { id: 'gaming', label: { es: 'Videojuegos', en: 'Gaming' }, value: 'gaming', icon: '🎮' },
        { id: 'art', label: { es: 'Arte/Fotografía', en: 'Art/Photography' }, value: 'art', icon: '🎨' },
        { id: 'gardening', label: { es: 'Jardinería', en: 'Gardening' }, value: 'gardening', icon: '🌱' },
        { id: 'movies', label: { es: 'Cine/Series', en: 'Movies/TV' }, value: 'movies', icon: '🎬' },
      ],
    },
    {
      id: 'sports',
      question: { es: '¿Practicas algún deporte o actividad física?', en: 'Do you practice any sport or physical activity?' },
      intro: { es: 'El ejercicio es inversión en salud... ¡y ahorro en doctores! 💪', en: 'Exercise is an investment in health... and savings on doctors! 💪' },
      field: 'sports',
      type: 'multiple',
      options: [
        { id: 'gym', label: { es: 'Gimnasio/CrossFit', en: 'Gym/CrossFit' }, value: 'gym', icon: '🏋️' },
        { id: 'running', label: { es: 'Running/Trail', en: 'Running/Trail' }, value: 'running', icon: '🏃' },
        { id: 'soccer', label: { es: 'Fútbol', en: 'Soccer' }, value: 'soccer', icon: '⚽' },
        { id: 'hockey', label: { es: 'Hockey', en: 'Hockey' }, value: 'hockey', icon: '🏒' },
        { id: 'tennis', label: { es: 'Tenis/Padel', en: 'Tennis/Padel' }, value: 'tennis', icon: '🎾' },
        { id: 'swimming', label: { es: 'Natación', en: 'Swimming' }, value: 'swimming', icon: '🏊' },
        { id: 'cycling', label: { es: 'Ciclismo/MTB', en: 'Cycling/MTB' }, value: 'cycling', icon: '🚴' },
        { id: 'yoga', label: { es: 'Yoga/Pilates', en: 'Yoga/Pilates' }, value: 'yoga', icon: '🧘' },
        { id: 'martial', label: { es: 'Artes marciales', en: 'Martial arts' }, value: 'martial_arts', icon: '🥋' },
        { id: 'skiing', label: { es: 'Esquí/Snowboard', en: 'Skiing/Snowboard' }, value: 'skiing', icon: '⛷️' },
        { id: 'basketball', label: { es: 'Basketball', en: 'Basketball' }, value: 'basketball', icon: '🏀' },
        { id: 'none', label: { es: 'No por ahora', en: 'Not right now' }, value: 'none', icon: '😅' },
      ],
    },
    {
      id: 'daily_routine',
      question: { es: '¿Cómo es tu rutina diaria?', en: 'What\'s your daily routine like?' },
      intro: { es: 'Tu estilo de vida influye en cómo ahorrar mejor.', en: 'Your lifestyle influences how to save better.' },
      field: 'daily_routine',
      type: 'single',
      options: [
        { id: 'morning', label: { es: 'Madrugador', en: 'Morning person' }, value: 'morning_person', icon: '🌅' },
        { id: 'night', label: { es: 'Noctámbulo', en: 'Night owl' }, value: 'night_owl', icon: '🌙' },
        { id: 'flexible', label: { es: 'Flexible', en: 'Flexible' }, value: 'flexible', icon: '⏰' },
      ],
    },
  ],
  dreams: [
    {
      id: 'what_drives_you',
      question: { es: '¿Qué te hace levantarte cada mañana?', en: 'What gets you out of bed every morning?' },
      intro: { es: 'Entender tu motor interno me ayuda a conectar contigo. 🔥', en: 'Understanding your inner drive helps me connect with you. 🔥' },
      field: 'passions',
      type: 'multiple',
      options: [
        { id: 'family_love', label: { es: 'El amor a mi familia', en: 'Love for my family' }, value: 'family_love', icon: '❤️' },
        { id: 'personal_growth', label: { es: 'Superarme cada día', en: 'Self-improvement' }, value: 'personal_growth', icon: '📈' },
        { id: 'passion_project', label: { es: 'Un proyecto que amo', en: 'A passion project' }, value: 'passion_project', icon: '🚀' },
        { id: 'helping_others', label: { es: 'Ayudar a otros', en: 'Helping others' }, value: 'helping_others', icon: '🤝' },
        { id: 'adventure', label: { es: 'Nuevas aventuras', en: 'New adventures' }, value: 'adventure', icon: '🌄' },
        { id: 'legacy', label: { es: 'Dejar un legado', en: 'Leaving a legacy' }, value: 'legacy', icon: '🏛️' },
      ],
    },
    {
      id: 'who_you_fight_for',
      question: { es: '¿Por quién luchas cada día?', en: 'Who do you fight for every day?' },
      intro: { es: 'Tu "para quién" es tan importante como tu "por qué". 💪', en: 'Your "for whom" is as important as your "why". 💪' },
      field: 'motivations',
      type: 'multiple',
      options: [
        { id: 'children', label: { es: 'Mis hijos', en: 'My children' }, value: 'children', icon: '👶' },
        { id: 'partner', label: { es: 'Mi pareja', en: 'My partner' }, value: 'partner', icon: '💑' },
        { id: 'parents', label: { es: 'Mis padres', en: 'My parents' }, value: 'parents', icon: '👨‍👩‍👦' },
        { id: 'myself', label: { es: 'Por mí mismo', en: 'For myself' }, value: 'myself', icon: '🙋' },
        { id: 'future_family', label: { es: 'Mi futura familia', en: 'My future family' }, value: 'future_family', icon: '🏠' },
        { id: 'community', label: { es: 'Mi comunidad', en: 'My community' }, value: 'community', icon: '🌍' },
      ],
    },
    {
      id: 'life_dreams',
      question: { es: '¿Cuál es tu mayor sueño en la vida?', en: 'What\'s your biggest dream in life?' },
      intro: { es: 'Los sueños grandes necesitan planes financieros sólidos. ✨', en: 'Big dreams need solid financial plans. ✨' },
      field: 'life_dreams',
      type: 'multiple',
      options: [
        { id: 'home', label: { es: 'Casa propia', en: 'Own a home' }, value: 'own_home', icon: '🏠' },
        { id: 'travel', label: { es: 'Viajar por el mundo', en: 'Travel the world' }, value: 'travel_world', icon: '🌍' },
        { id: 'retire', label: { es: 'Retirarme joven', en: 'Retire early' }, value: 'retire_early', icon: '🏖️' },
        { id: 'business', label: { es: 'Mi propio negocio', en: 'Start a business' }, value: 'start_business', icon: '🚀' },
        { id: 'freedom', label: { es: 'Libertad financiera', en: 'Financial freedom' }, value: 'financial_freedom', icon: '🦅' },
        { id: 'education', label: { es: 'Estudiar algo nuevo', en: 'Study something new' }, value: 'education', icon: '🎓' },
        { id: 'kids_future', label: { es: 'Futuro de mis hijos', en: 'My kids\' future' }, value: 'kids_future', icon: '👨‍👧‍👦' },
      ],
    },
  ],
  psychology: [
    {
      id: 'money_personality',
      question: { es: '¿Cómo es tu relación con el dinero?', en: 'What\'s your relationship with money?' },
      intro: { es: 'Ser honesto te ayudará a identificar patrones.', en: 'Being honest will help you identify patterns.' },
      field: 'money_personality',
      type: 'single',
      options: [
        { id: 'saver', label: { es: 'Ahorrador', en: 'Saver' }, value: 'saver', icon: '🐿️' },
        { id: 'spender', label: { es: 'Gastador', en: 'Spender' }, value: 'spender', icon: '🛍️' },
        { id: 'avoider', label: { es: 'Evitador', en: 'Avoider' }, value: 'avoider', icon: '🙈' },
        { id: 'worrier', label: { es: 'Preocupado', en: 'Worrier' }, value: 'worrier', icon: '😰' },
        { id: 'planner', label: { es: 'Planificador', en: 'Planner' }, value: 'planner', icon: '📋' },
      ],
    },
    {
      id: 'fears',
      question: { es: '¿Cuál es tu mayor miedo financiero?', en: 'What\'s your biggest financial fear?' },
      intro: { es: 'Conocer tus miedos me permite ayudarte a superarlos. 💪', en: 'Knowing your fears helps me help you overcome them. 💪' },
      field: 'biggest_fears',
      type: 'multiple',
      options: [
        { id: 'debt', label: { es: 'Quedar endeudado', en: 'Getting into debt' }, value: 'debt', icon: '📉' },
        { id: 'job_loss', label: { es: 'Perder mi trabajo', en: 'Losing my job' }, value: 'job_loss', icon: '💼' },
        { id: 'emergency', label: { es: 'Emergencia inesperada', en: 'Unexpected emergency' }, value: 'emergency', icon: '🚨' },
        { id: 'retirement', label: { es: 'No poder retirarme', en: 'Can\'t retire' }, value: 'no_retirement', icon: '👴' },
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
  const hasSpokenRef = useRef<string | null>(null);
  const handleOptionSelectRef = useRef<(value: string) => void>(() => {});
  
  const questions = EXTENDED_QUESTIONS[section] || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  
  const upsertLifeProfile = useUpsertLifeProfile();
  const markSectionComplete = useMarkSectionComplete();
  
  // Voice transcript handler - match spoken words to options
  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (!currentQuestion?.options) return;
    
    const lowerTranscript = transcript.toLowerCase();
    
    // Find matching option
    const matchedOption = currentQuestion.options.find(opt => 
      lowerTranscript.includes(opt.label.es.toLowerCase()) ||
      lowerTranscript.includes(opt.label.en.toLowerCase())
    );
    
    if (matchedOption) {
      handleOptionSelectRef.current(matchedOption.value);
      setInterimText('');
    }
  }, [currentQuestion]);
  
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
      hasSpokenRef.current = null;
    }
  }, [open, section]);
  
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
      
      // Auto-advance for single select
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (currentStep < questions.length - 1) {
          setCurrentStep(prev => prev + 1);
          hasSpokenRef.current = null;
        } else {
          handleComplete();
        }
      }, 800);
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
