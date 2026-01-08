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
  country?: string;
  taxRegime?: string;
  rut?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expenses, workTypes, province, gstHstRegistered, totalIncome, businessName, country = 'CA', taxRegime, rut } = await req.json() as TaxOptimizationRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const isChile = country === 'CL';

    // Work type descriptions per country
    const workTypeDescriptions: Record<string, Record<string, string>> = {
      CA: {
        employee: 'Empleado con T4',
        contractor: 'Contratista independiente / Sole Proprietor',
        corporation: 'Corporación incorporada'
      },
      CL: {
        employee: 'Trabajador dependiente (Segunda Categoría)',
        contractor: 'Contribuyente Primera Categoría / Honorarios',
        corporation: 'Sociedad / SpA / Ltda'
      }
    };

    const countryWorkTypes = workTypeDescriptions[country] || workTypeDescriptions.CA;
    const workTypeList = workTypes.map(wt => countryWorkTypes[wt] || wt).join(', ');

    const expenseSummary = expenses.map(e => 
      `- ${e.category}: $${e.total.toFixed(2)} (${e.count} transacciones, tasa deducción: ${(e.deductionRate * 100).toFixed(0)}%)`
    ).join('\n');

    const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
    const totalDeductible = expenses.reduce((sum, e) => sum + (e.total * e.deductionRate), 0);

    // Country-specific prompts
    const systemPrompt = isChile 
      ? `Eres un experto en impuestos chilenos especializado en el SII (Servicio de Impuestos Internos). 
Tu objetivo es analizar los gastos del usuario y proporcionar sugerencias específicas para maximizar sus deducciones según las reglas del SII.

IMPORTANTE:
- Todas las respuestas deben ser en ESPAÑOL
- Proporciona sugerencias específicas basadas en la normativa SII
- Menciona el Formulario 29 (IVA mensual) y Formulario 22 (Renta Anual)
- Considera el régimen tributario del usuario (General, Pro PyME, 14 ter)
- Incluye referencias a circulares SII cuando sea relevante
- IVA en Chile es 19% uniforme
- Gastos rechazados tienen tratamiento especial (Art. 21 LIR)`
      : `Eres un experto en impuestos canadienses especializado en el formulario T2125 y deducciones para trabajadores independientes y corporaciones. 
Tu objetivo es analizar los gastos del usuario y proporcionar sugerencias específicas y accionables para maximizar sus deducciones fiscales según las reglas de CRA.

IMPORTANTE:
- Todas las respuestas deben ser en ESPAÑOL
- Proporciona sugerencias específicas y prácticas
- Incluye porcentajes de deducción exactos según CRA
- Menciona categorías de gastos que podrían estar faltando
- Considera el tipo de trabajo del usuario para personalizar consejos
- Si hay gastos que no están siendo aprovechados al máximo, indica cómo optimizarlos`;

    const userPrompt = isChile
      ? `Analiza mi situación fiscal y proporciona recomendaciones para maximizar mis deducciones SII:

**Mi Perfil:**
- Tipo de contribuyente: ${workTypeList}
- Región: ${province || 'No especificada'}
- RUT: ${rut || 'No especificado'}
- Régimen tributario: ${taxRegime || 'General'}
${businessName ? `- Nombre del negocio: ${businessName}` : ''}
${totalIncome ? `- Ingresos totales: $${totalIncome.toFixed(0)} CLP` : ''}

**Resumen de Gastos Actuales:**
${expenseSummary || 'No hay gastos registrados aún'}

**Totales:**
- Total gastos: $${totalExpenses.toFixed(0)} CLP
- Total deducible estimado: $${totalDeductible.toFixed(0)} CLP
- IVA crédito fiscal potencial: $${(totalExpenses * 0.19 / 1.19).toFixed(0)} CLP

Por favor proporciona:
1. **Análisis de Optimización**: Evalúa si estoy aprovechando todas las deducciones según normativa SII
2. **Crédito Fiscal IVA**: Cómo maximizar la recuperación de IVA en mis compras
3. **Gastos Rechazados**: Qué gastos debo evitar incluir según Art. 21 LIR
4. **Régimen Tributario**: Si mi régimen actual (${taxRegime || 'General'}) es el óptimo para mi situación
5. **Calendario Tributario**: Recordatorios de F29 mensual y F22 anual

Formatea la respuesta de forma clara con secciones y bullets.`
      : `Analiza mi situación fiscal y proporciona recomendaciones para maximizar mis deducciones CRA:

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

    console.log(`Calling Lovable AI for ${isChile ? 'SII' : 'CRA'} tax optimization...`);

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

    // Generate quick insights based on expense data and country
    const quickInsights = generateQuickInsights(expenses, workTypes, gstHstRegistered, totalExpenses, totalDeductible, isChile, taxRegime);

    // Different marginal rates for savings estimate
    const marginalRate = isChile ? 0.27 : 0.30;

    return new Response(JSON.stringify({ 
      suggestions,
      quickInsights,
      summary: {
        totalExpenses,
        totalDeductible,
        potentialSavings: totalDeductible * marginalRate,
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
  totalDeductible: number,
  isChile: boolean,
  taxRegime?: string
): { type: 'success' | 'warning' | 'info'; message: string }[] {
  const insights: { type: 'success' | 'warning' | 'info'; message: string }[] = [];
  const existingCategories = expenses.map(e => e.category);

  if (isChile) {
    // Chile-specific insights
    const commonCategories = ['software', 'professional_services', 'equipment', 'travel'];
    const missingCategories = commonCategories.filter(c => !existingCategories.includes(c));
    
    if (missingCategories.length > 0) {
      insights.push({
        type: 'warning',
        message: `No tienes gastos en: ${missingCategories.join(', ')}. Estos gastos son deducibles según SII.`
      });
    }

    // Meal warning for Chile
    if (existingCategories.includes('meals')) {
      insights.push({
        type: 'warning',
        message: 'Los gastos de alimentación personal son gastos rechazados según Art. 21 LIR. Solo colaciones para empleados son deducibles.'
      });
    }

    // Tax regime suggestion
    if (taxRegime === 'general' && totalExpenses < 5000000) { // 5M CLP
      insights.push({
        type: 'info',
        message: 'Con gastos menores a 5M CLP, podrías beneficiarte del régimen Pro PyME (Art. 14 D).'
      });
    }

    // IVA reminder
    insights.push({
      type: 'info',
      message: `Recuerda declarar el F29 antes del día 12 de cada mes. IVA crédito fiscal estimado: $${(totalExpenses * 0.19 / 1.19).toFixed(0)} CLP`
    });

  } else {
    // Canada-specific insights
    const commonCategories = ['home_office', 'software', 'professional_services', 'equipment', 'travel'];
    const missingCategories = commonCategories.filter(c => !existingCategories.includes(c));
    
    if (missingCategories.length > 0) {
      insights.push({
        type: 'warning',
        message: `No tienes gastos en: ${missingCategories.join(', ')}. Estas categorías suelen ser 100% deducibles.`
      });
    }

    if ((workTypes.includes('contractor') || workTypes.includes('corporation')) && !existingCategories.includes('home_office')) {
      insights.push({
        type: 'info',
        message: 'Como trabajador independiente, podrías deducir gastos de oficina en casa (renta, servicios, internet).'
      });
    }

    if (!gstHstRegistered && totalExpenses > 30000) {
      insights.push({
        type: 'warning',
        message: 'Con más de $30,000 en gastos, considera registrarte para GST/HST para reclamar ITCs.'
      });
    }

    const mealExpenses = expenses.find(e => e.category === 'meals');
    if (mealExpenses && mealExpenses.deductionRate < 0.5) {
      insights.push({
        type: 'info',
        message: 'Las comidas de negocio son 50% deducibles. Asegúrate de documentar el propósito comercial.'
      });
    }
  }

  // Common deduction rate insight
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
