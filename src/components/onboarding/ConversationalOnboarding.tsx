import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Sparkles, MessageCircle, Loader2, Volume2, VolumeX, Settings2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PhoenixLogo, PhoenixState } from '@/components/ui/phoenix-logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConversationalOnboarding, OnboardingOption } from '@/hooks/utils/useConversationalOnboarding';
import { useElevenLabsTTS } from '@/hooks/utils/useElevenLabsTTS';
import { useVoicePreferences } from '@/hooks/utils/useVoicePreferences';
import { useVoiceAssistant } from '@/hooks/utils/useVoiceAssistant';
import { VoiceSettingsPanel } from '@/components/chat/VoiceSettingsPanel';
import { cn } from '@/lib/utils';


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
  const [interimTranscript, setInterimTranscript] = useState('');
  const [textInputValue, setTextInputValue] = useState('');
  const hasSpokenRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  
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

  // Keep selection stable for rerenders
  const selectedPremiumVoiceId = voicePrefs.getPremiumVoiceId(lang) || undefined;

  // ElevenLabs TTS (premium voice)
  const elevenLabsTTS = useElevenLabsTTS({
    voiceId: selectedPremiumVoiceId,
    lang,
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender,
  });

  // Find matching option from transcript
  const findMatchingOption = useCallback((transcript: string, options: OnboardingOption[]): OnboardingOption | null => {
    const normalized = transcript.toLowerCase().trim();
    
    for (const option of options) {
      const labelEs = option.label.es.toLowerCase();
      const labelEn = option.label.en.toLowerCase();
      const value = option.value.toLowerCase();
      
      // Match by label or value
      if (
        normalized.includes(labelEs) ||
        normalized.includes(labelEn) ||
        normalized.includes(value) ||
        labelEs.includes(normalized) ||
        labelEn.includes(normalized)
      ) {
        return option;
      }
    }
    
    return null;
  }, []);

  // Handle voice transcript
  const handleVoiceResponse = useCallback((transcript: string) => {
    if (!currentQuestion || !transcript.trim()) return;
    
    setInterimTranscript('');
    
    const matchedOption = findMatchingOption(transcript, currentQuestion.options);
    
    if (matchedOption) {
      // User said a valid option
      handleOptionClickInternal(matchedOption, true);
    } else {
      // Didn't match - provide feedback
      const feedback = lang === 'es' 
        ? 'No entendí tu respuesta. Por favor elige una de las opciones.'
        : "I didn't understand. Please choose one of the options.";
      voiceAssistant.speak(feedback);
    }
  }, [currentQuestion, lang]);

  // Unified voice assistant with premium TTS integration
  const voiceAssistant = useVoiceAssistant({
    speechSpeed: voicePrefs.speechSpeed,
    volume: voicePrefs.volume,
    pitch: voicePrefs.pitch,
    voiceGender: voicePrefs.voiceGender === 'auto' ? 'female' : voicePrefs.voiceGender,
    selectedVoiceName: voicePrefs.selectedVoiceName,
    premiumSpeak: elevenLabsTTS.speak,
    isPremiumSpeaking: elevenLabsTTS.isSpeaking,
    onTranscript: handleVoiceResponse,
    onInterimTranscript: (text) => setInterimTranscript(text),
  });

  const isSpeaking = voiceAssistant.isSpeaking || elevenLabsTTS.isSpeaking;
  const isLoadingVoice = elevenLabsTTS.isLoading;
  const isListening = voiceAssistant.isListening;

  // If user has global volume set to 0, auto-unmute
  useEffect(() => {
    if (voiceEnabled && voicePrefs.volume === 0) {
      voicePrefs.setVolume(1);
    }
  }, [voiceEnabled, voicePrefs.volume, voicePrefs.setVolume]);

  // If user changes voice settings, allow re-speaking the current step
  useEffect(() => {
    hasSpokenRef.current = null;
  }, [selectedPremiumVoiceId, voicePrefs.selectedVoiceName, voicePrefs.voiceGender]);

  // Phoenix state evolves with progress
  const phoenixState: PhoenixState = 
    state.currentStep <= 1 ? 'flames' :
    state.currentStep <= 3 ? 'smoke' :
    'rebirth';

  // Track if speech is already in progress to prevent React StrictMode double-execution
  const isSpeakingInProgressRef = useRef(false);

  // Auto-speak on mount and when step changes
  // CRITICAL: Must speak immediately when landing on this page!
  // IMPORTANT: Wait until voice engine is supported/ready; otherwise the first speak() no-ops and never retries.
  useEffect(() => {
    if (!voiceEnabled) return;
    if (!currentQuestion) return;
    if (!voiceAssistant.isSupported) return;
    
    // Don't try to speak if ElevenLabs is still speaking (prevents overlap)
    if (isSpeaking || isLoadingVoice) return;

    const questionKey = `${currentQuestion.id}-${state.currentStep}`;

    // Skip if we already spoke this question
    if (hasSpokenRef.current === questionKey) return;
    
    // Prevent React StrictMode double-execution
    if (isSpeakingInProgressRef.current) return;
    isSpeakingInProgressRef.current = true;

    const textToSpeak = `${currentQuestion.phoenixIntro[lang]}. ${currentQuestion.question[lang]}`;

    // Mark as spoken ONLY once we're actually ready to speak
    hasSpokenRef.current = questionKey;

    // Slight delay for audio to feel natural
    // First mount: quick start. Subsequent: wait for previous audio to finish
    const delay = !isInitializedRef.current ? 450 : 800;

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      console.log('[Onboarding] First mount - auto-speaking in', delay, 'ms');
    }

    const timeout = setTimeout(() => {
      if (!voiceEnabled) return;
      if (!voiceAssistant.isSupported) return;
      console.log('[Onboarding] Auto-speaking step', state.currentStep + 1, ':', textToSpeak.substring(0, 50) + '...');
      voiceAssistant.speak(textToSpeak);
      
      // Reset after speaking to allow next step
      setTimeout(() => {
        isSpeakingInProgressRef.current = false;
      }, 100);
    }, delay);

    return () => {
      clearTimeout(timeout);
      isSpeakingInProgressRef.current = false;
    };
  }, [voiceEnabled, voiceAssistant.isSupported, currentQuestion?.id, state.currentStep, lang, voiceAssistant, isSpeaking, isLoadingVoice]);

  // Check if current question has a selection
  const currentField = currentQuestion?.field;
  const currentResponse = currentField ? state.responses[currentField] : null;

  const isOptionSelected = (optionValue: string) => {
    if (Array.isArray(currentResponse)) {
      return currentResponse.includes(optionValue);
    }
    return currentResponse === optionValue;
  };

  // Internal handler for option selection (used by both click and voice)
  const handleOptionClickInternal = useCallback((option: OnboardingOption, fromVoice = false) => {
    voiceAssistant.stopSpeaking();
    selectOption(option.value);
    
    if (!currentQuestion?.allowMultiple) {
      setIsTyping(true);
      
      // DON'T speak acknowledgment here - let the auto-speak useEffect handle the next question
      // This prevents overlap between "¡Perfecto!" and the next question's intro
      // The next question's intro already has enthusiastic energy
      
      // Clear the hasSpokenRef so the next question can be spoken
      hasSpokenRef.current = null;
      
      setTimeout(() => {
        setIsTyping(false);
        nextStep();
      }, fromVoice ? 800 : 600);
    }
  }, [currentQuestion, selectOption, nextStep, voiceAssistant]);

  const handleOptionClick = useCallback((option: OnboardingOption) => {
    handleOptionClickInternal(option, false);
  }, [handleOptionClickInternal]);

  const handleComplete = useCallback(async () => {
    voiceAssistant.stopSpeaking();
    const success = await saveProfile();
    if (success) {
      if (voiceEnabled) {
        const message = lang === 'es' 
          ? '¡Felicidades! Tu perfil está completo. Estoy lista para ayudarte.'
          : 'Congratulations! Your profile is complete. I\'m ready to help you.';
        voiceAssistant.speak(message);
      }
      
      // Confetti removed - routine onboarding action
      
      setTimeout(() => {
        onComplete();
        navigate('/dashboard');
      }, 2500);
    }
  }, [saveProfile, onComplete, navigate, voiceEnabled, lang, voiceAssistant]);

  const handleNextOrComplete = useCallback(() => {
    voiceAssistant.stopSpeaking();
    if (isLastStep) {
      handleComplete();
    } else {
      setIsTyping(true);
      
      if (voiceEnabled) {
        const acks = lang === 'es' 
          ? ['Sigamos.', 'Continuemos.', 'Siguiente.']
          : ['Let\'s continue.', 'Moving on.', 'Next.'];
        voiceAssistant.speak(acks[Math.floor(Math.random() * acks.length)]);
      }
      
      setTimeout(() => {
        setIsTyping(false);
        nextStep();
      }, 800);
    }
  }, [isLastStep, handleComplete, nextStep, voiceEnabled, lang, voiceAssistant]);

  const handleBack = useCallback(() => {
    voiceAssistant.stopSpeaking();
    hasSpokenRef.current = null;
    if (state.currentStep === 0) {
      onBack?.();
    } else {
      previousStep();
    }
  }, [state.currentStep, onBack, previousStep, voiceAssistant]);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      voiceAssistant.stopSpeaking();
      setVoiceEnabled(false);
      return;
    }

    // Turning voice on: if volume is 0, unmute
    if (voicePrefs.volume === 0) {
      voicePrefs.setVolume(1);
    }

    hasSpokenRef.current = null;
    setVoiceEnabled(true);
  }, [voiceEnabled, voiceAssistant, voicePrefs]);

  const toggleMicrophone = useCallback(() => {
    if (isSpeaking || isLoadingVoice) {
      // Don't allow mic while Phoenix is speaking
      return;
    }
    voiceAssistant.toggleListening();
  }, [voiceAssistant, isSpeaking, isLoadingVoice]);

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
          <div className="flex items-center gap-2">
            <span className="text-white/50">{Math.round(progress)}%</span>
            
            {/* Voice Settings Button */}
            <Button
              variant={showVoiceSettings ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={cn(
                "h-9 w-9 p-0 rounded-full border-2 transition-all",
                showVoiceSettings 
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "border-white/40 bg-white/20 text-white hover:bg-white/30 hover:border-white/60"
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
                "h-9 w-9 p-0 rounded-full border-2 transition-all",
                voiceEnabled 
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "border-white/40 bg-white/20 text-white hover:bg-white/30 hover:border-white/60"
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
          <Card className="mb-4 border-primary/30 bg-card/95">
            <CardContent className="pt-4">
              <VoiceSettingsPanel
                language={lang}
                autoSpeak={voiceEnabled}
                onAutoSpeakChange={(v) => {
                  if (v && voicePrefs.volume === 0) {
                    voicePrefs.setVolume(1);
                  }
                  setVoiceEnabled(v);
                  hasSpokenRef.current = null;
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
              {/* Microphone Button + Transcript */}
              {voiceAssistant.isSupported && voiceEnabled && (
                <div className="mb-4">
                  <div className="flex items-center gap-3 justify-center">
                    <Button
                      variant={isListening ? "default" : "outline"}
                      size="lg"
                      onClick={toggleMicrophone}
                      disabled={isSpeaking || isLoadingVoice || isTyping}
                      className={cn(
                        "h-14 w-14 rounded-full border-2 transition-all",
                        isListening 
                          ? "bg-destructive border-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/40" 
                          : "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary"
                      )}
                    >
                      {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                  </div>
                  
                  {/* Listening status + transcript */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div 
                        className="mt-3 text-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="flex items-center justify-center gap-2 text-sm text-primary">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                          </span>
                          {lang === 'es' ? 'Escuchando...' : 'Listening...'}
                        </div>
                        {interimTranscript && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            "{interimTranscript}"
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Hint text */}
                  {!isListening && !isSpeaking && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {lang === 'es' 
                        ? 'Toca el micrófono para responder con tu voz' 
                        : 'Tap the mic to answer with your voice'}
                    </p>
                  )}
                </div>
              )}

              {/* Text Input for name/nickname questions */}
              {currentQuestion.isTextInput ? (
                <div className="space-y-4">
                  <Input
                    value={textInputValue}
                    onChange={(e) => setTextInputValue(e.target.value)}
                    placeholder={lang === 'es' ? 'Escribe aquí...' : 'Type here...'}
                    className="text-lg h-12"
                    autoFocus
                    disabled={isTyping || isSpeaking}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && textInputValue.trim()) {
                        selectOption(textInputValue.trim());
                        setTextInputValue('');
                        setIsTyping(true);
                        hasSpokenRef.current = null;
                        setTimeout(() => {
                          setIsTyping(false);
                          nextStep();
                        }, 600);
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (textInputValue.trim()) {
                        selectOption(textInputValue.trim());
                        setTextInputValue('');
                        setIsTyping(true);
                        hasSpokenRef.current = null;
                        setTimeout(() => {
                          setIsTyping(false);
                          nextStep();
                        }, 600);
                      }
                    }}
                    disabled={!textInputValue.trim() || isTyping || isSpeaking}
                    className="w-full"
                  >
                    {lang === 'es' ? 'Continuar' : 'Continue'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* Options */
                currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleOptionClick(option)}
                    disabled={isTyping || isSpeaking || isListening}
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
                    whileHover={{ scale: (isTyping || isSpeaking || isListening) ? 1 : 1.01 }}
                    whileTap={{ scale: (isTyping || isSpeaking || isListening) ? 1 : 0.99 }}
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
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isTyping || isListening}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {lang === 'es' ? 'Atrás' : 'Back'}
        </Button>
        
        {(currentQuestion.allowMultiple || isLastStep) && (
          <Button
            onClick={handleNextOrComplete}
            disabled={!hasCurrentResponse() || state.isLoading || isTyping || isListening}
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
                <Sparkles className="h-4 w-4" />
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
