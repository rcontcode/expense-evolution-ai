import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMergedPreferences, useUpsertNotificationPreference, NOTIFICATION_TYPES, type NotificationType } from '@/hooks/data/useNotificationPreferences';
import { Bell, FileText, Calculator, Wallet, Settings2, Clock, Repeat, Hash, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_CONFIG: Record<NotificationType, {
  icon: typeof Bell;
  colorClass: string;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
}> = {
  bill_reminder: {
    icon: Wallet,
    colorClass: 'text-blue-500 bg-blue-500/10',
    labelEs: 'Pagos Fijos',
    labelEn: 'Recurring Bills',
    descEs: 'Alertas antes del vencimiento de pagos recurrentes',
    descEn: 'Alerts before recurring bill due dates',
  },
  contract_reminder: {
    icon: FileText,
    colorClass: 'text-violet-500 bg-violet-500/10',
    labelEs: 'Contratos',
    labelEn: 'Contracts',
    descEs: 'Avisos de vencimiento y renovación de contratos',
    descEn: 'Contract expiration and renewal notices',
  },
  tax_reminder: {
    icon: Calculator,
    colorClass: 'text-cyan-500 bg-cyan-500/10',
    labelEs: 'Calendario Fiscal',
    labelEn: 'Tax Calendar',
    descEs: 'Recordatorios de fechas límite fiscales',
    descEn: 'Tax deadline reminders',
  },
  budget_alert: {
    icon: Bell,
    colorClass: 'text-amber-500 bg-amber-500/10',
    labelEs: 'Presupuesto',
    labelEn: 'Budget',
    descEs: 'Alertas cuando se acercan o exceden límites de gasto',
    descEn: 'Alerts when spending approaches or exceeds limits',
  },
};

export function ReminderPreferencesPanel() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { preferences, isLoading } = useMergedPreferences();
  const upsertPref = useUpsertNotificationPreference();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          {isEs ? 'Configuración de Recordatorios' : 'Reminder Settings'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isEs
            ? 'Personaliza qué tipo de recordatorios recibes, cuándo y con qué frecuencia.'
            : 'Customize what type of reminders you receive, when, and how often.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATION_TYPES.map((type) => {
          const config = TYPE_CONFIG[type];
          const pref = preferences[type];
          const Icon = config.icon;

          return (
            <ReminderTypeCard
              key={type}
              type={type}
              icon={Icon}
              colorClass={config.colorClass}
              label={isEs ? config.labelEs : config.labelEn}
              description={isEs ? config.descEs : config.descEn}
              enabled={pref.enabled}
              advanceDays={pref.advance_days}
              repeatFrequency={pref.repeat_frequency}
              maxReminders={pref.max_reminders}
              preferredHour={pref.preferred_hour}
              isEs={isEs}
              onSave={(updates) => {
                upsertPref.mutate({
                  notification_type: type,
                  enabled: updates.enabled ?? pref.enabled,
                  advance_days: updates.advance_days ?? pref.advance_days,
                  repeat_frequency: updates.repeat_frequency ?? pref.repeat_frequency,
                  max_reminders: updates.max_reminders ?? pref.max_reminders,
                  preferred_hour: updates.preferred_hour !== undefined ? updates.preferred_hour : pref.preferred_hour,
                });
              }}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

interface ReminderTypeCardProps {
  type: string;
  icon: typeof Bell;
  colorClass: string;
  label: string;
  description: string;
  enabled: boolean;
  advanceDays: number;
  repeatFrequency: string;
  maxReminders: number;
  preferredHour: number | null;
  isEs: boolean;
  onSave: (updates: Record<string, any>) => void;
}

function ReminderTypeCard({
  icon: Icon, colorClass, label, description,
  enabled: initialEnabled, advanceDays: initialAdvance, repeatFrequency: initialFreq,
  maxReminders: initialMax, preferredHour: initialHour, isEs, onSave
}: ReminderTypeCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [advanceDays, setAdvanceDays] = useState(initialAdvance);
  const [frequency, setFrequency] = useState(initialFreq);
  const [maxReminders, setMaxReminders] = useState(initialMax);
  const [preferredHour, setPreferredHour] = useState(initialHour);
  const [dirty, setDirty] = useState(false);

  const handleChange = (field: string, value: any) => {
    setDirty(true);
    if (field === 'enabled') setEnabled(value);
    if (field === 'advance_days') setAdvanceDays(value);
    if (field === 'repeat_frequency') setFrequency(value);
    if (field === 'max_reminders') setMaxReminders(value);
    if (field === 'preferred_hour') setPreferredHour(value);
  };

  const handleSave = () => {
    onSave({
      enabled,
      advance_days: advanceDays,
      repeat_frequency: frequency,
      max_reminders: maxReminders,
      preferred_hour: preferredHour,
    });
    setDirty(false);
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-3 transition-all",
      !enabled && "opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => handleChange('enabled', v)}
        />
      </div>

      {/* Settings (only when enabled) */}
      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
          {/* Advance Days */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {isEs ? 'Anticipación (días)' : 'Advance (days)'}
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[advanceDays]}
                onValueChange={([v]) => handleChange('advance_days', v)}
                min={1}
                max={60}
                step={1}
                className="flex-1"
              />
              <Badge variant="secondary" className="min-w-[2.5rem] justify-center">
                {advanceDays}
              </Badge>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Repeat className="h-3 w-3" />
              {isEs ? 'Frecuencia' : 'Frequency'}
            </Label>
            <Select value={frequency} onValueChange={(v) => handleChange('repeat_frequency', v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{isEs ? 'Una vez' : 'Once'}</SelectItem>
                <SelectItem value="daily_until_deadline">{isEs ? 'Diario hasta el vencimiento' : 'Daily until deadline'}</SelectItem>
                <SelectItem value="weekly">{isEs ? 'Semanal' : 'Weekly'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Reminders */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              {isEs ? 'Máximo por mes' : 'Max per month'}
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[maxReminders]}
                onValueChange={([v]) => handleChange('max_reminders', v)}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <Badge variant="secondary" className="min-w-[2.5rem] justify-center">
                {maxReminders}
              </Badge>
            </div>
          </div>

          {/* Preferred Hour */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {isEs ? 'Hora preferida' : 'Preferred hour'}
            </Label>
            <Select 
              value={preferredHour !== null ? String(preferredHour) : 'any'} 
              onValueChange={(v) => handleChange('preferred_hour', v === 'any' ? null : Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{isEs ? 'Cualquier hora' : 'Anytime'}</SelectItem>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Save button */}
      {dirty && (
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isEs ? 'Guardar' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
}
