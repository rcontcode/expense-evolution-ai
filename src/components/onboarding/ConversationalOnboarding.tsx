import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PhoenixLogo, PhoenixState } from '@/components/ui/phoenix-logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConversationalOnboarding, OnboardingOption } from '@/hooks/utils/useConversationalOnboarding';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface ConversationalOnboardingProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function ConversationalOnboarding({ onComplete, onBack }: ConversationalOnboardingProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';
  const [isTyping, setIsTyping] = useState(false);
  
  const {
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
  } = useConversationalOnboarding();

  // Phoenix state evolves with progress
  const phoenixState: PhoenixState = 
    state.currentStep <= 1 ? 'flames' :
    state.currentStep <= 3 ? 'smoke' :
    'rebirth';

  // Check if current question has a selection
  const currentField = currentQuestion?.field;
  const currentResponse = currentField ? state.responses[currentField] : null;

  const isOptionSelected = (optionValue: string) => {
    if (Array.isArray(currentResponse)) {
      return currentResponse.includes(optionValue);
    }
    return currentResponse === optionValue;
  };

  const handleOptionClick = useCallback((option: OnboardingOption) => {
    selectOption(option.value);
    
    // For single-select, show typing animation then advance
    if (!currentQuestion?.allowMultiple) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        nextStep();
      }, 600);
    }
  }, [currentQuestion, selectOption, nextStep]);

  const handleComplete = useCallback(async () => {
    const success = await saveProfile();
    if (success) {
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74'],
      });
      
      // Navigate after a short celebration
      setTimeout(() => {
        onComplete();
        navigate('/dashboard');
      }, 800);
    }
  }, [saveProfile, onComplete, navigate]);

  const handleNextOrComplete = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        nextStep();
      }, 400);
    }
  }, [isLastStep, handleComplete, nextStep]);

  if (state.isComplete) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center gap-6 text-center w-full max-w-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <PhoenixLogo variant="sidebar" state="rebirth" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {lang === 'es' ? '¡Perfil Completo!' : 'Profile Complete!'}
            <Sparkles className="h-6 w-6 text-primary" />
          </h2>
          <p className="text-white/80 max-w-md">
            {getPersonalizedSummary(lang)}
          </p>
        </div>
        <Button onClick={() => { onComplete(); navigate('/dashboard'); }} size="lg">
          {lang === 'es' ? 'Ir al Dashboard' : 'Go to Dashboard'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-white/60">
          <span>{lang === 'es' ? 'Paso' : 'Step'} {state.currentStep + 1} / {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Phoenix Logo with evolution */}
      <div className="flex justify-center">
        <PhoenixLogo variant="sidebar" state={phoenixState} />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl border-primary/20">
            <CardHeader className="space-y-4">
              {/* Phoenix intro message with typing indicator */}
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/80">
                    {currentQuestion.phoenixIntro[lang]}
                  </p>
                  {isTyping && (
                    <motion.div 
                      className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {lang === 'es' ? 'Phoenix está procesando...' : 'Phoenix is processing...'}
                    </motion.div>
                  )}
                </div>
              </div>
              
              <CardTitle className="text-xl">
                {currentQuestion.question[lang]}
              </CardTitle>
              
              {currentQuestion.allowMultiple && (
                <CardDescription>
                  {lang === 'es' 
                    ? 'Puedes seleccionar varias opciones' 
                    : 'You can select multiple options'}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  disabled={isTyping}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isOptionSelected(option.value)
                      ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                      : "border-border bg-card"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: isTyping ? 1 : 1.01 }}
                  whileTap={{ scale: isTyping ? 1 : 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <span className="text-2xl">{option.icon}</span>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{option.label[lang]}</p>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">
                          {option.description[lang]}
                        </p>
                      )}
                    </div>
                    {isOptionSelected(option.value) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="h-5 w-5 text-primary" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={state.currentStep === 0 ? onBack : previousStep}
          disabled={isTyping}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {lang === 'es' ? 'Atrás' : 'Back'}
        </Button>
        
        {/* Show Next/Complete button for multi-select OR when on last step */}
        {(currentQuestion.allowMultiple || isLastStep) && (
          <Button
            onClick={handleNextOrComplete}
            disabled={!hasCurrentResponse() || state.isLoading || isTyping}
            className="gap-2"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === 'es' ? 'Guardando...' : 'Saving...'}
              </>
            ) : isLastStep ? (
              <>
                {lang === 'es' ? 'Completar' : 'Complete'}
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                {lang === 'es' ? 'Siguiente' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
