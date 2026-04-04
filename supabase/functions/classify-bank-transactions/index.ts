import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 50;

interface ClassifiedTransaction {
  id: string;
  transaction_type: 'income' | 'expense';
  category: string;
  is_recurring: boolean;
  recurring_type: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { transactionIds, batchIndex, totalBatches } = await req.json();

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No transaction IDs provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch transactions from DB
    const { data: transactions, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('id, transaction_date, amount, description, original_amount')
      .eq('user_id', user.id)
      .in('id', transactionIds.slice(0, BATCH_SIZE));

    if (fetchError) throw fetchError;
    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ classified: [], batchIndex }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = `Classify these bank transactions. For each, determine:
1. transaction_type: "income" (deposits, salary, transfers IN, refunds, payments received) or "expense" (purchases, bills, withdrawals, transfers OUT, fees)
2. category: one of: salary, client_payment, transfer_in, refund, investment_return, other_income, utilities, telecommunications, subscriptions, insurance, banking_fees, transfer_out, shopping, groceries, restaurants, transportation, entertainment, healthcare, education, housing, taxes, savings, other
3. is_recurring: true if this looks like a recurring payment (subscription, monthly bill, salary)
4. recurring_type: "monthly", "weekly", "yearly", or null

Use the original_amount sign as a hint: negative = expense, positive = income. But also use description context.

Transactions:
${JSON.stringify(transactions.map(t => ({
  id: t.id,
  date: t.transaction_date,
  amount: t.amount,
  original_amount: t.original_amount,
  description: t.description,
})), null, 2)}

Return ONLY a valid JSON array:
[{"id": "uuid", "transaction_type": "expense", "category": "groceries", "is_recurring": false, "recurring_type": null}]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
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

    let classified: ClassifiedTransaction[] = [];
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      classified = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Parse error:', e);
      classified = [];
    }

    // Update each transaction in DB
    let updated = 0;
    for (const item of classified) {
      if (!item.id) continue;
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          transaction_type: item.transaction_type || 'expense',
          category: item.category || 'other',
          is_recurring: item.is_recurring || false,
          recurring_type: item.recurring_type || null,
          auto_categorized: true,
        })
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (!updateError) updated++;
    }

    console.log(`Batch ${batchIndex}/${totalBatches}: classified ${updated}/${transactions.length} transactions`);

    return new Response(
      JSON.stringify({ 
        classified, 
        batchIndex, 
        totalBatches,
        updated,
        total: transactions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error classifying transactions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
