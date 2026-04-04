import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface DuplicateMatch {
  type: 'expense' | 'document';
  id: string;
  vendor: string | null;
  amount: number;
  date: string;
  time?: string;
  description: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason_es: string;
  reason_en: string;
  document_id?: string | null;
  file_name?: string;
  is_recurring_pattern?: boolean;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
}

export interface DuplicateComparable {
  vendor?: string | null;
  amount?: number | null;
  date?: string | null;
  time?: string | null;
}

export function normalizeVendor(vendor: string | null | undefined): string {
  if (!vendor) return '';
  return vendor.toLowerCase().replace(/[^a-z0-9áéíóúñü]/g, '').trim();
}

export function vendorMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeVendor(a);
  const nb = normalizeVendor(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function parseTimeToMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function timeDifferenceMinutes(t1: string | undefined | null, t2: string | undefined | null): number | null {
  const m1 = parseTimeToMinutes(t1);
  const m2 = parseTimeToMinutes(t2);
  if (m1 === null || m2 === null) return null;
  return Math.abs(m1 - m2);
}

function determineConfidence(
  sameDate: boolean,
  timeDiff: number | null,
  isRecurring: boolean
): 'high' | 'medium' | 'low' {
  if (sameDate) {
    // Same date — check time
    if (timeDiff !== null && timeDiff >= 30) return 'low'; // different time = likely separate purchase
    if (timeDiff !== null && timeDiff < 30) return 'high'; // very close in time = likely duplicate
    return 'high'; // no time data, same date = assume high
  }
  // Different date
  if (isRecurring) return 'low';
  return 'medium';
}

function buildSmartReason(
  extracted: { vendor?: string; amount?: number; date?: string; time?: string },
  match: { vendor: string | null; amount: number; date: string; time?: string },
  sameDate: boolean,
  timeDiff: number | null,
  isRecurring: boolean
): { es: string; en: string } {
  const amt = `$${Number(match.amount).toFixed(2)}`;
  const v = match.vendor || '?';

  if (sameDate && timeDiff !== null && timeDiff >= 30) {
    return {
      es: `Mismo proveedor "${v}" y monto (${amt}) el mismo día, pero a hora diferente — probablemente compras separadas`,
      en: `Same vendor "${v}" and amount (${amt}) same day, but different time — likely separate purchases`,
    };
  }

  if (sameDate) {
    return {
      es: `Mismo monto (${amt}), fecha (${match.date}) y proveedor "${v}" — podría ser duplicado`,
      en: `Same amount (${amt}), date (${match.date}) and vendor "${v}" — might be a duplicate`,
    };
  }

  if (isRecurring) {
    return {
      es: `Compra frecuente en "${v}" por ${amt} — parece un pago recurrente`,
      en: `Frequent purchase at "${v}" for ${amt} — looks like a recurring payment`,
    };
  }

  return {
    es: `Mismo monto (${amt}) y proveedor "${v}", fecha diferente (${match.date} vs ${extracted.date})`,
    en: `Same amount (${amt}) and vendor "${v}", different date (${match.date} vs ${extracted.date})`,
  };
}

export function compareDuplicateCandidate(
  extracted: DuplicateComparable,
  candidate: DuplicateComparable,
  options: { amountTolerance?: number; isRecurring?: boolean } = {}
) {
  const extractedAmount = Number(extracted.amount) || 0;
  const candidateAmount = Number(candidate.amount) || 0;
  const amountTolerance = options.amountTolerance ?? 0.01;
  const isRecurring = options.isRecurring ?? false;

  if (extractedAmount <= 0 || candidateAmount <= 0) {
    return { isMatch: false as const, sameDate: false, timeDiff: null as number | null };
  }

  if (Math.abs(candidateAmount - extractedAmount) > amountTolerance) {
    return { isMatch: false as const, sameDate: false, timeDiff: null as number | null };
  }

  if (!vendorMatch(extracted.vendor, candidate.vendor)) {
    return { isMatch: false as const, sameDate: false, timeDiff: null as number | null };
  }

  const sameDate = Boolean(extracted.date && candidate.date && extracted.date === candidate.date);
  const timeDiff = timeDifferenceMinutes(extracted.time, candidate.time);
  const confidence = determineConfidence(sameDate, timeDiff, isRecurring);
  const reasons = buildSmartReason(
    {
      vendor: extracted.vendor || undefined,
      amount: extractedAmount,
      date: extracted.date || undefined,
      time: extracted.time || undefined,
    },
    {
      vendor: candidate.vendor || null,
      amount: candidateAmount,
      date: candidate.date || '',
      time: candidate.time || undefined,
    },
    sameDate,
    timeDiff,
    isRecurring
  );

  return {
    isMatch: true as const,
    sameDate,
    timeDiff,
    confidence,
    reasons,
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

// Check how many previous expenses match vendor+amount to detect recurring patterns
async function checkRecurringPattern(
  userId: string,
  vendor: string | undefined,
  amount: number | undefined
): Promise<boolean> {
  if (!vendor || !amount) return false;
  
  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('id, vendor, amount')
    .eq('user_id', userId)
    .gte('amount', amount * 0.95)
    .lte('amount', amount * 1.05);
  
  if (!prevExpenses) return false;
  
  const matchingVendor = prevExpenses.filter(e => vendorMatch(e.vendor, vendor));
  return matchingVendor.length >= 3; // 3+ similar expenses = recurring pattern
}

// Layer 2: Post-OCR content-based detection
export async function findContentDuplicates(
  userId: string,
  extracted: { vendor?: string; amount?: number; date?: string; time?: string; description?: string; line_items?: Array<{ name: string; total: number }> },
  excludeDocId?: string
): Promise<DuplicateCheckResult> {
  console.log('[DupCheck] Starting check with:', { vendor: extracted.vendor, amount: extracted.amount, date: extracted.date, excludeDocId });
  
  if (!extracted.vendor && !extracted.amount) {
    console.log('[DupCheck] Skipped: no vendor and no amount');
    return { hasDuplicates: false, matches: [] };
  }

  const matches: DuplicateMatch[] = [];
  
  // Check if this vendor+amount is a recurring pattern
  const isRecurring = await checkRecurringPattern(userId, extracted.vendor, extracted.amount);

  // 1. Search expenses by amount (exact) — then filter vendor client-side
  if (extracted.amount && extracted.amount > 0) {
    let expQuery = supabase
      .from('expenses')
      .select('id, vendor, amount, date, description, document_id')
      .eq('user_id', userId)
      .eq('amount', extracted.amount);
    
    if (excludeDocId) {
      expQuery = expQuery.neq('document_id', excludeDocId);
    }
    
    const { data: expenseMatches, error: expErr } = await expQuery;
    console.log('[DupCheck] Expense query results:', expenseMatches?.length, 'error:', expErr);

    if (expenseMatches) {
      for (const exp of expenseMatches) {
        const comparison = compareDuplicateCandidate(
          extracted,
          {
            vendor: exp.vendor,
            amount: Number(exp.amount),
            date: exp.date,
            time: undefined,
          },
          { isRecurring }
        );

        if (comparison.isMatch) {
          matches.push({
            type: 'expense',
            id: exp.id,
            vendor: exp.vendor,
            amount: Number(exp.amount),
            date: exp.date,
            description: exp.description,
            confidence: comparison.confidence,
            reason_es: comparison.reasons.es,
            reason_en: comparison.reasons.en,
            document_id: exp.document_id,
            is_recurring_pattern: isRecurring,
          });
        }
      }
    }
  }

  // 2. Search documents with extracted_data
  let docQuery = supabase
    .from('documents')
    .select('id, file_name, extracted_data, created_at')
    .eq('user_id', userId)
    .eq('status', 'classified');
  
  if (excludeDocId) {
    docQuery = docQuery.neq('id', excludeDocId);
  }
  
  const { data: docMatches, error: docErr } = await docQuery;
  console.log('[DupCheck] Document query results:', docMatches?.length, 'error:', docErr);

  if (docMatches) {
    for (const doc of docMatches) {
      const ed = doc.extracted_data as any;
      if (!ed) continue;

      const docVendor = ed.vendor || ed.company || '';
      const docAmount = Number(ed.amount) || 0;
      const docDate = ed.date || '';
      const docTime = ed.time || undefined;

      console.log('[DupCheck] Comparing doc', doc.id, { docVendor, docAmount, docDate, extractedVendor: extracted.vendor, extractedAmount: extracted.amount });

      const comparison = compareDuplicateCandidate(
        extracted,
        {
          vendor: docVendor,
          amount: docAmount,
          date: docDate,
          time: docTime,
        },
        { isRecurring }
      );
      console.log('[DupCheck] Comparison result:', comparison.isMatch, comparison);

      if (comparison.isMatch) {
        if (matches.some(m => m.document_id === doc.id || m.id === doc.id)) continue;
        
        matches.push({
          type: 'document',
          id: doc.id,
          vendor: docVendor,
          amount: docAmount,
          date: docDate,
          time: docTime,
          description: null,
          confidence: comparison.confidence,
          reason_es: comparison.reasons.es,
          reason_en: comparison.reasons.en,
          file_name: doc.file_name,
          is_recurring_pattern: isRecurring,
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
          const confidence = determineConfidence(sameDate, null, isRecurring);
          matches.push({
            type: 'expense',
            id: exp.id,
            vendor: exp.vendor,
            amount: Number(exp.amount),
            date: exp.date,
            description: exp.description,
            confidence,
            reason_es: `Mismo item "${mainItem.name}" con monto $${Number(exp.amount).toFixed(2)}`,
            reason_en: `Same item "${mainItem.name}" with amount $${Number(exp.amount).toFixed(2)}`,
            document_id: exp.document_id,
            is_recurring_pattern: isRecurring,
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
    (extracted: Parameters<typeof findContentDuplicates>[1], excludeDocId?: string) => {
      if (!user?.id) return Promise.resolve({ hasDuplicates: false, matches: [] });
      return findContentDuplicates(user.id, extracted, excludeDocId);
    },
    [user?.id]
  );

  return { checkPreUpload, checkContent };
}
