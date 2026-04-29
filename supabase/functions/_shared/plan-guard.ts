// Shared plan limit guard for AI / quota-bound edge functions.
// Returns a standardized 429 payload that the frontend's
// useAIErrorHandler understands, so users see a consistent
// upgrade prompt with the correct plan + usage info.
//
// Usage at the top of an edge function (after CORS preflight):
//
//   const guard = await checkPlanAccess(req, 'ocr');
//   if (!guard.allowed) return guard.response;
//   const { userId, supabaseAdmin } = guard;
//   // ... do the work ...
//   await guard.recordUsage(); // increments usage_tracking on success
//
// Never trust user_id from the request body — it's always derived
// from the JWT on Authorization header.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type PlanType = 'free' | 'premium' | 'pro' | 'pro_beta';

/** Maps a logical "feature" used by AI flows to:
 *  - the column in plan_configurations that holds its monthly limit (or boolean)
 *  - the column in usage_tracking that counts its consumption
 *  - the increment_usage type string
 *  - which plan is the minimum that enables it (used as fallback hint)
 */
export type FeatureName =
  | 'ocr'
  | 'contract_analysis'
  | 'bank_analysis'
  | 'voice_premium'
  | 'ai_credits'
  | 'tax_optimizer'
  | 'rrsp_tfsa_optimizer'
  | 'predictions'
  | 'autopilot'
  | 'coaching';

interface FeatureSpec {
  /** Limit column on plan_configurations. Null means it's a boolean feature. */
  limitCol: string | null;
  /** Boolean column on plan_configurations (when feature is on/off). */
  boolCol?: string;
  /** Counter column on usage_tracking. */
  usageCol?: string;
  /** Type string for increment_usage RPC. */
  usageType?: 'expense' | 'income' | 'ocr' | 'contract' | 'bank' | 'voice';
  /** Default required plan suggested to the user. */
  defaultRequiredPlan: PlanType;
  /** Friendly key passed to the upgrade prompt (matches UpgradeFeatureKey). */
  promptFeature: string;
}

const FEATURE_SPEC: Record<FeatureName, FeatureSpec> = {
  ocr: {
    limitCol: 'ocr_scans_per_month',
    usageCol: 'ocr_scans_count',
    usageType: 'ocr',
    defaultRequiredPlan: 'premium',
    promptFeature: 'ocr',
  },
  contract_analysis: {
    limitCol: 'contract_analyses_per_month',
    usageCol: 'contract_analyses_count',
    usageType: 'contract',
    defaultRequiredPlan: 'pro',
    promptFeature: 'contracts',
  },
  bank_analysis: {
    limitCol: 'bank_analyses_per_month',
    usageCol: 'bank_analyses_count',
    usageType: 'bank',
    defaultRequiredPlan: 'premium',
    promptFeature: 'bank_analysis',
  },
  voice_premium: {
    limitCol: 'voice_minutes_per_month',
    usageCol: 'voice_minutes_used',
    usageType: 'voice',
    defaultRequiredPlan: 'premium',
    promptFeature: 'voice_premium',
  },
  ai_credits: {
    limitCol: null,
    defaultRequiredPlan: 'pro',
    promptFeature: 'ai_credits',
  },
  tax_optimizer: {
    limitCol: null,
    boolCol: 'tax_optimizer_enabled',
    defaultRequiredPlan: 'pro',
    promptFeature: 'ai_credits',
  },
  rrsp_tfsa_optimizer: {
    limitCol: null,
    boolCol: 'rrsp_tfsa_optimizer_enabled',
    defaultRequiredPlan: 'pro',
    promptFeature: 'ai_credits',
  },
  predictions: {
    limitCol: null,
    defaultRequiredPlan: 'pro',
    promptFeature: 'predictions',
  },
  autopilot: {
    limitCol: null,
    defaultRequiredPlan: 'pro',
    promptFeature: 'autopilot',
  },
  coaching: {
    limitCol: null,
    defaultRequiredPlan: 'pro',
    promptFeature: 'coaching',
  },
};

interface DeniedResult {
  allowed: false;
  response: Response;
}

interface AllowedResult {
  allowed: true;
  userId: string;
  plan: PlanType;
  isAdmin: boolean;
  supabaseAdmin: SupabaseClient;
  /** Increment usage counter (call after the work succeeded). */
  recordUsage: (overrideAmount?: number) => Promise<void>;
}

export type PlanGuardResult = AllowedResult | DeniedResult;

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function nextMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/**
 * Check whether the calling user can use `feature`.
 * - Validates JWT, derives user_id.
 * - Reads plan_configurations + user_subscriptions + usage_tracking.
 * - Admin users always pass.
 * - Returns either an AllowedResult or a DeniedResult with a 429 Response.
 */
export async function checkPlanAccess(
  req: Request,
  feature: FeatureName,
): Promise<PlanGuardResult> {
  const spec = FEATURE_SPEC[feature];
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify JWT — uses anon client with the user's bearer token
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      allowed: false,
      response: jsonResponse(401, { error: 'unauthorized', message: 'Missing bearer token' }),
    };
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) {
    return {
      allowed: false,
      response: jsonResponse(401, { error: 'unauthorized', message: 'Invalid session' }),
    };
  }
  const userId = userRes.user.id;

  // Admin client (bypasses RLS for reading config + admin role + usage table)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Admin bypass
  const { data: adminCheck } = await supabaseAdmin.rpc('is_admin', { p_user_id: userId });
  const isAdmin = adminCheck === true;

  // Resolve user plan
  const { data: sub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('plan_type, is_active, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_beta_tester, beta_plan_level, beta_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const betaActive =
    profile?.is_beta_tester === true &&
    (!profile?.beta_expires_at || new Date(profile.beta_expires_at) > new Date());

  let plan: PlanType = (sub?.plan_type as PlanType) || 'free';
  if (sub?.expires_at && new Date(sub.expires_at) < new Date()) plan = 'free';
  if (betaActive) plan = 'pro_beta';
  if (isAdmin) plan = 'pro'; // treat admin as pro for limit lookup but bypass below

  // Treat pro_beta same as pro for limit purposes
  const planForLimits: PlanType = plan === 'pro_beta' ? 'pro' : plan;

  // Build noop recordUsage as default
  const recordUsage = async (override?: number) => {
    if (!spec.usageType) return;
    if (isAdmin) return; // do not consume admin quota
    try {
      if (spec.usageType === 'voice') {
        await supabaseAdmin.rpc('increment_voice_usage', {
          p_user_id: userId,
          p_minutes: override ?? 1,
        });
      } else {
        // increment_usage requires auth.uid() === p_user_id, so call via user client
        await userClient.rpc('increment_usage', {
          p_user_id: userId,
          p_usage_type: spec.usageType,
        });
      }
    } catch (e) {
      console.error('[plan-guard] recordUsage failed', e);
    }
  };

  if (isAdmin) {
    return { allowed: true, userId, plan: 'pro', isAdmin: true, supabaseAdmin, recordUsage };
  }

  // Read plan_configurations for this plan
  const { data: planConfig } = await supabaseAdmin
    .from('plan_configurations')
    .select('*')
    .eq('plan_type', planForLimits)
    .eq('is_active', true)
    .maybeSingle();

  // Determine the lowest plan that enables this feature (for the upgrade hint)
  const { data: allPlans } = await supabaseAdmin
    .from('plan_configurations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  function planEnablesFeature(row: Record<string, unknown> | null): boolean {
    if (!row) return false;
    if (spec.boolCol) return row[spec.boolCol] === true;
    if (spec.limitCol) {
      const v = row[spec.limitCol];
      return typeof v === 'number' && (v === -1 || v > 0);
    }
    return true;
  }

  let suggestedPlan: PlanType = spec.defaultRequiredPlan;
  if (allPlans) {
    const enabling = allPlans.find((p) => planEnablesFeature(p as Record<string, unknown>));
    if (enabling?.plan_type) suggestedPlan = enabling.plan_type as PlanType;
  }

  // Boolean feature: enabled or not
  if (spec.boolCol) {
    const enabled = planEnablesFeature((planConfig as Record<string, unknown>) ?? null);
    if (!enabled) {
      return {
        allowed: false,
        response: jsonResponse(429, {
          error: 'plan_required',
          feature: spec.promptFeature,
          currentPlan: plan,
          requiredPlan: suggestedPlan,
          message: `Esta función requiere el plan ${suggestedPlan}.`,
        }),
      };
    }
    return { allowed: true, userId, plan, isAdmin: false, supabaseAdmin, recordUsage };
  }

  // Numeric limit feature
  if (spec.limitCol && spec.usageCol) {
    const limitRaw = (planConfig as Record<string, unknown> | null)?.[spec.limitCol];
    const limit =
      typeof limitRaw === 'number' ? (limitRaw === -1 ? Infinity : limitRaw) : 0;

    if (limit === 0) {
      return {
        allowed: false,
        response: jsonResponse(429, {
          error: 'plan_required',
          feature: spec.promptFeature,
          currentPlan: plan,
          requiredPlan: suggestedPlan,
          limit: 0,
          currentUsage: 0,
          message: `Esta función no está incluida en tu plan ${plan}.`,
        }),
      };
    }

    if (Number.isFinite(limit)) {
      // Read this month's usage
      const { data: usage } = await supabaseAdmin
        .from('usage_tracking')
        .select(spec.usageCol)
        .eq('user_id', userId)
        .gte('period_start', new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1).toISOString().slice(0, 10))
        .maybeSingle();
      const used = Number((usage as Record<string, unknown> | null)?.[spec.usageCol] ?? 0);

      if (used >= (limit as number)) {
        return {
          allowed: false,
          response: jsonResponse(429, {
            error: 'quota_exceeded',
            feature: spec.promptFeature,
            currentPlan: plan,
            requiredPlan: planForLimits === 'pro' ? undefined : suggestedPlan,
            currentUsage: used,
            limit: limit as number,
            resetDate: nextMonthIso(),
            message: `Has alcanzado el límite mensual (${used}/${limit}). Se renueva el ${nextMonthIso().slice(0, 10)}.`,
          }),
        };
      }
    }
  }

  return { allowed: true, userId, plan, isAdmin: false, supabaseAdmin, recordUsage };
}

export { corsHeaders };
