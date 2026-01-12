import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for EvoFinz plans
const PRICE_IDS = {
  premium_monthly: "price_1SnBvH7BLBLy48jQTW0FYtxP",
  premium_annual: "price_1SnBwm7BLBLy48jQX7j8AA4S",
  pro_monthly: "price_1SnBvY7BLBLy48jQ3SM3pbQY",
  pro_annual: "price_1SnBx67BLBLy48jQFh5Cj6Xc",
};

// Marketing-optimized product descriptions for checkout
const PRODUCT_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  premium_monthly: {
    name: "EvoFinz Premium Mensual",
    description: "🚀 Tu camino a la libertad financiera empieza HOY:\n\n✅ Gastos e ingresos ILIMITADOS\n✅ 50 escaneos OCR de recibos/mes\n✅ Clientes y proyectos ilimitados\n✅ Mileage tracking completo para deducciones\n✅ Gamificación + XP para motivarte diariamente\n✅ Net Worth tracking en tiempo real\n✅ Calendario fiscal con alertas inteligentes\n✅ Analytics avanzados (9+ gráficos)\n✅ Biblioteca de educación financiera\n\n💡 Cancela cuando quieras. Sin compromisos.",
  },
  premium_annual: {
    name: "EvoFinz Premium Anual",
    description: "🎉 ¡AHORRA 20%! Tu mejor inversión del año:\n\n✅ TODO lo del plan Premium Mensual\n✅ 12 meses de tranquilidad financiera\n✅ Equivalente a solo $5.59/mes\n✅ Sin interrupciones - enfócate en crecer\n\n🏆 INCLUYE:\n• Gastos/ingresos ILIMITADOS\n• 50 OCR/mes + Mileage tracking\n• Gamificación + Net Worth\n• Calendario fiscal + Analytics avanzados\n• Biblioteca de educación financiera\n\n💪 Miles de profesionales ya organizaron sus finanzas con EvoFinz.",
  },
  pro_monthly: {
    name: "EvoFinz Pro Mensual",
    description: "👑 El plan COMPLETO para profesionales exigentes:\n\n✅ TODO lo del Premium +\n✅ OCR ILIMITADO - escanea sin límites\n✅ Análisis INTELIGENTE de contratos\n✅ Análisis bancario con detección de anomalías\n✅ Optimizador fiscal inteligente\n✅ Calculadora FIRE + Optimizador RRSP/TFSA\n✅ 8 módulos de mentoría (Kiyosaki, Tracy, Clear)\n✅ Asistente de voz inteligente\n✅ Exportación fiscal oficial (T2125/F29)\n✅ Predicciones y tendencias\n✅ Soporte prioritario 24/7\n\n🔥 Convierte el caos financiero en dominio total.",
  },
  pro_annual: {
    name: "EvoFinz Pro Anual",
    description: "🏆 MÁXIMO AHORRO + TODAS las herramientas PRO:\n\n🎁 ¡AHORRA 20%! Solo $11.99/mes (vs $14.99)\n\n👑 INCLUYE ABSOLUTAMENTE TODO:\n• OCR ILIMITADO para todos tus recibos\n• Análisis inteligente de contratos\n• Detección de anomalías bancarias\n• Optimizador fiscal + RRSP/TFSA/APV\n• Calculadora FIRE completa + proyecciones\n• 8 módulos de mentoría financiera\n• Asistente de voz inteligente\n• Exportación fiscal oficial\n• Predicciones, tendencias y reconciliación\n• Soporte prioritario 24/7\n\n🚀 De empleado a EXPERTO financiero. Tu transformación empieza ahora.\n\n✨ Garantía de satisfacción: 30 días o te devolvemos el dinero.",
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
