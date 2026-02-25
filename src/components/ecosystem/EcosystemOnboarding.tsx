import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, BarChart3, ExternalLink, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';

const DISMISS_KEY = 'ecosystem-onboarding-dismissed';

const steps = [
  {
    icon: Sparkles,
    titleEs: 'Tus finanzas y enfoque están conectados',
    titleEn: 'Your finances and focus are now connected',
    descEs: 'Con el Evo Bundle, EvoFinz y Fokuspark trabajan juntos para darte una visión completa de tu bienestar financiero y mental.',
    descEn: 'With the Evo Bundle, EvoFinz and Fokuspark work together to give you a complete view of your financial and mental wellbeing.',
  },
  {
    icon: BarChart3,
    titleEs: 'Insights cruzados automáticos',
    titleEn: 'Cross-app insights will appear automatically',
    descEs: 'Verás correlaciones entre tus sesiones de enfoque y tus decisiones financieras directamente en tu dashboard.',
    descEn: "You'll see correlations between your focus sessions and financial decisions right on your dashboard.",
  },
  {
    icon: Brain,
    titleEs: 'Explora Fokuspark',
    titleEn: 'Explore Fokuspark',
    descEs: 'Descubre la otra mitad de tu ecosistema: meditación, respiración, journaling y más — todo sincronizado con tus finanzas.',
    descEn: 'Discover the other half of your ecosystem: meditation, breathing, journaling and more — all synced with your finances.',
  },
];

export const EcosystemOnboarding = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading } = useFeatureFlags();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [step, setStep] = useState(0);

  if (isLoading || !hasBundleAccess || !isEnabled('ecosystem_onboarding') || dismissed) return null;

  const isEs = language === 'es';
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4"
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 pr-4">
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {isEs ? current.titleEs : current.titleEn}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {isEs ? current.descEs : current.descEn}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="gap-1 text-xs h-8"
        >
          <ChevronLeft className="h-3 w-3" />
          {isEs ? 'Anterior' : 'Back'}
        </Button>

        {isLast ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs h-8">
              {isEs ? 'Entendido' : 'Got it'}
            </Button>
            <Button
              size="sm"
              className="gap-1 text-xs h-8"
              onClick={() => {
                window.open('https://fokuspark.lovable.app', '_blank');
                handleDismiss();
              }}
            >
              <ExternalLink className="h-3 w-3" />
              Fokuspark
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => setStep(s => s + 1)}
            className="gap-1 text-xs h-8"
          >
            {isEs ? 'Siguiente' : 'Next'}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});

EcosystemOnboarding.displayName = 'EcosystemOnboarding';
