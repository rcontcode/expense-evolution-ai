import React, { createContext, useCallback, useContext, useState } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
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
  /** Optional human message – currently logged for analytics. */
  message?: string;
}

interface UpgradePromptContextValue {
  open: (options: OpenOptions) => void;
  close: () => void;
}

const UpgradePromptContext = createContext<UpgradePromptContextValue | null>(null);

export function UpgradePromptProvider({ children }: { children: React.ReactNode }) {
  const { planType } = usePlanLimits();
  const [state, setState] = useState<{ isOpen: boolean; opts: OpenOptions | null }>({
    isOpen: false,
    opts: null,
  });

  const open = useCallback((opts: OpenOptions) => {
    setState({ isOpen: true, opts });
  }, []);
  const close = useCallback(() => setState({ isOpen: false, opts: null }), []);

  const opts = state.opts;

  return (
    <UpgradePromptContext.Provider value={{ open, close }}>
      {children}
      {opts && (
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
