import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonthlyData {
  month: string;
  total: number;
  categories: Record<string, number>;
}

interface PredictionRequest {
  historicalData: MonthlyData[];
  language: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historicalData, language } = await req.json() as PredictionRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const isSpanish = language === 'es';

    // Build historical summary for AI
    const historySummary = historicalData.map(m => {
      const categoryList = Object.entries(m.categories)
        .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
        .join(', ');
      return `${m.month}: $${m.total.toFixed(2)} (${categoryList})`;
    }).join('\n');

    // Calculate basic statistics for context
    const totals = historicalData.map(m => m.total);
    const avgMonthly = totals.reduce((a, b) => a + b, 0) / totals.length;
    const maxMonth = Math.max(...totals);
    const minMonth = Math.min(...totals);
    
    // Get all unique categories
    const allCategories = new Set<string>();
    historicalData.forEach(m => {
      Object.keys(m.categories).forEach(cat => allCategories.add(cat));
    });

    const systemPrompt = isSpanish 
      ? `Eres un analista financiero experto en predicción de gastos personales y empresariales.
Tu tarea es analizar patrones históricos de gastos y generar predicciones para los próximos 3 meses.

IMPORTANTE:
- Responde SIEMPRE en formato JSON válido
- Identifica tendencias estacionales y patrones recurrentes
- Considera categorías que podrían tener gastos excepcionales
- Proporciona rangos de confianza para las predicciones`
      : `You are a financial analyst expert in personal and business expense prediction.
Your task is to analyze historical expense patterns and generate predictions for the next 3 months.

IMPORTANT:
- ALWAYS respond in valid JSON format
- Identify seasonal trends and recurring patterns
- Consider categories that might have exceptional expenses
- Provide confidence ranges for predictions`;

    const userPrompt = isSpanish
      ? `Analiza estos datos históricos de gastos y genera predicciones para los próximos 3 meses:

**Datos Históricos (últimos ${historicalData.length} meses):**
${historySummary}

**Estadísticas:**
- Promedio mensual: $${avgMonthly.toFixed(2)}
- Mes más alto: $${maxMonth.toFixed(2)}
- Mes más bajo: $${minMonth.toFixed(2)}
- Categorías activas: ${Array.from(allCategories).join(', ')}

Responde con este JSON exacto:
{
  "predictions": [
    {
      "month": "nombre del mes",
      "predictedTotal": número,
      "confidence": número entre 0.5 y 0.95,
      "range": { "min": número, "max": número },
      "categoryBreakdown": { "categoria": número }
    }
  ],
  "insights": [
    {
      "type": "trend|seasonal|anomaly|recommendation",
      "title": "título corto",
      "description": "descripción detallada",
      "impact": "high|medium|low"
    }
  ],
  "summary": {
    "trend": "increasing|decreasing|stable",
    "trendPercentage": número,
    "riskLevel": "low|medium|high",
    "expectedSavings": número o null
  }
}`
      : `Analyze this historical expense data and generate predictions for the next 3 months:

**Historical Data (last ${historicalData.length} months):**
${historySummary}

**Statistics:**
- Monthly average: $${avgMonthly.toFixed(2)}
- Highest month: $${maxMonth.toFixed(2)}
- Lowest month: $${minMonth.toFixed(2)}
- Active categories: ${Array.from(allCategories).join(', ')}

Respond with this exact JSON:
{
  "predictions": [
    {
      "month": "month name",
      "predictedTotal": number,
      "confidence": number between 0.5 and 0.95,
      "range": { "min": number, "max": number },
      "categoryBreakdown": { "category": number }
    }
  ],
  "insights": [
    {
      "type": "trend|seasonal|anomaly|recommendation",
      "title": "short title",
      "description": "detailed description",
      "impact": "high|medium|low"
    }
  ],
  "summary": {
    "trend": "increasing|decreasing|stable",
    "trendPercentage": number,
    "riskLevel": "low|medium|high",
    "expectedSavings": number or null
  }
}`;

    console.log('Calling Lovable AI for expense predictions...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: isSpanish 
            ? 'Límite de solicitudes excedido. Por favor intenta de nuevo más tarde.'
            : 'Rate limit exceeded. Please try again later.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: isSpanish
            ? 'Se requiere pago. Por favor añade créditos a tu cuenta.'
            : 'Payment required. Please add credits to your account.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let parsedPredictions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedPredictions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, content);
      // Generate fallback predictions based on historical averages
      parsedPredictions = generateFallbackPredictions(historicalData, allCategories, isSpanish);
    }

    return new Response(JSON.stringify(parsedPredictions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-expenses function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackPredictions(
  historicalData: MonthlyData[], 
  categories: Set<string>,
  isSpanish: boolean
) {
  const totals = historicalData.map(m => m.total);
  const avgMonthly = totals.reduce((a, b) => a + b, 0) / totals.length;
  
  // Calculate category averages
  const categoryTotals: Record<string, number[]> = {};
  historicalData.forEach(m => {
    Object.entries(m.categories).forEach(([cat, amount]) => {
      if (!categoryTotals[cat]) categoryTotals[cat] = [];
      categoryTotals[cat].push(amount);
    });
  });
  
  const categoryAvgs: Record<string, number> = {};
  Object.entries(categoryTotals).forEach(([cat, amounts]) => {
    categoryAvgs[cat] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  });

  const months = isSpanish 
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const now = new Date();
  const predictions = [];
  
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = months[futureDate.getMonth()];
    
    predictions.push({
      month: monthName,
      predictedTotal: Math.round(avgMonthly * 100) / 100,
      confidence: 0.7,
      range: {
        min: Math.round(avgMonthly * 0.8 * 100) / 100,
        max: Math.round(avgMonthly * 1.2 * 100) / 100
      },
      categoryBreakdown: categoryAvgs
    });
  }

  return {
    predictions,
    insights: [
      {
        type: 'trend',
        title: isSpanish ? 'Predicción basada en promedios' : 'Average-based prediction',
        description: isSpanish 
          ? 'Las predicciones se basan en promedios históricos debido a datos limitados.'
          : 'Predictions are based on historical averages due to limited data.',
        impact: 'medium'
      }
    ],
    summary: {
      trend: 'stable',
      trendPercentage: 0,
      riskLevel: 'medium',
      expectedSavings: null
    }
  };
}
