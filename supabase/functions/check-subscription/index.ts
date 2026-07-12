import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs for EvoFinz plans (includes both old and new Stripe products)
const PRODUCT_ID_MAP: Record<string, { plan: string; period: string; bundle?: boolean }> = {
  // New products
  "prod_U4OdR9JHiXuKho": { plan: "premium", period: "monthly" },
  "prod_U4Ofsc9SskEad8": { plan: "premium", period: "annual" },
  // Old products (still active on some subscriptions)
  "prod_TuPUlFnv10u2OA": { plan: "premium", period: "monthly" },
  "prod_TuPUaVFFZ9bBgf": { plan: "premium", period: "annual" },
  // Pro
  "prod_TuPUJPLiqh0kC7": { plan: "pro", period: "monthly" },
  "prod_TuPVHHsOi7e4Au": { plan: "pro", period: "annual" },
  // Bundle (new)
  "prod_U4OgGM4CrkdVOP": { plan: "pro", period: "monthly", bundle: true },
  "prod_U4Ohr9YUiCNX76": { plan: "pro", period: "annual", bundle: true },
  // Bundle (old)
  "prod_U2ZIfWwlezukmF": { plan: "pro", period: "monthly", bundle: true },
  "prod_U2ZNNkNSSVCIp5": { plan: "pro", period: "annual", bundle: true },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// FIX 3: mismos estados que trata el webhook como isActive (activo, en prueba o en período de
// gracia por cobro fallido), para que ambas funciones no se contradigan.
const VALID_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

// FIX 4: lectura defensiva de la fecha de renovación. En la API 2025-08-27.basil el campo puede
// haberse movido al nivel del item; probamos ambos y nos quedamos con el primero que sea número válido.
function resolveSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const primary = subscription.current_period_end;
  if (typeof primary === "number" && primary > 0) return primary;

  // El SDK de tipos puede no tener aún documentado este campo a nivel de item; se lee defensivo.
  const item = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const itemPeriodEnd = item?.current_period_end;
  if (typeof itemPeriodEnd === "number" && itemPeriodEnd > 0) return itemPeriodEnd;

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free plan");
      
      // Update user_subscriptions table to ensure it's in sync
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          plan_type: "free",
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_type: "free",
        billing_period: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // FIX 3: la API no permite pedir varios status a la vez, así que traemos "all" y filtramos en
    // código las que cuentan como suscritas (activa, trial o período de gracia por cobro fallido).
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    const activeSubscription = subscriptions.data.find((sub) => VALID_SUBSCRIPTION_STATUSES.has(sub.status));
    const hasActiveSub = !!activeSubscription;
    let planType = "free";
    let billingPeriod: string | null = null;
    let subscriptionEnd: string | null = null;
    let hasBundle = false;

    if (activeSubscription) {
      const subscription = activeSubscription;
      // FIX 4: fecha robusta (subscription.current_period_end o, si no viene, el item)
      const periodEnd = resolveSubscriptionPeriodEnd(subscription);
      if (periodEnd !== null) {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      } else {
        logStep("WARNING: could not resolve period end from subscription or items", { subscriptionId: subscription.id });
      }
      const productId = subscription.items.data[0].price.product as string;
      
      logStep("Active subscription found", { subscriptionId: subscription.id, productId, endDate: subscriptionEnd });

      // Determine plan type, billing period, and bundle status from product ID
      const productConfig = PRODUCT_ID_MAP[productId];
      if (productConfig) {
        planType = productConfig.plan;
        billingPeriod = productConfig.period;
        hasBundle = productConfig.bundle || false;
      } else {
        // FIX 2: un producto desconocido NUNCA regala plan pagado — se deja en gratis.
        logStep("WARNING: Unknown product ID, defaulting to free (nunca se regala premium)", { productId });
        planType = "free";
        billingPeriod = null;
        hasBundle = false;
      }

      logStep("Determined plan", { planType, billingPeriod, hasBundle });

      // Update user_subscriptions table
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          plan_type: planType,
          billing_period: billingPeriod,
          is_active: true,
          expires_at: subscriptionEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          has_bundle: hasBundle,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

    } else {
      logStep("No active subscription found");
      
      // Update to free plan
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          plan_type: "free",
          is_active: true,
          has_bundle: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_type: planType,
      billing_period: billingPeriod,
      subscription_end: subscriptionEnd,
      has_bundle: hasBundle,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
