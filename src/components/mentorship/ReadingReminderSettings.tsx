import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bell, BellOff, Plus, X, Clock, Calendar, Volume2, VolumeX, TestTube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReadingReminders, DAY_LABELS, PRESET_TIMES } from '@/hooks/data/useReadingReminders';
import { cn } from '@/lib/utils';

export const ReadingReminderSettings = () => {
  const { language } = useLanguage();
  const {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
    notificationPermission,
    requestPermission,
    showNotification,
    isSupported,
  } = useReadingReminders();

  const [newTime, setNewTime] = useState('09:00');

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              {language === 'es'
                ? 'Las notificaciones no están soportadas en este navegador'
                : 'Notifications are not supported in this browser'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToggleDay = (day: number) => {
    const newDays = settings.days.includes(day)
      ? settings.days.filter(d => d !== day)
      : [...settings.days, day].sort();
    updateSettings({ days: newDays });
  };

  const handleAddTime = () => {
    if (!settings.times.includes(newTime)) {
      updateSettings({ times: [...settings.times, newTime].sort() });
    }
  };

  const handleRemoveTime = (time: string) => {
    updateSettings({ times: settings.times.filter(t => t !== time) });
  };

  const handlePresetTime = (times: string[]) => {
    const uniqueTimes = [...new Set([...settings.times, ...times])].sort();
    updateSettings({ times: uniqueTimes });
  };

  const handleEnableReminders = async () => {
    if (notificationPermission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        updateSettings({ enabled: true });
      }
    } else {
      updateSettings({ enabled: !settings.enabled });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {language === 'es' ? 'Recordatorios de Lectura' : 'Reading Reminders'}
            </CardTitle>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleEnableReminders}
            disabled={isUpdating}
          />
        </div>
        <CardDescription>
          {language === 'es'
            ? 'Recibe notificaciones para mantener tu hábito de lectura'
            : 'Get notifications to maintain your reading habit'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Permission Status */}
        {notificationPermission !== 'granted' && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <BellOff className="h-4 w-4" />
              <span className="text-sm font-medium">
                {language === 'es'
                  ? 'Permisos de notificación requeridos'
                  : 'Notification permission required'}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={requestPermission}
            >
              {language === 'es' ? 'Permitir notificaciones' : 'Allow notifications'}
            </Button>
          </div>
        )}

        {settings.enabled && (
          <>
            {/* Days Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {language === 'es' ? 'Días de recordatorio' : 'Reminder days'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS[language === 'es' ? 'es' : 'en'].map((label, index) => (
                  <Badge
                    key={index}
                    variant={settings.days.includes(index) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all',
                      settings.days.includes(index) 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'hover:bg-muted'
                    )}
                    onClick={() => handleToggleDay(index)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {language === 'es' ? 'Horas de recordatorio' : 'Reminder times'}
              </Label>

              {/* Current Times */}
              <div className="flex flex-wrap gap-2">
                {settings.times.map((time) => (
                  <Badge
                    key={time}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {time}
                    <button
                      onClick={() => handleRemoveTime(time)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add Time */}
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-32"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddTime}
                  disabled={settings.times.includes(newTime)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </div>

              {/* Preset Times */}
              <div className="flex flex-wrap gap-2">
                {PRESET_TIMES.map((preset, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handlePresetTime(preset.times)}
                  >
                    {preset.label[language === 'es' ? 'es' : 'en']}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label>
                {language === 'es' ? 'Mensaje personalizado (opcional)' : 'Custom message (optional)'}
              </Label>
              <Textarea
                value={settings.message}
                onChange={(e) => updateSettings({ message: e.target.value })}
                placeholder={
                  language === 'es'
                    ? '¡Es momento de leer!'
                    : "It's time to read!"
                }
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.sound ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <Label>
                  {language === 'es' ? 'Sonido de notificación' : 'Notification sound'}
                </Label>
              </div>
              <Switch
                checked={settings.sound}
                onCheckedChange={(sound) => updateSettings({ sound })}
              />
            </div>

            {/* Test Notification */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => showNotification()}
              disabled={notificationPermission !== 'granted'}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Probar notificación' : 'Test notification'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
