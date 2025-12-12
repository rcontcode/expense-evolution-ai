import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 2024 TFSA/RRSP limits and tax brackets by province
const TFSA_ANNUAL_LIMIT_2024 = 7000;
const RRSP_CONTRIBUTION_RATE = 0.18; // 18% of earned income
const RRSP_MAX_2024 = 31560;

const PROVINCIAL_TAX_BRACKETS: Record<string, { brackets: number[]; rates: number[] }> = {
  'ON': { brackets: [51446, 102894, 150000, 220000], rates: [0.0505, 0.0915, 0.1116, 0.1216, 0.1316] },
  'BC': { brackets: [45654, 91310, 104835, 127299, 172602, 240716], rates: [0.0506, 0.077, 0.105, 0.1229, 0.147, 0.168, 0.205] },
  'AB': { brackets: [142292, 170751, 227668, 341502], rates: [0.10, 0.12, 0.13, 0.14, 0.15] },
  'QC': { brackets: [49275, 98540, 119910], rates: [0.14, 0.19, 0.24, 0.2575] },
  'MB': { brackets: [36842, 79625], rates: [0.108, 0.1275, 0.174] },
  'SK': { brackets: [49720, 142058], rates: [0.105, 0.125, 0.145] },
  'NS': { brackets: [29590, 59180, 93000, 150000], rates: [0.0879, 0.1495, 0.1667, 0.175, 0.21] },
  'NB': { brackets: [47715, 95431, 176756], rates: [0.094, 0.14, 0.16, 0.195] },
  'NL': { brackets: [41457, 82913, 148027, 207239, 264750, 529500, 1059000], rates: [0.087, 0.145, 0.158, 0.178, 0.198, 0.208, 0.213, 0.218] },
  'PE': { brackets: [31984, 63969], rates: [0.098, 0.138, 0.167] },
  'YT': { brackets: [53359, 106717, 165430, 500000], rates: [0.064, 0.09, 0.109, 0.128, 0.15] },
  'NT': { brackets: [48326, 96655, 157139], rates: [0.059, 0.086, 0.122, 0.1405] },
  'NU': { brackets: [50877, 101754, 165429], rates: [0.04, 0.07, 0.09, 0.115] },
};

const FEDERAL_TAX_BRACKETS = {
  brackets: [55867, 111733, 173205, 246752],
  rates: [0.15, 0.205, 0.26, 0.29, 0.33]
};

function calculateMarginalRate(income: number, province: string): { federal: number; provincial: number; combined: number } {
  // Federal marginal rate
  let federalRate = FEDERAL_TAX_BRACKETS.rates[0];
  for (let i = 0; i < FEDERAL_TAX_BRACKETS.brackets.length; i++) {
    if (income > FEDERAL_TAX_BRACKETS.brackets[i]) {
      federalRate = FEDERAL_TAX_BRACKETS.rates[i + 1];
    }
  }

  // Provincial marginal rate
  const provincialData = PROVINCIAL_TAX_BRACKETS[province] || PROVINCIAL_TAX_BRACKETS['ON'];
  let provincialRate = provincialData.rates[0];
  for (let i = 0; i < provincialData.brackets.length; i++) {
    if (income > provincialData.brackets[i]) {
      provincialRate = provincialData.rates[i + 1];
    }
  }

  return {
    federal: federalRate,
    provincial: provincialRate,
    combined: federalRate + provincialRate
  };
}

function calculateRRSPRoom(income: number, previousContributions: number = 0): number {
  const newRoom = Math.min(income * RRSP_CONTRIBUTION_RATE, RRSP_MAX_2024);
  return Math.max(0, newRoom - previousContributions);
}

function generateRecommendations(
  income: number,
  province: string,
  workType: string[],
  currentSavings: number,
  monthlyCapacity: number
): {
  tfsa: { recommended: number; taxSavings: number; reasoning: string };
  rrsp: { recommended: number; taxSavings: number; reasoning: string };
  priority: 'tfsa' | 'rrsp' | 'both';
  strategy: string;
  projections: { year1: number; year5: number; year10: number };
} {
  const marginalRates = calculateMarginalRate(income, province);
  const rrspRoom = calculateRRSPRoom(income);
  const annualCapacity = monthlyCapacity * 12;
  
  // Determine optimal split based on income and marginal rate
  let tfsaRecommended = 0;
  let rrspRecommended = 0;
  let priority: 'tfsa' | 'rrsp' | 'both' = 'both';
  let strategy = '';

  // High income (>$100k) - prioritize RRSP for tax deferral
  if (income > 100000) {
    priority = 'rrsp';
    rrspRecommended = Math.min(rrspRoom, annualCapacity * 0.7);
    tfsaRecommended = Math.min(TFSA_ANNUAL_LIMIT_2024, annualCapacity - rrspRecommended);
    strategy = `Con un ingreso de $${income.toLocaleString()}, tu tasa marginal combinada es ${(marginalRates.combined * 100).toFixed(1)}%. Priorizar RRSP te da un beneficio fiscal inmediato significativo. Cada $1,000 en RRSP te ahorra $${(marginalRates.combined * 1000).toFixed(0)} en impuestos este año.`;
  }
  // Medium income ($50k-$100k) - balance both
  else if (income > 50000) {
    priority = 'both';
    tfsaRecommended = Math.min(TFSA_ANNUAL_LIMIT_2024, annualCapacity * 0.5);
    rrspRecommended = Math.min(rrspRoom, annualCapacity * 0.5);
    strategy = `Con un ingreso medio de $${income.toLocaleString()}, una estrategia balanceada es óptima. El TFSA ofrece flexibilidad de retiro, mientras que el RRSP reduce tu carga fiscal actual en ${(marginalRates.combined * 100).toFixed(1)}%.`;
  }
  // Lower income (<$50k) - prioritize TFSA
  else {
    priority = 'tfsa';
    tfsaRecommended = Math.min(TFSA_ANNUAL_LIMIT_2024, annualCapacity);
    rrspRecommended = Math.max(0, annualCapacity - tfsaRecommended);
    strategy = `Con un ingreso de $${income.toLocaleString()}, prioriza el TFSA. Tu tasa marginal actual es baja (${(marginalRates.combined * 100).toFixed(1)}%), así que el beneficio de diferir impuestos con RRSP es menor. El TFSA te da crecimiento libre de impuestos sin restricciones de retiro.`;
  }

  // Adjust for work type
  if (workType.includes('contractor') || workType.includes('corporation')) {
    strategy += ` Como ${workType.includes('corporation') ? 'corporación' : 'contratista independiente'}, considera también estrategias de dividendos y retención corporativa para optimización fiscal adicional.`;
  }

  // Calculate tax savings
  const rrspTaxSavings = rrspRecommended * marginalRates.combined;
  
  // TFSA doesn't give immediate tax savings but provides tax-free growth
  // We estimate future tax savings based on expected growth
  const estimatedGrowthRate = 0.07; // 7% annual return
  const tfsaTaxSavings = tfsaRecommended * estimatedGrowthRate * marginalRates.combined;

  // Project growth over time (assuming 7% annual return)
  const totalAnnual = tfsaRecommended + rrspRecommended;
  const projections = {
    year1: totalAnnual * 1.07,
    year5: totalAnnual * Math.pow(1.07, 5) * 5 * 0.6, // Simplified 5-year accumulation
    year10: totalAnnual * Math.pow(1.07, 10) * 10 * 0.5 // Simplified 10-year accumulation
  };

  return {
    tfsa: {
      recommended: Math.round(tfsaRecommended),
      taxSavings: Math.round(tfsaTaxSavings),
      reasoning: tfsaRecommended > 0 
        ? `Contribuir $${tfsaRecommended.toLocaleString()} al TFSA. El crecimiento y retiros son 100% libres de impuestos. Límite 2024: $${TFSA_ANNUAL_LIMIT_2024.toLocaleString()}.`
        : 'Considera contribuir al TFSA cuando tengas capacidad adicional.'
    },
    rrsp: {
      recommended: Math.round(rrspRecommended),
      taxSavings: Math.round(rrspTaxSavings),
      reasoning: rrspRecommended > 0
        ? `Contribuir $${rrspRecommended.toLocaleString()} al RRSP te genera un reembolso de ~$${rrspTaxSavings.toLocaleString()} en tu declaración de impuestos. Espacio disponible: $${rrspRoom.toLocaleString()}.`
        : 'Enfócate primero en el TFSA dado tu nivel de ingresos actual.'
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
      province, 
      workTypes, 
      currentSavings = 0,
      monthlyInvestmentCapacity = 0
    } = await req.json();

    if (!annualIncome || !province) {
      return new Response(
        JSON.stringify({ error: 'Se requiere ingreso anual y provincia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recommendations = generateRecommendations(
      annualIncome,
      province,
      workTypes || [],
      currentSavings,
      monthlyInvestmentCapacity
    );

    const marginalRates = calculateMarginalRate(annualIncome, province);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        taxInfo: {
          marginalRates,
          rrspRoom: calculateRRSPRoom(annualIncome),
          tfsaLimit: TFSA_ANNUAL_LIMIT_2024
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in optimize-rrsp-tfsa:', error);
    const message = error instanceof Error ? error.message : 'Error al analizar opciones RRSP/TFSA';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
