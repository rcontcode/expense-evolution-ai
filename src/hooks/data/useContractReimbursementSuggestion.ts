import { useMemo } from 'react';
import { useContracts } from './useContracts';

interface ReimbursementSuggestion {
  isReimbursable: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  reasonEn: string;
  matchedCategory?: string;
  contractTitle?: string;
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
    if (!clientId || clientId === '__none__' || !category) {
      return null;
    }

    // Find contracts for this client that have been analyzed
    const clientContracts = contracts?.filter(
      c => c.client_id === clientId && c.extracted_terms && Object.keys(c.extracted_terms as object).length > 0
    ) || [];

    if (clientContracts.length === 0) {
      return null;
    }

    // Check each contract's terms
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

        // Check if user notes indicate this category IS reimbursable
        const positiveIndicators = ['reembolsan', 'reembolsable', 'me pagan', 'cubre', 'cubren', 'incluye', 'incluyen', 'sí pagan', 'si pagan', 'acuerdo', 'acordamos', 'reimbursable', 'covered', 'pays for', 'will pay'];
        const hasPositiveIndicator = positiveIndicators.some(ind => userNotes.includes(ind));
        
        if (notesMatchCategory && hasPositiveIndicator) {
          return {
            isReimbursable: true,
            confidence: 'medium',
            reason: `Según tus notas en el contrato "${contract.title || contract.file_name}", esta categoría es reembolsable (acuerdo informal/corrección manual).`,
            reasonEn: `According to your notes on contract "${contract.title || contract.file_name}", this category is reimbursable (informal agreement/manual correction).`,
            matchedCategory: category,
            contractTitle: contract.title || contract.file_name,
          };
        }

        // Check for general "materials/tools/supplies" mentions in notes
        const materialTerms = ['materiales', 'herramientas', 'insumos', 'materials', 'tools', 'supplies', 'compras', 'purchases'];
        const notesMentionsMaterials = materialTerms.some(term => userNotes.includes(term));
        const categoryIsMaterial = ['equipment', 'office_supplies', 'other'].includes(category);
        
        if (notesMentionsMaterials && hasPositiveIndicator && categoryIsMaterial) {
          return {
            isReimbursable: true,
            confidence: 'medium',
            reason: `Según tus notas en el contrato "${contract.title || contract.file_name}", los materiales/herramientas son reembolsables (acuerdo informal).`,
            reasonEn: `According to your notes on contract "${contract.title || contract.file_name}", materials/tools are reimbursable (informal agreement).`,
            matchedCategory: 'materiales/herramientas',
            contractTitle: contract.title || contract.file_name,
          };
        }
      }

      if (!reimbursementPolicy) continue;

      const reimbursableCategories = reimbursementPolicy.reimbursable_categories || [];
      const nonReimbursable = reimbursementPolicy.non_reimbursable || [];

      // Check if category matches reimbursable categories
      if (categoryMatchesTerms(category, reimbursableCategories)) {
        const matchedTerm = reimbursableCategories.find(term => 
          categoryMatchesTerms(category, [term])
        );

        return {
          isReimbursable: true,
          confidence: 'high',
          reason: `Según el contrato "${contract.title || contract.file_name}", esta categoría es reembolsable${matchedTerm ? ` (${matchedTerm})` : ''}.`,
          reasonEn: `According to contract "${contract.title || contract.file_name}", this category is reimbursable${matchedTerm ? ` (${matchedTerm})` : ''}.`,
          matchedCategory: matchedTerm,
          contractTitle: contract.title || contract.file_name,
        };
      }

      // Check if category matches non-reimbursable (but user notes can override)
      if (categoryMatchesTerms(category, nonReimbursable) && !userNotes) {
        const matchedTerm = nonReimbursable.find(term => 
          categoryMatchesTerms(category, [term])
        );

        return {
          isReimbursable: false,
          confidence: 'high',
          reason: `Según el contrato "${contract.title || contract.file_name}", esta categoría NO es reembolsable${matchedTerm ? ` (${matchedTerm})` : ''}.`,
          reasonEn: `According to contract "${contract.title || contract.file_name}", this category is NOT reimbursable${matchedTerm ? ` (${matchedTerm})` : ''}.`,
          matchedCategory: matchedTerm,
          contractTitle: contract.title || contract.file_name,
        };
      }
    }

    // If we have contracts but no explicit match, suggest with low confidence
    if (clientContracts.length > 0) {
      return {
        isReimbursable: false,
        confidence: 'low',
        reason: `No se encontró esta categoría explícitamente en los términos del contrato. Verifica manualmente.`,
        reasonEn: `This category was not explicitly found in contract terms. Please verify manually.`,
        contractTitle: clientContracts[0].title || clientContracts[0].file_name,
      };
    }

    return null;
  }, [clientId, category, contracts]);
}
