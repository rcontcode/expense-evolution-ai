export type IncomeType = 
  | 'salary'
  | 'client_payment'
  | 'bonus'
  | 'gift'
  | 'refund'
  | 'investment_stocks'
  | 'investment_crypto'
  | 'investment_funds'
  | 'passive_rental'
  | 'passive_royalties'
  | 'online_business'
  | 'freelance'
  | 'other';

export type RecurrenceType = 
  | 'one_time'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  date: string;
  income_type: IncomeType;
  description: string | null;
  source: string | null;
  client_id: string | null;
  project_id: string | null;
  entity_id: string | null;
  recurrence: RecurrenceType;
  recurrence_end_date: string | null;
  is_taxable: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeWithRelations extends Income {
  client?: { id: string; name: string } | null;
  project?: { id: string; name: string; color: string } | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  client_id: string | null;
  entity_id: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithRelations extends Project {
  client?: { id: string; name: string } | null;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  priority: number;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeFormData {
  amount: number;
  currency: string;
  date: Date;
  income_type: IncomeType;
  description?: string;
  source?: string;
  client_id?: string;
  project_id?: string;
  entity_id?: string;
  recurrence: RecurrenceType;
  recurrence_end_date?: Date;
  is_taxable: boolean;
  notes?: string;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  status: string;
  client_id?: string;
  entity_id?: string;
  budget?: number;
  start_date?: Date;
  end_date?: Date;
  color: string;
}

export interface SavingsGoalFormData {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: Date;
  priority: number;
  color: string;
}
