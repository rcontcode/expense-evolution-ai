import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type DocumentClassification = 
  | 'receipt'
  | 'utility_bill'
  | 'bank_statement'
  | 'income_proof'
  | 'contract'
  | 'tax_document'
  | 'invoice'
  | 'tax_slip'
  | 'medical_receipt'
  | 'donation_receipt'
  | 'insurance_policy'
  | 'rental_receipt'
  | 'investment_statement'
  | 'government_form'
  | 'unknown';

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
    invoice_direction?: 'income' | 'expense' | 'unknown';
    invoice_direction_confidence?: number;
    from_entity?: string;
    to_entity?: string;
    bill_to?: string;
    remit_to?: { name?: string; address?: string };
    invoice_number?: string;
    line_items?: Array<{
      description?: string;
      name?: string;
      quantity?: string;
      unit_price?: string;
      total?: string;
      amount?: string;
    }>;
    subtotal?: number;
    tax?: number;
    total?: number;
    // Tax slip fields
    slip_type?: string;
    tax_year?: number;
    issuer?: string;
    // Medical fields
    provider?: string;
    patient?: string;
    // Donation fields
    charity_name?: string;
    registration_number?: string;
    // Insurance fields
    policy_number?: string;
    coverage_type?: string;
    premium?: number;
    // Investment fields
    institution?: string;
    account_type?: string;
    contributions?: number;
    market_value?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName, fileType, country } = await req.json();
    const userCountry = country || 'CA';
    const defaultCurrency = userCountry === 'CL' ? 'CLP' : 'CAD';
    const taxAuthority = userCountry === 'CL' ? 'SII (Servicio de Impuestos Internos)' : 'CRA (Canada Revenue Agency)';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!imageBase64) {
      throw new Error('No image/document provided');
    }

    console.log('Classifying document:', fileName, fileType, 'country:', userCountry);

    const countryContext = userCountry === 'CL' 
      ? `USER COUNTRY: Chile. Tax authority: SII. Default currency: CLP. Prioritize Chilean document types: boletas, facturas electrónicas, certificados AFP/APV/Isapre/Fonasa, formularios F22/F29, liquidaciones de sueldo. Common Chilean vendors: Falabella, Ripley, Líder, Jumbo, Copec, ENAP, Sodimac, Easy, Homecenter.`
      : `USER COUNTRY: Canada. Tax authority: CRA. Default currency: CAD. Prioritize Canadian document types: T4, T4A, T5, T2202, T3, T5007, RRSP receipts. Common Canadian vendors: Costco, Walmart, Canadian Tire, Home Depot, Loblaws, Sobeys.`;

    const prompt = `You are an intelligent document classifier for a personal finance app. ${countryContext}

DOCUMENT TYPES:
1. "receipt" - Store purchase receipt, pharmacy, fuel, restaurant, grocery, materials, clothing, etc.
2. "utility_bill" - Utility bill: electricity, water, phone, internet, gas, cable.
3. "bank_statement" - Bank statement or screenshot showing multiple transactions, balances.
4. "income_proof" - Screenshot of received transfer, deposit confirmation, salary deposit.
5. "contract" - Employment contract, service agreement, rental/lease agreement.
6. "tax_document" - General tax declaration, tax assessment, F22/F29 forms.
7. "invoice" - Invoice (emitted or received) for services or products.
8. "tax_slip" - Official tax slips/certificates: T4, T4A, T5, T2202, T3, T5007, RRSP receipts (Canada); Certificados AFP, APV, Isapre, Fonasa, intereses hipotecarios (Chile).
9. "medical_receipt" - Medical expense receipts: doctor visits, prescriptions, dental, vision, physiotherapy, hospital bills.
10. "donation_receipt" - Charitable donation receipts with tax receipt number, from registered charities or foundations.
11. "insurance_policy" - Insurance documents: policy declarations, premium statements, coverage summaries (business or personal).
12. "rental_receipt" - Rent payment receipts, lease payment confirmations, landlord statements.
13. "investment_statement" - Investment account statements: RRSP, TFSA, mutual funds, brokerage, APV, fondos mutuos.
14. "government_form" - Government forms: business licenses, permits, official certificates, social benefit statements.
15. "unknown" - Cannot determine the type.

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
    "parties": ["Party 1", "Party 2"],
    "invoice_direction": "income or expense or unknown",
    "invoice_direction_confidence": 0.8,
    "from_entity": "Who issued/sent this document",
    "to_entity": "Who receives/pays this document",
    "bill_to": "Name of the entity being billed",
    "remit_to": {"name": "Who to pay to", "address": "optional"},
    "invoice_number": "INV-001 if visible",
    "line_items": [{"description": "item name", "quantity": "1", "unit_price": "100", "total": "100"}],
    "subtotal": 100,
    "tax": 15,
    "total": 115,
    "slip_type": "T4 or T5 or AFP or APV etc if tax_slip",
    "tax_year": 2024,
    "issuer": "Issuing institution",
    "provider": "Medical provider name if medical_receipt",
    "patient": "Patient name if visible",
    "charity_name": "Charity name if donation_receipt",
    "registration_number": "Charity registration or tax receipt number",
    "policy_number": "Insurance policy number if visible",
    "coverage_type": "Type of insurance coverage",
    "premium": 0,
    "institution": "Financial institution if investment_statement",
    "account_type": "RRSP, TFSA, APV, Fondo Mutuo etc",
    "contributions": 0,
    "market_value": 0
  }
}

IMPORTANT RULES:
- For suggested_actions, use practical actions like: "Crear gasto", "Crear pago recurrente", "Importar transacciones", "Registrar ingreso", "Analizar contrato", "Vincular a cliente", "Agregar a deducciones médicas", "Registrar donación", "Vincular a declaración fiscal"
- For receipts: extract vendor, amount, date
- For utility bills: mark is_recurring=true
- For bank statements: suggest importing transactions
- For income proofs: extract amount and source
- For contracts: extract parties involved
- For tax_slip: extract slip_type, tax_year, issuer, amounts. These are OFFICIAL government/employer tax forms.
- For medical_receipt: extract provider, patient, amount. These are for medical expense tax credits.
- For donation_receipt: extract charity_name, registration_number, amount. Must be from registered charity.
- For insurance_policy: extract policy_number, coverage_type, premium.
- For rental_receipt: extract landlord (vendor), amount, date, mark is_recurring=true.
- For investment_statement: extract institution, account_type, contributions, market_value.
- For government_form: extract issuing body, form type, date.
- For INVOICES: determine invoice_direction (income/expense), extract entities, line_items
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
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: prompt },
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
      'contract', 'tax_document', 'invoice',
      'tax_slip', 'medical_receipt', 'donation_receipt', 'insurance_policy',
      'rental_receipt', 'investment_statement', 'government_form',
      'unknown'
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
