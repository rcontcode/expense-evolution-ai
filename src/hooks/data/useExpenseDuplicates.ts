import { useMemo } from 'react';
import { ExpenseWithRelations } from '@/types/expense.types';

export interface DuplicateGroup {
  original: ExpenseWithRelations;
  duplicate: ExpenseWithRelations;
  similarity: number;
  reason: string;
  reasonEn: string;
}

function normalizeVendor(vendor: string | null): string {
  if (!vendor) return '';
  return vendor.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function vendorSimilarity(a: string | null, b: string | null): number {
  const na = normalizeVendor(a);
  const nb = normalizeVendor(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  return 0;
}

export function useExpenseDuplicates(expenses: ExpenseWithRelations[]) {
  return useMemo(() => {
    const groups: DuplicateGroup[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < expenses.length; i++) {
      for (let j = i + 1; j < expenses.length; j++) {
        const a = expenses[i];
        const b = expenses[j];
        const pairKey = [a.id, b.id].sort().join('-');
        if (seen.has(pairKey)) continue;

        if (Number(a.amount) === Number(b.amount) && a.date === b.date) {
          const sim = vendorSimilarity(a.vendor, b.vendor);
          if (sim >= 0.8) {
            seen.add(pairKey);
            groups.push({
              original: a,
              duplicate: b,
              similarity: sim,
              reason: `Mismo monto ($${Number(a.amount).toFixed(2)}), fecha (${a.date}) y proveedor similar`,
              reasonEn: `Same amount ($${Number(a.amount).toFixed(2)}), date (${a.date}) and similar vendor`,
            });
          }
        }
      }
    }

    return { groups, count: groups.length };
  }, [expenses]);
}
