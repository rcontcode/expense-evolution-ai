import { useMemo } from 'react';
import { usePlanLimits } from '@/hooks/data/usePlanLimits';
import { useUpgradePrompt } from '@/contexts/UpgradePromptContext';
import { FEATURE_MATRIX, type AccessFeature } from '@/config/featureMatrix';

interface FeatureAccessResult {
  /** Is the feature usable right now (plan + quota OK)? */
  allowed: boolean;
  /** Why it's blocked, if blocked. */
  reason: 'ok' | 'plan' | 'quota' | 'loading';
  /** Current monthly usage (only meaningful when usageKey applies). */
  currentUsage: number | null;
  /** Monthly limit (Infinity = unlimited). */
  limit: number | null;
  /** Lowest plan that unlocks the feature. */
  requiredPlan: 'premium' | 'pro';
  /** ISO timestamp when monthly counters reset (1st of next month, UTC). */
  resetDate: string;
  /** Open the global upgrade prompt for this feature. */
  openUpgrade: () => void;
}

function nextMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/**
 * Reactive feature access — combines plan limits + current usage to tell
 * the UI whether to enable a CTA, show a "X/Y this month" hint, or open
 * the upgrade prompt directly.
 *
 * Backend remains the source of truth: even if this hook says allowed,
 * the edge function may still return 429. useAIErrorHandler catches that.
 */
export function useFeatureAccess(feature: AccessFeature): FeatureAccessResult {
  const {
    limits,
    usage,
    isGodMode,
    isLoading,
  } = usePlanLimits();
  const upgrade = useUpgradePrompt();

  const spec = FEATURE_MATRIX[feature];

  return useMemo<FeatureAccessResult>(() => {
    const openUpgrade = () =>
      upgrade.open({
        feature: spec.promptFeature,
        requiredPlan: spec.requiredPlan,
        currentUsage: spec.usageKey ? Number(usage?.[spec.usageKey] ?? 0) : undefined,
        limit:
          spec.usageKey && typeof limits[spec.limitKey] === 'number'
            ? (limits[spec.limitKey] as number)
            : undefined,
      });

    if (isLoading) {
      return {
        allowed: true, // optimistic while loading to avoid flicker
        reason: 'loading',
        currentUsage: null,
        limit: null,
        requiredPlan: spec.requiredPlan,
        resetDate: nextMonthIso(),
        openUpgrade,
      };
    }

    if (isGodMode) {
      return {
        allowed: true,
        reason: 'ok',
        currentUsage: null,
        limit: null,
        requiredPlan: spec.requiredPlan,
        resetDate: nextMonthIso(),
        openUpgrade,
      };
    }

    const raw = limits[spec.limitKey];

    // Boolean feature on/off
    if (typeof raw === 'boolean') {
      return {
        allowed: raw,
        reason: raw ? 'ok' : 'plan',
        currentUsage: null,
        limit: null,
        requiredPlan: spec.requiredPlan,
        resetDate: nextMonthIso(),
        openUpgrade,
      };
    }

    // Numeric limit
    const limit = raw as number;
    const used = spec.usageKey ? Number(usage?.[spec.usageKey] ?? 0) : 0;

    if (limit === 0) {
      return {
        allowed: false,
        reason: 'plan',
        currentUsage: used,
        limit: 0,
        requiredPlan: spec.requiredPlan,
        resetDate: nextMonthIso(),
        openUpgrade,
      };
    }

    if (limit === Infinity) {
      return {
        allowed: true,
        reason: 'ok',
        currentUsage: used,
        limit: Infinity,
        requiredPlan: spec.requiredPlan,
        resetDate: nextMonthIso(),
        openUpgrade,
      };
    }

    const allowed = used < limit;
    return {
      allowed,
      reason: allowed ? 'ok' : 'quota',
      currentUsage: used,
      limit,
      requiredPlan: spec.requiredPlan,
      resetDate: nextMonthIso(),
      openUpgrade,
    };
  }, [feature, limits, usage, isGodMode, isLoading, upgrade, spec]);
}
