import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpenseSummary {
  category: string;
  total: number;
  count: number;
  deductionRate: number;
}

interface TaxOptimizationRequest {
  expenses: ExpenseSummary[];
  workTypes: string[];
  province: string;
  gstHstRegistered: boolean;
  totalIncome?: number;
  businessName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expenses, workTypes, province, gstHstRegistered, totalIncome, businessName } = await req.json() as TaxOptimizationRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const workTypeDescriptions: Record<string, string> = {
      employee: 'Empleado con T4',
      contractor: 'Contratista independiente / Sole Proprietor',
      corporation: 'Corporación incorporada'
    };

    const workTypeList = workTypes.map(wt => workTypeDescriptions[wt] || wt).join(', ');

    const expenseSummary = expenses.map(e => 
      `- ${e.category}: $${e.total.toFixed(2)} (${e.count} transacciones, tasa deducción: ${(e.deductionRate * 100).toFixed(0)}%)`
    ).join('\n');

    const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
    const totalDeductible = expenses.reduce((sum, e) => sum + (e.total * e.deductionRate), 0);

    const systemPrompt = `Eres un experto en impuestos canadienses especializado en el formulario T2125 y deducciones para trabajadores independientes y corporaciones. 
Tu objetivo es analizar los gastos del usuario y proporcionar sugerencias específicas y accionables para maximizar sus deducciones fiscales según las reglas de CRA.

IMPORTANTE:
- Todas las respuestas deben ser en ESPAÑOL
- Proporciona sugerencias específicas y prácticas
- Incluye porcentajes de deducción exactos según CRA
- Menciona categorías de gastos que podrían estar faltando
- Considera el tipo de trabajo del usuario para personalizar consejos
- Si hay gastos que no están siendo aprovechados al máximo, indica cómo optimizarlos`;

    const userPrompt = `Analiza mi situación fiscal y proporciona recomendaciones para maximizar mis deducciones CRA:

**Mi Perfil:**
- Tipo de trabajo: ${workTypeList}
- Provincia: ${province || 'No especificada'}
- Registrado GST/HST: ${gstHstRegistered ? 'Sí' : 'No'}
${businessName ? `- Nombre del negocio: ${businessName}` : ''}
${totalIncome ? `- Ingresos totales: $${totalIncome.toFixed(2)}` : ''}

**Resumen de Gastos Actuales:**
${expenseSummary || 'No hay gastos registrados aún'}

**Totales:**
- Total gastos: $${totalExpenses.toFixed(2)}
- Total deducible estimado: $${totalDeductible.toFixed(2)}

Por favor proporciona:
1. **Análisis de Optimización**: Evalúa si estoy aprovechando todas las deducciones posibles según mi tipo de trabajo
2. **Deducciones Faltantes**: Identifica categorías de gastos que probablemente tengo pero no estoy registrando
3. **Consejos Específicos**: Según mi tipo de trabajo (${workTypeList}), qué gastos adicionales podría deducir
4. **Estrategias de Maximización**: Cómo puedo estructurar mejor mis gastos para maximizar deducciones
5. **Alertas Importantes**: Cualquier error común o cosa que debo evitar

Formatea la respuesta de forma clara con secciones y bullets.`;

    console.log('Calling Lovable AI for tax optimization...');

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
          error: 'Límite de solicitudes excedido. Por favor intenta de nuevo más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const suggestions = data.choices?.[0]?.message?.content || 'No se pudieron generar sugerencias.';

    // Generate quick insights based on expense data
    const quickInsights = generateQuickInsights(expenses, workTypes, gstHstRegistered, totalExpenses, totalDeductible);

    return new Response(JSON.stringify({ 
      suggestions,
      quickInsights,
      summary: {
        totalExpenses,
        totalDeductible,
        potentialSavings: totalDeductible * 0.30, // Estimated at 30% marginal rate
        deductionRate: totalExpenses > 0 ? (totalDeductible / totalExpenses) * 100 : 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-taxes function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateQuickInsights(
  expenses: ExpenseSummary[], 
  workTypes: string[], 
  gstHstRegistered: boolean,
  totalExpenses: number,
  totalDeductible: number
): { type: 'success' | 'warning' | 'info'; message: string }[] {
  const insights: { type: 'success' | 'warning' | 'info'; message: string }[] = [];

  // Check for missing common categories
  const commonCategories = ['home_office', 'software', 'professional_services', 'equipment', 'travel'];
  const existingCategories = expenses.map(e => e.category);
  
  const missingCategories = commonCategories.filter(c => !existingCategories.includes(c));
  if (missingCategories.length > 0) {
    insights.push({
      type: 'warning',
      message: `No tienes gastos en: ${missingCategories.join(', ')}. Estas categorías suelen ser 100% deducibles.`
    });
  }

  // Check home office for contractors
  if ((workTypes.includes('contractor') || workTypes.includes('corporation')) && !existingCategories.includes('home_office')) {
    insights.push({
      type: 'info',
      message: 'Como trabajador independiente, podrías deducir gastos de oficina en casa (renta, servicios, internet).'
    });
  }

  // Check GST/HST registration
  if (!gstHstRegistered && totalExpenses > 30000) {
    insights.push({
      type: 'warning',
      message: 'Con más de $30,000 en gastos, considera registrarte para GST/HST para reclamar ITCs.'
    });
  }

  // Check meal deductions
  const mealExpenses = expenses.find(e => e.category === 'meals');
  if (mealExpenses && mealExpenses.deductionRate < 0.5) {
    insights.push({
      type: 'info',
      message: 'Las comidas de negocio son 50% deducibles. Asegúrate de documentar el propósito comercial.'
    });
  }

  // Good deduction rate
  if (totalExpenses > 0) {
    const rate = (totalDeductible / totalExpenses) * 100;
    if (rate > 80) {
      insights.push({
        type: 'success',
        message: `Excelente tasa de deducción del ${rate.toFixed(0)}%. Estás maximizando tus deducciones.`
      });
    } else if (rate < 50) {
      insights.push({
        type: 'warning',
        message: `Tu tasa de deducción es ${rate.toFixed(0)}%. Revisa si hay gastos que podrían reclasificarse.`
      });
    }
  }

  return insights;
}
