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
  Shield, Ticket, Settings2, Database, ChevronDown
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
 import { SoundPreferencesPanel } from '@/components/settings/SoundPreferencesPanel';

// Lazy load heavy sections
const DataPrivacyCard = lazy(() => import('@/components/settings/DataPrivacyCard').then(m => ({ default: m.DataPrivacyCard })));
const SampleDataManager = lazy(() => import('@/components/settings/SampleDataManager').then(m => ({ default: m.SampleDataManager })));
import { SecurityCard } from '@/components/settings/SecurityCard';
import { VoicePreferencesCard } from '@/components/settings/VoicePreferencesCard';

const SectionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

// Collapsible section wrapper for mobile
function SettingsSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  isMobile 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto bg-muted/50 hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-medium">{title}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('preferences');

  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={t('nav.settings')}
          description={!isMobile ? (language === 'es' 
            ? 'Personaliza la aplicación y gestiona tus datos' 
            : 'Customize the app and manage your data') : undefined}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="preferences" className="gap-2 min-h-[44px]">
              <Settings2 className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'es' ? 'Preferencias' : 'Preferences'}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 min-h-[44px]">
              <Database className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{language === 'es' ? 'Datos' : 'Data'}</span>
            </TabsTrigger>
          </TabsList>

          {/* ============== PREFERENCES TAB ============== */}
          <TabsContent value="preferences" className="space-y-4 sm:space-y-6">
            {/* Fiscal Jurisdictions - Multi-country support */}
            <SettingsSection 
              title={language === 'es' ? 'Entidades Fiscales' : 'Fiscal Entities'} 
              icon={Globe} 
              defaultOpen={true}
              isMobile={isMobile}
            >
              <div data-highlight="fiscal-entities">
                <FiscalEntitiesCard />
              </div>
            </SettingsSection>

            {/* Subscription Management */}
            <SettingsSection 
              title={language === 'es' ? 'Suscripción' : 'Subscription'} 
              icon={Shield} 
              isMobile={isMobile}
            >
              <div data-highlight="subscription-settings">
                <SubscriptionManager />
              </div>
            </SettingsSection>

            {/* Language Section */}
            <SettingsSection 
              title={language === 'es' ? 'Idioma' : 'Language'} 
              icon={Globe} 
              isMobile={isMobile}
            >
              <Card data-highlight="language-settings">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{t('settings.languageTitle')}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{t('settings.languageDescription')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>{t('common.language')}</Label>
                    <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                      <SelectTrigger className="w-full sm:w-[200px]">
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
            </SettingsSection>

            {/* Display Preferences */}
            <SettingsSection 
              title={language === 'es' ? 'Visualización' : 'Display'} 
              icon={Settings2} 
              isMobile={isMobile}
            >
              <DisplayPreferencesCard />
            </SettingsSection>

            {/* Voice Preferences */}
            <SettingsSection 
              title={language === 'es' ? 'Voz' : 'Voice'} 
              icon={Settings2} 
              isMobile={isMobile}
            >
              <div data-highlight="voice-preferences">
                <VoicePreferencesCard />
              </div>
            </SettingsSection>
 
             {/* Sound Preferences */}
             <SettingsSection 
               title={language === 'es' ? 'Sonidos' : 'Sounds'} 
               icon={Settings2} 
               isMobile={isMobile}
             >
               <div data-highlight="sound-preferences">
                 <SoundPreferencesPanel language={language === 'es' ? 'es' : 'en'} />
               </div>
             </SettingsSection>

            {/* Theme Section */}
            <SettingsSection 
              title={language === 'es' ? 'Tema' : 'Theme'} 
              icon={Settings2} 
              isMobile={isMobile}
            >
              <ThemeCard />
            </SettingsSection>

            {/* Notification Preferences */}
            <SettingsSection 
              title={language === 'es' ? 'Notificaciones' : 'Notifications'} 
              icon={Settings2} 
              isMobile={isMobile}
            >
              <NotificationPreferences />
            </SettingsSection>

            {/* Onboarding Guides Section */}
            <SettingsSection 
              title={language === 'es' ? 'Guías de Ayuda' : 'Help Guides'} 
              icon={BookOpen} 
              isMobile={isMobile}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{language === 'es' ? 'Guías de Ayuda' : 'Help Guides'}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {language === 'es' 
                          ? 'Restablece las guías de onboarding' 
                          : 'Reset the onboarding guides'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="min-h-[44px]"
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
                      {language === 'es' ? 'Guías de Página' : 'Page Guides'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => {
                        resetOnboardingTutorial();
                        toast.success(
                          language === 'es' 
                            ? '¡Tutorial reiniciado!' 
                            : 'Tutorial reset!'
                        );
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {language === 'es' ? 'Tutorial' : 'Tutorial'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SettingsSection>

            {/* Admin Section */}
            {isAdmin && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{language === 'es' ? 'Administración' : 'Administration'}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {language === 'es' 
                          ? 'Herramientas de administración' 
                          : 'Administration tools'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/admin/beta-codes')} className="gap-2 min-h-[44px]">
                    <Ticket className="h-4 w-4" />
                    {language === 'es' ? 'Códigos Beta' : 'Beta Codes'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============== DATA TAB ============== */}
          <TabsContent value="data" className="space-y-4 sm:space-y-6">
            <SecurityCard />
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
