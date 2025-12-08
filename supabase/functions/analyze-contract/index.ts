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
    const { documentBase64, documentType, contractTitle, targetLanguage = 'es' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageNames: Record<string, string> = {
      es: 'Spanish',
      en: 'English',
      fr: 'French',
      pt: 'Portuguese',
    };
    const outputLanguage = languageNames[targetLanguage] || 'Spanish';

    console.log("Analyzing contract with Gemini 2.5 Flash...");
    console.log("Document type:", documentType);
    console.log("Contract title:", contractTitle);
    console.log("Target language:", outputLanguage);

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

CRITICAL INSTRUCTIONS:
1. ALL text output (summaries, descriptions, titles) MUST be in ${outputLanguage}
2. Extract and include EXACT quotes from the original document in "original_quotes" arrays
3. Identify if this is a multi-party agreement and clearly describe each party's role

IMPORTANT: Respond with a valid JSON object with this exact structure:
{
  "contract_summary": "Brief 1-2 sentence summary in ${outputLanguage}",
  "contract_summary_detailed": "Detailed 3-5 sentence explanation of what this contract establishes, the relationship between parties, and main obligations - in ${outputLanguage}",
  "original_language": "The detected language of the original document (e.g., 'English', 'Spanish')",
  "parties": {
    "party_count": 2,
    "client": "Client/company name",
    "client_role": "Description of client's role and responsibilities in ${outputLanguage}",
    "contractor": "Contractor/service provider name",
    "contractor_role": "Description of contractor's role and responsibilities in ${outputLanguage}",
    "relationship_summary": "Brief description of how the parties relate to each other in ${outputLanguage}"
  },
  "reimbursement_policy": {
    "summary": "Overall summary of what's reimbursable in ${outputLanguage}",
    "original_quotes": ["Exact quote from document about reimbursement in original language", "Another relevant quote"],
    "reimbursable_categories": [
      {
        "category": "travel|meals|equipment|software|office_supplies|professional_services|mileage|fuel|lodging|other",
        "description": "What's specifically covered in ${outputLanguage}",
        "rate": "100% or specific percentage",
        "limits": "Any caps or limits in ${outputLanguage}",
        "conditions": "Any special requirements in ${outputLanguage}",
        "original_quote": "Exact text from document that mentions this"
      }
    ],
    "non_reimbursable": ["List of expenses explicitly NOT reimbursable in ${outputLanguage}"],
    "documentation_required": ["List of required documentation in ${outputLanguage}"],
    "submission_deadline": "When expenses must be submitted in ${outputLanguage}",
    "approval_process": "How reimbursements are approved in ${outputLanguage}"
  },
  "billing_terms": {
    "rate": "Hourly/daily/project rate",
    "payment_terms": "Net 30, etc. in ${outputLanguage}",
    "invoicing_frequency": "Monthly, per project, etc. in ${outputLanguage}",
    "currency": "CAD, USD, etc.",
    "original_quotes": ["Exact quote about billing/payment from document"]
  },
  "key_clauses": [
    {
      "title": "Clause name/topic in ${outputLanguage}",
      "summary": "Brief summary in ${outputLanguage}",
      "importance": "high|medium|low",
      "original_quote": "Exact text from document for this clause"
    }
  ],
  "important_agreements": [
    {
      "topic": "Topic of the agreement in ${outputLanguage}",
      "summary": "What was agreed in ${outputLanguage}",
      "who_benefits": "client|contractor|both",
      "original_quote": "Exact text from document"
    }
  ],
  "confidence": "high|medium|low",
  "notes": "Any additional observations in ${outputLanguage}"
}

If the document is unclear or doesn't contain certain information, indicate that in the relevant field.
For Canadian contracts, assume CAD unless otherwise specified.
Pay special attention to expense reimbursement policies as this is critical for expense tracking.
Remember: ALL descriptions and summaries must be in ${outputLanguage}, but original_quotes must preserve the original document language.`;

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
      text: `Analyze this contract/agreement document${contractTitle ? ` titled "${contractTitle}"` : ''} and extract all relevant terms, especially focusing on expense reimbursement policies and billing terms. Return a detailed JSON object with the extracted information. Remember to output all summaries and descriptions in ${outputLanguage}, but keep original quotes in their original language.`,
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
