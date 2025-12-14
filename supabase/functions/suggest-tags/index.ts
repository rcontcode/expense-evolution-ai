import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TagSuggestionRequest {
  vendor?: string;
  category?: string;
  description?: string;
  existingTags: { id: string; name: string; color: string }[];
  userTagHistory?: { tagId: string; tagName: string; vendor?: string; category?: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor, category, description, existingTags, userTagHistory } = await req.json() as TagSuggestionRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Suggesting tags for:', { vendor, category, description });
    console.log('Available tags:', existingTags.map(t => t.name));
    console.log('User history patterns:', userTagHistory?.length || 0);

    const systemPrompt = `You are a financial expense tagging assistant. Your job is to suggest the most relevant tags for an expense based on the vendor name, category, and description.

Available tags: ${existingTags.map(t => t.name).join(', ')}

User's tagging patterns from history:
${userTagHistory?.slice(0, 20).map(h => 
  `- "${h.vendor || 'unknown vendor'}" (${h.category || 'no category'}) → tag: "${h.tagName}"`
).join('\n') || 'No history available'}

Rules:
1. ONLY suggest tags from the available tags list
2. Suggest 1-3 most relevant tags
3. Consider the user's historical tagging patterns
4. If no tags seem relevant, return empty array
5. Prioritize tags that match the expense context (urgent, personal, reimbursed, recurring, etc.)`;

    const userPrompt = `Suggest tags for this expense:
- Vendor: ${vendor || 'Not specified'}
- Category: ${category || 'Not specified'}  
- Description: ${description || 'Not specified'}

Return only the tag names from the available list that are most relevant.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tags",
              description: "Return suggested tag names for the expense",
              parameters: {
                type: "object",
                properties: {
                  suggestedTags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tagName: { type: "string", description: "Name of the suggested tag" },
                        confidence: { type: "number", description: "Confidence score 0-1" },
                        reason: { type: "string", description: "Brief reason for suggestion" }
                      },
                      required: ["tagName", "confidence", "reason"]
                    },
                    maxItems: 3
                  }
                },
                required: ["suggestedTags"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_tags" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    console.log('AI response:', JSON.stringify(result));

    let suggestions: { tagName: string; confidence: number; reason: string }[] = [];
    
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestedTags || [];
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }

    // Map tag names back to tag objects with IDs
    const mappedSuggestions = suggestions
      .map(s => {
        const tag = existingTags.find(t => 
          t.name.toLowerCase() === s.tagName.toLowerCase()
        );
        if (tag) {
          return {
            tagId: tag.id,
            tagName: tag.name,
            tagColor: tag.color,
            confidence: s.confidence,
            reason: s.reason
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log('Mapped suggestions:', mappedSuggestions);

    return new Response(JSON.stringify({ suggestions: mappedSuggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in suggest-tags:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
