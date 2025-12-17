import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Bell, 
  Trophy, 
  Target, 
  TrendingUp, 
  Flame, 
  Calendar, 
  Receipt, 
  Wallet, 
  FileText, 
  Lightbulb, 
  AlertTriangle,
  BookOpen,
  Calculator,
  Loader2,
  Save
} from 'lucide-react';

interface NotificationCategory {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
  color: string;
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    key: 'achievements',
    icon: Trophy,
    labelEs: 'Logros y Niveles',
    labelEn: 'Achievements & Levels',
    descriptionEs: 'Notificaciones cuando desbloqueas logros o subes de nivel',
    descriptionEn: 'Notifications when you unlock achievements or level up',
    color: 'text-amber-500'
  },
  {
    key: 'goals',
    icon: Target,
    labelEs: 'Metas de Ahorro',
    labelEn: 'Savings Goals',
    descriptionEs: 'Progreso, fechas límite y completitud de metas',
    descriptionEn: 'Progress, deadlines and goal completion',
    color: 'text-green-500'
  },
  {
    key: 'investments',
    icon: TrendingUp,
    labelEs: 'Metas de Inversión',
    labelEn: 'Investment Goals',
    descriptionEs: 'Actualizaciones sobre tus metas de inversión',
    descriptionEn: 'Updates on your investment goals',
    color: 'text-emerald-500'
  },
  {
    key: 'streaks',
    icon: Flame,
    labelEs: 'Rachas y Hábitos',
    labelEn: 'Streaks & Habits',
    descriptionEs: 'Rachas de actividad y recordatorios de hábitos',
    descriptionEn: 'Activity streaks and habit reminders',
    color: 'text-red-500'
  },
  {
    key: 'reminders',
    icon: Calendar,
    labelEs: 'Recordatorios',
    labelEn: 'Reminders',
    descriptionEs: 'Gastos pendientes, recibos sin revisar, tareas',
    descriptionEn: 'Pending expenses, unreviewed receipts, tasks',
    color: 'text-cyan-500'
  },
  {
    key: 'expenses',
    icon: Receipt,
    labelEs: 'Gastos',
    labelEn: 'Expenses',
    descriptionEs: 'Alertas sobre gastos inusuales o patrones',
    descriptionEn: 'Alerts about unusual expenses or patterns',
    color: 'text-rose-500'
  },
  {
    key: 'income',
    icon: Wallet,
    labelEs: 'Ingresos',
    labelEn: 'Income',
    descriptionEs: 'Notificaciones de nuevos ingresos registrados',
    descriptionEn: 'Notifications of new income recorded',
    color: 'text-green-500'
  },
  {
    key: 'contracts',
    icon: FileText,
    labelEs: 'Contratos',
    labelEn: 'Contracts',
    descriptionEs: 'Análisis completado, renovaciones próximas',
    descriptionEn: 'Analysis completed, upcoming renewals',
    color: 'text-violet-500'
  },
  {
    key: 'tax',
    icon: Calculator,
    labelEs: 'Impuestos',
    labelEn: 'Taxes',
    descriptionEs: 'Fechas límite fiscales y recordatorios CRA',
    descriptionEn: 'Tax deadlines and CRA reminders',
    color: 'text-blue-500'
  },
  {
    key: 'tips',
    icon: Lightbulb,
    labelEs: 'Consejos Financieros',
    labelEn: 'Financial Tips',
    descriptionEs: 'Consejos y oportunidades de ahorro',
    descriptionEn: 'Tips and savings opportunities',
    color: 'text-yellow-500'
  },
  {
    key: 'education',
    icon: BookOpen,
    labelEs: 'Educación',
    labelEn: 'Education',
    descriptionEs: 'Recordatorios de lectura y progreso educativo',
    descriptionEn: 'Reading reminders and educational progress',
    color: 'text-teal-500'
  },
  {
    key: 'alerts',
    icon: AlertTriangle,
    labelEs: 'Alertas del Sistema',
    labelEn: 'System Alerts',
    descriptionEs: 'Alertas importantes y anomalías detectadas',
    descriptionEn: 'Important alerts and detected anomalies',
    color: 'text-destructive'
  },
];

interface NotificationPreferencesData {
  [key: string]: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferencesData = {
  achievements: true,
  goals: true,
  investments: true,
  streaks: true,
  reminders: true,
  expenses: true,
  income: true,
  contracts: true,
  tax: true,
  tips: true,
  education: true,
  alerts: true,
};

export function NotificationPreferences() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isEs = language === 'es';
  
  const [preferences, setPreferences] = useState<NotificationPreferencesData>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from database
  useEffect(() => {
    async function loadPreferences() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('preferences')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading notification preferences:', error);
        }

        if (data?.preferences) {
          const prefs = data.preferences as Record<string, unknown>;
          const notifPrefs = prefs.notifications as NotificationPreferencesData | undefined;
          if (notifPrefs) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...notifPrefs });
          }
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  const togglePreference = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const enableAll = () => {
    const allEnabled = Object.fromEntries(
      NOTIFICATION_CATEGORIES.map(cat => [cat.key, true])
    );
    setPreferences(allEnabled);
    setHasChanges(true);
  };

  const disableAll = () => {
    const allDisabled = Object.fromEntries(
      NOTIFICATION_CATEGORIES.map(cat => [cat.key, false])
    );
    setPreferences(allDisabled);
    setHasChanges(true);
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Get current settings
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      const currentPrefs = (existingSettings?.preferences as Record<string, unknown>) || {};
      const updatedPrefs = {
        ...currentPrefs,
        notifications: preferences
      };

      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          preferences: updatedPrefs,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success(isEs ? '¡Preferencias guardadas!' : 'Preferences saved!');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error(isEs ? 'Error al guardar preferencias' : 'Error saving preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{isEs ? 'Preferencias de Notificaciones' : 'Notification Preferences'}</CardTitle>
              <CardDescription>
                {isEs 
                  ? 'Elige qué tipos de notificaciones deseas recibir' 
                  : 'Choose which types of notifications you want to receive'}
              </CardDescription>
            </div>
          </div>
          {hasChanges && (
            <Button onClick={savePreferences} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEs ? 'Guardar' : 'Save'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick actions */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {enabledCount} / {NOTIFICATION_CATEGORIES.length} {isEs ? 'activos' : 'active'}
          </span>
          <div className="flex gap-2">
            <Button variant="link" size="sm" onClick={enableAll}>
              {isEs ? 'Activar todo' : 'Enable all'}
            </Button>
            <Button variant="link" size="sm" onClick={disableAll}>
              {isEs ? 'Desactivar todo' : 'Disable all'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Categories list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {NOTIFICATION_CATEGORIES.map(category => {
              const Icon = category.icon;
              const isEnabled = preferences[category.key] ?? true;
              
              return (
                <div 
                  key={category.key}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-muted ${category.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor={category.key} className="font-medium cursor-pointer">
                        {isEs ? category.labelEs : category.labelEn}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isEs ? category.descriptionEs : category.descriptionEn}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={category.key}
                    checked={isEnabled}
                    onCheckedChange={() => togglePreference(category.key)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          {isEs 
            ? 'Las notificaciones desactivadas no aparecerán en tu bandeja de entrada ni generarán alertas.' 
            : 'Disabled notifications will not appear in your inbox or generate alerts.'}
        </p>
      </CardContent>
    </Card>
  );
}
