import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Text too short" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing smart input:", text);

    const todayDate = new Date().toISOString().split("T")[0];
    const lang = language === "es" ? "Spanish" : "English";

    const systemPrompt = `You are a financial data parser for a personal/freelancer expense tracking app. 
The user will write a natural language description of a financial transaction in ${lang}. 
Your job is to extract structured data and classify what TYPE of transaction it is.

Today's date is ${todayDate}.

TRANSACTION TYPES:
1. "expense" — A purchase or payment the user made (groceries, gas, dinner, uber, etc.)
2. "recurring_bill" — A fixed recurring obligation (rent, Netflix, gym, insurance, phone plan, utilities like water/electricity/gas)
3. "income" — Money the user received (salary, freelance payment, refund, etc.)

CLASSIFICATION RULES:
- If the user mentions paying for a service that recurs (rent, subscription, utilities, insurance, phone, internet), classify as "recurring_bill"
- If the user mentions receiving money, getting paid, a deposit, or salary → "income"
- Everything else (one-time purchases, meals, shopping) → "expense"
- If ambiguous, default to "expense"

DATE RULES:
- "ayer/yesterday" → subtract 1 day from today
- "hoy/today" or no date mentioned → use today (${todayDate})
- "el 15" or "on the 15th" → use the 15th of the current month
- "la semana pasada/last week" → subtract 7 days
- Specific dates like "enero 5" → use that date

CATEGORY RULES for expenses:
- meals: restaurant, food, coffee, lunch, dinner, groceries
- travel: uber, taxi, flight, hotel, parking, bus, metro
- equipment: computer, phone, tools, hardware
- software: apps, subscriptions (if one-time or unsure)
- fuel: gas, gasoline, diesel, bencina, nafta
- utilities: electricity, water, gas (utility), phone bill, internet
- office_supplies: paper, pens, stationery
- professional_services: lawyer, accountant, consultant
- home_office: desk, chair, office furniture
- mileage: km driven for work
- other: anything else

CATEGORY RULES for recurring_bill:
- housing: rent, mortgage, HOA, condo fees
- utilities: electricity, water, gas, internet, phone
- insurance: health, car, home, life insurance
- subscriptions: Netflix, Spotify, gym, streaming
- transportation: car payment, lease, transit pass
- debt: credit card payment, loan payment
- childcare: daycare, school tuition
- other: anything else

FREQUENCY for recurring bills:
- monthly (default if not specified)
- bimonthly (every 2 months)
- quarterly (every 3 months)  
- semi_annual (every 6 months)
- annual (yearly)
- weekly
- biweekly (every 2 weeks)

INCOME TYPE:
- salary: regular employment income
- freelance: contract/freelance work
- investment: dividends, interest, capital gains
- rental: rental income
- refund: refund or reimbursement
- other: anything else

Respond ONLY with a valid JSON object. No markdown, no explanation.

{
  "type": "expense" | "recurring_bill" | "income",
  "confidence": "high" | "medium" | "low",
  "data": {
    // For ALL types:
    "amount": number,
    "date": "YYYY-MM-DD",
    "description": "brief description",
    "currency": "CAD" (default),
    
    // For "expense":
    "vendor": "store/company name",
    "category": "expense category",
    "cra_deductible": boolean,
    "typically_reimbursable": boolean,
    
    // For "recurring_bill":
    "name": "bill name (e.g., 'Arriendo', 'Netflix')",
    "category": "bill category",
    "frequency": "monthly|bimonthly|quarterly|etc",
    "auto_pay": boolean (true if user mentions auto-pay),
    
    // For "income":
    "source": "who paid (employer, client, etc.)",
    "income_type": "salary|freelance|investment|rental|refund|other",
    "is_taxable": boolean
  },
  "suggestion": "A short friendly message in ${lang} confirming what was understood and asking if it's correct"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    console.log("AI Response:", aiResponse);

    let parsed;
    try {
      let jsonStr = aiResponse;
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsed result:", parsed);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing smart input:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
