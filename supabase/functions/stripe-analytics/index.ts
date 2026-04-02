import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

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

    const now = new Date();

    // --- Monthly Revenue for last 6 months ---
    const monthlyRevenue: Array<{ month: string; revenue: number; charges: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      let totalRevenue = 0;
      let totalCharges = 0;
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Stripe.ChargeListParams = {
          created: {
            gte: Math.floor(monthStart.getTime() / 1000),
            lt: Math.floor(monthEnd.getTime() / 1000),
          },
          limit: 100,
        };
        if (startingAfter) params.starting_after = startingAfter;

        const batch = await stripe.charges.list(params);
        for (const charge of batch.data) {
          if (charge.status === "succeeded") {
            totalRevenue += charge.amount;
            totalCharges++;
          }
        }
        hasMore = batch.has_more;
        if (batch.data.length > 0) {
          startingAfter = batch.data[batch.data.length - 1].id;
        }
      }

      monthlyRevenue.push({
        month: monthKey,
        revenue: Math.round(totalRevenue) / 100,
        charges: totalCharges,
      });
    }

    // --- Canceled subscriptions (last 60 days) ---
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const canceledSubs: Stripe.Subscription[] = [];
    let hasMoreCanceled = true;
    let canceledAfter: string | undefined;

    while (hasMoreCanceled) {
      const params: Stripe.SubscriptionListParams = {
        status: "canceled",
        limit: 100,
        created: { gte: Math.floor(sixtyDaysAgo.getTime() / 1000) },
      };
      if (canceledAfter) params.starting_after = canceledAfter;

      const batch = await stripe.subscriptions.list(params);
      canceledSubs.push(...batch.data);
      hasMoreCanceled = batch.has_more;
      if (batch.data.length > 0) {
        canceledAfter = batch.data[batch.data.length - 1].id;
      }
    }

    const canceled30d = canceledSubs.filter(
      (s) => s.canceled_at && s.canceled_at * 1000 >= thirtyDaysAgo.getTime()
    ).length;
    const canceled60d = canceledSubs.length;

    // --- New subscriptions (last 30 and 60 days) ---
    const newSubs30d: Stripe.Subscription[] = [];
    let hasMoreNew = true;
    let newAfter: string | undefined;

    while (hasMoreNew) {
      const params: Stripe.SubscriptionListParams = {
        status: "active",
        limit: 100,
        created: { gte: Math.floor(thirtyDaysAgo.getTime() / 1000) },
      };
      if (newAfter) params.starting_after = newAfter;

      const batch = await stripe.subscriptions.list(params);
      newSubs30d.push(...batch.data);
      hasMoreNew = batch.has_more;
      if (batch.data.length > 0) {
        newAfter = batch.data[batch.data.length - 1].id;
      }
    }

    // --- Active subscriptions count ---
    const activeSubs = await stripe.subscriptions.list({ status: "active", limit: 1 });
    const totalActive = activeSubs.data.length > 0 ? (await stripe.subscriptions.list({ status: "active", limit: 100 })).data.length : 0;

    // --- Total customers ---
    let totalCustomers = 0;
    let custHasMore = true;
    let custAfter: string | undefined;
    while (custHasMore) {
      const params: Stripe.CustomerListParams = { limit: 100 };
      if (custAfter) params.starting_after = custAfter;
      const batch = await stripe.customers.list(params);
      totalCustomers += batch.data.length;
      custHasMore = batch.has_more;
      if (batch.data.length > 0) {
        custAfter = batch.data[batch.data.length - 1].id;
      }
    }

    // Calculate churn rate
    const startOfPeriodActive = totalActive + canceled30d; // approximation
    const churnRate30d = startOfPeriodActive > 0 ? Math.round((canceled30d / startOfPeriodActive) * 10000) / 100 : 0;

    // Net subscriber growth
    const netGrowth30d = newSubs30d.length - canceled30d;

    return new Response(JSON.stringify({
      monthlyRevenue,
      churn: {
        canceled30d,
        canceled60d,
        churnRate30d,
        newSubscribers30d: newSubs30d.length,
        netGrowth30d,
        totalActive,
        totalCustomers,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-ANALYTICS]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: error instanceof Error && msg.includes("Unauthorized") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
