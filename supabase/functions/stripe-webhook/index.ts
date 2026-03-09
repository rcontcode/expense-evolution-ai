import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Unified Product ID map — must stay in sync with check-subscription
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

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

function parseStripeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    let date: Date;
    if (typeof value === "number") {
      date = new Date(value * 1000);
    } else if (typeof value === "string") {
      const numericValue = Number(value);
      if (!isNaN(numericValue)) {
        date = new Date(numericValue * 1000);
      } else {
        date = new Date(value);
      }
    } else {
      return null;
    }
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function getPlanFromProductId(productId: string): { planType: string; billingPeriod: string | null; isBundle: boolean } {
  const config = PRODUCT_ID_MAP[productId];
  if (config) {
    return { planType: config.plan, billingPeriod: config.period, isBundle: config.bundle || false };
  }
  logStep("WARNING: Unknown product ID in webhook", { productId });
  return { planType: "free", billingPeriod: null, isBundle: false };
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          logStep("Customer deleted, skipping");
          break;
        }
        
        const email = customer.email;
        if (!email) {
          logStep("No customer email found");
          break;
        }

        const { data: profiles } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .limit(1);

        if (!profiles || profiles.length === 0) {
          logStep("No user found for email", { email });
          break;
        }

        const userId = profiles[0].id;
        const productId = subscription.items.data[0]?.price?.product as string;
        const { planType, billingPeriod, isBundle } = getPlanFromProductId(productId);
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        
        logStep("Raw subscription data", { 
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          productId 
        });

        const expiresAt = isActive ? parseStripeDate(subscription.current_period_end) : null;

        logStep("Updating subscription", { userId, planType, billingPeriod, isActive, isBundle, expiresAt });

        const { error: upsertError } = await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan_type: isActive ? planType : "free",
            billing_period: isActive ? billingPeriod : null,
            is_active: isActive,
            expires_at: expiresAt,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            has_bundle: isActive ? isBundle : false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (upsertError) {
          logStep("Upsert error", { error: upsertError.message, code: upsertError.code });
          throw new Error(`Database upsert failed: ${upsertError.message}`);
        }

        logStep("Subscription updated successfully");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const email = customer.email;
        if (!email) break;

        const { data: profiles } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .limit(1);

        if (!profiles || profiles.length === 0) break;

        const userId = profiles[0].id;

        logStep("Subscription cancelled, reverting to free", { userId });

        const { error: upsertError } = await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan_type: "free",
            billing_period: null,
            is_active: true,
            expires_at: null,
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            has_bundle: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (upsertError) {
          logStep("Upsert error on cancellation", { error: upsertError.message });
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === "subscription_create" || invoice.billing_reason === "subscription_cycle") {
          logStep("Payment succeeded", { invoiceId: invoice.id, amount: invoice.amount_paid });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logStep("Payment failed", { invoiceId: invoice.id, customerId });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
