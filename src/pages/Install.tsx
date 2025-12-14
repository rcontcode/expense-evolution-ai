import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Camera, 
  Wifi, 
  CheckCircle, 
  ArrowRight,
  Share,
  Plus,
  Monitor
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);
    
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Camera,
      title: language === 'es' ? 'Captura Rápida' : 'Quick Capture',
      description: language === 'es' 
        ? 'Fotografía recibos y la IA extrae los datos automáticamente'
        : 'Photograph receipts and AI extracts data automatically'
    },
    {
      icon: Wifi,
      title: language === 'es' ? 'Sincronización en Tiempo Real' : 'Real-time Sync',
      description: language === 'es'
        ? 'Los gastos capturados aparecen instantáneamente en tu laptop'
        : 'Captured expenses appear instantly on your laptop'
    },
    {
      icon: Smartphone,
      title: language === 'es' ? 'Experiencia Nativa' : 'Native Experience',
      description: language === 'es'
        ? 'Se abre como una app real, sin barras del navegador'
        : 'Opens like a real app, without browser bars'
    }
  ];

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>
              {language === 'es' ? '¡App Instalada!' : 'App Installed!'}
            </CardTitle>
            <CardDescription>
              {language === 'es'
                ? 'Estás usando EvoFinz como app instalada'
                : 'You are using EvoFinz as an installed app'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/capture')} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              {language === 'es' ? 'Ir a Captura Móvil' : 'Go to Mobile Capture'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/20">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">
            {language === 'es' ? 'Instala EvoFinz' : 'Install EvoFinz'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'es'
              ? 'Captura gastos desde tu celular y sincroniza con tu laptop'
              : 'Capture expenses from your phone and sync with your laptop'
            }
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Install Button or Instructions */}
        {isInstalled ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {language === 'es' ? '¡Instalación completa!' : 'Installation complete!'}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {language === 'es' 
                    ? 'Busca EvoFinz en tu pantalla de inicio'
                    : 'Look for EvoFinz on your home screen'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full h-14 text-lg">
            <Download className="mr-2 h-6 w-6" />
            {language === 'es' ? 'Instalar Ahora' : 'Install Now'}
          </Button>
        ) : isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'es' ? 'Cómo instalar en iPhone/iPad' : 'How to install on iPhone/iPad'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">1</Badge>
                <div className="flex items-center gap-2">
                  <span>{language === 'es' ? 'Toca el botón' : 'Tap the'}</span>
                  <Share className="h-5 w-5" />
                  <span>{language === 'es' ? 'Compartir' : 'Share button'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">2</Badge>
                <div className="flex items-center gap-2">
                  <span>{language === 'es' ? 'Selecciona' : 'Select'}</span>
                  <Plus className="h-5 w-5" />
                  <span>{language === 'es' ? '"Agregar a Inicio"' : '"Add to Home Screen"'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">3</Badge>
                <span>{language === 'es' ? 'Toca "Agregar"' : 'Tap "Add"'}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">
                {language === 'es'
                  ? 'Abre esta página en Chrome o Safari para instalar la app'
                  : 'Open this page in Chrome or Safari to install the app'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Continue to App */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/capture')} 
          className="w-full"
        >
          {language === 'es' ? 'Continuar sin instalar' : 'Continue without installing'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Desktop Notice */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              {language === 'es'
                ? 'Los gastos que captures aquí aparecerán automáticamente en la versión de escritorio.'
                : 'Expenses you capture here will automatically appear in the desktop version.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
