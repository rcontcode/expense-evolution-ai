import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecurringBills } from './useRecurringBills';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

/**
 * Cross-detection: when a new expense is created, check if it matches
 * an existing recurring bill (by vendor similarity + amount proximity).
 * If matched, suggest linking it via a toast notification.
 */
export function useExpenseBillMatcher() {
  const { data: bills } = useRecurringBills();
  const { language } = useLanguage();
  const l = language === 'es';

  const checkExpenseAgainstBills = useCallback((expense: { vendor?: string | null; amount?: number; id?: string }) => {
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

      // Match found — notify user
      toast.info(
        l 
          ? `🔗 Este gasto coincide con tu pago fijo "${bill.name}" ($${billAmount.toFixed(2)}/${bill.frequency})`
          : `🔗 This expense matches your recurring bill "${bill.name}" ($${billAmount.toFixed(2)}/${bill.frequency})`,
        {
          duration: 6000,
          action: expense.id ? {
            label: l ? 'Ver pagos fijos' : 'View bills',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('navigate-to', { detail: '/bills' }));
            },
          } : undefined,
        }
      );
      
      // Only notify for first match
      return;
    }
  }, [bills, l]);

  return { checkExpenseAgainstBills };
}
