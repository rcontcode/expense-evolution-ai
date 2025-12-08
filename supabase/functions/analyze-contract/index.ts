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
    const { documentBase64, documentType, contractTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing contract with Gemini 2.5 Flash...");
    console.log("Document type:", documentType);
    console.log("Contract title:", contractTitle);

    const systemPrompt = `You are an expert contract and agreement analyzer specializing in extracting reimbursement terms, billing policies, and expense guidelines from business documents.

Your task is to analyze the provided contract/agreement document and extract ALL relevant information about:
1. What expenses are reimbursable by the client
2. What expenses are NOT reimbursable
3. Billing rates and fee structures
4. Payment terms
5. Travel and expense policies
6. Any limits or caps on reimbursements
7. Required documentation for reimbursement
8. Any special conditions or exceptions

IMPORTANT: Respond with a valid JSON object with this exact structure:
{
  "contract_summary": "Brief 1-2 sentence summary of the contract/agreement",
  "parties": {
    "client": "Client/company name",
    "contractor": "Contractor/service provider name (if mentioned)"
  },
  "reimbursement_policy": {
    "summary": "Overall summary of what's reimbursable",
    "reimbursable_categories": [
      {
        "category": "travel|meals|equipment|software|office_supplies|professional_services|mileage|fuel|lodging|other",
        "description": "What's specifically covered",
        "rate": "100% or specific percentage",
        "limits": "Any caps or limits (e.g., 'max $50/day for meals')",
        "conditions": "Any special requirements"
      }
    ],
    "non_reimbursable": ["List of expenses explicitly NOT reimbursable"],
    "documentation_required": ["List of required documentation for reimbursement"],
    "submission_deadline": "When expenses must be submitted",
    "approval_process": "How reimbursements are approved"
  },
  "billing_terms": {
    "rate": "Hourly/daily/project rate",
    "payment_terms": "Net 30, etc.",
    "invoicing_frequency": "Monthly, per project, etc.",
    "currency": "CAD, USD, etc."
  },
  "key_clauses": [
    {
      "title": "Clause name/topic",
      "summary": "Brief summary of the clause",
      "importance": "high|medium|low"
    }
  ],
  "confidence": "high|medium|low",
  "notes": "Any additional observations or unclear items"
}

If the document is unclear or doesn't contain certain information, indicate that in the relevant field.
For Canadian contracts, assume CAD unless otherwise specified.
Pay special attention to expense reimbursement policies as this is critical for expense tracking.`;

    const userContent: any[] = [];

    if (documentBase64) {
      const mimeType = documentType === 'application/pdf' 
        ? 'application/pdf' 
        : documentType?.startsWith('image/') 
          ? documentType 
          : 'image/jpeg';
      
      userContent.push({
        type: "image_url",
        image_url: {
          url: documentBase64.startsWith("data:") 
            ? documentBase64 
            : `data:${mimeType};base64,${documentBase64}`,
        },
      });
    }

    userContent.push({
      type: "text",
      text: `Analyze this contract/agreement document${contractTitle ? ` titled "${contractTitle}"` : ''} and extract all relevant terms, especially focusing on expense reimbursement policies and billing terms. Return a detailed JSON object with the extracted information.`,
    });

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
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      extracted = {
        contract_summary: "Could not fully parse contract",
        reimbursement_policy: {
          summary: aiResponse,
          reimbursable_categories: [],
          non_reimbursable: [],
          documentation_required: [],
        },
        confidence: "low",
        notes: "AI response could not be parsed as structured data",
      };
    }

    console.log("Extracted contract terms:", extracted);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing contract:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
