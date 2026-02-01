import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2024 APV limits and tax benefits (Chile SII)
const APV_ANNUAL_LIMIT_UF = 600; // 600 UF annual limit
const UF_VALUE_CLP = 37000; // Approximate UF value in CLP (updates monthly)
const CUENTA_2_NO_LIMIT = true; // Cuenta 2 has no contribution limit

// Chilean tax brackets 2024 (monthly income in UTA)
const CHILE_TAX_BRACKETS = {
  brackets: [13.5, 30, 50, 70, 90, 120], // In UTA (Unidad Tributaria Anual)
  rates: [0, 0.04, 0.08, 0.135, 0.23, 0.304, 0.35, 0.40]
};

// UTA value (approximate)
const UTA_VALUE_CLP = 780000; // Monthly tributary unit

interface ApvRecommendation {
  recommended: number;
  taxBenefit: number;
  reasoning: string;
}

interface OptimizationResult {
  recommendations: {
    apvRegimenA: ApvRecommendation;
    apvRegimenB: ApvRecommendation;
    cuenta2: ApvRecommendation;
    priority: 'regimen_a' | 'regimen_b' | 'cuenta2' | 'mixed';
    strategy: string;
    projections: {
      year1: number;
      year5: number;
      year10: number;
    };
  };
  taxInfo: {
    marginalRate: number;
    annualTaxableIncome: number;
    apvLimitUF: number;
    apvLimitCLP: number;
  };
}

function calculateMarginalRate(annualIncome: number): number {
  const incomeInUTA = annualIncome / (UTA_VALUE_CLP * 12);
  
  for (let i = CHILE_TAX_BRACKETS.brackets.length - 1; i >= 0; i--) {
    if (incomeInUTA > CHILE_TAX_BRACKETS.brackets[i]) {
      return CHILE_TAX_BRACKETS.rates[i + 1];
    }
  }
  return CHILE_TAX_BRACKETS.rates[0];
}

function generateRecommendations(
  annualIncome: number,
  taxRegime: string | null,
  currentSavings: number,
  monthlyCapacity: number
): OptimizationResult['recommendations'] {
  const marginalRate = calculateMarginalRate(annualIncome);
  const annualCapacity = monthlyCapacity * 12;
  const apvMaxCLP = APV_ANNUAL_LIMIT_UF * UF_VALUE_CLP;
  
  let apvRegimenARecommended = 0;
  let apvRegimenBRecommended = 0;
  let cuenta2Recommended = 0;
  let priority: 'regimen_a' | 'regimen_b' | 'cuenta2' | 'mixed' = 'mixed';
  let strategy = '';

  // High income (>$50M CLP) - prioritize Régimen A for tax deduction
  if (annualIncome > 50000000) {
    priority = 'regimen_a';
    apvRegimenARecommended = Math.min(apvMaxCLP, annualCapacity * 0.6);
    cuenta2Recommended = Math.max(0, annualCapacity - apvRegimenARecommended) * 0.3;
    apvRegimenBRecommended = 0;
    
    strategy = `Con un ingreso anual de $${(annualIncome / 1000000).toFixed(1)}M, tu tasa marginal es ${(marginalRate * 100).toFixed(1)}%. ` +
      `El APV Régimen A te permite deducir hasta 600 UF (~$${(apvMaxCLP / 1000000).toFixed(1)}M) de tu base imponible, ` +
      `generando un ahorro fiscal inmediato de ~$${((apvRegimenARecommended * marginalRate) / 1000000).toFixed(1)}M.`;
  }
  // Medium income ($20M-$50M) - balance A and B
  else if (annualIncome > 20000000) {
    priority = 'mixed';
    apvRegimenARecommended = Math.min(apvMaxCLP * 0.5, annualCapacity * 0.4);
    apvRegimenBRecommended = Math.min(apvMaxCLP * 0.5, annualCapacity * 0.3);
    cuenta2Recommended = Math.max(0, annualCapacity - apvRegimenARecommended - apvRegimenBRecommended);
    
    strategy = `Con ingreso medio de $${(annualIncome / 1000000).toFixed(1)}M, una estrategia mixta es óptima. ` +
      `Régimen A reduce impuestos ahora (${(marginalRate * 100).toFixed(1)}% de ahorro), ` +
      `mientras Régimen B ofrece bonificación estatal del 15% al retirar (máx 6 UTM/año).`;
  }
  // Lower income (<$20M) - prioritize Régimen B for state bonus
  else {
    priority = 'regimen_b';
    apvRegimenBRecommended = Math.min(apvMaxCLP, annualCapacity * 0.7);
    cuenta2Recommended = Math.max(0, annualCapacity - apvRegimenBRecommended);
    apvRegimenARecommended = 0;
    
    strategy = `Con ingreso de $${(annualIncome / 1000000).toFixed(1)}M, tu tasa marginal es baja (${(marginalRate * 100).toFixed(1)}%). ` +
      `El APV Régimen B es más conveniente: el Estado aporta 15% de bonificación sobre tus aportes ` +
      `(hasta 6 UTM/año ≈ $340.000). Además, retiras sin pagar impuestos adicionales.`;
  }

  // Calculate tax benefits
  const regimenATaxBenefit = apvRegimenARecommended * marginalRate;
  const regimenBBonus = Math.min(apvRegimenBRecommended * 0.15, 6 * 57000); // 6 UTM max bonus
  
  // Cuenta 2 doesn't have direct tax benefits but offers liquidity
  const cuenta2Benefit = cuenta2Recommended * 0.05; // Estimated return benefit

  // Project growth (assuming 5% real annual return)
  const totalAnnual = apvRegimenARecommended + apvRegimenBRecommended + cuenta2Recommended;
  const projections = {
    year1: totalAnnual * 1.05,
    year5: totalAnnual * Math.pow(1.05, 5) * 5 * 0.6,
    year10: totalAnnual * Math.pow(1.05, 10) * 10 * 0.5
  };

  return {
    apvRegimenA: {
      recommended: Math.round(apvRegimenARecommended),
      taxBenefit: Math.round(regimenATaxBenefit),
      reasoning: apvRegimenARecommended > 0
        ? `Aportar $${(apvRegimenARecommended / 1000000).toFixed(2)}M al APV Régimen A. ` +
          `Reduces tu base imponible y ahorras $${(regimenATaxBenefit / 1000).toFixed(0)}K en impuestos este año. ` +
          `Límite anual: 600 UF (~$${(apvMaxCLP / 1000000).toFixed(1)}M).`
        : 'Con tu nivel de ingreso, el Régimen B ofrece mejores beneficios.'
    },
    apvRegimenB: {
      recommended: Math.round(apvRegimenBRecommended),
      taxBenefit: Math.round(regimenBBonus),
      reasoning: apvRegimenBRecommended > 0
        ? `Aportar $${(apvRegimenBRecommended / 1000000).toFixed(2)}M al APV Régimen B. ` +
          `El Estado bonifica 15% = $${(regimenBBonus / 1000).toFixed(0)}K adicionales. ` +
          `Al jubilar, retiras sin impuesto adicional.`
        : 'Prioriza Régimen A dado tu tramo impositivo alto.'
    },
    cuenta2: {
      recommended: Math.round(cuenta2Recommended),
      taxBenefit: Math.round(cuenta2Benefit),
      reasoning: cuenta2Recommended > 0
        ? `Destinar $${(cuenta2Recommended / 1000000).toFixed(2)}M a Cuenta 2 de la AFP. ` +
          `Ofrece liquidez (retiro en 4 días hábiles) con rentabilidad de mercado. Sin límite de aportes.`
        : 'Enfócate primero en maximizar APV por sus beneficios tributarios.'
    },
    priority,
    strategy,
    projections
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      annualIncome, 
      taxRegime,
      currentSavings = 0,
      monthlyInvestmentCapacity = 0
    } = await req.json();

    if (!annualIncome) {
      return new Response(
        JSON.stringify({ error: 'Se requiere ingreso anual para el análisis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recommendations = generateRecommendations(
      annualIncome,
      taxRegime,
      currentSavings,
      monthlyInvestmentCapacity
    );

    const marginalRate = calculateMarginalRate(annualIncome);
    const apvMaxCLP = APV_ANNUAL_LIMIT_UF * UF_VALUE_CLP;

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        taxInfo: {
          marginalRate,
          annualTaxableIncome: annualIncome,
          apvLimitUF: APV_ANNUAL_LIMIT_UF,
          apvLimitCLP: apvMaxCLP
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in optimize-apv-chile:', error);
    const message = error instanceof Error ? error.message : 'Error al analizar opciones APV/Cuenta 2';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
