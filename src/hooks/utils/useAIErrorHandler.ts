import { useCallback } from 'react';
import { toast } from 'sonner';
import { useUpgradePrompt, type UpgradeFeatureKey } from '@/contexts/UpgradePromptContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PlanType } from '@/hooks/data/usePlanLimits';

/**
 * Normalised payload that any AI / quota-bound edge function can return.
 * Older responses (just `{ error: 'AI credits exhausted' }`) are also
 * detected via heuristics for backwards compatibility.
 */
export interface AIErrorPayload {
  error?: string;
  message?: string;
  feature?: UpgradeFeatureKey;
  currentPlan?: PlanType;
  requiredPlan?: PlanType;
  currentUsage?: number;
  limit?: number;
  resetDate?: string;
  status?: number;
  // Supabase FunctionsHttpError has `context.status`
  context?: { status?: number };
}

interface HandleOptions {
  /** Override / supply feature when the payload didn't carry it. */
  feature?: UpgradeFeatureKey;
  /** Default required plan when payload doesn't include one. */
  requiredPlan?: PlanType;
  /** Silence the toast (e.g. when caller already shows its own UI). */
  silentToast?: boolean;
}

const QUOTA_ERROR_KEYS = ['quota_exceeded', 'plan_required', 'limit_reached'];
const CREDITS_ERROR_KEYS = [
  'credits_exhausted',
  'ai credits exhausted',
  'ai credits depleted',
  'payment required',
];

function detectKind(payload: AIErrorPayload | unknown): 'quota' | 'credits' | 'other' {
  const p = payload as AIErrorPayload;
  const status = p?.status ?? p?.context?.status;
  if (status === 429) return 'quota';
  if (status === 402) return 'credits';

  const errStr = `${p?.error ?? ''} ${p?.message ?? ''}`.toLowerCase();
  if (QUOTA_ERROR_KEYS.some((k) => errStr.includes(k))) return 'quota';
  if (CREDITS_ERROR_KEYS.some((k) => errStr.includes(k.toLowerCase()))) return 'credits';
  return 'other';
}

export function useAIErrorHandler() {
  const upgrade = useUpgradePrompt();
  const { language } = useLanguage();
  const es = language === 'es';

  /**
   * Returns true when the error was identified as a quota/credits issue and
   * handled via UpgradePrompt — caller can use this to short-circuit
   * additional generic error UI.
   */
  const handleAIError = useCallback(
    (errorOrPayload: unknown, opts: HandleOptions = {}): boolean => {
      const payload = (errorOrPayload ?? {}) as AIErrorPayload;
      const kind = detectKind(payload);

      const feature: UpgradeFeatureKey =
        payload.feature || opts.feature || 'ai_credits';
      const requiredPlan: PlanType | undefined =
        payload.requiredPlan || opts.requiredPlan;

      if (kind === 'quota') {
        upgrade.open({
          feature,
          requiredPlan,
          currentUsage: payload.currentUsage,
          limit: payload.limit,
          resetDate: payload.resetDate,
          message: payload.message,
        });
        return true;
      }

      if (kind === 'credits') {
        // AI gateway out of credits — typically a temporary platform issue.
        // Still encourage upgrade for higher limits, but be transparent.
        if (!opts.silentToast) {
          toast.error(
            es
              ? 'Servicio inteligente temporalmente saturado'
              : 'Smart service temporarily busy',
            {
              description: es
                ? 'Estamos recargando capacidad. Inténtalo de nuevo en unos minutos. Los planes superiores tienen prioridad.'
                : 'We are restoring capacity. Try again in a few minutes. Upper plans get priority.',
              duration: 6000,
            },
          );
        }
        // Still surface the upgrade path softly
        upgrade.open({ feature, requiredPlan });
        return true;
      }

      return false;
    },
    [upgrade, es],
  );

  return { handleAIError };
}
