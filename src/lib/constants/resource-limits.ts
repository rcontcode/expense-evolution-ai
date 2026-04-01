/**
 * Centralized resource limits to prevent browser hangs,
 * memory exhaustion, and database timeouts from extreme user input.
 */

// === Projection limits ===
export const MAX_PROJECTION_YEARS = 80;
export const MAX_PROJECTION_MONTHS = MAX_PROJECTION_YEARS * 12;

// === Historical backfill ===
export const MAX_HISTORICAL_PAYMENTS = 500;

// === Bulk import ===
export const MAX_BULK_IMPORT_ROWS = 500;
export const BATCH_INSERT_SIZE = 100;

// === Charts ===
export const MAX_CHART_DATA_POINTS = 120;

// === Safety nets ===
export const MAX_LOOP_ITERATIONS = 10_000;

// === Queries ===
export const MAX_QUERY_ROWS_REPORT = 10_000;
export const QUERY_PAGE_SIZE = 1000;

// === FIRE Calculator input bounds ===
export const MIN_AGE = 10;
export const MAX_AGE = 120;
export const MIN_RETURN_RATE = -20;
export const MAX_RETURN_RATE = 50;
export const MIN_WITHDRAWAL_RATE = 0.5;
export const MAX_WITHDRAWAL_RATE = 15;

// === Date bounds ===
export const MIN_HISTORICAL_YEAR = 2000;
export const MAX_FUTURE_YEARS = 50;

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Aggregate data points by grouping when there are too many for a chart */
export function sampleChartData<T extends Record<string, any>>(
  data: T[],
  dateKey: keyof T,
  valueKeys: (keyof T)[],
  maxPoints: number = MAX_CHART_DATA_POINTS,
): T[] {
  if (data.length <= maxPoints) return data;

  const groupSize = Math.ceil(data.length / maxPoints);
  const sampled: T[] = [];

  for (let i = 0; i < data.length; i += groupSize) {
    const chunk = data.slice(i, i + groupSize);
    if (chunk.length === 0) continue;

    const aggregated = { ...chunk[chunk.length - 1] } as any;

    for (const key of valueKeys) {
      const sum = chunk.reduce((s, item) => s + (Number(item[key]) || 0), 0);
      aggregated[key] = Math.round((sum / chunk.length) * 100) / 100;
    }

    sampled.push(aggregated as T);
  }

  return sampled;
}
