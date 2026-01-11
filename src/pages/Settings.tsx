import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RotateCcw, Globe, BookOpen,
  Shield, Ticket, Settings2, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { SubscriptionManager } from '@/components/settings/SubscriptionManager';
import { FiscalEntitiesCard } from '@/components/settings/FiscalEntitiesCard';
import { resetOnboardingTutorial } from '@/components/guidance/OnboardingTutorial';
import { PageHeader } from '@/components/PageHeader';
import { DisplayPreferencesCard } from '@/components/settings/DisplayPreferencesCard';
import { ThemeCard } from '@/components/settings/ThemeCard';
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

            {/* Theme Section - New Optimized Component */}
            <ThemeCard />

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
