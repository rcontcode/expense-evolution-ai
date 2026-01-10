import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mic, MicOff, Volume2, Radio, CheckCircle2, AlertCircle, ChevronRight, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceOnboardingProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
  isVoiceSupported: boolean;
  onTestVoice: (text: string) => void;
  onTestMic: () => void;
  isListening: boolean;
  isSpeaking: boolean;
}

const ONBOARDING_KEY = 'evofinz_voice_onboarding_completed';

export function VoiceOnboarding({
  open,
  onComplete,
  onSkip,
  isVoiceSupported,
  onTestVoice,
  onTestMic,
  isListening,
  isSpeaking,
}: VoiceOnboardingProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [voiceTested, setVoiceTested] = useState(false);
  const [micTested, setMicTested] = useState(false);

  // Check mic permission on mount
  useEffect(() => {
    if (open && isVoiceSupported) {
      navigator.mediaDevices?.getUserMedia?.({ audio: true })
        .then(() => setMicPermission('granted'))
        .catch(() => setMicPermission('denied'));
    }
  }, [open, isVoiceSupported]);

  const steps = [
    {
      title: { es: '¡Bienvenido al Asistente de Voz!', en: 'Welcome to Voice Assistant!' },
      description: {
        es: 'Te guiaré para configurar tu experiencia de voz. Podrás navegar, consultar datos y crear gastos solo con tu voz.',
        en: "I'll guide you through setting up your voice experience. You can navigate, query data, and create expenses just with your voice.",
      },
      action: 'next',
    },
    {
      title: { es: 'Probar el Micrófono', en: 'Test Microphone' },
      description: {
        es: 'Primero, asegurémonos de que tu micrófono funciona. Haz clic en el botón y di algo.',
        en: "First, let's make sure your microphone works. Click the button and say something.",
      },
      action: 'mic',
    },
    {
      title: { es: 'Probar la Voz', en: 'Test Voice' },
      description: {
        es: 'Ahora probemos que puedes escuchar al asistente. Haz clic para escuchar un mensaje de prueba.',
        en: "Now let's test that you can hear the assistant. Click to hear a test message.",
      },
      action: 'voice',
    },
    {
      title: { es: 'Comandos Básicos', en: 'Basic Commands' },
      description: {
        es: 'Puedes usar comandos como:\n• "Ir a gastos" - Navegación\n• "Cuánto gasté este mes" - Consultas\n• "Gasto de 50 en restaurante" - Crear gastos\n• "Modo continuo" - Manos libres',
        en: 'You can use commands like:\n• "Go to expenses" - Navigation\n• "How much did I spend this month" - Queries\n• "Expense of 50 at restaurant" - Create expenses\n• "Continuous mode" - Hands-free',
      },
      action: 'next',
    },
    {
      title: { es: '¡Listo!', en: 'All Set!' },
      description: {
        es: 'Ya puedes usar el asistente de voz. Toca el micrófono para hablar o activa el modo continuo para manos libres.',
        en: "You're ready to use the voice assistant. Tap the microphone to speak or enable continuous mode for hands-free.",
      },
      action: 'complete',
    },
  ];

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const handleTestVoice = () => {
    const testMessage = language === 'es'
      ? '¡Hola! Soy tu asistente financiero. Estoy aquí para ayudarte.'
      : "Hello! I'm your financial assistant. I'm here to help you.";
    onTestVoice(testMessage);
    setVoiceTested(true);
  };

  const handleTestMic = () => {
    onTestMic();
    setMicTested(true);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onSkip();
  };

  if (!isVoiceSupported) {
    return (
      <Dialog open={open} onOpenChange={() => onSkip()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {language === 'es' ? 'Voz No Soportada' : 'Voice Not Supported'}
            </DialogTitle>
            <DialogDescription>
              {language === 'es'
                ? 'Tu navegador no soporta las funciones de voz. Intenta con Chrome, Edge o Safari para una experiencia completa.'
                : 'Your browser does not support voice features. Try Chrome, Edge or Safari for the full experience.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onSkip}>
              {language === 'es' ? 'Entendido' : 'Got it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {step + 1}/{steps.length}
            </Badge>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleSkip}>
              {language === 'es' ? 'Saltar' : 'Skip'}
            </Button>
          </div>
          <Progress value={progress} className="h-1 mb-4" />
          <DialogTitle>{currentStep.title[language as 'es' | 'en']}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {currentStep.description[language as 'es' | 'en']}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Step-specific content */}
          {step === 1 && (
            <div className="flex flex-col items-center gap-4">
              {micPermission === 'denied' && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {language === 'es' 
                    ? 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.'
                    : 'Microphone permission denied. Enable it in browser settings.'}
                </div>
              )}
              <Button
                size="lg"
                onClick={handleTestMic}
                disabled={micPermission === 'denied'}
                className={cn(
                  "h-20 w-20 rounded-full",
                  isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                )}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              {micTested && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'es' ? '¡Micrófono funcionando!' : 'Microphone working!'}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                onClick={handleTestVoice}
                className={cn(
                  "h-20 w-20 rounded-full",
                  isSpeaking && "bg-primary animate-pulse"
                )}
              >
                {isSpeaking ? <Square className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
              {voiceTested && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'es' ? '¡Voz funcionando!' : 'Voice working!'}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Mic className="h-5 w-5 text-primary" />
                <span className="text-sm">{language === 'es' ? 'Hablar una vez' : 'Speak once'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Radio className="h-5 w-5 text-green-500" />
                <span className="text-sm">{language === 'es' ? 'Modo continuo' : 'Continuous'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Volume2 className="h-5 w-5 text-blue-500" />
                <span className="text-sm">{language === 'es' ? 'Auto-lectura' : 'Auto-read'}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Square className="h-5 w-5 text-red-500" />
                <span className="text-sm">{language === 'es' ? 'Detener' : 'Stop'}</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              {language === 'es' ? 'Atrás' : 'Back'}
            </Button>
          )}
          {currentStep.action === 'next' && (
            <Button onClick={() => setStep(s => s + 1)}>
              {language === 'es' ? 'Siguiente' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {currentStep.action === 'mic' && (
            <Button onClick={() => setStep(s => s + 1)} disabled={!micTested && micPermission !== 'denied'}>
              {language === 'es' ? 'Continuar' : 'Continue'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {currentStep.action === 'voice' && (
            <Button onClick={() => setStep(s => s + 1)} disabled={!voiceTested}>
              {language === 'es' ? 'Continuar' : 'Continue'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {currentStep.action === 'complete' && (
            <Button onClick={handleComplete}>
              {language === 'es' ? '¡Empezar!' : "Let's go!"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding was completed
export function useVoiceOnboardingStatus() {
  const [completed, setCompleted] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const reset = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setCompleted(false);
  };

  return { completed, reset };
}
