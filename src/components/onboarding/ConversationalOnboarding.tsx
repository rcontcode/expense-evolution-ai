import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Sparkles, MessageCircle, Loader2, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PhoenixLogo, PhoenixState } from '@/components/ui/phoenix-logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConversationalOnboarding, OnboardingOption } from '@/hooks/utils/useConversationalOnboarding';
import { useElevenLabsTTS } from '@/hooks/utils/useElevenLabsTTS';
import { useVoicePreferences } from '@/hooks/utils/useVoicePreferences';
import { useVoiceSynthesis } from '@/hooks/utils/useVoiceSynthesis';
import { VoiceSettingsPanel } from '@/components/chat/VoiceSettingsPanel';
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const hasSpokenRef = useRef<string | null>(null);
  
  const voicePrefs = useVoicePreferences();
  
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

  // Keep selection stable for rerenders and allow reacting to changes
  const selectedPremiumVoiceId = voicePrefs.getPremiumVoiceId(lang) || undefined;

  // ElevenLabs TTS (premium voice)
  const elevenLabsTTS = useElevenLabsTTS({
    voiceId: selectedPremiumVoiceId,
    lang,
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender,
  });

  // Fallback to native voice synthesis - include all voice preferences
  // NOTE: If user volume is 0, they'll hear nothing. We handle unmute on toggle.
  const nativeTTS = useVoiceSynthesis({
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender,
    speechSpeed: voicePrefs.speechSpeed,
    volume: voicePrefs.volume,
    pitch: voicePrefs.pitch,
    selectedVoiceName: voicePrefs.selectedVoiceName,
  });

  const isSpeaking = elevenLabsTTS.isSpeaking || nativeTTS.isSpeaking;
  const isLoadingVoice = elevenLabsTTS.isLoading;

  // If user has global volume set to 0, onboarding will be silent.
  // Auto-unmute once (they can still disable voice with the toggle).
  useEffect(() => {
    if (voiceEnabled && voicePrefs.volume === 0) {
      voicePrefs.setVolume(1);
    }
  }, [voiceEnabled, voicePrefs.volume, voicePrefs.setVolume]);

  // If user changes voice settings, allow re-speaking the current step.
  useEffect(() => {
    hasSpokenRef.current = null;
  }, [selectedPremiumVoiceId, voicePrefs.selectedVoiceName, voicePrefs.voiceGender]);

  // Smart speak function - tries ElevenLabs first, falls back to native
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text?.trim()) return;

    // Try ElevenLabs first if available
    if (elevenLabsTTS.canUsePremium) {
      const result = await elevenLabsTTS.speak(text);
      if (result.success) return;
    }

    // Fallback to native TTS
    nativeTTS.speak(text);
  }, [voiceEnabled, elevenLabsTTS, nativeTTS]);

  const stopSpeaking = useCallback(() => {
    elevenLabsTTS.stop();
    nativeTTS.stop();
  }, [elevenLabsTTS, nativeTTS]);

  // Phoenix state evolves with progress
  const phoenixState: PhoenixState = 
    state.currentStep <= 1 ? 'flames' :
    state.currentStep <= 3 ? 'smoke' :
    'rebirth';

  // Speak the current question when it changes
  useEffect(() => {
    if (!voiceEnabled || !currentQuestion) return;
    
    const questionKey = `${currentQuestion.id}-${state.currentStep}-${selectedPremiumVoiceId || 'native'}`;
    if (hasSpokenRef.current === questionKey) return;
    
    hasSpokenRef.current = questionKey;
    
    // First question speaks faster, subsequent ones have a small delay
    const delay = state.currentStep === 0 ? 800 : 600;
    
    const timeout = setTimeout(() => {
      const textToSpeak = `${currentQuestion.phoenixIntro[lang]}. ${currentQuestion.question[lang]}`;
      speak(textToSpeak);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [currentQuestion, state.currentStep, voiceEnabled, lang, speak, selectedPremiumVoiceId]);

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
    stopSpeaking();
    selectOption(option.value);
    
    if (!currentQuestion?.allowMultiple) {
      setIsTyping(true);
      
      if (voiceEnabled) {
        const acks = lang === 'es' 
          ? ['¡Excelente!', '¡Perfecto!', '¡Muy bien!', '¡Entendido!']
          : ['Excellent!', 'Perfect!', 'Great!', 'Got it!'];
        speak(acks[Math.floor(Math.random() * acks.length)]);
      }
      
      setTimeout(() => {
        setIsTyping(false);
        nextStep();
      }, 1000);
    }
  }, [currentQuestion, selectOption, nextStep, voiceEnabled, lang, speak, stopSpeaking]);

  const handleComplete = useCallback(async () => {
    stopSpeaking();
    const success = await saveProfile();
    if (success) {
      if (voiceEnabled) {
        const message = lang === 'es' 
          ? '¡Felicidades! Tu perfil está completo. Estoy lista para ayudarte.'
          : 'Congratulations! Your profile is complete. I\'m ready to help you.';
        speak(message);
      }
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74'],
      });
      
      setTimeout(() => {
        onComplete();
        navigate('/dashboard');
      }, 2500);
    }
  }, [saveProfile, onComplete, navigate, voiceEnabled, lang, speak, stopSpeaking]);

  const handleNextOrComplete = useCallback(() => {
    stopSpeaking();
    if (isLastStep) {
      handleComplete();
    } else {
      setIsTyping(true);
      
      if (voiceEnabled) {
        const acks = lang === 'es' 
          ? ['Sigamos.', 'Continuemos.', 'Siguiente.']
          : ['Let\'s continue.', 'Moving on.', 'Next.'];
        speak(acks[Math.floor(Math.random() * acks.length)]);
      }
      
      setTimeout(() => {
        setIsTyping(false);
        nextStep();
      }, 800);
    }
  }, [isLastStep, handleComplete, nextStep, voiceEnabled, lang, speak, stopSpeaking]);

  const handleBack = useCallback(() => {
    stopSpeaking();
    hasSpokenRef.current = null;
    if (state.currentStep === 0) {
      onBack?.();
    } else {
      previousStep();
    }
  }, [state.currentStep, onBack, previousStep, stopSpeaking]);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      stopSpeaking();
      setVoiceEnabled(false);
      return;
    }

    // Turning voice on: if volume is 0, unmute so user actually hears it.
    if (voicePrefs.volume === 0) {
      voicePrefs.setVolume(1);
    }

    hasSpokenRef.current = null;
    setVoiceEnabled(true);
  }, [voiceEnabled, stopSpeaking, voicePrefs]);

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
      {/* Progress bar with controls */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-white/70">
          <span className="font-medium">{lang === 'es' ? 'Paso' : 'Step'} {state.currentStep + 1} / {totalSteps}</span>
          <div className="flex items-center gap-1">
            <span className="text-white/50 mr-2">{Math.round(progress)}%</span>
            
            {/* Voice Settings Button */}
            <Button
              variant={showVoiceSettings ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={cn(
                "h-8 w-8 p-0 rounded-full border-2 transition-all",
                showVoiceSettings 
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
              )}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            
            {/* Voice Toggle Button */}
            <Button
              variant={voiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleVoice}
              className={cn(
                "h-8 w-8 p-0 rounded-full border-2 transition-all",
                voiceEnabled 
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
              )}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-white/20" />
      </div>

      {/* Voice Settings Panel */}
      <Collapsible open={showVoiceSettings} onOpenChange={setShowVoiceSettings}>
        <CollapsibleContent>
          <Card className="mb-4 border-primary/20">
            <CardContent className="pt-4">
              <VoiceSettingsPanel
                language={lang}
                autoSpeak={voiceEnabled}
                onAutoSpeakChange={(v) => {
                  // If user turns voice on while volume is 0, unmute for them
                  if (v && voicePrefs.volume === 0) {
                    voicePrefs.setVolume(1);
                  }
                  setVoiceEnabled(v);
                  hasSpokenRef.current = null; // re-speak current step with new settings
                }}
                compact
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Phoenix Logo with speaking indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <PhoenixLogo variant="sidebar" state={phoenixState} />
          {(isSpeaking || isLoadingVoice) && (
            <motion.div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary/20 px-2 py-1 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {isLoadingVoice ? (
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              ) : (
                <Volume2 className="h-3 w-3 text-primary animate-pulse" />
              )}
              <span className="text-xs text-primary">
                {isLoadingVoice 
                  ? (lang === 'es' ? 'Cargando...' : 'Loading...') 
                  : (lang === 'es' ? 'Hablando...' : 'Speaking...')
                }
              </span>
            </motion.div>
          )}
        </div>
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
                  disabled={isTyping || isSpeaking}
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
                  whileHover={{ scale: (isTyping || isSpeaking) ? 1 : 1.01 }}
                  whileTap={{ scale: (isTyping || isSpeaking) ? 1 : 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && <span className="text-2xl">{option.icon}</span>}
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
          onClick={handleBack}
          disabled={isTyping}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {lang === 'es' ? 'Atrás' : 'Back'}
        </Button>
        
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
