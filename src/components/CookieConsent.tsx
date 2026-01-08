import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'evofinz_cookie_consent';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<Partial<ConsentState>>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const { language } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const content = {
    es: {
      title: 'Tu privacidad es importante',
      description: 'Usamos cookies para mejorar tu experiencia. Puedes personalizar tus preferencias o aceptar todas.',
      acceptAll: 'Aceptar todo',
      acceptNecessary: 'Solo esenciales',
      customize: 'Personalizar',
      save: 'Guardar preferencias',
      necessary: 'Esenciales',
      necessaryDesc: 'Necesarias para el funcionamiento básico del sitio.',
      analytics: 'Analíticas',
      analyticsDesc: 'Nos ayudan a entender cómo usas la aplicación.',
      marketing: 'Marketing',
      marketingDesc: 'Permiten mostrarte contenido personalizado.',
      privacy: 'Política de Privacidad',
    },
    en: {
      title: 'Your privacy matters',
      description: 'We use cookies to improve your experience. You can customize your preferences or accept all.',
      acceptAll: 'Accept all',
      acceptNecessary: 'Essential only',
      customize: 'Customize',
      save: 'Save preferences',
      necessary: 'Essential',
      necessaryDesc: 'Required for basic site functionality.',
      analytics: 'Analytics',
      analyticsDesc: 'Help us understand how you use the app.',
      marketing: 'Marketing',
      marketingDesc: 'Allow us to show you personalized content.',
      privacy: 'Privacy Policy',
    },
  };

  const t = content[language];

  const saveConsent = (consentData: Partial<ConsentState>) => {
    const finalConsent: ConsentState = {
      necessary: true,
      analytics: consentData.analytics || false,
      marketing: consentData.marketing || false,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(finalConsent));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleAcceptNecessary = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const handleSaveCustom = () => {
    saveConsent(consent);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary sm:hidden" />
                  <h3 className="font-semibold text-foreground">{t.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.description}{' '}
                  <Link to="/legal#privacy" className="text-primary hover:underline">
                    {t.privacy}
                  </Link>
                </p>
              </div>
              
              <button 
                onClick={handleAcceptNecessary}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customize Section */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                {/* Necessary */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.necessary}</p>
                    <p className="text-xs text-muted-foreground">{t.necessaryDesc}</p>
                  </div>
                  <div className="h-6 w-11 rounded-full bg-primary flex items-center justify-end px-1">
                    <div className="h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>
                
                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.analytics}</p>
                    <p className="text-xs text-muted-foreground">{t.analyticsDesc}</p>
                  </div>
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                    className={cn(
                      "h-6 w-11 rounded-full flex items-center px-1 transition-colors",
                      consent.analytics ? "bg-primary justify-end" : "bg-muted justify-start"
                    )}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                
                {/* Marketing */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.marketing}</p>
                    <p className="text-xs text-muted-foreground">{t.marketingDesc}</p>
                  </div>
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, marketing: !prev.marketing }))}
                    className={cn(
                      "h-6 w-11 rounded-full flex items-center px-1 transition-colors",
                      consent.marketing ? "bg-primary justify-end" : "bg-muted justify-start"
                    )}
                  >
                    <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 md:px-6 md:pb-6 flex flex-wrap gap-2 justify-end">
            {!showDetails ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {t.customize}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                >
                  {t.acceptNecessary}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                >
                  {t.acceptAll}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCustom}
                >
                  {t.save}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
