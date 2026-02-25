import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { openFokusparkTool, FOKUSPARK_TOOLS } from '@/lib/ecosystem/deeplinks';

/**
 * Expandable quick-actions bar for Bundle users.
 * Provides one-tap access to Fokuspark tools from EvoFinz.
 */
export const EcosystemQuickActions = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading } = useFeatureFlags();
  const [expanded, setExpanded] = useState(false);
  const isEs = language === 'es';

  if (isLoading || !hasBundleAccess || !isEnabled('ecosystem_badge')) return null;

  return (
    <div className="space-y-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs h-8 px-3 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/20"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {isEs ? 'Acceso rápido a Fokuspark' : 'Quick access to Fokuspark'}
        </span>
        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </Button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {FOKUSPARK_TOOLS.map((tool) => (
                <button
                  key={tool.key}
                  onClick={() => openFokusparkTool(tool.key, 'quick-actions')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group"
                >
                  <span className="text-base">{tool.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-foreground truncate">
                      {isEs ? tool.labelEs : tool.labelEn}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {isEs ? tool.descEs : tool.descEn}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

EcosystemQuickActions.displayName = 'EcosystemQuickActions';
