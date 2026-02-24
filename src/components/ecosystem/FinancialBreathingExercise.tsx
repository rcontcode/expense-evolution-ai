import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wind, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { key: 'inhale', duration: 4, es: 'Inhala', en: 'Inhale', scale: 1.4 },
  { key: 'hold', duration: 7, es: 'Retén', en: 'Hold', scale: 1.4 },
  { key: 'exhale', duration: 8, es: 'Exhala', en: 'Exhale', scale: 1 },
];

const MESSAGES_ES = [
  'Calma tu mente antes de decidir',
  'Respira y planifica con claridad',
  'Cada respiración es un reset financiero',
  'Inhala abundancia, exhala estrés',
  'Tu mente clara toma mejores decisiones',
];

const MESSAGES_EN = [
  'Calm your mind before deciding',
  'Breathe and plan with clarity',
  'Every breath is a financial reset',
  'Inhale abundance, exhale stress',
  'A clear mind makes better decisions',
];

export function FinancialBreathingExercise() {
  const { language } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const messages = language === 'es' ? MESSAGES_ES : MESSAGES_EN;
  const phase = PHASES[phaseIndex];

  const stop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].duration);
  }, []);

  const start = useCallback(() => {
    setIsActive(true);
    setCycles(0);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].duration);
    setMessageIndex(Math.floor(Math.random() * messages.length));
  }, [messages.length]);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setPhaseIndex(pi => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) {
              setCycles(c => c + 1);
              setMessageIndex(mi => (mi + 1) % messages.length);
            }
            return next;
          });
          return PHASES[(phaseIndex + 1) % PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, phaseIndex, messages.length]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Wind className="h-4 w-4 text-cyan-500" />
          {language === 'es' ? 'Respiración Financiera' : 'Financial Breathing'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Breathing Circle */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-32 w-32 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30"
              animate={isActive ? { scale: phase.scale } : { scale: 1 }}
              transition={{ duration: phase.duration, ease: 'easeInOut' }}
            />
            <div className="z-10 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-bold text-foreground"
                >
                  {isActive ? (language === 'es' ? phase.es : phase.en) : '4-7-8'}
                </motion.p>
              </AnimatePresence>
              {isActive && (
                <p className="text-2xl font-mono font-bold text-primary">{secondsLeft}</p>
              )}
            </div>
          </div>

          {/* Message */}
          {isActive && (
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground text-center italic"
            >
              {messages[messageIndex]}
            </motion.p>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={isActive ? 'destructive' : 'default'}
              onClick={isActive ? stop : start}
              className="min-h-[44px] gap-2"
            >
              {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isActive
                ? (language === 'es' ? 'Detener' : 'Stop')
                : (language === 'es' ? 'Iniciar' : 'Start')}
            </Button>
          </div>

          {cycles > 0 && (
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? `${cycles} ciclo${cycles > 1 ? 's' : ''} completado${cycles > 1 ? 's' : ''}` : `${cycles} cycle${cycles > 1 ? 's' : ''} completed`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
