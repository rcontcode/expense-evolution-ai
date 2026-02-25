import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, ArrowLeft, ShieldCheck, ShieldAlert, RotateCcw, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useIsAdmin } from '@/hooks/data/useIsAdmin';
import { toast } from 'sonner';

const ADMIN_BUNDLE_PREVIEW_KEY = 'admin-bundle-preview-enabled';
const ECOSYSTEM_ONBOARDING_KEY = 'ecosystem-onboarding-dismissed';
const ECOSYSTEM_WEEKLY_DIGEST_KEY = 'ecosystem-weekly-digest-dismissed';

function readPreviewMode() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ADMIN_BUNDLE_PREVIEW_KEY) === 'true';
}

export default function EcosystemLabAdmin() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { hasRealBundleAccess, hasBundleAccess, adminBundlePreviewEnabled } = useFeatureFlags();
  const [previewEnabled, setPreviewEnabled] = useState(readPreviewMode());

  const isEs = language === 'es';

  const statusLabel = useMemo(() => {
    if (hasRealBundleAccess) {
      return isEs ? 'Bundle real activo' : 'Real bundle active';
    }
    if (adminBundlePreviewEnabled) {
      return isEs ? 'Modo prueba admin activo' : 'Admin preview mode active';
    }
    return isEs ? 'Sin Bundle activo' : 'No active bundle';
  }, [adminBundlePreviewEnabled, hasRealBundleAccess, isEs]);

  const setPreviewMode = (enabled: boolean) => {
    window.localStorage.setItem(ADMIN_BUNDLE_PREVIEW_KEY, enabled ? 'true' : 'false');
    setPreviewEnabled(enabled);
    toast.success(
      enabled
        ? (isEs ? 'Modo de prueba activado para tu usuario admin' : 'Preview mode enabled for your admin user')
        : (isEs ? 'Modo de prueba desactivado' : 'Preview mode disabled')
    );
  };

  const resetOneTimeEcosystemViews = () => {
    window.localStorage.removeItem(ECOSYSTEM_ONBOARDING_KEY);
    window.localStorage.removeItem(ECOSYSTEM_WEEKLY_DIGEST_KEY);
    toast.success(
      isEs
        ? 'Se reiniciaron vistas de onboarding/weekly digest para esta sesión de pruebas'
        : 'Onboarding/weekly digest views reset for this testing session'
    );
  };

  if (isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              {isEs ? 'Cargando laboratorio…' : 'Loading lab…'}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive/30">
            <CardContent className="py-10 text-sm text-muted-foreground">
              {isEs ? 'Esta pantalla es solo para administradores.' : 'This screen is admin only.'}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Beaker className="h-6 w-6 text-primary" />
                {isEs ? 'Laboratorio del Ecosistema' : 'Ecosystem Lab'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEs
                  ? 'Panel privado para probar Bundle sin tocar datos de suscripción reales.'
                  : 'Private panel to test Bundle behavior without touching real subscription data.'}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{statusLabel}</Badge>
        </div>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {hasBundleAccess ? (
                <ShieldCheck className="h-5 w-5 text-primary" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              )}
              {isEs ? 'Control de acceso para pruebas' : 'Testing access control'}
            </CardTitle>
            <CardDescription>
              {isEs
                ? 'Esto sólo afecta tu sesión de administrador en frontend. No cambia Stripe ni la suscripción real.'
                : 'This only affects your admin frontend session. It does not change Stripe or real subscription state.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-2">
              <Button
                className="gap-2"
                onClick={() => setPreviewMode(true)}
                disabled={previewEnabled && !hasRealBundleAccess}
              >
                <PlayCircle className="h-4 w-4" />
                {isEs ? 'Activar prueba' : 'Enable preview'}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setPreviewMode(false)}
                disabled={!previewEnabled}
              >
                {isEs ? 'Desactivar prueba' : 'Disable preview'}
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={resetOneTimeEcosystemViews}
              >
                <RotateCcw className="h-4 w-4" />
                {isEs ? 'Reiniciar vistas' : 'Reset views'}
              </Button>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-card">
                <p className="font-semibold mb-1">{isEs ? 'Bundle real (backend)' : 'Real bundle (backend)'}</p>
                <p className="text-muted-foreground">{hasRealBundleAccess ? (isEs ? 'Activo' : 'Active') : (isEs ? 'Inactivo' : 'Inactive')}</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="font-semibold mb-1">{isEs ? 'Override admin local' : 'Local admin override'}</p>
                <p className="text-muted-foreground">{adminBundlePreviewEnabled ? (isEs ? 'Activo' : 'Active') : (isEs ? 'Inactivo' : 'Inactive')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isEs ? 'Pantallas para probar ahora' : 'Screens to test now'}</CardTitle>
            <CardDescription>
              {isEs
                ? 'Abre estas rutas para validar el flujo completo del ecosistema.'
                : 'Open these routes to validate the full ecosystem flow.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>/dashboard</Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>/settings</Button>
            <Button variant="outline" onClick={() => navigate('/notifications')}>/notifications</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
