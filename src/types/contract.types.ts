import { Database } from '@/integrations/supabase/types';

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
export type ContractUpdate = Database['public']['Tables']['contracts']['Update'];
export type ContractStatus = Database['public']['Enums']['contract_status'];

export interface ContractFormData {
  client_id?: string;
  files: File[];
  billing_profile?: Record<string, any>;
  // New fields
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
