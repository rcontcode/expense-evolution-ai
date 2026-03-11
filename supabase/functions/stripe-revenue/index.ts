import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs for EvoFinz plans
const PRODUCT_ID_MAP: Record<string, { plan: string; period: string; bundle?: boolean }> = {
  "prod_U4OdR9JHiXuKho": { plan: "premium", period: "monthly" },
  "prod_U4Ofsc9SskEad8": { plan: "premium", period: "annual" },
  "prod_TuPUlFnv10u2OA": { plan: "premium", period: "monthly" },
  "prod_TuPUaVFFZ9bBgf": { plan: "premium", period: "annual" },
  "prod_TuPUJPLiqh0kC7": { plan: "pro", period: "monthly" },
  "prod_TuPVHHsOi7e4Au": { plan: "pro", period: "annual" },
  "prod_U4OgGM4CrkdVOP": { plan: "pro", period: "monthly", bundle: true },
  "prod_U4Ohr9YUiCNX76": { plan: "pro", period: "annual", bundle: true },
  "prod_U2ZIfWwlezukmF": { plan: "pro", period: "monthly", bundle: true },
  "prod_U2ZNNkNSSVCIp5": { plan: "pro", period: "annual", bundle: true },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) throw new Error("Admin access required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all active subscriptions
    const subscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = {
        status: "active",
        limit: 100,
        expand: ["data.items.data.price"],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const batch = await stripe.subscriptions.list(params);
      subscriptions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id;
      }
    }

    // Calculate MRR breakdown
    let totalMRR = 0;
    const planBreakdown: Record<string, { count: number; mrr: number }> = {
      premium_monthly: { count: 0, mrr: 0 },
      premium_annual: { count: 0, mrr: 0 },
      pro_monthly: { count: 0, mrr: 0 },
      pro_annual: { count: 0, mrr: 0 },
      bundle_monthly: { count: 0, mrr: 0 },
      bundle_annual: { count: 0, mrr: 0 },
      other: { count: 0, mrr: 0 },
    };

    const recentSubscriptions: Array<{
      id: string;
      email: string;
      plan: string;
      mrr: number;
      created: string;
      current_period_end: string;
    }> = [];

    for (const sub of subscriptions) {
      const item = sub.items.data[0];
      if (!item?.price) continue;

      const price = item.price;
      const productId = typeof price.product === "string" ? price.product : (price.product as Stripe.Product)?.id;
      const amount = (price.unit_amount || 0) / 100;
      const interval = price.recurring?.interval;

      // Calculate monthly equivalent
      let monthlyAmount = amount;
      if (interval === "year") {
        monthlyAmount = amount / 12;
      }

      totalMRR += monthlyAmount;

      // Classify
      const mapping = productId ? PRODUCT_ID_MAP[productId] : null;
      if (mapping) {
        const key = mapping.bundle 
          ? `bundle_${mapping.period}` 
          : `${mapping.plan}_${mapping.period}`;
        if (planBreakdown[key]) {
          planBreakdown[key].count++;
          planBreakdown[key].mrr += monthlyAmount;
        }
      } else {
        planBreakdown.other.count++;
        planBreakdown.other.mrr += monthlyAmount;
      }

      // Get customer email
      let email = "unknown";
      if (sub.customer) {
        try {
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          email = customer.email || "unknown";
        } catch { /* ignore */ }
      }

      recentSubscriptions.push({
        id: sub.id,
        email,
        plan: mapping ? (mapping.bundle ? `Bundle (${mapping.period})` : `${mapping.plan} (${mapping.period})`) : "Other",
        mrr: Math.round(monthlyAmount * 100) / 100,
        created: new Date(sub.created * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      });
    }

    // Sort recent subs by creation date desc
    recentSubscriptions.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    // Get balance
    const balance = await stripe.balance.retrieve();
    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    // Get recent charges for trend
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const charges30d = await stripe.charges.list({
      created: { gte: Math.floor(thirtyDaysAgo.getTime() / 1000) },
      limit: 100,
    });
    const revenue30d = charges30d.data
      .filter(c => c.status === "succeeded")
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const charges60d = await stripe.charges.list({
      created: {
        gte: Math.floor(sixtyDaysAgo.getTime() / 1000),
        lt: Math.floor(thirtyDaysAgo.getTime() / 1000),
      },
      limit: 100,
    });
    const revenuePrev30d = charges60d.data
      .filter(c => c.status === "succeeded")
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const revenueGrowth = revenuePrev30d > 0
      ? Math.round(((revenue30d - revenuePrev30d) / revenuePrev30d) * 100)
      : revenue30d > 0 ? 100 : 0;

    return new Response(JSON.stringify({
      mrr: Math.round(totalMRR * 100) / 100,
      arr: Math.round(totalMRR * 12 * 100) / 100,
      totalActiveSubscriptions: subscriptions.length,
      planBreakdown,
      revenue30d: Math.round(revenue30d * 100) / 100,
      revenueGrowth,
      balance: {
        available: Math.round(availableBalance * 100) / 100,
        pending: Math.round(pendingBalance * 100) / 100,
      },
      recentSubscriptions: recentSubscriptions.slice(0, 20),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-REVENUE]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: error instanceof Error && msg.includes("Unauthorized") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
