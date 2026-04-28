import { memo } from 'react';
import { useEcosystemDashboard } from '@/hooks/data/useEcosystemDashboard';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { EcosystemContext } from '@/contexts/EcosystemContext';
import { BundleActiveBadge } from './BundleActiveBadge';
import { EcosystemNotifications } from './EcosystemNotifications';
import { EcosystemSmartCoaching } from './EcosystemSmartCoaching';
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

/**
 * Consolidated ecosystem widgets wrapper.
 * - Single useFeatureFlags check (instead of 12 individual ones)
 * - Single useEcosystemDashboard query shared via context
 * - Lazy-loaded from MobileDashboard since it's below the fold
 */
const EcosystemDashboardWidgets = memo(() => {
  const { hasBundleAccess, isLoading: flagsLoading } = useFeatureFlags();
  const { data, isLoading, isError, refetch } = useEcosystemDashboard();

  if (flagsLoading || !hasBundleAccess) return null;

  return (
    <EcosystemContext.Provider value={{ data, isLoading, isError, refetch }}>
      <BundleActiveBadge variant="full" />
      <EcosystemNotifications />
      <EcosystemSmartCoaching />
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
    </EcosystemContext.Provider>
  );
});

EcosystemDashboardWidgets.displayName = 'EcosystemDashboardWidgets';

export default EcosystemDashboardWidgets;
