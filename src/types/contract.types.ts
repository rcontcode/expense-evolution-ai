import { Database } from '@/integrations/supabase/types';

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
export type ContractUpdate = Database['public']['Tables']['contracts']['Update'];
export type ContractStatus = Database['public']['Enums']['contract_status'];

export interface ContractFormData {
  client_id?: string;
  files: File[];
  billing_profile?: Record<string, any>;
  title?: string;
  contract_type?: string;
  start_date?: Date | null;
  end_date?: Date | null;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  value?: number | null;
  description?: string;
}

export interface ContractWithClient extends Contract {
  client?: {
    id: string;
    name: string;
  } | null;
}

export interface ContractGroup {
  /** The primary contract (page_order = 0 or first in group) */
  primary: ContractWithClient;
  /** All pages in the group, ordered by page_order */
  pages: ContractWithClient[];
  /** Total number of pages */
  pageCount: number;
  /** The shared group_id */
  groupId: string | null;
}

/**
 * Groups a flat list of contracts into ContractGroup[] 
 * Contracts with the same group_id are merged into one group.
 * Contracts without group_id are treated as single-page groups.
 */
export function groupContracts(contracts: ContractWithClient[]): ContractGroup[] {
  const groupMap = new Map<string, ContractWithClient[]>();
  const ungrouped: ContractWithClient[] = [];

  for (const contract of contracts) {
    if (contract.group_id) {
      const existing = groupMap.get(contract.group_id) || [];
      existing.push(contract);
      groupMap.set(contract.group_id, existing);
    } else {
      ungrouped.push(contract);
    }
  }

  const groups: ContractGroup[] = [];

  // Grouped contracts
  for (const [groupId, pages] of groupMap.entries()) {
    const sorted = pages.sort((a, b) => (a.page_order || 0) - (b.page_order || 0));
    groups.push({
      primary: sorted[0],
      pages: sorted,
      pageCount: sorted.length,
      groupId,
    });
  }

  // Ungrouped contracts (each is its own group)
  for (const contract of ungrouped) {
    groups.push({
      primary: contract,
      pages: [contract],
      pageCount: 1,
      groupId: null,
    });
  }

  // Sort by primary's created_at descending
  groups.sort((a, b) => {
    const dateA = new Date(a.primary.created_at || 0).getTime();
    const dateB = new Date(b.primary.created_at || 0).getTime();
    return dateB - dateA;
  });

  return groups;
}
