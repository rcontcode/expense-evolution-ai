import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { getCountryConfig, type CountryCode } from '@/lib/constants/country-tax-config';
import type { NotificationPreference } from './useNotificationPreferences';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Maps repeat_frequency to the anti-duplication window in hours.
 * 'once' = very large window (effectively never re-send)
 * 'daily_until_deadline' = 24h
 * 'weekly' = 168h
 */
function getWithinHours(frequency: string): number {
  switch (frequency) {
    case 'daily_until_deadline': return 24;
    case 'weekly': return 168;
    case 'once':
    default:
      return 999_999; // effectively infinite — one notification per item
  }
}

/**
 * Returns true if the current hour is within ±1 of the preferred hour.
 * If preferredHour is null, always returns true (any time is fine).
 */
function isWithinPreferredHour(preferredHour: number | null): boolean {
  if (preferredHour === null) return true;
  const currentHour = new Date().getHours();
  const diff = Math.abs(currentHour - preferredHour);
  return diff <= 1 || diff >= 23; // handle wrap-around (e.g. 23 vs 0)
}

/**
 * Centralized auto-reminder hook. Checks bills, contracts, tax deadlines,
 * and budget alerts — inserting notifications into the `notifications` table.
 * Respects user preferences from `notification_preferences`.
 */
export function useAutoReminders() {
  const { user } = useAuth();
  const { currentEntity } = useEntity();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const runningRef = useRef(false);
  const lastRunRef = useRef(0);
  const isEs = language === 'es';

  // Fetch user preferences for a given type
  const getPreference = useCallback(async (userId: string, type: string): Promise<NotificationPreference | null> => {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('notification_type', type)
      .maybeSingle();
    return data as unknown as NotificationPreference | null;
  }, []);

  const hasRecentNotification = useCallback(async (
    userId: string, type: string, titleContains: string, withinHours: number
  ): Promise<boolean> => {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .ilike('title', `%${titleContains}%`)
      .gte('created_at', since)
      // Exclude snoozed notifications from duplicate check
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`);
    return (count ?? 0) > 0;
  }, []);

  // Count how many notifications of this type+title exist this month
  const countMonthNotifications = useCallback(async (
    userId: string, type: string, titleContains: string
  ): Promise<number> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .ilike('title', `%${titleContains}%`)
      .gte('created_at', startOfMonth.toISOString());
    return count ?? 0;
  }, []);

  // Check if this specific source has been muted
  const isMuted = useCallback(async (
    userId: string, type: string, titleContains: string
  ): Promise<boolean> => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .eq('muted', true)
      .ilike('title', `%${titleContains}%`);
    return (count ?? 0) > 0;
  }, []);

  const insertNotification = useCallback(async (
    userId: string, type: string, title: string, message: string, actionUrl?: string,
    sourceType?: string, sourceId?: string
  ) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      action_url: actionUrl ?? null,
      read: false,
      source_type: sourceType ?? null,
      source_id: sourceId ?? null,
    });
    if (error) {
      console.warn(`[useAutoReminders] insert failed (${type}):`, error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  // A) Bill reminders
  const checkBillReminders = useCallback(async (userId: string) => {
    const pref = await getPreference(userId, 'bill_reminder');
    if (pref?.enabled === false) return;
    const advanceDays = pref?.advance_days ?? 3;
    const maxReminders = pref?.max_reminders ?? 3;
    const withinHours = getWithinHours(pref?.repeat_frequency ?? 'once');

    // Check preferred hour
    if (!isWithinPreferredHour(pref?.preferred_hour ?? null)) return;

    const { data: bills, error } = await supabase
      .from('recurring_bills')
      .select('id, name, next_due_date, reminder_days_before, amount, currency')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) { console.warn('[useAutoReminders] bills error:', error.message); return; }
    if (!bills?.length) return;
    const today = new Date();

    for (const bill of bills) {
      const muted = await isMuted(userId, 'bill_reminder', bill.name);
      if (muted) continue;

      const dueDate = new Date(bill.next_due_date);
      const daysUntilDue = differenceInDays(dueDate, today);
      const effectiveAdvance = Math.max(bill.reminder_days_before, advanceDays);

      // Upcoming
      if (daysUntilDue <= effectiveAdvance && daysUntilDue >= 0) {
        const monthCount = await countMonthNotifications(userId, 'bill_reminder', bill.name);
        if (monthCount >= maxReminders) continue;
        const exists = await hasRecentNotification(userId, 'bill_reminder', bill.name, withinHours);
        if (!exists) {
          await insertNotification(
            userId, 'bill_reminder', `💳 ${bill.name}`,
            isEs
              ? `Vence en ${daysUntilDue} día(s) — $${bill.amount} ${bill.currency}`
              : `Due in ${daysUntilDue} day(s) — $${bill.amount} ${bill.currency}`,
            '/budget', 'bill', bill.id
          );
        }
      }

      // Overdue (up to -7 days)
      if (daysUntilDue < 0 && daysUntilDue >= -7) {
        const overdueDays = Math.abs(daysUntilDue);
        const exists = await hasRecentNotification(userId, 'bill_reminder', bill.name, withinHours);
        if (!exists) {
          await insertNotification(
            userId, 'bill_reminder', `🚨 ${bill.name}`,
            isEs
              ? `¡Vencido hace ${overdueDays} día(s)! — $${bill.amount} ${bill.currency}`
              : `Overdue by ${overdueDays} day(s)! — $${bill.amount} ${bill.currency}`,
            '/budget', 'bill', bill.id
          );
        }
      }
    }
  }, [getPreference, hasRecentNotification, countMonthNotifications, isMuted, insertNotification, isEs]);

  // B) Contract reminders
  const checkContractReminders = useCallback(async (userId: string) => {
    const pref = await getPreference(userId, 'contract_reminder');
    if (pref?.enabled === false) return;
    const advanceDays = pref?.advance_days ?? 30;
    const maxReminders = pref?.max_reminders ?? 4;
    const withinHours = getWithinHours(pref?.repeat_frequency ?? 'weekly');

    if (!isWithinPreferredHour(pref?.preferred_hour ?? null)) return;

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, title, file_name, end_date, auto_renew, renewal_notice_days')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('end_date', 'is', null);

    if (error) { console.warn('[useAutoReminders] contracts error:', error.message); return; }
    if (!contracts?.length) return;
    const today = new Date();

    for (const c of contracts) {
      const name = c.title || c.file_name;
      const muted = await isMuted(userId, 'contract_reminder', name);
      if (muted) continue;

      const endDate = new Date(c.end_date!);
      const noticeDays = Math.max(c.renewal_notice_days ?? 30, advanceDays);
      const daysUntilEnd = differenceInDays(endDate, today);

      if (daysUntilEnd <= noticeDays && daysUntilEnd >= 0) {
        const monthCount = await countMonthNotifications(userId, 'contract_reminder', name);
        if (monthCount >= maxReminders) continue;
        const exists = await hasRecentNotification(userId, 'contract_reminder', name, withinHours);
        if (!exists) {
          const autoMsg = c.auto_renew
            ? (isEs ? ' (se renovará automáticamente)' : ' (auto-renews)')
            : '';
          await insertNotification(
            userId, 'contract_reminder', `📄 ${name}`,
            isEs ? `Vence en ${daysUntilEnd} día(s)${autoMsg}` : `Expires in ${daysUntilEnd} day(s)${autoMsg}`,
            '/contracts', 'contract', c.id
          );
        }
      }
    }
  }, [getPreference, hasRecentNotification, countMonthNotifications, isMuted, insertNotification, isEs]);

  // C) Tax deadline reminders
  const checkTaxReminders = useCallback(async (userId: string) => {
    const pref = await getPreference(userId, 'tax_reminder');
    if (pref?.enabled === false) return;
    const advanceDays = pref?.advance_days ?? 30;
    const maxReminders = pref?.max_reminders ?? 3;
    const withinHours = getWithinHours(pref?.repeat_frequency ?? 'weekly');

    if (!isWithinPreferredHour(pref?.preferred_hour ?? null)) return;

    const country = (currentEntity?.country as CountryCode) || 'CA';
    const config = getCountryConfig(country);
    const today = new Date();
    const currentYear = today.getFullYear();
    const alertThresholds = [advanceDays, 14, 7].filter(d => d <= advanceDays || d <= 14);

    for (const deadline of config.taxDeadlines) {
      const muted = await isMuted(userId, 'tax_reminder', deadline.name);
      if (muted) continue;

      if (deadline.frequency === 'annual' && deadline.month) {
        const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day || 30);
        const daysUntil = differenceInDays(deadlineDate, today);
        if (alertThresholds.some(d => daysUntil <= d) && daysUntil >= 0) {
          const monthCount = await countMonthNotifications(userId, 'tax_reminder', deadline.name);
          if (monthCount >= maxReminders) continue;
          const exists = await hasRecentNotification(userId, 'tax_reminder', deadline.name, withinHours);
          if (!exists) {
            await insertNotification(
              userId, 'tax_reminder', `🏛️ ${deadline.name}`,
              isEs
                ? `Vence en ${daysUntil} día(s) — ${deadline.description}`
                : `Due in ${daysUntil} day(s) — ${deadline.description}`,
              '/tax-calendar'
            );
          }
        }
      } else if (deadline.frequency === 'monthly' && deadline.day) {
        const month = today.getDate() <= deadline.day ? today.getMonth() : today.getMonth() + 1;
        const nextDeadline = new Date(currentYear, month, deadline.day);
        const daysUntil = differenceInDays(nextDeadline, today);
        if (daysUntil <= 7 && daysUntil >= 0) {
          const exists = await hasRecentNotification(userId, 'tax_reminder', deadline.name, withinHours);
          if (!exists) {
            await insertNotification(
              userId, 'tax_reminder', `🏛️ ${deadline.name}`,
              isEs ? `Próximo vencimiento en ${daysUntil} día(s)` : `Next deadline in ${daysUntil} day(s)`,
              '/tax-calendar'
            );
          }
        }
      }
    }
  }, [currentEntity, getPreference, hasRecentNotification, countMonthNotifications, isMuted, insertNotification, isEs]);

  // D) Budget alert rules
  const checkBudgetAlerts = useCallback(async (userId: string) => {
    const pref = await getPreference(userId, 'budget_alert');
    if (pref?.enabled === false) return;

    if (!isWithinPreferredHour(pref?.preferred_hour ?? null)) return;

    const { data: rules, error: rulesError } = await supabase
      .from('budget_alert_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (rulesError) { console.warn('[useAutoReminders] budget rules error:', rulesError.message); return; }
    if (!rules?.length) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .is('deleted_at', null);

    if (expError) { console.warn('[useAutoReminders] expenses error:', expError.message); return; }
    if (!expenses) return;

    const totals: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || 'other';
      totals[cat] = (totals[cat] || 0) + Number(e.amount);
    }

    const withinHours = getWithinHours(pref?.repeat_frequency ?? 'once');

    for (const rule of rules as any[]) {
      const muted = await isMuted(userId, 'budget_alert', rule.name);
      if (muted) continue;

      const spent = rule.category ? (totals[rule.category] || 0) : Object.values(totals).reduce((a, b) => a + b, 0);
      let triggered = false;

      if (rule.condition_type === 'exceeds' && spent > rule.threshold_amount) triggered = true;
      else if (rule.condition_type === 'approaches') {
        const pct = rule.threshold_percentage || 80;
        if (spent >= rule.threshold_amount * (pct / 100)) triggered = true;
      }

      if (triggered) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (rule.last_triggered_at && rule.last_triggered_at.startsWith(todayStr)) continue;

        const exists = await hasRecentNotification(userId, 'budget_alert', rule.name, withinHours);
        if (!exists) {
          await insertNotification(
            userId, 'budget_alert', `⚠️ ${rule.name}`,
            isEs
              ? `${rule.category || 'Total'}: $${spent.toFixed(0)} / $${rule.threshold_amount} presupuesto`
              : `${rule.category || 'Total'}: $${spent.toFixed(0)} / $${rule.threshold_amount} budget`,
            '/budget', 'budget_rule', rule.id
          );
          await supabase
            .from('budget_alert_rules')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', rule.id);
        }
      }
    }
  }, [getPreference, hasRecentNotification, isMuted, insertNotification, isEs]);

  const runAllChecks = useCallback(async () => {
    if (!user?.id || runningRef.current) return;
    if (Date.now() - lastRunRef.current < 55_000) return;
    
    runningRef.current = true;
    lastRunRef.current = Date.now();

    try {
      const results = await Promise.allSettled([
        checkBillReminders(user.id),
        checkContractReminders(user.id),
        checkTaxReminders(user.id),
        checkBudgetAlerts(user.id),
      ]);
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const names = ['bills', 'contracts', 'tax', 'budget'];
          console.warn(`[useAutoReminders] ${names[i]} check failed:`, r.reason);
        }
      });
    } catch (e) {
      console.error('[useAutoReminders] error:', e);
    } finally {
      runningRef.current = false;
    }
  }, [user?.id, checkBillReminders, checkContractReminders, checkTaxReminders, checkBudgetAlerts]);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(runAllChecks, 5_000);
    const interval = setInterval(runAllChecks, CHECK_INTERVAL_MS);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [user, runAllChecks]);
}
