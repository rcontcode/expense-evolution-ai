import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wind, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type WidgetMode = 'breathing' | 'focus';

/**
 * Inline Fokuspark mini-widgets embedded directly in EvoFinz.
 * - Breathing: 4-7-8 guided breathing animation
 * - Focus: Quick 5-min focus timer
 * Logs sessions to financial_focus_sessions on completion.
 */
export const EcosystemInlineWidgets = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';

  const [activeWidget, setActiveWidget] = useState<WidgetMode | null>(null);

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_badge')) return null;

  return (
    <div className="space-y-2">
      {!activeWidget && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/15">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-primary" />
                {isEs ? 'Mini Herramientas' : 'Mini Tools'}
                <span className="text-[9px] font-normal text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded-full">
                  Fokuspark
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-16 flex-col gap-1 text-xs"
                  onClick={() => setActiveWidget('breathing')}
                >
                  <Wind className="h-5 w-5 text-sky-500" />
                  {isEs ? 'Respiración 4-7-8' : '4-7-8 Breathing'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-16 flex-col gap-1 text-xs"
                  onClick={() => setActiveWidget('focus')}
                >
                  <Timer className="h-5 w-5 text-orange-500" />
                  {isEs ? 'Enfoque 5 min' : '5 min Focus'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeWidget === 'breathing' && (
        <BreathingWidget
          isEs={isEs}
          userId={user?.id}
          onClose={() => setActiveWidget(null)}
        />
      )}

      {activeWidget === 'focus' && (
        <FocusTimerWidget
          isEs={isEs}
          userId={user?.id}
          onClose={() => setActiveWidget(null)}
        />
      )}
    </div>
  );
});

EcosystemInlineWidgets.displayName = 'EcosystemInlineWidgets';

// --- Breathing Widget ---
function BreathingWidget({ isEs, userId, onClose }: { isEs: boolean; userId?: string; onClose: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(true);
  const totalCycles = 4;

  useEffect(() => {
    if (!running) return;
    const durations = { inhale: 4000, hold: 7000, exhale: 8000 };
    const timer = setTimeout(() => {
      if (phase === 'inhale') setPhase('hold');
      else if (phase === 'hold') setPhase('exhale');
      else {
        const next = cycle + 1;
        if (next >= totalCycles) {
          setRunning(false);
          logSession(userId, 1, 'breathing');
          toast.success(isEs ? '¡Sesión de respiración completada!' : 'Breathing session complete!');
          return;
        }
        setCycle(next);
        setPhase('inhale');
      }
    }, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase, cycle, running]);

  const scaleMap = { inhale: 1.4, hold: 1.4, exhale: 0.8 };
  const labelMap = {
    inhale: isEs ? 'Inhala' : 'Inhale',
    hold: isEs ? 'Sostén' : 'Hold',
    exhale: isEs ? 'Exhala' : 'Exhale',
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
        <CardContent className="py-6 flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-full bg-sky-500/20 flex items-center justify-center"
              animate={{ scale: scaleMap[phase] }}
              transition={{ duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0.3 : 8, ease: 'easeInOut' }}
            >
              <div className="w-10 h-10 rounded-full bg-sky-500/40" />
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{running ? labelMap[phase] : (isEs ? '¡Listo!' : 'Done!')}</p>
            <p className="text-[10px] text-muted-foreground">{cycle + 1}/{totalCycles}</p>
          </div>

          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
            {running ? (isEs ? 'Cancelar' : 'Cancel') : (isEs ? 'Cerrar' : 'Close')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Focus Timer Widget ---
function FocusTimerWidget({ isEs, userId, onClose }: { isEs: boolean; userId?: string; onClose: () => void }) {
  const DURATION = 5 * 60; // 5 minutes
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [running, setRunning] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!running || completed) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRunning(false);
          setCompleted(true);
          logSession(userId, 5, 'focus');
          toast.success(isEs ? '¡Sesión de enfoque completada!' : 'Focus session complete!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, completed]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / DURATION;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - progress);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
        <CardContent className="py-6 flex flex-col items-center gap-4">
          <div className="relative h-24 w-24">
            <svg className="-rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" className="stroke-muted" />
              <circle
                cx="50" cy="50" r="40" fill="none" strokeWidth="6"
                stroke="#f97316"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-mono font-bold text-foreground">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {completed
              ? (isEs ? '¡Sesión completada!' : 'Session complete!')
              : (isEs ? 'Enfoque activo' : 'Active focus')}
          </p>

          <div className="flex gap-2">
            {!completed && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => setRunning(!running)}
              >
                {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {running ? (isEs ? 'Pausar' : 'Pause') : (isEs ? 'Reanudar' : 'Resume')}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
              {completed ? (isEs ? 'Cerrar' : 'Close') : (isEs ? 'Cancelar' : 'Cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Shared session logger ---
async function logSession(userId: string | undefined, durationMinutes: number, type: string) {
  if (!userId) return;
  try {
    await supabase.from('financial_focus_sessions').insert({
      user_id: userId,
      duration_minutes: durationMinutes,
      session_type: type,
      completed: true,
    });
  } catch (e) {
    console.error('Error logging session:', e);
  }
}
