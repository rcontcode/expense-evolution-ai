import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Sparkles, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  applyUiModeImmediately,
  openDashboardAfterUiModeChange,
  useDisplayPreferences,
} from '@/hooks/data/useDisplayPreferences';

export function SimpleSettings() {
  const { language, setLanguage } = useLanguage();
  const { signOut } = useAuth();
  const { setUiMode } = useDisplayPreferences();
  const navigate = useNavigate();

  return (
    <SimplePageShell
      title={language === 'es' ? 'Ajustes' : 'Settings'}
      subtitle={language === 'es' ? 'Lo esencial' : 'The essentials'}
    >
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {language === 'es' ? 'Idioma' : 'Language'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'es' ? 'Español / English' : 'Español / English'}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant={language === 'es' ? 'default' : 'outline'}
              onClick={() => setLanguage('es')}
            >
              ES
            </Button>
            <Button
              size="sm"
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => setLanguage('en')}
            >
              EN
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {language === 'es' ? 'Modo de uso' : 'App mode'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'es' ? 'Cambia a Avanzado para más herramientas' : 'Switch to Advanced for more tools'}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 shrink-0"
            onClick={() => {
              applyUiModeImmediately('advanced');
              setUiMode('advanced');
              openDashboardAfterUiModeChange();
            }}
          >
            {language === 'es' ? 'Cambiar a Avanzado' : 'Switch to Advanced'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {language === 'es' ? 'Más ajustes' : 'More settings'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'es' ? 'Notificaciones, privacidad, datos' : 'Notifications, privacy, data'}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/settings?advanced=1')} className="shrink-0">
            {language === 'es' ? 'Abrir' : 'Open'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-rose-500/20">
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">
              {language === 'es' ? 'Cerrar sesión' : 'Sign out'}
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10" onClick={() => signOut()}>
            {language === 'es' ? 'Cerrar' : 'Sign out'}
          </Button>
        </CardContent>
      </Card>
    </SimplePageShell>
  );
}
