import React, { createContext, useCallback, useContext, useState } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { QuotaResetDialog } from '@/components/QuotaResetDialog';
import { usePlanLimits, type PlanType } from '@/hooks/data/usePlanLimits';

export type UpgradeFeatureKey =
  | 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects'
  | 'contracts' | 'mileage' | 'net_worth' | 'fire_calculator'
  | 'mentorship' | 'voice_assistant'
  // Extended (defined in UpgradePrompt friendlyMessages or fall back to closest)
  | 'voice_premium' | 'bank_analysis' | 'ai_reconcile'
  | 'predictions' | 'autopilot' | 'coaching' | 'ai_credits';

interface OpenOptions {
  feature: UpgradeFeatureKey;
  requiredPlan?: PlanType;
  currentUsage?: number;
  limit?: number;
  /** ISO timestamp of when the monthly counter resets. */
  resetDate?: string;
  /** Optional human message – currently logged for analytics. */
  message?: string;
}

interface UpgradePromptContextValue {
  open: (options: OpenOptions) => void;
  close: () => void;
}

const UpgradePromptContext = createContext<UpgradePromptContextValue | null>(null);

export function UpgradePromptProvider({ children }: { children: React.ReactNode }) {
  const { planType, isGodMode } = usePlanLimits();
  const [state, setState] = useState<{ isOpen: boolean; opts: OpenOptions | null }>({
    isOpen: false,
    opts: null,
  });

  const open = useCallback((opts: OpenOptions) => {
    // Admins should never see upgrade prompts (they have full access)
    if (isGodMode) {
      console.warn('[UpgradePrompt] suppressed for admin user', opts);
      return;
    }
    setState({ isOpen: true, opts });
  }, [isGodMode]);
  const close = useCallback(() => setState({ isOpen: false, opts: null }), []);

  const opts = state.opts;

  // If the user is already on the highest plan AND the block is purely a
  // monthly quota (limit > 0 and currentUsage >= limit), there is no
  // upgrade path — show a "comes back next month" dialog instead of
  // pushing them to "upgrade" something that doesn't exist.
  const isOnTopPlan = planType === 'pro' || planType === 'pro_beta';
  const isQuotaOnly =
    typeof opts?.limit === 'number' &&
    opts.limit > 0 &&
    typeof opts?.currentUsage === 'number' &&
    opts.currentUsage >= opts.limit;
  const showQuotaResetInstead = isOnTopPlan && isQuotaOnly;

  return (
    <UpgradePromptContext.Provider value={{ open, close }}>
      {children}
      {opts && showQuotaResetInstead && (
        <QuotaResetDialog
          isOpen={state.isOpen}
          onClose={close}
          feature={opts.feature}
          currentUsage={opts.currentUsage}
          limit={opts.limit}
          resetDate={opts.resetDate}
        />
      )}
      {opts && !showQuotaResetInstead && (
        <UpgradePrompt
          isOpen={state.isOpen}
          onClose={close}
          feature={opts.feature as never}
          currentPlan={planType}
          requiredPlan={opts.requiredPlan}
          currentUsage={opts.currentUsage}
          limit={opts.limit}
        />
      )}
    </UpgradePromptContext.Provider>
  );
}

export function useUpgradePrompt() {
  const ctx = useContext(UpgradePromptContext);
  if (!ctx) {
    // Soft fallback: log + noop so consumers don't crash if provider missing
    return {
      open: (o: OpenOptions) => console.warn('[UpgradePrompt] provider missing', o),
      close: () => {},
    } as UpgradePromptContextValue;
  }
  return ctx;
}
