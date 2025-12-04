import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, voiceText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing receipt with Gemini 2.5 Flash...");
    console.log("Has image:", !!imageBase64);
    console.log("Has voice text:", !!voiceText);

const systemPrompt = `You are an expert receipt analyzer for expense tracking. Extract expense information from receipts (images or text descriptions).

CRITICAL: If a receipt or note contains MULTIPLE items that belong to DIFFERENT expense categories, you MUST split them into separate expense entries. 

Examples of when to split:
- "Beef 200, Gas 80" → Split into: meals (Beef $200) + mileage (Gas $80)
- "Lunch $50, Uber $30" → Split into: meals (Lunch $50) + travel (Uber $30)
- "Office supplies $100, Coffee $15" → Split into: office_supplies ($100) + meals (Coffee $15)

DO NOT combine items from different categories into one expense.

IMPORTANT: Always respond with a valid JSON object with this exact structure:
{
  "expenses": [
    {
      "vendor": "store or company name",
      "amount": numeric value (no currency symbols),
      "date": "YYYY-MM-DD format",
      "category": "one of: meals, travel, equipment, software, office_supplies, professional_services, utilities, home_office, mileage, other",
      "description": "brief description of this specific item",
      "confidence": "high, medium, or low",
      "currency": "CAD, USD, etc.",
      "cra_deductible": true or false,
      "cra_deduction_rate": percentage (e.g., 50 for meals, 100 for equipment),
      "typically_reimbursable": true or false (based on common contractor agreements)
    }
  ]
}

Category guidelines for Canadian tax deductions:
- meals: restaurant, food, coffee, catering (50% CRA deductible, typically NOT reimbursable by clients)
- travel: flights, hotels, taxi, uber, parking, public transit (100% CRA deductible, often reimbursable)
- equipment: computers, phones, tools, furniture, materials (100% CRA deductible, often reimbursable if for project)
- software: subscriptions, licenses, apps (100% CRA deductible, sometimes reimbursable)
- office_supplies: paper, pens, printer ink (100% CRA deductible, rarely reimbursable)
- professional_services: legal, accounting, consulting (100% CRA deductible, rarely reimbursable)
- utilities: phone bill, internet, electricity (prorated for home office, rarely reimbursable)
- home_office: office furniture, supplies for home workspace (100% CRA deductible, NOT reimbursable)
- mileage: gas, vehicle maintenance, fuel (use CRA mileage rates, sometimes reimbursable)
- other: anything that doesn't fit above

For each expense, assess:
1. Is it CRA deductible? (most business expenses are)
2. What's the CRA deduction rate? (50% for meals, 100% for most others)
3. Is it typically reimbursable by clients? (project materials yes, personal meals no)

If information is unclear or missing, make your best estimate and set confidence to "low" or "medium".
For Canadian receipts, assume CAD unless otherwise specified.`;

    const userContent: any[] = [];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
        },
      });
      userContent.push({
        type: "text",
        text: "Extract expense information from this receipt image. Return a JSON object with vendor, amount, date, category, description, confidence, and currency.",
      });
    }

    if (voiceText) {
      userContent.push({
        type: "text",
        text: `User voice input describing expense: "${voiceText}". Extract expense information and return a JSON object with vendor, amount, date, category, description, confidence, and currency.`,
      });
    }

    if (userContent.length === 0) {
      throw new Error("No image or voice text provided");
    }

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
          { role: "user", content: userContent },
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
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log("AI Response:", aiResponse);

    // Parse JSON from response (handle markdown code blocks)
    let extracted;
    try {
      let jsonStr = aiResponse;
      // Remove markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a default structure with the raw response
      extracted = {
        expenses: [{
          vendor: "Unknown",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          category: "other",
          description: aiResponse,
          confidence: "low",
          currency: "CAD",
          cra_deductible: true,
          cra_deduction_rate: 100,
          typically_reimbursable: false,
        }]
      };
    }

    // Handle both old single-expense format and new multi-expense format
    let expenses = extracted.expenses;
    if (!expenses && extracted.vendor) {
      // Legacy single expense format - convert to array
      expenses = [extracted];
    }
    if (!expenses || !Array.isArray(expenses)) {
      expenses = [{
        vendor: "Unknown",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "other",
        description: "",
        confidence: "low",
        currency: "CAD",
        cra_deductible: true,
        cra_deduction_rate: 100,
        typically_reimbursable: false,
      }];
    }

    // Validate and normalize each expense
    const result = {
      expenses: expenses.map((exp: any) => ({
        vendor: exp.vendor || "Unknown",
        amount: typeof exp.amount === "number" ? exp.amount : parseFloat(exp.amount) || 0,
        date: exp.date || new Date().toISOString().split("T")[0],
        category: exp.category || "other",
        description: exp.description || "",
        confidence: exp.confidence || "medium",
        currency: exp.currency || "CAD",
        cra_deductible: exp.cra_deductible !== false,
        cra_deduction_rate: exp.cra_deduction_rate || 100,
        typically_reimbursable: exp.typically_reimbursable || false,
      }))
    };

    console.log("Processed result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
