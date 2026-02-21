import { useMemo } from 'react';
import { IncomeWithRelations } from '@/types/income.types';

export interface IncomeDuplicateGroup {
  /** The record we recommend keeping */
  keep: IncomeWithRelations;
  /** Records we suggest removing */
  duplicates: IncomeWithRelations[];
  /** Why we think they're duplicates */
  reason: string;
  reasonEn: string;
  /** Confidence 0-1 */
  confidence: number;
  /** Which one we suggest deleting and why */
  suggestion: string;
  suggestionEn: string;
}

function normalizeSource(s: string | null): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sourceSimilarity(a: string | null, b: string | null): number {
  const na = normalizeSource(a);
  const nb = normalizeSource(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  return 0;
}

/**
 * Picks the "best" record to keep based on heuristics:
 * - Has description/notes
 * - Has client/project linked
 * - Was created first (original)
 */
function pickBestRecord(records: IncomeWithRelations[]): { keep: IncomeWithRelations; remove: IncomeWithRelations[] } {
  const scored = records.map(r => {
    let score = 0;
    if (r.description) score += 2;
    if (r.notes) score += 2;
    if (r.client_id) score += 3;
    if (r.project_id) score += 3;
    if (r.source) score += 1;
    return { record: r, score };
  });

  // Sort: highest score first, then oldest created_at (original)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.record.created_at).getTime() - new Date(b.record.created_at).getTime();
  });

  return {
    keep: scored[0].record,
    remove: scored.slice(1).map(s => s.record),
  };
}

function buildSuggestion(keep: IncomeWithRelations, remove: IncomeWithRelations[], language: 'es' | 'en'): string {
  const reasons: string[] = [];

  if (keep.client_id && remove.some(r => !r.client_id)) {
    reasons.push(language === 'es' ? 'tiene cliente asignado' : 'has assigned client');
  }
  if (keep.project_id && remove.some(r => !r.project_id)) {
    reasons.push(language === 'es' ? 'tiene proyecto vinculado' : 'has linked project');
  }
  if (keep.description && remove.some(r => !r.description)) {
    reasons.push(language === 'es' ? 'tiene descripción' : 'has description');
  }
  if (keep.notes && remove.some(r => !r.notes)) {
    reasons.push(language === 'es' ? 'tiene notas' : 'has notes');
  }

  if (reasons.length === 0) {
    // Default: keep the oldest
    reasons.push(language === 'es' ? 'es el registro original (más antiguo)' : 'is the original (oldest) record');
  }

  const prefix = language === 'es'
    ? `Conservar el registro porque ${reasons.join(', ')}`
    : `Keep record because it ${reasons.join(', ')}`;

  return prefix;
}

export function useIncomeDuplicates(incomes: IncomeWithRelations[]) {
  return useMemo(() => {
    const groups: IncomeDuplicateGroup[] = [];
    const usedIds = new Set<string>();

    // Group by (amount, date, source_similarity)
    for (let i = 0; i < incomes.length; i++) {
      if (usedIds.has(incomes[i].id)) continue;

      const cluster: IncomeWithRelations[] = [incomes[i]];

      for (let j = i + 1; j < incomes.length; j++) {
        if (usedIds.has(incomes[j].id)) continue;
        const a = incomes[i];
        const b = incomes[j];

        if (
          Number(a.amount) === Number(b.amount) &&
          a.date === b.date &&
          a.income_type === b.income_type
        ) {
          const sim = sourceSimilarity(a.source, b.source);
          if (sim >= 0.8) {
            cluster.push(b);
          }
        }
      }

      if (cluster.length > 1) {
        cluster.forEach(r => usedIds.add(r.id));
        const { keep, remove } = pickBestRecord(cluster);

        // Check recurrence - if monthly, very likely duplicates
        const isRecurring = keep.recurrence === 'monthly' || keep.recurrence === 'biweekly';
        const confidence = isRecurring ? 0.95 : 0.85;

        groups.push({
          keep,
          duplicates: remove,
          confidence,
          reason: `Mismo monto ($${Number(keep.amount).toFixed(2)}), fecha (${keep.date}), tipo y fuente "${keep.source || '-'}" — ${cluster.length} registros`,
          reasonEn: `Same amount ($${Number(keep.amount).toFixed(2)}), date (${keep.date}), type and source "${keep.source || '-'}" — ${cluster.length} records`,
          suggestion: buildSuggestion(keep, remove, 'es'),
          suggestionEn: buildSuggestion(keep, remove, 'en'),
        });
      }
    }

    return { groups, count: groups.reduce((s, g) => s + g.duplicates.length, 0) };
  }, [incomes]);
}
