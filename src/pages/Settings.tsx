import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Palette, Sun, Moon, Monitor, RotateCcw, Globe, BookOpen,
  Shield, Ticket, Settings2, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { SubscriptionManager } from '@/components/settings/SubscriptionManager';
import { FiscalEntitiesCard } from '@/components/settings/FiscalEntitiesCard';
import { resetOnboardingTutorial } from '@/components/guidance/OnboardingTutorial';
import { PageHeader } from '@/components/PageHeader';
import { DisplayPreferencesCard } from '@/components/settings/DisplayPreferencesCard';
import { useIsAdmin } from '@/hooks/data/useIsAdmin';

// Lazy load heavy sections
const DataPrivacyCard = lazy(() => import('@/components/settings/DataPrivacyCard').then(m => ({ default: m.DataPrivacyCard })));
const SampleDataManager = lazy(() => import('@/components/settings/SampleDataManager').then(m => ({ default: m.SampleDataManager })));
const VoicePreferencesCard = lazy(() => import('@/components/settings/VoicePreferencesCard').then(m => ({ default: m.VoicePreferencesCard })));

const SectionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { mode, style, setMode, setStyle, animationSpeed, animationIntensity, setAnimationSpeed, setAnimationIntensity } = useTheme();
  const { data: isAdmin } = useIsAdmin();
  const [activeTab, setActiveTab] = useState('preferences');

  return (
    <Layout>
      <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
        <PageHeader
          title={t('nav.settings')}
          description={language === 'es' 
            ? 'Personaliza la aplicación y gestiona tus datos' 
            : 'Customize the app and manage your data'}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="preferences" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Preferencias' : 'Preferences'}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Datos' : 'Data'}</span>
            </TabsTrigger>
          </TabsList>

          {/* ============== PREFERENCES TAB ============== */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Fiscal Jurisdictions - Multi-country support */}
            <div data-highlight="fiscal-entities">
              <FiscalEntitiesCard />
            </div>

            {/* Subscription Management */}
            <div data-highlight="subscription-settings">
              <SubscriptionManager />
            </div>

            {/* Language Section */}
            <Card data-highlight="language-settings">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{t('settings.languageTitle')}</CardTitle>
                    <CardDescription>{t('settings.languageDescription')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>{t('common.language')}</Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Display Preferences */}
            <DisplayPreferencesCard />

            {/* Voice Preferences */}
            <Suspense fallback={<SectionSkeleton />}>
              <div data-highlight="voice-preferences">
                <VoicePreferencesCard />
              </div>
            </Suspense>

            {/* Theme Section */}
            <Card data-highlight="theme-settings">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{t('settings.themeTitle')}</CardTitle>
                    <CardDescription>{t('settings.themeDescription')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Mode */}
                <div className="space-y-3">
                  <Label>{t('settings.themeMode')}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={mode === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('light')}
                      className="flex items-center gap-2"
                    >
                      <Sun className="h-4 w-4" />
                      {t('settings.lightMode')}
                    </Button>
                    <Button
                      variant={mode === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('dark')}
                      className="flex items-center gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      {t('settings.darkMode')}
                    </Button>
                    <Button
                      variant={mode === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('system')}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="h-4 w-4" />
                      {t('settings.systemMode')}
                    </Button>
                  </div>
                </div>

                {/* Theme Styles */}
                <div className="space-y-3">
                  <Label>{t('settings.themeStyle')}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'es' ? 'Estilos Clásicos' : 'Classic Styles'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {([
                      { value: 'modern', gradient: 'from-violet-500 to-fuchsia-500' },
                      { value: 'vintage', gradient: 'from-amber-600 to-orange-700' },
                      { value: 'ocean', gradient: 'from-cyan-500 to-blue-600' },
                      { value: 'forest', gradient: 'from-emerald-500 to-green-700' },
                      { value: 'sunset', gradient: 'from-orange-500 to-rose-600' },
                      { value: 'minimal', gradient: 'from-slate-400 to-slate-600' },
                    ] as const).map(({ value, gradient }) => (
                      <button
                        key={value}
                        onClick={() => setStyle(value)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          style === value 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-full h-8 rounded bg-gradient-to-r ${gradient} mb-2`} />
                        <span className="text-sm font-medium">{t(`settings.${value}`)}</span>
                        {style === value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 mt-4">
                    {language === 'es' ? '🌸 Estaciones del Año' : '🌸 Seasons'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {([
                      { value: 'spring', gradient: 'from-pink-400 to-green-400', emoji: '🌸' },
                      { value: 'summer', gradient: 'from-yellow-400 to-cyan-400', emoji: '☀️' },
                      { value: 'autumn', gradient: 'from-orange-500 to-amber-600', emoji: '🍂' },
                      { value: 'winter', gradient: 'from-blue-400 to-slate-300', emoji: '❄️' },
                    ] as const).map(({ value, gradient, emoji }) => (
                      <button
                        key={value}
                        onClick={() => setStyle(value)}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          style === value 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-full h-6 rounded bg-gradient-to-r ${gradient} mb-2`} />
                        <span className="text-sm font-medium flex items-center gap-1">
                          {emoji} {language === 'es' 
                            ? value === 'spring' ? 'Primavera' 
                            : value === 'summer' ? 'Verano' 
                            : value === 'autumn' ? 'Otoño' 
                            : 'Invierno'
                            : value.charAt(0).toUpperCase() + value.slice(1)}
                        </span>
                        {style === value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 mt-4">
                    {language === 'es' ? '🎮 Intereses & Hobbies' : '🎮 Interests & Hobbies'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {([
                      { value: 'crypto', gradient: 'from-yellow-500 to-orange-500', emoji: '₿', label: { es: 'Crypto', en: 'Crypto' } },
                      { value: 'gaming', gradient: 'from-purple-500 via-pink-500 to-cyan-400', emoji: '🎮', label: { es: 'Gaming', en: 'Gaming' } },
                      { value: 'sports', gradient: 'from-blue-600 to-red-500', emoji: '⚽', label: { es: 'Deportes', en: 'Sports' } },
                      { value: 'music', gradient: 'from-purple-600 to-pink-500', emoji: '🎵', label: { es: 'Música', en: 'Music' } },
                      { value: 'coffee', gradient: 'from-amber-700 to-orange-800', emoji: '☕', label: { es: 'Café', en: 'Coffee' } },
                      { value: 'nature', gradient: 'from-green-500 to-lime-400', emoji: '🌿', label: { es: 'Naturaleza', en: 'Nature' } },
                    ] as const).map(({ value, gradient, emoji, label }) => (
                      <button
                        key={value}
                        onClick={() => setStyle(value)}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          style === value 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-full h-6 rounded bg-gradient-to-r ${gradient} mb-2`} />
                        <span className="text-sm font-medium flex items-center gap-1">
                          {emoji} {label[language as 'es' | 'en']}
                        </span>
                        {style === value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 mt-4">
                    {language === 'es' ? '🚀 Temas Creativos' : '🚀 Creative Themes'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {([
                      { value: 'space', gradient: 'from-indigo-900 via-purple-800 to-blue-900', emoji: '🚀', label: { es: 'Espacio', en: 'Space' } },
                      { value: 'photography', gradient: 'from-gray-700 to-gray-500', emoji: '📷', label: { es: 'Fotografía', en: 'Photography' } },
                      { value: 'travel', gradient: 'from-sky-500 to-amber-400', emoji: '✈️', label: { es: 'Viajes', en: 'Travel' } },
                      { value: 'cinema', gradient: 'from-red-900 via-black to-yellow-600', emoji: '🎬', label: { es: 'Cine', en: 'Cinema' } },
                    ] as const).map(({ value, gradient, emoji, label }) => (
                      <button
                        key={value}
                        onClick={() => setStyle(value)}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          style === value 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-full h-6 rounded bg-gradient-to-r ${gradient} mb-2`} />
                        <span className="text-sm font-medium flex items-center gap-1">
                          {emoji} {label[language as 'es' | 'en']}
                        </span>
                        {style === value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Animation Controls */}
                  <div className="border-t pt-4 mt-6">
                    <Label className="text-sm font-medium mb-3 block">
                      {language === 'es' ? '⚡ Control de Animaciones' : '⚡ Animation Controls'}
                    </Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {language === 'es' ? 'Velocidad' : 'Speed'}
                        </Label>
                        <div className="flex gap-2">
                          {(['off', 'slow', 'normal', 'fast'] as const).map((speed) => (
                            <Button
                              key={speed}
                              variant={animationSpeed === speed ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAnimationSpeed(speed)}
                              className="flex-1"
                            >
                              {speed === 'off' ? (language === 'es' ? 'Sin' : 'Off') : 
                               speed === 'slow' ? (language === 'es' ? 'Lenta' : 'Slow') :
                               speed === 'normal' ? 'Normal' :
                               (language === 'es' ? 'Rápida' : 'Fast')}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {language === 'es' ? 'Intensidad' : 'Intensity'}
                        </Label>
                        <div className="flex gap-2">
                          {(['subtle', 'normal', 'vibrant'] as const).map((intensity) => (
                            <Button
                              key={intensity}
                              variant={animationIntensity === intensity ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setAnimationIntensity(intensity)}
                              className="flex-1"
                            >
                              {intensity === 'subtle' ? (language === 'es' ? 'Sutil' : 'Subtle') : 
                               intensity === 'normal' ? 'Normal' :
                               (language === 'es' ? 'Vibrante' : 'Vibrant')}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'es' 
                        ? 'Controla la velocidad e intensidad de las animaciones de fondo del tema' 
                        : 'Control the speed and intensity of theme background animations'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <NotificationPreferences />

            {/* Onboarding Guides Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{language === 'es' ? 'Guías de Ayuda' : 'Help Guides'}</CardTitle>
                    <CardDescription>
                      {language === 'es' 
                        ? 'Restablece las guías de onboarding para verlas de nuevo en cada página' 
                        : 'Reset the onboarding guides to see them again on each page'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const keysToRemove = Object.keys(localStorage).filter(key => 
                        key.startsWith('onboarding-dismissed-') || 
                        key.startsWith('guide-') ||
                        key.startsWith('tip-') ||
                        key === 'setup-banner-dismissed'
                      );
                      keysToRemove.forEach(key => localStorage.removeItem(key));
                      toast.success(
                        language === 'es' 
                          ? '¡Guías de página restablecidas!' 
                          : 'Page guides reset!'
                      );
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {language === 'es' ? 'Restablecer Guías de Página' : 'Reset Page Guides'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetOnboardingTutorial();
                      toast.success(
                        language === 'es' 
                          ? '¡Tutorial reiniciado! Recarga la página para verlo.' 
                          : 'Tutorial reset! Reload the page to see it.'
                      );
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {language === 'es' ? 'Ver Tutorial de Inicio' : 'View Welcome Tutorial'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Section */}
            {isAdmin && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>{language === 'es' ? 'Administración' : 'Administration'}</CardTitle>
                      <CardDescription>
                        {language === 'es' 
                          ? 'Herramientas de administración del sistema' 
                          : 'System administration tools'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin/beta-codes')} className="gap-2">
                    <Ticket className="h-4 w-4" />
                    {language === 'es' ? 'Gestionar Códigos Beta' : 'Manage Beta Codes'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============== DATA TAB ============== */}
          <TabsContent value="data" className="space-y-6">
            <Suspense fallback={<SectionSkeleton />}>
              <SampleDataManager />
              <DataPrivacyCard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
