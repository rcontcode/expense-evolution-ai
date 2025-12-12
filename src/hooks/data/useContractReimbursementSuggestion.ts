import { useMemo } from 'react';
import { useContracts } from './useContracts';

interface ReimbursementSuggestion {
  isReimbursable: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  reasonEn: string;
  matchedCategory?: string;
  contractTitle?: string;
  suggestionType: 'contract' | 'cra' | 'general';
  craDeductionPercent?: number;
}

interface ExtractedTerms {
  reimbursement_policy?: {
    reimbursable_categories?: string[];
    non_reimbursable?: string[];
    documentation_required?: string[];
    deadline?: string;
  };
  contract_summary?: string;
}

// CRA deduction rules by category
const CRA_DEDUCTION_RULES: Record<string, { percent: number; descEs: string; descEn: string }> = {
  meals: { percent: 50, descEs: 'Comidas de negocios: 50% deducible según CRA', descEn: 'Business meals: 50% deductible per CRA' },
  travel: { percent: 100, descEs: 'Viajes de negocios: 100% deducible si es exclusivo para trabajo', descEn: 'Business travel: 100% deductible if exclusively for work' },
  equipment: { percent: 100, descEs: 'Equipos de trabajo: 100% deducible (puede aplicar depreciación CCA)', descEn: 'Work equipment: 100% deductible (CCA depreciation may apply)' },
  software: { percent: 100, descEs: 'Software de trabajo: 100% deducible como gasto operativo', descEn: 'Work software: 100% deductible as operating expense' },
  mileage: { percent: 100, descEs: 'Kilometraje: $0.70/km primeros 5,000km, $0.64/km después (CRA 2024)', descEn: 'Mileage: $0.70/km first 5,000km, $0.64/km after (CRA 2024)' },
  home_office: { percent: 100, descEs: 'Oficina en casa: proporcional al % de uso comercial del espacio', descEn: 'Home office: proportional to % of business use of space' },
  professional_services: { percent: 100, descEs: 'Servicios profesionales: 100% deducible (legal, contable, consultoría)', descEn: 'Professional services: 100% deductible (legal, accounting, consulting)' },
  office_supplies: { percent: 100, descEs: 'Suministros de oficina: 100% deducible', descEn: 'Office supplies: 100% deductible' },
  utilities: { percent: 100, descEs: 'Servicios: % proporcional si trabaja desde casa', descEn: 'Utilities: proportional % if working from home' },
  fuel: { percent: 100, descEs: 'Combustible: % proporcional al uso comercial del vehículo', descEn: 'Fuel: proportional % to business use of vehicle' },
  materials: { percent: 100, descEs: 'Materiales de trabajo: 100% deducible', descEn: 'Work materials: 100% deductible' },
  other: { percent: 100, descEs: 'Otros gastos: deducible si es exclusivamente para el negocio', descEn: 'Other expenses: deductible if exclusively for business' },
};

// Map expense categories to common contract term categories
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  meals: ['comidas', 'alimentación', 'meals', 'food', 'restaurantes', 'restaurants'],
  travel: ['viajes', 'transporte', 'travel', 'transportation', 'vuelos', 'flights', 'hoteles', 'hotels', 'alojamiento', 'accommodation'],
  equipment: ['equipos', 'equipment', 'tecnología', 'technology', 'hardware', 'computadoras', 'computers', 'materiales', 'materials', 'insumos', 'supplies', 'herramientas', 'tools'],
  software: ['software', 'licencias', 'licenses', 'suscripciones', 'subscriptions', 'herramientas digitales'],
  mileage: ['kilometraje', 'mileage', 'gasolina', 'combustible', 'fuel', 'vehículo', 'vehicle'],
  home_office: ['oficina en casa', 'home office', 'teletrabajo', 'remote work'],
  professional_services: ['servicios profesionales', 'professional services', 'consultoría', 'consulting', 'capacitación', 'training'],
  office_supplies: ['suministros de oficina', 'office supplies', 'papelería', 'stationery', 'materiales', 'materials', 'insumos', 'supplies'],
  utilities: ['servicios', 'utilities', 'internet', 'teléfono', 'phone', 'electricidad'],
  fuel: ['combustible', 'fuel', 'gasolina', 'gasoline', 'diésel', 'diesel', 'gas'],
  materials: ['materiales', 'materials', 'insumos', 'supplies', 'herramientas', 'tools', 'equipos', 'equipment', 'compras', 'purchases'],
  other: ['otros', 'other', 'misceláneos', 'miscellaneous', 'materiales', 'materials', 'insumos'],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function categoryMatchesTerms(category: string, terms: string[]): boolean {
  const categoryVariants = CATEGORY_MAPPINGS[category] || [category];
  const normalizedTerms = terms.map(normalizeText);
  
  return categoryVariants.some(variant => 
    normalizedTerms.some(term => 
      normalizeText(term).includes(normalizeText(variant)) || 
      normalizeText(variant).includes(normalizeText(term))
    )
  );
}

export function useContractReimbursementSuggestion(
  clientId: string | undefined | null,
  category: string | undefined | null
): ReimbursementSuggestion | null {
  const { data: contracts } = useContracts();

  return useMemo(() => {
    if (!category) {
      return null;
    }

    // If client is selected, check contract terms first
    if (clientId && clientId !== '__none__') {
      const clientContracts = contracts?.filter(
        c => c.client_id === clientId && c.extracted_terms && Object.keys(c.extracted_terms as object).length > 0
      ) || [];

      for (const contract of clientContracts) {
        const terms = contract.extracted_terms as ExtractedTerms;
        const reimbursementPolicy = terms?.reimbursement_policy;
        const userNotes = contract.user_notes?.toLowerCase() || '';

        // First check user notes/corrections - they override AI extracted terms
        if (userNotes) {
          const categoryVariants = CATEGORY_MAPPINGS[category] || [category];
          const notesMatchCategory = categoryVariants.some(variant => 
            normalizeText(userNotes).includes(normalizeText(variant))
          );

          const positiveIndicators = ['reembolsan', 'reembolsable', 'me pagan', 'cubre', 'cubren', 'incluye', 'incluyen', 'sí pagan', 'si pagan', 'acuerdo', 'acordamos', 'reimbursable', 'covered', 'pays for', 'will pay'];
          const hasPositiveIndicator = positiveIndicators.some(ind => userNotes.includes(ind));
          
          if (notesMatchCategory && hasPositiveIndicator) {
            return {
              isReimbursable: true,
              confidence: 'medium',
              reason: `✅ Según tus notas en "${contract.title || contract.file_name}": categoría reembolsable por acuerdo informal.`,
              reasonEn: `✅ Per your notes on "${contract.title || contract.file_name}": category reimbursable by informal agreement.`,
              matchedCategory: category,
              contractTitle: contract.title || contract.file_name,
              suggestionType: 'contract',
            };
          }

          const materialTerms = ['materiales', 'herramientas', 'insumos', 'materials', 'tools', 'supplies', 'compras', 'purchases'];
          const notesMentionsMaterials = materialTerms.some(term => userNotes.includes(term));
          const categoryIsMaterial = ['equipment', 'office_supplies', 'other', 'materials'].includes(category);
          
          if (notesMentionsMaterials && hasPositiveIndicator && categoryIsMaterial) {
            return {
              isReimbursable: true,
              confidence: 'medium',
              reason: `✅ Según notas en "${contract.title || contract.file_name}": materiales/herramientas son reembolsables.`,
              reasonEn: `✅ Per notes on "${contract.title || contract.file_name}": materials/tools are reimbursable.`,
              matchedCategory: 'materiales/herramientas',
              contractTitle: contract.title || contract.file_name,
              suggestionType: 'contract',
            };
          }
        }

        if (!reimbursementPolicy) continue;

        const reimbursableCategories = reimbursementPolicy.reimbursable_categories || [];
        const nonReimbursable = reimbursementPolicy.non_reimbursable || [];

        if (categoryMatchesTerms(category, reimbursableCategories)) {
          const matchedTerm = reimbursableCategories.find(term => 
            categoryMatchesTerms(category, [term])
          );

          return {
            isReimbursable: true,
            confidence: 'high',
            reason: `✅ Contrato "${contract.title || contract.file_name}": ${matchedTerm || category} es reembolsable por el cliente.`,
            reasonEn: `✅ Contract "${contract.title || contract.file_name}": ${matchedTerm || category} is reimbursable by client.`,
            matchedCategory: matchedTerm,
            contractTitle: contract.title || contract.file_name,
            suggestionType: 'contract',
          };
        }

        if (categoryMatchesTerms(category, nonReimbursable) && !userNotes) {
          const matchedTerm = nonReimbursable.find(term => 
            categoryMatchesTerms(category, [term])
          );

          // Not reimbursable by client, but suggest CRA deduction
          const craRule = CRA_DEDUCTION_RULES[category];
          return {
            isReimbursable: false,
            confidence: 'high',
            reason: `⚠️ No reembolsable por cliente (${matchedTerm}). ${craRule ? `💡 Pero ${craRule.descEs}` : ''}`,
            reasonEn: `⚠️ Not client reimbursable (${matchedTerm}). ${craRule ? `💡 But ${craRule.descEn}` : ''}`,
            matchedCategory: matchedTerm,
            contractTitle: contract.title || contract.file_name,
            suggestionType: 'contract',
            craDeductionPercent: craRule?.percent,
          };
        }
      }

      // Has contracts but no explicit match - suggest checking manually + CRA option
      if (clientContracts.length > 0) {
        const craRule = CRA_DEDUCTION_RULES[category];
        return {
          isReimbursable: false,
          confidence: 'low',
          reason: `❓ Categoría no especificada en contrato. Verifica manualmente. ${craRule ? `💡 Alternativa CRA: ${craRule.descEs}` : ''}`,
          reasonEn: `❓ Category not specified in contract. Verify manually. ${craRule ? `💡 CRA alternative: ${craRule.descEn}` : ''}`,
          contractTitle: clientContracts[0].title || clientContracts[0].file_name,
          suggestionType: 'contract',
          craDeductionPercent: craRule?.percent,
        };
      }
    }

    // No client or no contracts - suggest CRA deduction rules
    const craRule = CRA_DEDUCTION_RULES[category];
    if (craRule) {
      return {
        isReimbursable: false,
        confidence: 'medium',
        reason: `📋 Sin cliente asignado. ${craRule.descEs}`,
        reasonEn: `📋 No client assigned. ${craRule.descEn}`,
        suggestionType: 'cra',
        craDeductionPercent: craRule.percent,
      };
    }

    return null;
  }, [clientId, category, contracts]);
}
