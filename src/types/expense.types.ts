import { Database } from '@/integrations/supabase/types';

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
export type ExpenseStatus = Database['public']['Enums']['expense_status'];

export type Tag = Database['public']['Tables']['tags']['Row'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];

export type Client = Database['public']['Tables']['clients']['Row'];

export type ExpenseCategory = 
  | 'meals'
  | 'travel'
  | 'equipment'
  | 'software'
  | 'mileage'
  | 'home_office'
  | 'professional_services'
  | 'office_supplies'
  | 'utilities'
  | 'fuel'
  | 'other';

export type ReimbursementType = 
  | 'pending_classification'
  | 'client_reimbursable'
  | 'cra_deductible'
  | 'personal';

export interface ExpenseFormData {
  date: Date;
  vendor: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  notes?: string;
  client_id?: string;
  project_id?: string;
  contract_id?: string;
  document_id?: string;
  status?: ExpenseStatus;
  reimbursement_type?: ReimbursementType;
}

export interface ExpenseFilters {
  dateRange?: { start: Date; end: Date };
  clientIds?: string[];
  statuses?: ExpenseStatus[];
  tagIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  category?: ExpenseCategory;
  hasReceipt?: boolean;
  onlyIncomplete?: boolean;
  reimbursementType?: ReimbursementType;
}

export interface ExpenseWithRelations extends Expense {
  client?: Client | null;
  tags?: Tag[];
}
