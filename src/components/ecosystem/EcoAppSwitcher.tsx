import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { ECO_APPS, ECO_MOTTO, getEcoAppUrl, type EcoApp } from '@/lib/ecosystem/app-switcher-spec';

interface EcoAppSwitcherProps {
  currentApp?: EcoApp;
}

/**
 * Unified app-switcher between EvoFinz ↔ Fokuspark.
 * Shows current app as "active" and the other as a navigable link.
 * Designed to be copied to Fokuspark with currentApp='fokuspark'.
 */
export const EcoAppSwitcher = memo(({ currentApp = 'evofinz' }: EcoAppSwitcherProps) => {
  const { language } = useLanguage();
  const { hasBundleAccess, isLoading } = useFeatureFlags();
  const isEs = language === 'es';

  if (isLoading || !hasBundleAccess) return null;

  const otherApp: EcoApp = currentApp === 'evofinz' ? 'fokuspark' : 'evofinz';
  const current = ECO_APPS[currentApp];
  const other = ECO_APPS[otherApp];

  const handleNavigate = () => {
    window.open(getEcoAppUrl(otherApp, currentApp, 'app-switcher'), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* Current app — active state */}
        <div className={`relative rounded-xl border-2 border-primary/30 ${current.colorClass} p-3 flex flex-col items-center gap-1.5`}>
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <span className="text-2xl">{current.emoji}</span>
          <p className="text-xs font-semibold text-foreground">{current.name}</p>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Check className="h-3 w-3 text-success" />
            {isEs ? 'Aquí estás' : "You're here"}
          </span>
        </div>

        {/* Other app — navigable */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNavigate}
          className={`rounded-xl border border-border/50 ${other.colorClass} p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-colors hover:border-primary/30 group`}
        >
          <span className="text-2xl">{other.emoji}</span>
          <p className="text-xs font-semibold text-foreground">{other.name}</p>
          <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
            {isEs ? 'Ir' : 'Go'}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </motion.button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        {isEs ? ECO_MOTTO.es : ECO_MOTTO.en}
      </p>
    </div>
  );
});

EcoAppSwitcher.displayName = 'EcoAppSwitcher';
