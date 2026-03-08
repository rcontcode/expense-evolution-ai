import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { transactions, expenses } = await req.json();

    if (!transactions?.length || !expenses?.length) {
      return new Response(JSON.stringify({ matches: [], summary: 'No data to reconcile' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Prepare concise data for AI
    const txSummary = transactions.slice(0, 50).map((t: any) => ({
      id: t.id,
      date: t.transaction_date,
      amount: t.amount,
      desc: t.description?.substring(0, 80) || '',
    }));

    const expSummary = expenses.slice(0, 100).map((e: any) => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      vendor: e.vendor?.substring(0, 50) || '',
      desc: e.description?.substring(0, 50) || '',
      category: e.category || '',
    }));

    const systemPrompt = `You are a financial reconciliation AI. Match bank transactions to expenses.

Rules:
- Match by amount (exact or within 2%), date proximity (within 5 days), and description/vendor similarity
- Each transaction can match AT MOST one expense, and each expense AT MOST one transaction
- Return confidence 0-100 for each match
- For unmatched transactions, suggest if they should be created as new expenses
- Be conservative: only match with confidence >= 60

You MUST use the reconcile_transactions tool to return results.`;

    const userPrompt = `Reconcile these bank transactions with recorded expenses:

TRANSACTIONS:
${JSON.stringify(txSummary)}

EXPENSES:
${JSON.stringify(expSummary)}

Match each transaction to the best expense. For unmatched ones, suggest creating a new expense with category.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'reconcile_transactions',
            description: 'Return reconciliation results',
            parameters: {
              type: 'object',
              properties: {
                matches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      transaction_id: { type: 'string' },
                      expense_id: { type: 'string' },
                      confidence: { type: 'number', minimum: 0, maximum: 100 },
                      reason: { type: 'string' },
                    },
                    required: ['transaction_id', 'expense_id', 'confidence', 'reason'],
                    additionalProperties: false,
                  },
                },
                unmatched_suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      transaction_id: { type: 'string' },
                      suggested_category: { type: 'string' },
                      suggested_vendor: { type: 'string' },
                      reason: { type: 'string' },
                    },
                    required: ['transaction_id', 'suggested_category', 'reason'],
                    additionalProperties: false,
                  },
                },
                summary: { type: 'string' },
              },
              required: ['matches', 'unmatched_suggestions', 'summary'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'reconcile_transactions' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let result = { matches: [], unmatched_suggestions: [], summary: 'AI analysis completed' };
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error('Failed to parse AI tool call result');
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('AI reconciliation error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
