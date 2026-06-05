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
    <div
      className="fixed left-3 right-3 top-3 z-40 pointer-events-none sm:left-auto sm:right-4 sm:top-auto sm:bottom-4 sm:max-w-sm"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
    >
      <div className="pointer-events-auto touch-pan-y">
        <div className={cn(
          "bg-card border-2 border-border/60 rounded-xl shadow-2xl shadow-primary/5 sm:max-h-[48dvh] sm:overflow-y-auto sm:rounded-2xl",
          showDetails ? "max-h-[36dvh] overflow-y-auto" : "overflow-visible"
        )}>
          {/* Header */}
          <div className="p-2 sm:p-4 md:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="hidden sm:flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center shrink-0">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary sm:hidden" />
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">{t.title}</h3>
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm sm:leading-snug">
                  {t.description}{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
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
          <div className="flex flex-nowrap justify-end gap-1.5 px-2 pb-2 sm:flex-wrap sm:gap-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
            {!showDetails ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="h-9 shrink-0 gap-1.5 px-2.5 text-xs sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
                  aria-label={t.customize}
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.customize}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                  className="h-9 shrink min-w-0 px-2.5 text-xs sm:h-10 sm:px-3 sm:text-sm"
                >
                  {t.acceptNecessary}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="h-9 shrink-0 px-2.5 text-xs sm:h-10 sm:px-3 sm:text-sm"
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
