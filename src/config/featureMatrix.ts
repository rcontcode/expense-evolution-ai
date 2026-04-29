import type { FeatureKey, PlanType } from '@/hooks/data/usePlanLimits';
import type { UpgradeFeatureKey } from '@/contexts/UpgradePromptContext';

/**
 * Single source of truth for the relationship between:
 * - frontend feature key (used in usePlanLimits)
 * - human friendly name (ES / EN)
 * - the lowest plan that unlocks the feature (suggested upgrade)
 * - the prompt feature key passed to <UpgradePrompt /> for messaging
 *
 * The backend (`supabase/functions/_shared/plan-guard.ts`) holds the
 * authoritative copy. This frontend matrix is used for **preventive**
 * gating (FeatureGate, disabled buttons, "X/Y this month" labels) so
 * we don't need a server round trip just to know a feature is locked.
 *
 * If frontend and backend disagree, the backend's 429 always wins.
 */
export type AccessFeature =
  | 'ocr'
  | 'contract_analysis'
  | 'bank_analysis'
  | 'voice_premium'
  | 'tax_optimizer'
  | 'rrsp_tfsa_optimizer'
  | 'predictions'
  | 'autopilot'
  | 'coaching'
  | 'fire_calculator'
  | 'mileage'
  | 'net_worth';

interface FeatureSpec {
  /** Which limit/flag column from PlanLimits to inspect. */
  limitKey: FeatureKey;
  /** Which usage counter (for monthly numeric limits). */
  usageKey?:
    | 'ocr_scans_count'
    | 'contract_analyses_count'
    | 'bank_analyses_count'
    | 'voice_minutes_used';
  /** Lowest plan that unlocks the feature (suggested upgrade). */
  requiredPlan: Exclude<PlanType, 'free' | 'pro_beta'>;
  /** Key passed to <UpgradePrompt /> for the friendly message. */
  promptFeature: UpgradeFeatureKey;
  /** Display label (ES / EN). */
  label: { es: string; en: string };
}

export const FEATURE_MATRIX: Record<AccessFeature, FeatureSpec> = {
  ocr: {
    limitKey: 'ocr_scans_per_month',
    usageKey: 'ocr_scans_count',
    requiredPlan: 'premium',
    promptFeature: 'ocr',
    label: { es: 'Escaneo de recibos', en: 'Receipt scanning' },
  },
  contract_analysis: {
    limitKey: 'contract_analyses_per_month',
    usageKey: 'contract_analyses_count',
    requiredPlan: 'pro',
    promptFeature: 'contracts',
    label: { es: 'Análisis de contratos', en: 'Contract analysis' },
  },
  bank_analysis: {
    limitKey: 'bank_analyses_per_month',
    usageKey: 'bank_analyses_count',
    requiredPlan: 'premium',
    promptFeature: 'bank_analysis',
    label: { es: 'Análisis bancario', en: 'Bank analysis' },
  },
  voice_premium: {
    limitKey: 'voice_minutes_per_month',
    usageKey: 'voice_minutes_used',
    requiredPlan: 'premium',
    promptFeature: 'voice_premium',
    label: { es: 'Voz premium', en: 'Premium voice' },
  },
  tax_optimizer: {
    limitKey: 'tax_optimizer',
    requiredPlan: 'pro',
    promptFeature: 'ai_credits',
    label: { es: 'Optimizador fiscal', en: 'Tax optimizer' },
  },
  rrsp_tfsa_optimizer: {
    limitKey: 'rrsp_tfsa_optimizer',
    requiredPlan: 'pro',
    promptFeature: 'ai_credits',
    label: { es: 'Optimizador RRSP/TFSA/APV', en: 'RRSP/TFSA/APV optimizer' },
  },
  predictions: {
    limitKey: 'tax_optimizer', // gated together with pro features
    requiredPlan: 'pro',
    promptFeature: 'predictions',
    label: { es: 'Predicciones de gasto', en: 'Spending predictions' },
  },
  autopilot: {
    limitKey: 'tax_optimizer',
    requiredPlan: 'pro',
    promptFeature: 'autopilot',
    label: { es: 'Autopiloto financiero', en: 'Financial autopilot' },
  },
  coaching: {
    limitKey: 'tax_optimizer',
    requiredPlan: 'pro',
    promptFeature: 'coaching',
    label: { es: 'Mentoría inteligente', en: 'Smart mentorship' },
  },
  fire_calculator: {
    limitKey: 'fire_calculator',
    requiredPlan: 'pro',
    promptFeature: 'fire_calculator',
    label: { es: 'Calculadora FIRE', en: 'FIRE calculator' },
  },
  mileage: {
    limitKey: 'mileage',
    requiredPlan: 'premium',
    promptFeature: 'mileage',
    label: { es: 'Kilometraje', en: 'Mileage tracking' },
  },
  net_worth: {
    limitKey: 'net_worth',
    requiredPlan: 'premium',
    promptFeature: 'net_worth',
    label: { es: 'Patrimonio neto', en: 'Net worth' },
  },
};
