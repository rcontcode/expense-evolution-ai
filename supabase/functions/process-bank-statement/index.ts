import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BANK_FALLBACK_LIMITS: Record<string, number> = {
  free: 0, premium: 0, pro: 999999, bundle: 999999, pro_beta: 999999,
};

async function checkBankQuota(req: Request) {
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

  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (roleData) return { user, supabase, isAdmin: true };

  const { data: sub } = await supabase.from('user_subscriptions').select('plan_type').eq('user_id', user.id).maybeSingle();
  const planType = sub?.plan_type || 'free';

  const { data: planConfig } = await supabase.from('plan_configurations').select('bank_analyses_per_month').eq('plan_type', planType).eq('is_active', true).maybeSingle();
  const limit = (planConfig as any)?.bank_analyses_per_month ?? BANK_FALLBACK_LIMITS[planType] ?? 0;

  const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
  const { data: usage } = await supabase.from('usage_tracking').select('bank_analyses_count').eq('user_id', user.id).eq('period_start', currentPeriod).maybeSingle();
  const currentCount = (usage as any)?.bank_analyses_count ?? 0;

  if (limit < 999999 && currentCount >= limit) {
    return {
      error: new Response(JSON.stringify({
        error: 'quota_exceeded',
        message: `Has alcanzado tu límite mensual de análisis bancarios (${currentCount}/${limit}).`,
        currentUsage: currentCount, limit,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    };
  }

  return { user, supabase, isAdmin: false };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing bank statement image...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Analyze this bank statement image and extract all visible transactions.
For each transaction, extract:
1. date (in YYYY-MM-DD format)
2. amount (as a positive number, remove currency symbols)
3. description (the merchant name or transaction description)

Return ONLY a valid JSON array with this exact format:
[
  {"date": "2024-01-15", "amount": 45.99, "description": "Grocery Store"},
  {"date": "2024-01-14", "amount": 125.00, "description": "Electric Company"}
]

If you cannot find any transactions, return an empty array: []
Do not include any explanation, only the JSON array.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    console.log('AI response:', content);

    // Parse the JSON from the response
    let transactions = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Try to parse the JSON
      transactions = JSON.parse(jsonStr);
      
      // Validate and clean the transactions
      transactions = transactions
        .filter((t: any) => t.date && t.amount && typeof t.amount === 'number')
        .map((t: any) => ({
          date: t.date,
          amount: Math.abs(Number(t.amount)),
          description: String(t.description || 'Unknown'),
        }));
        
      console.log(`Extracted ${transactions.length} transactions`);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content was:', content);
      transactions = [];
    }

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing bank statement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, transactions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
