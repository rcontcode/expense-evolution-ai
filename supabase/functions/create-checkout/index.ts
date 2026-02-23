import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Price IDs for EvoFinz plans
const PRICE_IDS = {
  premium_monthly: "price_1SwafM3wR30iWwFnJpszo14u",
  premium_annual: "price_1Swaff3wR30iWwFnGvO9x4Fa",
  pro_monthly: "price_1Swafv3wR30iWwFn0z52B0W7",
  pro_annual: "price_1SwagD3wR30iWwFn9RABKpl3",
};

// Short descriptions for Stripe (max 500 chars)
const PRODUCT_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  premium_monthly: {
    name: "EvoFinz Premium Mensual",
    description: "Gastos/ingresos ilimitados, 50 OCR/mes, clientes ilimitados, mileage, gamificación, patrimonio neto, calendario fiscal, reporte mensual IA, alertas proactivas, mentoría (4 módulos), voz (30 min/mes).",
  },
  premium_annual: {
    name: "EvoFinz Premium Anual",
    description: "Ahorra 20% - Todo Premium: gastos ilimitados, 50 OCR/mes, mileage, gamificación, patrimonio neto, calendario fiscal, reporte IA, alertas, mentoría. Solo $5.59/mes.",
  },
  pro_monthly: {
    name: "EvoFinz Pro Mensual",
    description: "Plan completo: OCR ilimitado, análisis contratos IA, análisis bancario, optimizador fiscal, FIRE, RRSP/TFSA, T2125, mentoría completa, voz (120 min/mes), soporte dedicado.",
  },
  pro_annual: {
    name: "EvoFinz Pro Anual",
    description: "Ahorra 20% - Todo Pro: OCR ilimitado, contratos IA, fiscal, FIRE, RRSP/TFSA, T2125, mentoría, voz (120 min/mes), soporte dedicado. Solo $11.99/mes.",
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planType, billingPeriod } = await req.json();
    logStep("Request params", { planType, billingPeriod });

    // Validate plan type
    if (!["premium", "pro"].includes(planType)) {
      throw new Error("Invalid plan type");
    }

    // Validate billing period
    if (!["monthly", "annual"].includes(billingPeriod)) {
      throw new Error("Invalid billing period");
    }

    const priceKey = `${planType}_${billingPeriod}` as keyof typeof PRICE_IDS;
    const priceId = PRICE_IDS[priceKey];
    const productInfo = PRODUCT_DESCRIPTIONS[priceKey];
    logStep("Selected price", { priceKey, priceId, productName: productInfo?.name });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://evofinz.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/dashboard?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        billing_period: billingPeriod,
      },
      subscription_data: {
        description: productInfo?.description || undefined,
        metadata: {
          plan_type: planType,
          billing_period: billingPeriod,
        },
      },
      // Require terms of service acceptance
      consent_collection: {
        terms_of_service: 'required',
      },
      // Customize checkout page appearance
      custom_text: {
        submit: {
          message: billingPeriod === 'annual' 
            ? '🎉 ¡Felicidades! Estás ahorrando un 20% con el plan anual. Tu transformación financiera comienza ahora.'
            : '🚀 Estás a un clic de tomar el control de tus finanzas. ¡Bienvenido a EvoFinz!',
        },
        terms_of_service_acceptance: {
          message: 'Al suscribirte, aceptas nuestros [términos de servicio](https://evofinz.lovable.app/legal) y confirmas que puedes cancelar en cualquier momento.',
        },
      },
      // Payment settings
      payment_method_types: ['card'],
      allow_promotion_codes: true, // Allow discount codes
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
