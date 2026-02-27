import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useEcosystemDashboard } from '@/hooks/data/useEcosystemDashboard';
import { EcosystemContext } from '@/contexts/EcosystemContext';
import { BundleActiveBadge } from './BundleActiveBadge';
import { EcosystemNotifications } from './EcosystemNotifications';
import { EcosystemAICoaching } from './EcosystemAICoaching';
import { EcosystemCoaching } from './EcosystemCoaching';
import { EcosystemPredictiveAlerts } from './EcosystemPredictiveAlerts';
import { EcosystemStreaks } from './EcosystemStreaks';
import { EcosystemInlineWidgets } from './EcosystemInlineWidgets';
import { EcosystemWeeklyDigest } from './EcosystemWeeklyDigest';
import { EcosystemHealthScore } from './EcosystemHealthScore';
import { EcosystemLeaderboard } from './EcosystemLeaderboard';
import { EcosystemAchievements } from './EcosystemAchievements';
import { EcosystemMonthlyReport } from './EcosystemMonthlyReport';
import { EcosystemInsights } from './EcosystemInsights';
import { EcoAppSwitcher } from './EcoAppSwitcher';

export const EcosystemSection = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isLoading } = useFeatureFlags();
  const [open, setOpen] = useState(false);
  const isEs = language === 'es';

  // Single consolidated query for all ecosystem data
  const { data, isLoading: dashLoading, isError, refetch } = useEcosystemDashboard();

  if (isLoading || !hasBundleAccess) return null;

  return (
    <EcosystemContext.Provider value={{ data, isLoading: dashLoading, isError, refetch }}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  {isEs ? 'Evo Ecosystem' : 'Evo Ecosystem'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isEs ? 'Insights cruzados, bienestar y más' : 'Cross-app insights, wellbeing & more'}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 pt-3"
          >
            <EcoAppSwitcher currentApp="evofinz" />
            <BundleActiveBadge variant="full" />
            <EcosystemNotifications />
            <EcosystemAICoaching />
            <EcosystemCoaching />
            <EcosystemPredictiveAlerts />
            <EcosystemStreaks />
            <EcosystemInlineWidgets />
            <EcosystemWeeklyDigest />
            <EcosystemHealthScore />
            <EcosystemLeaderboard />
            <EcosystemAchievements />
            <EcosystemMonthlyReport />
            <EcosystemInsights />
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </EcosystemContext.Provider>
  );
});

EcosystemSection.displayName = 'EcosystemSection';
