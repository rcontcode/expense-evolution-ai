import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { differenceInDays } from 'date-fns';
import { getCountryConfig, type CountryCode } from '@/lib/constants/country-tax-config';

const CHECK_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Centralized auto-reminder hook that checks bills, contracts, tax deadlines,
 * and budget alerts — inserting real notifications into the `notifications` table.
 */
export function useAutoReminders() {
  const { user } = useAuth();
  const { currentEntity } = useEntity();
  const runningRef = useRef(false);
  const lastRunRef = useRef(0);

  // Anti-duplicate: check if a notification already exists
  const hasRecentNotification = useCallback(async (
    userId: string,
    type: string,
    titleContains: string,
    withinHours: number
  ): Promise<boolean> => {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .ilike('title', `%${titleContains}%`)
      .gte('created_at', since);
    return (count ?? 0) > 0;
  }, []);

  const insertNotification = useCallback(async (
    userId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string
  ) => {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      action_url: actionUrl ?? null,
      read: false,
    });
  }, []);

  // A) Bill reminders
  const checkBillReminders = useCallback(async (userId: string) => {
    const { data: bills } = await supabase
      .from('recurring_bills')
      .select('id, name, next_due_date, reminder_days_before, amount, currency')
      .eq('status', 'active');

    if (!bills?.length) return;
    const today = new Date();

    for (const bill of bills) {
      const dueDate = new Date(bill.next_due_date);
      const daysUntilDue = differenceInDays(dueDate, today);
      if (daysUntilDue <= bill.reminder_days_before && daysUntilDue >= 0) {
        const exists = await hasRecentNotification(userId, 'bill_reminder', bill.name, 24);
        if (!exists) {
          await insertNotification(
            userId,
            'bill_reminder',
            `💳 ${bill.name}`,
            `Vence en ${daysUntilDue} día(s) — $${bill.amount} ${bill.currency}`,
            '/budget'
          );
        }
      }
    }
  }, [hasRecentNotification, insertNotification]);

  // B) Contract reminders
  const checkContractReminders = useCallback(async (userId: string) => {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, title, file_name, end_date, auto_renew, renewal_notice_days')
      .is('deleted_at', null)
      .not('end_date', 'is', null);

    if (!contracts?.length) return;
    const today = new Date();

    for (const c of contracts) {
      const endDate = new Date(c.end_date!);
      const noticeDays = c.renewal_notice_days ?? 30;
      const daysUntilEnd = differenceInDays(endDate, today);
      if (daysUntilEnd <= noticeDays && daysUntilEnd >= 0) {
        const name = c.title || c.file_name;
        const exists = await hasRecentNotification(userId, 'contract_reminder', name, 168); // 7 days
        if (!exists) {
          const autoMsg = c.auto_renew ? ' (se renovará automáticamente)' : '';
          await insertNotification(
            userId,
            'contract_reminder',
            `📄 ${name}`,
            `Vence en ${daysUntilEnd} día(s)${autoMsg}`,
            '/contracts'
          );
        }
      }
    }
  }, [hasRecentNotification, insertNotification]);

  // C) Tax deadline reminders
  const checkTaxReminders = useCallback(async (userId: string) => {
    const country = (currentEntity?.country as CountryCode) || 'CA';
    const config = getCountryConfig(country);
    const today = new Date();
    const currentYear = today.getFullYear();
    const alertDays = [30, 14, 7];

    for (const deadline of config.taxDeadlines) {
      if (deadline.frequency === 'annual' && deadline.month) {
        const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day || 30);
        const daysUntil = differenceInDays(deadlineDate, today);
        if (alertDays.some(d => daysUntil <= d) && daysUntil >= 0) {
          const exists = await hasRecentNotification(userId, 'tax_reminder', deadline.name, 168);
          if (!exists) {
            await insertNotification(
              userId,
              'tax_reminder',
              `🏛️ ${deadline.name}`,
              `Vence en ${daysUntil} día(s) — ${deadline.description}`,
              '/tax-calendar'
            );
          }
        }
      } else if (deadline.frequency === 'monthly' && deadline.day) {
        const month = today.getDate() <= deadline.day ? today.getMonth() : today.getMonth() + 1;
        const nextDeadline = new Date(currentYear, month, deadline.day);
        const daysUntil = differenceInDays(nextDeadline, today);
        if (daysUntil <= 7 && daysUntil >= 0) {
          const exists = await hasRecentNotification(userId, 'tax_reminder', deadline.name, 168);
          if (!exists) {
            await insertNotification(
              userId,
              'tax_reminder',
              `🏛️ ${deadline.name}`,
              `Próximo vencimiento en ${daysUntil} día(s)`,
              '/tax-calendar'
            );
          }
        }
      }
    }
  }, [currentEntity, hasRecentNotification, insertNotification]);

  // D) Budget alert rules
  const checkBudgetAlerts = useCallback(async (userId: string) => {
    const { data: rules } = await supabase
      .from('budget_alert_rules' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!rules?.length) return;

    // Get current month expenses by category
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startStr = startOfMonth.toISOString().split('T')[0];

    const { data: expenses } = await supabase
      .from('expenses')
      .select('category, amount')
      .gte('date', startStr)
      .is('deleted_at', null);

    if (!expenses) return;

    // Sum by category
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || 'other';
      totals[cat] = (totals[cat] || 0) + Number(e.amount);
    }

    for (const rule of rules as any[]) {
      const spent = rule.category ? (totals[rule.category] || 0) : Object.values(totals).reduce((a, b) => a + b, 0);
      let triggered = false;

      if (rule.condition_type === 'exceeds' && spent > rule.threshold_amount) {
        triggered = true;
      } else if (rule.condition_type === 'approaches') {
        const pct = rule.threshold_percentage || 80;
        if (spent >= rule.threshold_amount * (pct / 100)) {
          triggered = true;
        }
      }

      if (triggered) {
        // Check if already triggered today
        const todayStr = new Date().toISOString().split('T')[0];
        if (rule.last_triggered_at && rule.last_triggered_at.startsWith(todayStr)) continue;

        const exists = await hasRecentNotification(userId, 'budget_alert', rule.name, 24);
        if (!exists) {
          await insertNotification(
            userId,
            'budget_alert',
            `⚠️ ${rule.name}`,
            `${rule.category || 'Total'}: $${spent.toFixed(0)} / $${rule.threshold_amount} presupuesto`,
            '/budget'
          );
          // Update last_triggered_at
          await supabase
            .from('budget_alert_rules' as any)
            .update({ last_triggered_at: new Date().toISOString() } as any)
            .eq('id', rule.id);
        }
      }
    }
  }, [hasRecentNotification, insertNotification]);

  // Main check
  const runAllChecks = useCallback(async () => {
    if (!user?.id || runningRef.current) return;
    // Throttle: don't run more than once per 55 seconds
    if (Date.now() - lastRunRef.current < 55_000) return;
    
    runningRef.current = true;
    lastRunRef.current = Date.now();

    try {
      await Promise.allSettled([
        checkBillReminders(user.id),
        checkContractReminders(user.id),
        checkTaxReminders(user.id),
        checkBudgetAlerts(user.id),
      ]);
    } catch (e) {
      console.error('[useAutoReminders] error:', e);
    } finally {
      runningRef.current = false;
    }
  }, [user?.id, checkBillReminders, checkContractReminders, checkTaxReminders, checkBudgetAlerts]);

  useEffect(() => {
    if (!user) return;

    // Run once on mount
    const timeout = setTimeout(runAllChecks, 5_000); // 5s delay on mount
    const interval = setInterval(runAllChecks, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, runAllChecks]);
}
