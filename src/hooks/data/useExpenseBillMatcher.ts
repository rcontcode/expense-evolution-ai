import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecurringBills, useMarkBillPaid } from './useRecurringBills';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// Session-level deduplication to avoid repeated toasts for same bill matches
const notifiedBillMatches = new Set<string>();

/**
 * Cross-detection: when a new expense is created, check if it matches
 * an existing recurring bill (by vendor similarity + amount proximity).
 * If matched, suggest linking it via a toast with "Mark as Paid" action.
 */
export function useExpenseBillMatcher() {
  const { data: bills } = useRecurringBills();
  const { language } = useLanguage();
  const l = language === 'es';
  const markPaid = useMarkBillPaid();

  const checkExpenseAgainstBills = useCallback((expense: { vendor?: string | null; amount?: number; id?: string; date?: string }) => {
    if (!bills || bills.length === 0 || !expense.vendor) return;

    const expenseVendor = expense.vendor.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (expenseVendor.length < 3) return;

    for (const bill of bills) {
      if (bill.status !== 'active') continue;
      const billName = bill.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check vendor similarity
      const vendorMatch = billName.includes(expenseVendor) || 
                          expenseVendor.includes(billName) ||
                          (expenseVendor.length >= 4 && billName.length >= 4 && 
                           (expenseVendor.slice(0, 4) === billName.slice(0, 4)));
      
      if (!vendorMatch) continue;

      // Check amount proximity (within 20%)
      const expAmount = Number(expense.amount) || 0;
      const billAmount = Number(bill.amount) || 0;
      if (billAmount === 0) continue;
      
      const amountDiff = Math.abs(expAmount - billAmount) / billAmount;
      if (amountDiff > 0.20) continue;

      // Deduplicate: skip if we already notified for this bill in this session
      const matchKey = `${bill.id}_${expense.vendor}_${expense.date || 'nodate'}`;
      if (notifiedBillMatches.has(matchKey)) return;
      notifiedBillMatches.add(matchKey);

      // Match found — notify user with Mark as Paid action
      toast.info(
        l 
          ? `🔗 Este gasto coincide con tu pago fijo "${bill.name}" ($${billAmount.toFixed(2)}/${bill.frequency})`
          : `🔗 This expense matches your recurring bill "${bill.name}" ($${billAmount.toFixed(2)}/${bill.frequency})`,
        {
          duration: 8000,
          action: {
            label: l ? '✅ Marcar pagado' : '✅ Mark paid',
            onClick: () => {
              markPaid.mutate({
                billId: bill.id,
                amount: expAmount,
                paidDate: expense.date || new Date().toISOString().split('T')[0],
                notes: l 
                  ? `Auto-vinculado desde gasto: ${expense.vendor}`
                  : `Auto-linked from expense: ${expense.vendor}`,
              });
            },
          },
        }
      );
      
      // Only notify for first match
      return;
    }
  }, [bills, l, markPaid]);

  return { checkExpenseAgainstBills };
}
