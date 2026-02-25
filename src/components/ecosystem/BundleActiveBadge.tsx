import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';

/**
 * Visual badge indicating active Evo Bundle ecosystem status.
 * Shows only for users with has_bundle = true.
 * Compact variant for headers, full variant for profile/settings.
 */
export const BundleActiveBadge = memo(({ variant = 'compact' }: { variant?: 'compact' | 'full' }) => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading } = useFeatureFlags();

  if (isLoading || !hasBundleAccess || !isEnabled('ecosystem_badge')) return null;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-xs font-semibold text-primary"
      >
        <Sparkles className="h-3 w-3" />
        <span>Evo Bundle</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">
          Evo Bundle {language === 'es' ? 'Activo' : 'Active'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {language === 'es'
            ? 'EvoFinz Pro + Fokuspark Premium'
            : 'EvoFinz Pro + Fokuspark Premium'}
        </p>
      </div>
      <Sparkles className="h-4 w-4 text-primary/60 shrink-0" />
    </motion.div>
  );
});

BundleActiveBadge.displayName = 'BundleActiveBadge';
