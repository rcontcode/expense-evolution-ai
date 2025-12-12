import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  date: string;
  amount: number;
  description: string;
  category?: string;
  isRecurring?: boolean;
  recurringType?: string;
  bank?: string;
  type?: 'debit' | 'credit';
}

interface AnalysisResult {
  transactions: Transaction[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    netChange: number;
    transactionCount: number;
  };
  recurringPayments: {
    description: string;
    amount: number;
    frequency: string;
    category: string;
    bank?: string;
  }[];
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  alerts: {
    type: 'unusual_charge' | 'duplicate' | 'high_amount' | 'new_recurring';
    message: string;
    transaction?: Transaction;
    severity: 'info' | 'warning' | 'critical';
  }[];
  insights: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType, bankName, existingTransactions } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing bank statement...', { contentType, bankName });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context about existing transactions for comparison
    const existingContext = existingTransactions?.length > 0 
      ? `\n\nExisting transactions for comparison (to detect anomalies):
${JSON.stringify(existingTransactions.slice(0, 50), null, 2)}`
      : '';

    const systemPrompt = `You are an expert financial analyst specializing in personal and business banking. 
Analyze bank statements to extract transactions, categorize them, detect recurring payments, and identify anomalies.

Categories to use:
- utilities (electricity, gas, water)
- telecommunications (phone, internet, cable)
- subscriptions (streaming, software, memberships)
- insurance (car, home, life, health)
- banking_fees (service charges, overdraft, ATM fees)
- transfers (between accounts, to other people)
- shopping (retail, online purchases)
- groceries (supermarkets, food stores)
- restaurants (dining, food delivery)
- transportation (gas, parking, transit, rideshare)
- entertainment (movies, events, games)
- healthcare (pharmacy, doctor, dental)
- education (tuition, courses, books)
- housing (rent, mortgage, maintenance)
- salary (income deposits)
- refunds (returns, reimbursements)
- other (anything that doesn't fit above)

For recurring payments, identify:
- Monthly bills (utilities, phone, internet)
- Subscriptions (Netflix, Spotify, etc.)
- Loan payments
- Insurance premiums
- Automatic transfers

Flag anomalies:
- Amounts significantly higher than usual for same vendor
- New recurring charges
- Duplicate transactions
- Unusually high single transactions`;

    const userPrompt = `Analyze this bank statement and extract all information.
Bank: ${bankName || 'Unknown'}
Content type: ${contentType}

${contentType === 'image' 
  ? 'The image shows a bank statement. Extract all visible transactions.' 
  : `Statement content:\n${content}`}
${existingContext}

Return a comprehensive JSON analysis with this exact structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": 123.45,
      "description": "Vendor or description",
      "category": "category_name",
      "isRecurring": true/false,
      "recurringType": "monthly/weekly/yearly/null",
      "type": "debit/credit"
    }
  ],
  "summary": {
    "totalDebits": 0,
    "totalCredits": 0,
    "netChange": 0,
    "transactionCount": 0
  },
  "recurringPayments": [
    {
      "description": "Electric Company",
      "amount": 150.00,
      "frequency": "monthly",
      "category": "utilities"
    }
  ],
  "categoryBreakdown": [
    {
      "category": "utilities",
      "total": 250.00,
      "count": 2,
      "percentage": 15.5
    }
  ],
  "alerts": [
    {
      "type": "unusual_charge",
      "message": "Electricity bill is 40% higher than usual",
      "severity": "warning"
    }
  ],
  "insights": [
    "Your utilities spending increased 15% compared to last month",
    "You have 5 active subscriptions totaling $75/month"
  ]
}

Return ONLY valid JSON, no explanations.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (contentType === 'image') {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: content } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: userPrompt
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const responseContent = aiResponse.choices?.[0]?.message?.content || '{}';
    
    console.log('AI response received, parsing...');

    // Parse the JSON from the response
    let analysis: AnalysisResult;
    try {
      let jsonStr = responseContent;
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      analysis = JSON.parse(jsonStr);
      
      // Validate and clean the data
      analysis.transactions = (analysis.transactions || []).map((t: any) => ({
        date: t.date || new Date().toISOString().split('T')[0],
        amount: Math.abs(Number(t.amount) || 0),
        description: String(t.description || 'Unknown'),
        category: t.category || 'other',
        isRecurring: Boolean(t.isRecurring),
        recurringType: t.recurringType || null,
        type: t.type || 'debit',
        bank: bankName || undefined,
      }));

      // Ensure all required fields exist
      analysis.summary = analysis.summary || {
        totalDebits: 0,
        totalCredits: 0,
        netChange: 0,
        transactionCount: analysis.transactions.length,
      };
      analysis.recurringPayments = analysis.recurringPayments || [];
      analysis.categoryBreakdown = analysis.categoryBreakdown || [];
      analysis.alerts = analysis.alerts || [];
      analysis.insights = analysis.insights || [];
      
      console.log(`Analyzed ${analysis.transactions.length} transactions, ${analysis.recurringPayments.length} recurring payments, ${analysis.alerts.length} alerts`);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content was:', responseContent);
      
      // Return minimal structure on parse error
      analysis = {
        transactions: [],
        summary: { totalDebits: 0, totalCredits: 0, netChange: 0, transactionCount: 0 },
        recurringPayments: [],
        categoryBreakdown: [],
        alerts: [{
          type: 'unusual_charge',
          message: 'Could not fully analyze the statement. Please try with a clearer image or different format.',
          severity: 'warning'
        }],
        insights: [],
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing bank statement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        transactions: [],
        summary: { totalDebits: 0, totalCredits: 0, netChange: 0, transactionCount: 0 },
        recurringPayments: [],
        categoryBreakdown: [],
        alerts: [],
        insights: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
