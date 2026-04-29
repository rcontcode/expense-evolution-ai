/**
 * useGuardedInvoke
 *
 * Thin wrapper around `supabase.functions.invoke()` that automatically
 * routes 429 / 402 / `quota_exceeded` / `voice_limit_exceeded` style
 * responses through the `UpgradePrompt` modal via `useAIErrorHandler`.
 *
 * Use this in components/hooks that call AI / quota-limited edge
 * functions so users always see a clear upgrade path instead of a
 * generic "Error" toast.
 *
 * Returns:
 *   { data, error, handled }
 *   - `handled` is true when the error was a quota/credits issue and
 *     UpgradePrompt was opened — caller should silently `return`.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAIErrorHandler } from '@/hooks/utils/useAIErrorHandler';
import type { UpgradeFeatureKey } from '@/contexts/UpgradePromptContext';
import type { PlanType } from '@/hooks/data/usePlanLimits';

export interface GuardedInvokeOptions {
  feature: UpgradeFeatureKey;
  requiredPlan?: PlanType;
  silentToast?: boolean;
}

export interface GuardedInvokeResult<T = any> {
  data: T | null;
  error: any;
  handled: boolean;
}

export function useGuardedInvoke() {
  const { handleAIError } = useAIErrorHandler();

  const invoke = useCallback(
    async <T = any>(
      functionName: string,
      body: Record<string, any> | undefined,
      opts: GuardedInvokeOptions,
    ): Promise<GuardedInvokeResult<T>> => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) {
        const handled = handleAIError(error, opts);
        return { data: null, error, handled };
      }

      // Some edge functions return 200 + { error: '...' } for quota issues.
      if (data && typeof data === 'object' && (data as any).error) {
        const handled = handleAIError(data, opts);
        if (handled) {
          return { data: null, error: data, handled: true };
        }
      }

      return { data: data as T, error: null, handled: false };
    },
    [handleAIError],
  );

  return { invoke };
}
