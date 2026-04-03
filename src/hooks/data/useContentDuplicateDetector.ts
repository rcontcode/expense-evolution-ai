import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface DuplicateMatch {
  type: 'expense' | 'document';
  id: string;
  vendor: string | null;
  amount: number;
  date: string;
  description: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason_es: string;
  reason_en: string;
  document_id?: string | null;
  file_name?: string;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
}

function normalizeVendor(vendor: string | null | undefined): string {
  if (!vendor) return '';
  return vendor.toLowerCase().replace(/[^a-z0-9áéíóúñü]/g, '').trim();
}

function vendorMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeVendor(a);
  const nb = normalizeVendor(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function buildReason(
  extracted: { vendor?: string; amount?: number; date?: string; description?: string },
  match: { vendor: string | null; amount: number; date: string },
  sameDate: boolean
): { es: string; en: string } {
  const amt = `$${Number(match.amount).toFixed(2)}`;
  const v = match.vendor || '?';
  
  if (sameDate) {
    return {
      es: `Mismo monto (${amt}), fecha (${match.date}) y proveedor "${v}"`,
      en: `Same amount (${amt}), date (${match.date}) and vendor "${v}"`,
    };
  }
  return {
    es: `Mismo monto (${amt}) y proveedor "${v}", pero fecha diferente (${match.date} vs ${extracted.date})`,
    en: `Same amount (${amt}) and vendor "${v}", but different date (${match.date} vs ${extracted.date})`,
  };
}

// Layer 1: Pre-upload check by file_name + file_size
export async function checkFilePreUpload(
  userId: string,
  fileName: string,
  fileSize: number
): Promise<{ isDuplicate: boolean; existingDate?: string }> {
  const { data } = await supabase
    .from('documents')
    .select('id, file_name, created_at')
    .eq('user_id', userId)
    .eq('file_name', fileName)
    .eq('file_size', fileSize)
    .maybeSingle();

  if (data) {
    return {
      isDuplicate: true,
      existingDate: new Date(data.created_at!).toLocaleDateString(),
    };
  }
  return { isDuplicate: false };
}

// Layer 2: Post-OCR content-based detection
export async function findContentDuplicates(
  userId: string,
  extracted: { vendor?: string; amount?: number; date?: string; description?: string; line_items?: Array<{ name: string; total: number }> },
  excludeDocId?: string
): Promise<DuplicateCheckResult> {
  if (!extracted.vendor && !extracted.amount) {
    return { hasDuplicates: false, matches: [] };
  }

  const matches: DuplicateMatch[] = [];

  // 1. Search expenses by amount (exact) — then filter vendor client-side
  if (extracted.amount && extracted.amount > 0) {
    let expQuery = supabase
      .from('expenses')
      .select('id, vendor, amount, date, description, document_id')
      .eq('user_id', userId)
      .eq('amount', extracted.amount);
    
    // Exclude expenses linked to the just-inserted document
    if (excludeDocId) {
      expQuery = expQuery.neq('document_id', excludeDocId);
    }
    
    const { data: expenseMatches } = await expQuery;

    if (expenseMatches) {
      for (const exp of expenseMatches) {
        if (vendorMatch(extracted.vendor, exp.vendor)) {
          const sameDate = exp.date === extracted.date;
          const reasons = buildReason(extracted, exp as any, sameDate);
          matches.push({
            type: 'expense',
            id: exp.id,
            vendor: exp.vendor,
            amount: Number(exp.amount),
            date: exp.date,
            description: exp.description,
            confidence: sameDate ? 'high' : 'medium',
            reason_es: reasons.es,
            reason_en: reasons.en,
            document_id: exp.document_id,
          });
        }
      }
    }
  }

  // 2. Search documents with extracted_data
  const { data: docMatches } = await supabase
    .from('documents')
    .select('id, file_name, extracted_data, created_at')
    .eq('user_id', userId)
    .eq('status', 'classified');

  if (docMatches) {
    for (const doc of docMatches) {
      const ed = doc.extracted_data as any;
      if (!ed) continue;

      const docVendor = ed.vendor || ed.company || '';
      const docAmount = Number(ed.amount) || 0;
      const docDate = ed.date || '';

      if (
        docAmount > 0 &&
        Math.abs(docAmount - (extracted.amount || 0)) < 0.01 &&
        vendorMatch(extracted.vendor, docVendor)
      ) {
        // Avoid duplicating matches already found via expenses
        if (matches.some(m => m.document_id === doc.id || m.id === doc.id)) continue;

        const sameDate = docDate === extracted.date;
        const reasons = buildReason(extracted, { vendor: docVendor, amount: docAmount, date: docDate }, sameDate);
        matches.push({
          type: 'document',
          id: doc.id,
          vendor: docVendor,
          amount: docAmount,
          date: docDate,
          description: null,
          confidence: sameDate ? 'high' : 'medium',
          reason_es: reasons.es,
          reason_en: reasons.en,
          file_name: doc.file_name,
        });
      }
    }
  }

  // 3. Line items cross-check
  if (extracted.line_items?.length && matches.length === 0 && extracted.amount) {
    const mainItem = extracted.line_items[0];
    const itemName = mainItem.name.toLowerCase();

    const { data: itemExpenses } = await supabase
      .from('expenses')
      .select('id, vendor, amount, date, description, document_id')
      .eq('user_id', userId)
      .eq('amount', extracted.amount);

    if (itemExpenses) {
      for (const exp of itemExpenses) {
        const desc = (exp.description || '').toLowerCase();
        if (desc.includes(itemName)) {
          const sameDate = exp.date === extracted.date;
          matches.push({
            type: 'expense',
            id: exp.id,
            vendor: exp.vendor,
            amount: Number(exp.amount),
            date: exp.date,
            description: exp.description,
            confidence: sameDate ? 'high' : 'medium',
            reason_es: `Mismo item "${mainItem.name}" con monto $${Number(exp.amount).toFixed(2)}`,
            reason_en: `Same item "${mainItem.name}" with amount $${Number(exp.amount).toFixed(2)}`,
            document_id: exp.document_id,
          });
        }
      }
    }
  }

  // 4. Contract duplicate detection
  if (matches.length === 0 && extracted.vendor) {
    const { data: contractMatches } = await supabase
      .from('contracts')
      .select('id, title, client_id, contract_type, start_date, file_name, value, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (contractMatches) {
      for (const contract of contractMatches) {
        const contractTitle = (contract.title || '').toLowerCase();
        const extractedVendor = (extracted.vendor || '').toLowerCase();
        
        const titleMatch = contractTitle.includes(extractedVendor) || extractedVendor.includes(contractTitle);
        const typeMatch = contract.contract_type && extracted.description?.toLowerCase().includes(contract.contract_type.toLowerCase());
        const valueMatch = contract.value && extracted.amount && Math.abs(contract.value - extracted.amount) < 0.01;
        
        if (titleMatch || (typeMatch && valueMatch)) {
          const sameDate = contract.start_date === extracted.date;
          matches.push({
            type: 'document',
            id: contract.id,
            vendor: contract.title,
            amount: contract.value || 0,
            date: contract.start_date || '',
            description: contract.contract_type,
            confidence: sameDate && titleMatch ? 'high' : 'medium',
            reason_es: sameDate 
              ? `Contrato "${contract.title}" con misma fecha (${contract.start_date})`
              : `Contrato similar "${contract.title}" (${contract.start_date || 'sin fecha'})`,
            reason_en: sameDate
              ? `Contract "${contract.title}" with same date (${contract.start_date})`
              : `Similar contract "${contract.title}" (${contract.start_date || 'no date'})`,
            file_name: contract.file_name,
          });
        }
      }
    }
  }

  return { hasDuplicates: matches.length > 0, matches };
}

export function useContentDuplicateDetector() {
  const { user } = useAuth();

  const checkPreUpload = useCallback(
    (fileName: string, fileSize: number): Promise<{ isDuplicate: boolean; existingDate?: string }> => {
      if (!user?.id) return Promise.resolve({ isDuplicate: false });
      return checkFilePreUpload(user.id, fileName, fileSize);
    },
    [user?.id]
  );

  const checkContent = useCallback(
    (extracted: Parameters<typeof findContentDuplicates>[1]) => {
      if (!user?.id) return Promise.resolve({ hasDuplicates: false, matches: [] });
      return findContentDuplicates(user.id, extracted);
    },
    [user?.id]
  );

  return { checkPreUpload, checkContent };
}
