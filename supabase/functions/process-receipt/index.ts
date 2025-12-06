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
    const { imageBase64, voiceText, detectMultipleReceipts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing receipt with Gemini 2.5 Flash...");
    console.log("Has image:", !!imageBase64);
    console.log("Has voice text:", !!voiceText);
    console.log("Detect multiple receipts:", !!detectMultipleReceipts);

const systemPrompt = `You are an expert receipt analyzer for expense tracking. Extract expense information from receipts (images or text descriptions).

${detectMultipleReceipts ? `
MULTI-RECEIPT DETECTION MODE ENABLED:
- This image may contain MULTIPLE separate physical receipts or invoices
- Carefully scan the ENTIRE image for separate receipt documents
- Each physical receipt should become a separate entry with its own vendor, date, and total
- Look for visual separations, different paper edges, different fonts/layouts indicating separate receipts
- Also check for multiple transactions on a single receipt that should be split
` : ''}

CRITICAL: CONTEXTUAL DISAMBIGUATION OF AMBIGUOUS CODES
Receipts often contain cryptic item codes that are hard to interpret. You MUST use the ENTIRE context of the receipt to decode them:

1. **Vendor Context is KEY**: The store/company name tells you what type of products they sell:
   - "Chevron", "Shell", "Petro-Canada", "Esso", "Husky" → Gas station → unclear codes likely mean fuel types (PREM, REG, DISL = Premium, Regular, Diesel)
   - "Costco", "Walmart", "Superstore", "Loblaws", "Metro", "Sobeys" → Supermarket → codes likely mean groceries
   - "Canadian Tire", "Home Depot", "Rona" → Hardware → codes likely mean tools/equipment
   - "Staples", "Bureau en Gros" → Office supplies
   - "Tim Hortons", "Starbucks", "McDonalds" → Restaurant/Coffee
   - "Amazon", "Best Buy" → Electronics/General merchandise

2. **Cross-Reference Strategy**: 
   - If vendor is "Chevron" and you see "CHV-PRE" or "CHVPREM" → This is Premium fuel, NOT meat (carne/beef)
   - If vendor is "Citymarket" and you see "BFCARN" → This is likely Beef/Carne (meat), NOT fuel
   - Look at the TOTAL amount to help: $80-150 at a gas station = likely full tank of fuel
   - Look at quantities: "45.5 L" = liters of fuel, "2.5 kg" = food by weight

3. **Common Cryptic Codes to Decode**:
   Gas Station Codes:
   - PRE, PREM, SPRM, SUP → Premium gasoline
   - REG, UNLEAD, UNL, 87 → Regular unleaded
   - DISL, DSL, DIESEL → Diesel fuel
   - PLT, PLTS → Plutón/Premium Plus
   - CARWSH, WASH, CW → Car wash service
   
   Grocery Store Codes:
   - BF, BEEF, CARN → Beef/Carne
   - PLLO, CHKN → Pollo/Chicken  
   - VEG, VERD, FRSH → Vegetables/Fresh produce
   - LACT, DARY → Dairy products
   - PAN, BRD → Bread/Pan
   - BEB, BVRG → Beverages/Bebidas

4. **When Still Ambiguous**:
   - Set confidence to "low"
   - Use the most likely interpretation based on vendor type
   - Add a note in the description explaining the ambiguity

CRITICAL SPLITTING RULES:
1. If a receipt or note contains MULTIPLE items that belong to DIFFERENT expense categories, you MUST split them into separate expense entries
2. If the image shows MULTIPLE PHYSICAL RECEIPTS, extract each as a separate expense entry
3. Each unique vendor/transaction should be its own expense entry

Examples of when to split:
- Multiple physical receipts in one photo → Each receipt = separate expense entry
- "Beef 200, Gas 80" → Split into: meals (Beef $200) + fuel (Gas $80)
- "Lunch $50, Uber $30" → Split into: meals (Lunch $50) + travel (Uber $30)
- Gas station receipt with fuel + snacks → Split into: fuel (main amount) + meals (snacks/drinks)
- Costco receipt with gas + groceries → Split by category

DO NOT combine items from different categories or different receipts into one expense.

IMPORTANT: Always respond with a valid JSON object with this exact structure:
{
  "receipts_detected": number (how many physical receipts/invoices were found in the image),
  "expenses": [
    {
      "vendor": "store or company name",
      "amount": numeric value (no currency symbols),
      "date": "YYYY-MM-DD format",
      "category": "one of: meals, travel, equipment, software, office_supplies, professional_services, utilities, home_office, mileage, fuel, other",
      "description": "brief description of this specific item - include the original code if you decoded an ambiguous one",
      "confidence": "high, medium, or low",
      "currency": "CAD, USD, etc.",
      "cra_deductible": true or false,
      "cra_deduction_rate": percentage (e.g., 50 for meals, 100 for equipment),
      "typically_reimbursable": true or false (based on common contractor agreements),
      "receipt_index": number (which physical receipt this came from, starting at 1),
      "decoded_from": "original cryptic code if any was decoded, e.g., 'CHVPREM → Premium Fuel'"
    }
  ]
}

Category guidelines for Canadian tax deductions:
- meals: restaurant, food, coffee, catering, groceries for personal consumption (50% CRA deductible, typically NOT reimbursable by clients)
- travel: flights, hotels, taxi, uber, parking, public transit (100% CRA deductible, often reimbursable)
- equipment: computers, phones, tools, furniture, materials (100% CRA deductible, often reimbursable if for project)
- software: subscriptions, licenses, apps (100% CRA deductible, sometimes reimbursable)
- office_supplies: paper, pens, printer ink (100% CRA deductible, rarely reimbursable)
- professional_services: legal, accounting, consulting (100% CRA deductible, rarely reimbursable)
- utilities: phone bill, internet, electricity (prorated for home office, rarely reimbursable)
- home_office: office furniture, supplies for home workspace (100% CRA deductible, NOT reimbursable)
- mileage: vehicle use based on kilometers (use CRA mileage rates, sometimes reimbursable)
- fuel: gas station, diesel, charging, vehicle fuel ONLY (100% CRA deductible if business use, often reimbursable)
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
        text: detectMultipleReceipts 
          ? "IMPORTANT: Scan this image carefully for ALL receipts or invoices visible. There may be multiple physical receipts in this photo. Extract expense information from EACH receipt found. Return a JSON object with receipts_detected count and an expenses array with all items found."
          : "Extract expense information from this receipt image. If there are multiple items of different categories, split them. Return a JSON object with expenses array.",
      });
    }

    if (voiceText) {
      userContent.push({
        type: "text",
        text: `User voice input describing expense: "${voiceText}". Extract expense information and return a JSON object with expenses array. If multiple expenses are mentioned, split them into separate entries.`,
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
        receipts_detected: 1,
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
          receipt_index: 1,
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
        receipt_index: 1,
      }];
    }

    // Validate and normalize each expense
    const result = {
      receipts_detected: extracted.receipts_detected || 1,
      expenses: expenses.map((exp: any, index: number) => ({
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
        receipt_index: exp.receipt_index || index + 1,
      }))
    };

    console.log("Processed result:", result);
    console.log(`Found ${result.receipts_detected} receipts with ${result.expenses.length} expense items`);

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
