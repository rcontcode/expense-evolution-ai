import { supabase } from '@/integrations/supabase/client';
import { QUERY_PAGE_SIZE, MAX_QUERY_ROWS_REPORT } from '@/lib/constants/resource-limits';

/**
 * Fetch all rows from a table using pagination, up to MAX_QUERY_ROWS_REPORT.
 * Use for report exports only — not for UI queries.
 */
export async function paginatedFetch<T = any>(
  tableName: string,
  userId: string,
  options: {
    select?: string;
    filters?: (query: any) => any;
    orderBy?: string;
    ascending?: boolean;
  } = {},
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;
  const pageSize = QUERY_PAGE_SIZE;
  const maxRows = MAX_QUERY_ROWS_REPORT;

  while (offset < maxRows) {
    let query = supabase
      .from(tableName as any)
      .select(options.select || '*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .range(offset, offset + pageSize - 1);

    if (options.filters) {
      query = options.filters(query);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...(data as T[]));

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return allRows;
}
