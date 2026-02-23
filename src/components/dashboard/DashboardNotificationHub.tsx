import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useExpenseCompleteness } from '@/hooks/utils/useExpenseCompleteness';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { useDataHealthCheck } from '@/hooks/data/useDataHealthCheck';
import { Button } from '@/components/ui/button';
import {
  Bell, CheckCircle2, Clock, ChevronDown, ChevronUp,
  AlertTriangle, Receipt, ArrowRight, X,
  Info, Trophy, Flame, Target, Sparkles,
  FileText, CreditCard, Shield, TrendingUp, Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays, isPast, isBefore, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──────────────────────────────────────────────
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
  snoozed_until: string | null;
  completed_at: string | null;
  muted: boolean;
}

interface SmartAlert {
  id: string;
  emoji: string;
  icon: React.ElementType;
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  colorClass: string;
  bgClass: string;
  priority: number;
}

// ── Constants ──────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ElementType> = {
  achievement: Trophy, level_up: Flame, streak_milestone: Target,
  bill_reminder: AlertTriangle, contract_reminder: Clock,
  tax_reminder: AlertTriangle, budget_alert: Info,
};
const TYPE_COLORS: Record<string, string> = {
  achievement: 'text-amber-500', level_up: 'text-orange-500',
  streak_milestone: 'text-emerald-500', bill_reminder: 'text-red-500',
  contract_reminder: 'text-blue-500', tax_reminder: 'text-red-400',
  budget_alert: 'text-amber-400',
};

const TOOLS_ES = [
  { icon: '📊', label: 'Presupuestos inteligentes' },
  { icon: '📈', label: 'Análisis de tendencias' },
  { icon: '🎯', label: 'Metas de ahorro' },
  { icon: '🧮', label: 'Cálculos fiscales' },
  { icon: '🛡️', label: 'Alertas proactivas' },
  { icon: '🔥', label: 'Proyecciones financieras' },
];
const TOOLS_EN = [
  { icon: '📊', label: 'Smart budgets' },
  { icon: '📈', label: 'Trend analysis' },
  { icon: '🎯', label: 'Savings goals' },
  { icon: '🧮', label: 'Tax calculations' },
  { icon: '🛡️', label: 'Proactive alerts' },
  { icon: '🔥', label: 'Financial projections' },
];

// ── Dismiss helpers (localStorage, 24h cooldown) ──────
const DISMISS_KEY = 'smart_alerts_dismissed';
function getDismissed(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}'); } catch { return {}; }
}
function isDismissed(id: string): boolean {
  const d = getDismissed()[id];
  if (!d) return false;
  return Date.now() - d < 24 * 60 * 60 * 1000;
}
function dismissAlert(id: string) {
  const d = getDismissed();
  d[id] = Date.now();
  localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
}

// ── Component ─────────────────────────────────────────
export function DashboardNotificationHub() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const l = language === 'es';
  const [expanded, setExpanded] = useState(false);
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(() => {
    const d = getDismissed();
    return new Set(Object.keys(d).filter(k => isDismissed(k)));
  });

  // ── Data hooks ──
  const { shouldShowPrompt, isConfirmed, looksIncomplete, expenseCount, confirmUpToDate, snoozeUntil } = useExpenseCompleteness();
  const { pendingDocuments, incompleteExpenses, expenseMissingReceipt, expensePendingClassification, expenseNoCategory, totalClients, totalIncomes } = useNudgeSystem();
  const { data: bills = [] } = useRecurringBills();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: healthData } = useDataHealthCheck();

  // ── DB Notifications ──
  const { data: notifications = [] } = useQuery({
    queryKey: ['dashboard-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications').select('*')
        .eq('user_id', user.id).eq('read', false).eq('muted', false)
        .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
        .is('completed_at', null)
        .order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user, refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ read: true } as any).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  // ── Smart Alerts ──
  const smartAlerts = useMemo(() => {
    const alerts: SmartAlert[] = [];
    const now = new Date();

    // 1. Pending documents
    if (pendingDocuments > 0) {
      alerts.push({
        id: 'pending_docs',
        emoji: '📄',
        icon: FileText,
        title: l ? `${pendingDocuments} documento${pendingDocuments > 1 ? 's' : ''} pendiente${pendingDocuments > 1 ? 's' : ''}` : `${pendingDocuments} pending document${pendingDocuments > 1 ? 's' : ''}`,
        message: l ? 'Clasifícalos para vincularlos a gastos automáticamente' : 'Classify them to auto-link to expenses',
        actionUrl: '/documents',
        actionLabel: l ? 'Revisar' : 'Review',
        colorClass: 'text-violet-500',
        bgClass: 'bg-violet-500/10',
        priority: 1,
      });
    }

    // 2. Incomplete expenses
    if (incompleteExpenses > 0) {
      alerts.push({
        id: 'incomplete_expenses',
        emoji: '⚠️',
        icon: AlertTriangle,
        title: l ? `${incompleteExpenses} gasto${incompleteExpenses > 1 ? 's' : ''} incompleto${incompleteExpenses > 1 ? 's' : ''}` : `${incompleteExpenses} incomplete expense${incompleteExpenses > 1 ? 's' : ''}`,
        message: l ? 'Faltan categoría o proveedor — afecta reportes y presupuestos' : 'Missing category or vendor — affects reports & budgets',
        actionUrl: '/expenses',
        actionLabel: l ? 'Completar' : 'Complete',
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10',
        priority: 2,
      });
    }

    // 3. Overdue / upcoming bills
    const overdueBills = bills.filter(b => b.status === 'active' && isPast(new Date(b.next_due_date)));
    const upcomingBills = bills.filter(b => b.status === 'active' && !isPast(new Date(b.next_due_date)) && isBefore(new Date(b.next_due_date), addDays(now, 3)));

    if (overdueBills.length > 0) {
      alerts.push({
        id: 'overdue_bills',
        emoji: '🚨',
        icon: CreditCard,
        title: l ? `${overdueBills.length} cuenta${overdueBills.length > 1 ? 's' : ''} vencida${overdueBills.length > 1 ? 's' : ''}` : `${overdueBills.length} overdue bill${overdueBills.length > 1 ? 's' : ''}`,
        message: l ? `${overdueBills.map(b => b.name).slice(0, 2).join(', ')}${overdueBills.length > 2 ? '...' : ''}` : `${overdueBills.map(b => b.name).slice(0, 2).join(', ')}${overdueBills.length > 2 ? '...' : ''}`,
        actionUrl: '/bills',
        actionLabel: l ? 'Pagar' : 'Pay now',
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        priority: 0,
      });
    } else if (upcomingBills.length > 0) {
      alerts.push({
        id: 'upcoming_bills',
        emoji: '📅',
        icon: CreditCard,
        title: l ? `${upcomingBills.length} cuenta${upcomingBills.length > 1 ? 's' : ''} próxima${upcomingBills.length > 1 ? 's' : ''}` : `${upcomingBills.length} bill${upcomingBills.length > 1 ? 's' : ''} due soon`,
        message: l ? `Vence${upcomingBills.length > 1 ? 'n' : ''} en los próximos 3 días` : `Due within the next 3 days`,
        actionUrl: '/bills',
        actionLabel: l ? 'Ver' : 'View',
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10',
        priority: 1,
      });
    }

    // 4. Savings goals at risk
    const atRiskGoals = savingsGoals.filter(g => {
      if (g.status !== 'active' || !g.deadline) return false;
      const daysLeft = differenceInDays(new Date(g.deadline), now);
      if (daysLeft < 0 || daysLeft > 30) return false;
      const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      return progress < 80;
    });

    if (atRiskGoals.length > 0) {
      const g = atRiskGoals[0];
      const daysLeft = differenceInDays(new Date(g.deadline!), now);
      const pct = Math.round((g.current_amount / g.target_amount) * 100);
      alerts.push({
        id: `goal_risk_${g.id}`,
        emoji: '🎯',
        icon: Target,
        title: l ? `Meta "${g.name}" en riesgo` : `Goal "${g.name}" at risk`,
        message: l ? `Vence en ${daysLeft} días y vas al ${pct}%` : `Due in ${daysLeft} days, ${pct}% progress`,
        actionUrl: '/goals',
        actionLabel: l ? 'Aportar' : 'Contribute',
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-600/10',
        priority: 2,
      });
    }

    // 5. Data health issues — consolidated from DB + expense-level issues
    const dbIssueCount = healthData?.totalIssues || 0;
    const detailParts: string[] = [];

    // DB-level issues (orphaned records)
    if (healthData && dbIssueCount > 0) {
      for (const type of Object.keys(healthData.grouped)) {
        const count = healthData.grouped[type].length;
        const label = l ? healthData.labels[type]?.es : healthData.labels[type]?.en;
        if (label) detailParts.push(`${count} ${label.toLowerCase()}`);
      }
    }

    // Expense-level issues
    if (expenseMissingReceipt > 0) detailParts.push(l ? `${expenseMissingReceipt} sin recibo` : `${expenseMissingReceipt} missing receipt`);
    if (expensePendingClassification > 0) detailParts.push(l ? `${expensePendingClassification} sin clasificar` : `${expensePendingClassification} unclassified`);
    if (expenseNoCategory > 0) detailParts.push(l ? `${expenseNoCategory} sin categoría` : `${expenseNoCategory} no category`);

    const totalHealthIssues = dbIssueCount + expenseMissingReceipt + expensePendingClassification + expenseNoCategory;

    if (totalHealthIssues > 0) {
      alerts.push({
        id: 'data_health',
        emoji: '🛡️',
        icon: Shield,
        title: l ? `${totalHealthIssues} problema${totalHealthIssues > 1 ? 's' : ''} de integridad` : `${totalHealthIssues} data integrity issue${totalHealthIssues > 1 ? 's' : ''}`,
        message: detailParts.join(', '),
        actionUrl: '/data-health',
        actionLabel: l ? 'Ver reporte' : 'View report',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-400/10',
        priority: 3,
      });
    }

    // 6. No income this month
    if (totalIncomes === 0 && incompleteExpenses === 0 && pendingDocuments === 0) {
      alerts.push({
        id: 'no_income',
        emoji: '💰',
        icon: TrendingUp,
        title: l ? 'Sin ingresos registrados' : 'No income recorded',
        message: l ? 'Registra ingresos para análisis de flujo completo' : 'Log income for complete cash flow analysis',
        actionUrl: '/income',
        actionLabel: l ? 'Agregar' : 'Add',
        colorClass: 'text-blue-500',
        bgClass: 'bg-blue-500/10',
        priority: 5,
      });
    }

    // 7. No clients (onboarding)
    if (totalClients === 0) {
      alerts.push({
        id: 'no_clients',
        emoji: '👥',
        icon: Users,
        title: l ? 'Agrega tu primer cliente' : 'Add your first client',
        message: l ? 'Desbloquea facturación, contratos y reportes por cliente' : 'Unlock invoicing, contracts & per-client reports',
        actionUrl: '/clients',
        actionLabel: l ? 'Crear' : 'Create',
        colorClass: 'text-indigo-500',
        bgClass: 'bg-indigo-500/10',
        priority: 6,
      });
    }

    return alerts
      .filter(a => !localDismissed.has(a.id))
      .sort((a, b) => a.priority - b.priority);
  }, [pendingDocuments, incompleteExpenses, expenseMissingReceipt, expensePendingClassification, expenseNoCategory, bills, savingsGoals, healthData, totalClients, totalIncomes, l, localDismissed]);

  const handleDismiss = useCallback((id: string) => {
    dismissAlert(id);
    setLocalDismissed(prev => new Set([...prev, id]));
  }, []);

  // ── Counts ──
  const totalItems = smartAlerts.length + notifications.length + (shouldShowPrompt ? 1 : 0);
  const hasItems = totalItems > 0;
  const tools = l ? TOOLS_ES : TOOLS_EN;

  // ── All caught up ──
  if (!hasItems && isConfirmed) {
    return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-teal-500/10 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/10 via-transparent to-transparent" />
        <div className="relative flex items-center justify-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/20 animate-pulse">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
              {l ? '✨ ¡Todo al día!' : '✨ All caught up!'}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              {l ? 'Tus herramientas financieras están al máximo rendimiento 🚀' : 'Your financial tools are at peak performance 🚀'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!hasItems) return null;

  const visibleNotifications = expanded ? notifications : notifications.slice(0, 2);
  const visibleAlerts = expanded ? smartAlerts : smartAlerts.slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-lg shadow-primary/5 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/15">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            {totalItems > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg shadow-destructive/30">
                {totalItems}
              </motion.span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              🔔 {l ? 'Centro de Avisos' : 'Notification Center'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {l ? 'Mantén todo actualizado para mejores resultados' : 'Keep everything updated for better results'}
            </p>
          </div>
        </div>
        {!expanded && (smartAlerts.length + notifications.length) > 3 && (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/10"
            onClick={() => setExpanded(true)}>
            {l ? `Ver todo (${totalItems})` : `View all (${totalItems})`}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/20">
        {/* Data completeness prompt */}
        {shouldShowPrompt && (
          <CompletenessPrompt l={l} looksIncomplete={looksIncomplete} expenseCount={expenseCount}
            confirmUpToDate={confirmUpToDate} snoozeUntil={snoozeUntil} tools={tools} />
        )}

        {/* Smart Alerts */}
        <AnimatePresence>
          {visibleAlerts.map((alert, i) => (
            <SmartAlertRow key={alert.id} alert={alert} index={i} l={l}
              onAction={() => navigate(alert.actionUrl)}
              onDismiss={() => handleDismiss(alert.id)} />
          ))}
        </AnimatePresence>

        {/* DB Notifications */}
        <AnimatePresence>
          {visibleNotifications.map((n, i) => (
            <NotificationRow key={n.id} notification={n} index={i} l={l}
              onAction={() => { markRead.mutate(n.id); if (n.action_url) navigate(n.action_url); }}
              onDismiss={() => markRead.mutate(n.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Show more / less */}
      {(smartAlerts.length + notifications.length) > 3 && (
        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all border-t border-border/30">
          {expanded
            ? (l ? 'Mostrar menos' : 'Show less')
            : (l ? `📬 Ver ${(smartAlerts.length + notifications.length) - 3} más` : `📬 Show ${(smartAlerts.length + notifications.length) - 3} more`)}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────

function SmartAlertRow({ alert, index, l, onAction, onDismiss }: {
  alert: SmartAlert; index: number; l: boolean;
  onAction: () => void; onDismiss: () => void;
}) {
  const Icon = alert.icon;
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }} transition={{ delay: index * 0.05 }}
      className={cn("flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group", alert.bgClass)}>
      <div className={cn("flex items-center justify-center h-9 w-9 rounded-xl shrink-0", alert.bgClass)}>
        <span className="text-lg">{alert.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold truncate", alert.colorClass)}>{alert.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{alert.message}</p>
      </div>
      <Button size="sm" variant="outline" className={cn("h-7 text-[11px] px-3 shrink-0 border-current/20", alert.colorClass)}
        onClick={onAction}>
        {alert.actionLabel}
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onDismiss}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}

function NotificationRow({ notification: n, index, l, onAction, onDismiss }: {
  notification: Notification; index: number; l: boolean;
  onAction: () => void; onDismiss: () => void;
}) {
  const Icon = TYPE_ICONS[n.type] || Info;
  const iconColor = TYPE_COLORS[n.type] || 'text-muted-foreground';
  const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: l ? es : enUS });

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }} transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-muted/50 shrink-0">
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
      </div>
      <span className="text-[10px] text-muted-foreground/50 shrink-0 hidden sm:block">{timeAgo}</span>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {n.action_url && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onAction}>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function CompletenessPrompt({ l, looksIncomplete, expenseCount, confirmUpToDate, snoozeUntil, tools }: {
  l: boolean; looksIncomplete: boolean; expenseCount: number;
  confirmUpToDate: () => void; snoozeUntil: (option: string) => void;
  tools: { icon: string; label: string }[];
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={cn("px-5 py-4", looksIncomplete
        ? "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent"
        : "bg-gradient-to-r from-blue-500/8 via-indigo-500/5 to-transparent"
      )}>
      <div className="flex items-start gap-4 mb-4">
        <div className={cn("flex items-center justify-center h-12 w-12 rounded-2xl shrink-0 shadow-lg",
          looksIncomplete
            ? "bg-gradient-to-br from-amber-500/30 to-orange-500/20 shadow-amber-500/20"
            : "bg-gradient-to-br from-blue-500/25 to-indigo-500/15 shadow-blue-500/20"
        )}>
          <span className="text-2xl">{looksIncomplete ? '⚠️' : '📋'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-bold mb-1",
            looksIncomplete ? "text-amber-700 dark:text-amber-400" : "text-foreground"
          )}>
            {looksIncomplete
              ? (l ? `📊 Solo ${expenseCount} gastos registrados este mes` : `📊 Only ${expenseCount} expenses logged this month`)
              : (l ? '📋 ¿Tus gastos del mes están completos?' : '📋 Are your monthly expenses complete?')
            }
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {l ? 'Mantener tus gastos al día desbloquea el poder real de tus herramientas financieras:'
              : 'Keeping expenses up to date unlocks the full power of your financial tools:'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
            {tools.map((tool, i) => (
              <motion.div key={tool.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium",
                  looksIncomplete ? "bg-amber-500/8 text-amber-700/80 dark:text-amber-400/80" : "bg-primary/5 text-muted-foreground"
                )}>
                <span>{tool.icon}</span>
                <span className="truncate">{tool.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={confirmUpToDate}
          className="h-9 text-xs gap-2 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          {l ? '✅ Sí, estoy al día' : '✅ Yes, I\'m up to date'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => snoozeUntil('working')} className="h-9 text-xs gap-2 px-4 border-primary/20">
          <Receipt className="h-3.5 w-3.5" />
          {l ? '🔄 Estoy en eso' : '🔄 Working on it'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-9 text-xs gap-1.5 px-3 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {l ? '⏰ Recordar...' : '⏰ Remind me...'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => snoozeUntil('tomorrow')}>🕐 {l ? 'Mañana' : 'Tomorrow'}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => snoozeUntil('3days')}>📅 {l ? 'En 3 días' : 'In 3 days'}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => snoozeUntil('weekend')}>🗓️ {l ? 'El fin de semana' : 'This weekend'}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => snoozeUntil('endofmonth')}>📆 {l ? 'Al final del mes' : 'End of month'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
