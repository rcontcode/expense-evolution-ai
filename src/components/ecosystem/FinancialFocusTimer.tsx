import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, Play, Square, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const PRESETS = [
  { key: 'review', minutes: 15, xp: 10, es: 'Revisión de gastos', en: 'Expense Review' },
  { key: 'planning', minutes: 25, xp: 15, es: 'Planificación', en: 'Planning' },
  { key: 'study', minutes: 50, xp: 25, es: 'Estudio de inversiones', en: 'Investment Study' },
];

export function FinancialFocusTimer() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [preset, setPreset] = useState(PRESETS[1]);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[1].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const totalSeconds = preset.minutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    setCompleted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (user?.id) {
      try {
        await (supabase as any)
          .from('financial_focus_sessions')
          .insert({
            user_id: user.id,
            session_type: preset.key,
            duration_minutes: preset.minutes,
            completed: true,
            xp_awarded: preset.xp,
          });
        toast.success(
          language === 'es'
            ? `¡Sesión completada! +${preset.xp} XP 🎉`
            : `Session complete! +${preset.xp} XP 🎉`
        );
      } catch {
        toast.error(language === 'es' ? 'Error al guardar sesión' : 'Error saving session');
      }
    }
  }, [user?.id, preset, language]);

  const start = () => {
    setIsRunning(true);
    setCompleted(false);
    setSecondsLeft(preset.minutes * 60);
  };

  const stop = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(preset.minutes * 60);
  };

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleComplete]);

  const selectPreset = (key: string) => {
    const p = PRESETS.find(pr => pr.key === key);
    if (p && !isRunning) {
      setPreset(p);
      setSecondsLeft(p.minutes * 60);
      setCompleted(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Timer className="h-4 w-4 text-amber-500" />
          {language === 'es' ? 'Timer de Enfoque' : 'Focus Timer'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset selector */}
        <Select value={preset.key} onValueChange={selectPreset} disabled={isRunning}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map(p => (
              <SelectItem key={p.key} value={p.key}>
                {language === 'es' ? p.es : p.en} ({p.minutes}m)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Timer Display */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-28 w-28 flex items-center justify-center">
            {/* Progress ring */}
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" className="stroke-muted" />
              <circle
                cx="50" cy="50" r="44" fill="none" strokeWidth="6"
                className="stroke-primary"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="z-10 text-center">
              {completed ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <p className="text-xl font-mono font-bold text-foreground">{formatTime(secondsLeft)}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isRunning ? 'destructive' : 'default'}
              onClick={isRunning ? stop : start}
              className="min-h-[44px] gap-2"
              disabled={completed}
            >
              {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning
                ? (language === 'es' ? 'Detener' : 'Stop')
                : (language === 'es' ? 'Iniciar' : 'Start')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            +{preset.xp} XP {language === 'es' ? 'al completar' : 'on completion'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
