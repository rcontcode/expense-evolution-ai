import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { esSuscripcionDeEvoFinz } from "../_shared/productos-evofinz.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Price IDs for EvoFinz plans
const PRICE_IDS = {
  premium_monthly: "price_1T6Fpu3wR30iWwFnTiIn2JLe",
  premium_annual: "price_1T6Fs93wR30iWwFnjzId7AK4",
  pro_monthly: "price_1Swafv3wR30iWwFn0z52B0W7",
  pro_annual: "price_1SwagD3wR30iWwFn9RABKpl3",
  bundle_monthly: "price_1T6FtG3wR30iWwFntfPozk4n",
  bundle_annual: "price_1T6Ftj3wR30iWwFnjQcJq4Mm",
};

// Short descriptions for Stripe (max 500 chars)
const PRODUCT_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  premium_monthly: {
    name: "EvoFinz Premium Mensual",
    description: "Gastos/ingresos ilimitados, 50 OCR/mes, clientes ilimitados, mileage, gamificación, patrimonio neto, calendario fiscal, reporte mensual IA, alertas proactivas, mentoría (4 módulos), voz (30 min/mes).",
  },
  premium_annual: {
    name: "EvoFinz Premium Anual",
    description: "Todo Premium: gastos ilimitados, 50 OCR/mes, mileage, gamificación, patrimonio neto, calendario fiscal, reporte IA, alertas, mentoría. $6.49/mes facturado anualmente.",
  },
  pro_monthly: {
    name: "EvoFinz Pro Mensual",
    description: "Plan completo: OCR ilimitado, análisis contratos IA, análisis bancario, optimizador fiscal, FIRE, RRSP/TFSA, T2125, mentoría completa, voz (120 min/mes), soporte dedicado.",
  },
  pro_annual: {
    name: "EvoFinz Pro Anual",
    description: "Todo Pro: OCR ilimitado, contratos IA, fiscal, FIRE, RRSP/TFSA, T2125, mentoría, voz (120 min/mes), soporte dedicado. $11.99/mes facturado anualmente.",
  },
  bundle_monthly: {
    name: "Evo Bundle Mensual",
    description: "EvoFinz Pro + Fokuspark Pro: acceso completo a ambas apps, datos cruzados, insights de correlación enfoque↔finanzas, dashboard del ecosistema, soporte prioritario.",
  },
  bundle_annual: {
    name: "Evo Bundle Anual",
    description: "EvoFinz Pro + Fokuspark Pro: acceso completo, datos cruzados, correlación enfoque↔finanzas, dashboard ecosistema. $15.99/mes facturado anualmente.",
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
    if (!["premium", "pro", "bundle"].includes(planType)) {
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

    // Respaldo = dominio propio. Corregido el 15-ago-2026: era `evofinz.lovable.app`, que
    // devuelve 404 (verificado con curl). Como este valor arma el `success_url` de Stripe, si
    // la cabecera `origin` no llegaba, el cliente terminaba en una página muerta JUSTO DESPUÉS
    // DE PAGAR. Es raro que falte esa cabecera, pero el precio de que falte era perder al cliente
    // en el peor momento posible.
    const origin = req.headers.get("origin") || "https://evofinz.com";

    // GUARDIA CONTRA EL COBRO DOBLE (mismo arreglo que en Fokuspark, 22-ago-2026).
    //
    // Abajo se crea SIEMPRE una suscripcion nueva. Quien ya tiene Premium y elige
    // Pro terminaba con las dos vivas, pagando las dos. Y el webhook guarda solo
    // el id de la ultima, asi que la primera quedaba huerfana: invisible para la
    // app y cobrando igual aunque el cliente creyera haber cancelado.
    //
    // Cuando ya hay una suscripcion viva devolvemos la URL del PORTAL, donde
    // Stripe MODIFICA la existente y prorratea. El frontend abre `url` igual.
    if (customerId) {
      const existentes = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });
      const VIVAS = ["active", "trialing", "past_due", "unpaid"];

      // OJO CON EL ALCANCE: solo cuentan las suscripciones DE EVOFINZ.
      //
      // Las tres apps comparten cuenta de Stripe y a menudo el mismo customer, asi que
      // "ya tiene una suscripcion viva" no quiere decir "ya tiene EvoFinz": puede ser su
      // Fokuspark. Sin este filtro, alguien con Fokuspark que ademas quiere EvoFinz
      // terminaba en el portal, donde no puede contratar nada — o sea, la guardia contra
      // el cobro doble se comia una venta buena.
      const viva = existentes.data.find(
        (sub) => VIVAS.includes(sub.status) && esSuscripcionDeEvoFinz(sub as any),
      );

      if (viva) {
        logStep("Ya tiene suscripcion viva: se redirige al portal en vez de crear otra", {
          subscriptionId: viva.id,
          status: viva.status,
        });
        const portal = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/dashboard`,
        });
        return new Response(
          JSON.stringify({ url: portal.url, redirectedToPortal: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
    }

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
          user_id: user.id,
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
          message: planType === 'bundle'
            ? '🌟 ¡Estás desbloqueando el ecosistema completo! EvoFinz + Fokuspark trabajando juntos por tu bienestar financiero y mental.'
            : '🚀 Estás a un clic de tomar el control de tus finanzas. ¡Bienvenido a EvoFinz!',
        },
        terms_of_service_acceptance: {
          // Dominio propio: `evofinz.lovable.app` da 404 y este enlace es el de los TÉRMINOS DE
          // SERVICIO que el cliente acepta al suscribirse. Apuntaba a una página inexistente.
          message: 'Al suscribirte, aceptas nuestros [términos de servicio](https://evofinz.com/legal) y confirmas que puedes cancelar en cualquier momento.',
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
