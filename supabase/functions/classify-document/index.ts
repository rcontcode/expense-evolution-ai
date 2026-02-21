import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type DocumentClassification = 
  | 'receipt'           // Compra/recibo de tienda, farmacia, combustible, etc.
  | 'utility_bill'      // Boleta de luz, agua, teléfono, internet, gas
  | 'bank_statement'    // Extracto bancario PDF o screenshot
  | 'income_proof'      // Screenshot de transferencia recibida, depósito, pago de cliente
  | 'contract'          // Contrato laboral, de servicios, de arriendo
  | 'tax_document'      // Formulario fiscal, declaración de impuestos
  | 'invoice'           // Factura emitida o recibida
  | 'unknown';          // No se pudo determinar

interface ClassificationResult {
  document_type: DocumentClassification;
  confidence: number;
  summary: string;
  suggested_actions: string[];
  extracted_preview: {
    vendor?: string;
    amount?: number;
    date?: string;
    description?: string;
    currency?: string;
    is_recurring?: boolean;
    recurrence_frequency?: string;
    parties?: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName, fileType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!imageBase64) {
      throw new Error('No image/document provided');
    }

    console.log('Classifying document:', fileName, fileType);

    const prompt = `You are an intelligent document classifier for a personal finance app. Analyze this document and determine its type.

DOCUMENT TYPES:
1. "receipt" - Store purchase receipt, pharmacy, fuel, restaurant, grocery, materials, clothing, etc. Has items, totals, store name.
2. "utility_bill" - Utility bill: electricity, water, phone, internet, gas, cable. Shows account number, billing period, amount due.
3. "bank_statement" - Bank statement or bank screenshot showing multiple transactions, balances, account summary.
4. "income_proof" - Screenshot of received transfer, deposit confirmation, client payment, salary deposit. Shows money RECEIVED.
5. "contract" - Employment contract, service agreement, rental/lease agreement, business contract. Has terms, parties, signatures.
6. "tax_document" - Tax form, tax declaration, T4, T2125, SII form, tax assessment.
7. "invoice" - Invoice (emitted or received) for services or products. Has invoice number, line items, payment terms.
8. "unknown" - Cannot determine the type.

Respond with ONLY a valid JSON object:
{
  "document_type": "one_of_the_types_above",
  "confidence": 0.95,
  "summary": "Brief description of what this document is in Spanish, max 1 sentence",
  "suggested_actions": ["action1_in_spanish", "action2_in_spanish"],
  "extracted_preview": {
    "vendor": "Name of store/company/bank if visible",
    "amount": 123.45,
    "date": "2024-01-15",
    "description": "Brief description in Spanish",
    "currency": "CAD or CLP or USD etc",
    "is_recurring": false,
    "recurrence_frequency": "monthly or null",
    "parties": ["Party 1", "Party 2"]
  }
}

IMPORTANT RULES:
- For suggested_actions, use practical actions like: "Crear gasto", "Crear pago recurrente", "Importar transacciones", "Registrar ingreso", "Analizar contrato", "Vincular a cliente"
- For receipts: extract vendor, amount, date
- For utility bills: mark is_recurring=true, extract provider and amount
- For bank statements: suggest importing transactions
- For income proofs: extract amount and source
- For contracts: extract parties involved
- confidence should be between 0 and 1
- All text in Spanish`;

    const userContent: any[] = [];

    const mimeType = fileType?.startsWith('image/') ? fileType 
      : fileType === 'application/pdf' ? 'application/pdf'
      : 'image/jpeg';

    userContent.push({
      type: 'image_url',
      image_url: {
        url: imageBase64.startsWith('data:') 
          ? imageBase64 
          : `data:${mimeType};base64,${imageBase64}`,
      },
    });

    userContent.push({
      type: 'text',
      text: `Classify this document. File name: "${fileName || 'unknown'}". Respond with only JSON.`,
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: userContent },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '{}';

    console.log('AI classification response:', aiContent);

    let classification: ClassificationResult;
    try {
      let jsonStr = aiContent;
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      classification = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse classification:', aiContent);
      classification = {
        document_type: 'unknown',
        confidence: 0,
        summary: 'No se pudo clasificar el documento',
        suggested_actions: ['Revisar manualmente'],
        extracted_preview: {},
      };
    }

    // Validate document_type
    const validTypes: DocumentClassification[] = [
      'receipt', 'utility_bill', 'bank_statement', 'income_proof',
      'contract', 'tax_document', 'invoice', 'unknown'
    ];
    if (!validTypes.includes(classification.document_type)) {
      classification.document_type = 'unknown';
    }

    console.log('Classification result:', classification.document_type, 'confidence:', classification.confidence);

    return new Response(
      JSON.stringify(classification),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error classifying document:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        document_type: 'unknown',
        confidence: 0,
        summary: 'Error al clasificar',
        suggested_actions: ['Revisar manualmente'],
        extracted_preview: {},
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
