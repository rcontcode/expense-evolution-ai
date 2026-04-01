import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';

// RecurringBill, BillPayment, BillInsert, BillUpdate types
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
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Generate historical bill_payments between startDate and today */
export async function generateHistoricalPayments(
  startDate: string,
  frequency: string,
  frequencyMonths: number | null,
  amount: number,
): Promise<{ payments: { paid_date: string; amount_paid: number }[]; truncated: boolean }> {
  const { MAX_HISTORICAL_PAYMENTS } = await import('@/lib/constants/resource-limits');
  const payments: { paid_date: string; amount_paid: number }[] = [];
  const { getNextDueDate } = await import('@/lib/constants/bill-categories');
  let current = new Date(startDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let iterations = 0;
  while (current < today && payments.length < MAX_HISTORICAL_PAYMENTS) {
    payments.push({
      paid_date: current.toISOString().split('T')[0],
      amount_paid: amount,
    });
    const prev = current.getTime();
    current = getNextDueDate(current, frequency, frequencyMonths || undefined);
    // Safety: break if date didn't advance (prevents infinite loop)
    if (current.getTime() <= prev) break;
    iterations++;
    if (iterations > MAX_HISTORICAL_PAYMENTS) break;
  }
  return { payments, truncated: payments.length >= MAX_HISTORICAL_PAYMENTS };
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

export type BillInsert = Omit<RecurringBill, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'start_date' | 'end_date'> & { start_date?: string | null; end_date?: string | null };
export type BillUpdate = Partial<BillInsert>;

export function useRecurringBills() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-bills', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('user_id', user!.id)
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
      let query = supabase.from('bill_payments').select('*').eq('user_id', user!.id).order('paid_date', { ascending: false });
      if (billId) query = query.eq('bill_id', billId);
      const { data, error } = await query;
      if (error) throw error;
      return data as BillPayment[];
    },
    enabled: !!user,
  });
}

export function useCreateBill() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { afterBill } = useInvalidateRelated();

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
      afterBill();
      toast.success(language === 'es' ? 'Pago recurrente creado' : 'Recurring bill created');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al crear el pago' : 'Error creating bill');
    },
  });
}

export function useUpdateBill() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { afterBill } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BillUpdate & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recurring_bills')
        .update(updates as any)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      afterBill();
      toast.success(language === 'es' ? 'Pago actualizado' : 'Bill updated');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al actualizar' : 'Error updating bill');
    },
  });
}

export function useDeleteBill() {
  const { language } = useLanguage();
  const { afterBill } = useInvalidateRelated();

  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('recurring_bills').select('name, amount').eq('id', id).eq('user_id', user.id).maybeSingle();
      const { error } = await supabase.from('recurring_bills').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      if (user) {
        await insertAuditLog(user.id, {
          action: 'delete', entity_type: 'recurring_bill', entity_id: id,
          entity_name: existing?.name || null, old_values: existing ? { name: existing.name, amount: existing.amount } : null,
        });
      }
    },
    onSuccess: () => {
      afterBill();
      toast.success(language === 'es' ? 'Pago eliminado' : 'Bill deleted');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al eliminar' : 'Error deleting bill');
    },
  });
}

export function useMarkBillPaid() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { afterBill } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ billId, amount, paidDate, notes }: { billId: string; amount: number; paidDate?: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error: payError } = await supabase.from('bill_payments').insert({
        user_id: user!.id,
        bill_id: billId,
        amount_paid: amount,
        paid_date: paidDate || new Date().toISOString().split('T')[0],
        notes,
      });
      if (payError) throw payError;

      const { data: bill, error: billError } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('id', billId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (billError) throw billError;
      if (!bill) throw new Error('Bill not found');

      const currentDue = new Date(bill.next_due_date);
      const { getNextDueDate } = await import('@/lib/constants/bill-categories');
      const nextDue = getNextDueDate(currentDue, bill.frequency, bill.frequency_months || undefined);

      const { error: updateError } = await supabase
        .from('recurring_bills')
        .update({
          last_paid_date: paidDate || new Date().toISOString().split('T')[0],
          next_due_date: nextDue.toISOString().split('T')[0],
        })
        .eq('id', billId)
        .eq('user_id', user.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      afterBill();
      toast.success(language === 'es' ? '✅ Pago registrado' : '✅ Payment recorded');
    },
    onError: () => {
      toast.error(language === 'es' ? 'Error al registrar pago' : 'Error recording payment');
    },
  });
}
