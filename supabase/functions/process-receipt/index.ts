import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback limits if plan_configurations is unreachable
const OCR_FALLBACK_LIMITS: Record<string, number> = {
  free: 5, premium: 50, pro: 999999, bundle: 999999, pro_beta: 999999,
};

async function checkQuota(req: Request, usageField: string, limitField: string, fallbackLimits: Record<string, number>) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { error: new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }

  // Check if admin (admins bypass limits)
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (roleData) {
    return { user, supabase, isAdmin: true };
  }

  // Get plan
  const { data: sub } = await supabase.from('user_subscriptions').select('plan_type').eq('user_id', user.id).maybeSingle();
  const planType = sub?.plan_type || 'free';

  // Get limit from plan_configurations
  const { data: planConfig } = await supabase.from('plan_configurations').select(limitField).eq('plan_type', planType).eq('is_active', true).maybeSingle();
  const limit = (planConfig as any)?.[limitField] ?? fallbackLimits[planType] ?? fallbackLimits['free'];

  // Get current usage
  const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
  const { data: usage } = await supabase.from('usage_tracking').select(usageField).eq('user_id', user.id).eq('period_start', currentPeriod).maybeSingle();
  const currentCount = (usage as any)?.[usageField] ?? 0;

  if (limit !== null && limit < 999999 && currentCount >= limit) {
    return {
      error: new Response(JSON.stringify({
        error: 'quota_exceeded',
        message: `Has alcanzado tu límite mensual (${currentCount}/${limit}). Actualiza tu plan para continuar.`,
        currentUsage: currentCount,
        limit,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    };
  }

  return { user, supabase, isAdmin: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Server-side quota enforcement
    const quota = await checkQuota(req, 'ocr_scans_count', 'ocr_scans_per_month', OCR_FALLBACK_LIMITS);
    if (quota.error) return quota.error;
    const body = await req.json();
    const { imageBase64, voiceText, detectMultipleReceipts } = body;

    // Input validation: image size limit (~10MB base64)
    if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 10_000_000) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is ~7.5MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation: voice text length limit
    if (voiceText && typeof voiceText === "string" && voiceText.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Voice text too long. Maximum 5000 characters." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation: ensure correct types
    if (imageBase64 && typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid image format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (voiceText && typeof voiceText !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid voice text format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      "amount": numeric value (no currency symbols) - THIS IS THE TOTAL,
      "date": "YYYY-MM-DD format",
      "category": "one of: meals, travel, equipment, software, office_supplies, professional_services, utilities, home_office, mileage, fuel, advertising, materials, hobbies, family_outings, gifts, scheduled_purchases, medical, insurance_business, education_training, donations, rent, bank_fees, maintenance_repairs, moving, interest_loans, vehicle_maintenance, parking_tolls, telephone, other",
      "description": "brief summary of all items purchased",
      "confidence": "high, medium, or low",
      "currency": "CAD, USD, etc.",
      "cra_deductible": true or false,
      "cra_deduction_rate": percentage (e.g., 50 for meals, 100 for equipment),
      "typically_reimbursable": true or false (based on common contractor agreements),
      "receipt_index": number (which physical receipt this came from, starting at 1),
      "decoded_from": "original cryptic code if any was decoded, e.g., 'CHVPREM → Premium Fuel'",
      "line_items": [
        {
          "name": "item name or description (decode cryptic codes)",
          "quantity": number (default 1 if not specified),
          "unit_price": number (price per unit),
          "total": number (quantity * unit_price),
          "original_code": "the original code from receipt if it was decoded, null otherwise",
          "sku": "product SKU/UPC/barcode if visible on receipt",
          "product_search_url": "generate a search URL for this product at the vendor's website"
        }
      ],
      "subtotal": number (sum before taxes),
      "taxes": [
        { "name": "GST", "rate": 5, "amount": number },
        { "name": "PST", "rate": 7, "amount": number }
      ],
      "payment_method": "VISA, Mastercard, Debit, Cash, etc. if visible",
      "is_recurring_candidate": true/false,
      "recurring_bill_data": {
        "name": "Bill name (e.g., 'Electricity - Hydro One', 'Water Bill', 'Internet - Bell')",
        "frequency": "monthly|bimonthly|quarterly|annual",
        "category": "utilities|insurance|subscriptions|housing|transportation|debt|childcare|other",
        "auto_pay": false,
        "next_due_date": "YYYY-MM-DD (estimated next due date based on billing period)"
      }
    }
  ]
}

RECURRING BILL DETECTION - VERY IMPORTANT:
Set "is_recurring_candidate" to TRUE if the receipt/bill is from any of these:
- Utility companies: electricity, water, gas (natural gas), sewer, garbage collection, internet, phone, cable TV
- Insurance: health, car, home, life, dental
- Subscriptions: gym, streaming services, software subscriptions
- Housing: rent receipts, condo fees, HOA
- Loan/debt payments: mortgage, car payment, credit card statement
- Recurring services: cleaning, lawn care, security monitoring

When is_recurring_candidate is true, fill in "recurring_bill_data" with:
- name: A clean descriptive name like "Electricity - [Company]" or "Internet - [Provider]"
- frequency: Usually "monthly" for utilities, check the billing period on the receipt
- category: Map to the appropriate category
- next_due_date: Calculate from the due date shown on the bill (add one billing cycle)

CRITICAL FOR LINE ITEMS:
- Extract EVERY visible line item from the receipt, not just the total
- Decode cryptic item codes using vendor context (e.g., at Shell, "PREM" = Premium Fuel)
- Include quantity and unit price when visible
- If only total per item is visible, use quantity=1 and unit_price=total
- Identify and separate taxes (GST, PST, HST, IVA, etc.)

PRODUCT SEARCH URLS - VERY IMPORTANT:
Generate a product_search_url for each line item so reviewers can verify the purchase. Use these patterns:
- Home Depot: https://www.homedepot.ca/search?q={product_name_encoded}
- Home Depot (if SKU visible): https://www.homedepot.ca/product/{sku}
- Costco: https://www.costco.ca/CatalogSearch?keyword={product_name_encoded}
- Walmart: https://www.walmart.ca/search?q={product_name_encoded}
- Canadian Tire: https://www.canadiantire.ca/en/search.html?q={product_name_encoded}
- Staples: https://www.staples.ca/search?query={product_name_encoded}
- Best Buy: https://www.bestbuy.ca/en-ca/search?search={product_name_encoded}
- Amazon: https://www.amazon.ca/s?k={product_name_encoded}
- London Drugs: https://www.londondrugs.com/search/?q={product_name_encoded}
- Rona: https://www.rona.ca/en/search?term={product_name_encoded}
- IKEA: https://www.ikea.com/ca/en/search/?q={product_name_encoded}
- Shell/Chevron/Petro-Canada/Esso (fuel): null (no product link for fuel)
- Restaurants/Cafes: null (no product link for food)
- For unknown vendors: try https://www.google.com/search?q={vendor}+{product_name_encoded}

Replace {product_name_encoded} with URL-encoded product name. Include SKU in search if available.

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
      const todayDate = new Date().toISOString().split("T")[0];
      userContent.push({
        type: "text",
        text: `User voice input describing expense: "${voiceText}". 

IMPORTANT DATE RULE: Today's date is ${todayDate}. 
- If the user mentions a specific date (e.g., "yesterday", "last Monday", "on January 5th", "el 15 de diciembre"), calculate and use that date.
- If NO date is mentioned at all, ASSUME the expense happened TODAY (${todayDate}).
- Do NOT use placeholder dates like "YYYY-MM-DD" - always use a real date.

Extract expense information and return a JSON object with expenses array. If multiple expenses are mentioned, split them into separate entries.`,
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
        line_items: exp.line_items || [],
        subtotal: exp.subtotal || null,
        taxes: exp.taxes || [],
        payment_method: exp.payment_method || null,
        decoded_from: exp.decoded_from || null,
        is_recurring_candidate: exp.is_recurring_candidate || false,
        recurring_bill_data: exp.is_recurring_candidate ? {
          name: exp.recurring_bill_data?.name || exp.vendor || "Unknown Bill",
          frequency: exp.recurring_bill_data?.frequency || "monthly",
          category: exp.recurring_bill_data?.category || "utilities",
          auto_pay: exp.recurring_bill_data?.auto_pay || false,
          next_due_date: exp.recurring_bill_data?.next_due_date || null,
        } : null,
      }))
    };

    console.log("Processed result:", result);
    console.log(`Found ${result.receipts_detected} receipts with ${result.expenses.length} expense items`);

    // Increment usage after successful processing
    if (quota.user && quota.supabase) {
      try {
        await quota.supabase.rpc('increment_usage', { p_user_id: quota.user.id, p_usage_type: 'ocr' });
      } catch (e) {
        console.error('Failed to increment usage:', e);
      }
    }

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
