import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  category: string;
  frequency: string;
  frequency_months: number | null;
  due_day: number | null;
  next_due_date: string;
  last_paid_date: string | null;
  auto_pay: boolean;
  status: string;
  priority: string;
  color: string | null;
  icon: string | null;
  notes: string | null;
  reminder_days_before: number;
  entity_id: string | null;
  payment_method_type: string;
  bank_account: string | null;
  bank_name: string | null;
  payment_details: string | null;
  payee_name: string | null;
  payee_account: string | null;
  beneficiary: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  user_id: string;
  bill_id: string;
  amount_paid: number;
  paid_date: string;
  payment_method: string | null;
  confirmation_number: string | null;
  notes: string | null;
  expense_id: string | null;
  created_at: string;
}

export type BillInsert = Omit<RecurringBill, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type BillUpdate = Partial<BillInsert>;

export function useRecurringBills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-bills', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .order('next_due_date', { ascending: true });
      if (error) throw error;
      return data as RecurringBill[];
    },
    enabled: !!user,
  });
}

export function useBillPayments(billId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bill-payments', billId, user?.id],
    queryFn: async () => {
      let query = supabase.from('bill_payments').select('*').order('paid_date', { ascending: false });
      if (billId) query = query.eq('bill_id', billId);
      const { data, error } = await query;
      if (error) throw error;
      return data as BillPayment[];
    },
    enabled: !!user,
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (bill: BillInsert) => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .insert({ ...bill, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-bills'] });
      toast.success(language === 'es' ? 'Pago recurrente creado' : 'Recurring bill created');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al crear el pago' : 'Error creating bill');
    },
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BillUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-bills'] });
      toast.success(language === 'es' ? 'Pago actualizado' : 'Bill updated');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al actualizar' : 'Error updating bill');
    },
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-bills'] });
      toast.success(language === 'es' ? 'Pago eliminado' : 'Bill deleted');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al eliminar' : 'Error deleting bill');
    },
  });
}

export function useMarkBillPaid() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async ({ billId, amount, paidDate, notes }: { billId: string; amount: number; paidDate?: string; notes?: string }) => {
      // Create payment record
      const { error: payError } = await supabase.from('bill_payments').insert({
        user_id: user!.id,
        bill_id: billId,
        amount_paid: amount,
        paid_date: paidDate || new Date().toISOString().split('T')[0],
        notes,
      });
      if (payError) throw payError;

      // Get current bill to calculate next due date
      const { data: bill, error: billError } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('id', billId)
        .single();
      if (billError) throw billError;

      // Calculate next due date
      const currentDue = new Date(bill.next_due_date);
      const { getNextDueDate } = await import('@/lib/constants/bill-categories');
      const nextDue = getNextDueDate(currentDue, bill.frequency, bill.frequency_months || undefined);

      // Update bill
      const { error: updateError } = await supabase
        .from('recurring_bills')
        .update({
          last_paid_date: paidDate || new Date().toISOString().split('T')[0],
          next_due_date: nextDue.toISOString().split('T')[0],
        })
        .eq('id', billId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-bills'] });
      qc.invalidateQueries({ queryKey: ['bill-payments'] });
      toast.success(language === 'es' ? '✅ Pago registrado' : '✅ Payment recorded');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al registrar pago' : 'Error recording payment');
    },
  });
}
