import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Product IDs for EvoFinz plans
const PRODUCT_IDS = {
  premium_monthly: "prod_TkhJLlgoAdGcGC",
  premium_annual: "prod_TkhL8wDZL2MPDd",
  pro_monthly: "prod_TkhKMQlrqFnKYc",
  pro_annual: "prod_TkhLVXHrCf97Ir",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

function getPlanFromProductId(productId: string): { planType: string; billingPeriod: string | null } {
  switch (productId) {
    case PRODUCT_IDS.premium_monthly:
      return { planType: "premium", billingPeriod: "monthly" };
    case PRODUCT_IDS.premium_annual:
      return { planType: "premium", billingPeriod: "annual" };
    case PRODUCT_IDS.pro_monthly:
      return { planType: "pro", billingPeriod: "monthly" };
    case PRODUCT_IDS.pro_annual:
      return { planType: "pro", billingPeriod: "annual" };
    default:
      return { planType: "free", billingPeriod: null };
  }
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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
        
        // Get customer email
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

        // Find user by email
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
        const { planType, billingPeriod } = getPlanFromProductId(productId);
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

        logStep("Updating subscription", { userId, planType, billingPeriod, isActive });

        await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan_type: isActive ? planType : "free",
            billing_period: isActive ? billingPeriod : null,
            is_active: isActive,
            expires_at: isActive ? expiresAt : null,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

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

        await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan_type: "free",
            billing_period: null,
            is_active: true,
            expires_at: null,
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

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

        // Optionally mark subscription as past_due in your system
        // For now, Stripe will handle retries and eventual cancellation
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
