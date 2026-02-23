import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useExpenseCompleteness } from '@/hooks/utils/useExpenseCompleteness';
import { Button } from '@/components/ui/button';
import {
  Bell, CheckCircle2, Clock, ChevronDown, ChevronUp,
  AlertTriangle, Receipt, ArrowRight, X,
  Info, Trophy, Flame, Target, Sparkles,
  BarChart3, PieChart, TrendingUp, Calculator, Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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

const TYPE_ICONS: Record<string, React.ElementType> = {
  achievement: Trophy,
  level_up: Flame,
  streak_milestone: Target,
  bill_reminder: AlertTriangle,
  contract_reminder: Clock,
  tax_reminder: AlertTriangle,
  budget_alert: Info,
};

const TYPE_COLORS: Record<string, string> = {
  achievement: 'text-amber-500',
  level_up: 'text-orange-500',
  streak_milestone: 'text-emerald-500',
  bill_reminder: 'text-red-500',
  contract_reminder: 'text-blue-500',
  tax_reminder: 'text-red-400',
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

export function DashboardNotificationHub() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const l = language === 'es';
  const [expanded, setExpanded] = useState(false);

  const {
    shouldShowPrompt,
    isConfirmed,
    looksIncomplete,
    expenseCount,
    confirmUpToDate,
    snoozeUntil,
  } = useExpenseCompleteness();

  // Fetch recent unread notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['dashboard-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .eq('muted', false)
        .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Mark as read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ read: true } as any).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const totalItems = notifications.length + (shouldShowPrompt ? 1 : 0);
  const hasItems = totalItems > 0;
  const tools = l ? TOOLS_ES : TOOLS_EN;

  // ✅ All caught up state
  if (!hasItems && isConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-teal-500/10 p-4"
      >
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-lg shadow-primary/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/15">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg shadow-destructive/30"
              >
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
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/10"
          onClick={() => navigate('/notifications')}
        >
          {l ? 'Ver todo' : 'View all'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/20">
        {/* Data completeness prompt — hero section */}
        {shouldShowPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "px-5 py-4",
              looksIncomplete
                ? "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent"
                : "bg-gradient-to-r from-blue-500/8 via-indigo-500/5 to-transparent"
            )}
          >
            {/* Main prompt */}
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "flex items-center justify-center h-12 w-12 rounded-2xl shrink-0 shadow-lg",
                looksIncomplete
                  ? "bg-gradient-to-br from-amber-500/30 to-orange-500/20 shadow-amber-500/20"
                  : "bg-gradient-to-br from-blue-500/25 to-indigo-500/15 shadow-blue-500/20"
              )}>
                <span className="text-2xl">{looksIncomplete ? '⚠️' : '📋'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "text-sm font-bold mb-1",
                  looksIncomplete ? "text-amber-700 dark:text-amber-400" : "text-foreground"
                )}>
                  {looksIncomplete
                    ? (l ? `📊 Solo ${expenseCount} gastos registrados este mes` : `📊 Only ${expenseCount} expenses logged this month`)
                    : (l ? '📋 ¿Tus gastos del mes están completos?' : '📋 Are your monthly expenses complete?')
                  }
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {l
                    ? 'Mantener tus gastos al día desbloquea el poder real de tus herramientas financieras:'
                    : 'Keeping expenses up to date unlocks the full power of your financial tools:'}
                </p>

                {/* Tools that depend on completeness */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                  {tools.map((tool, i) => (
                    <motion.div
                      key={tool.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium",
                        looksIncomplete
                          ? "bg-amber-500/8 text-amber-700/80 dark:text-amber-400/80"
                          : "bg-primary/5 text-muted-foreground"
                      )}
                    >
                      <span>{tool.icon}</span>
                      <span className="truncate">{tool.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={confirmUpToDate}
                className="h-9 text-xs gap-2 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25 font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                {l ? '✅ Sí, estoy al día' : '✅ Yes, I\'m up to date'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => snoozeUntil('working')}
                className="h-9 text-xs gap-2 px-4 border-primary/20"
              >
                <Receipt className="h-3.5 w-3.5" />
                {l ? '🔄 Estoy en eso' : '🔄 Working on it'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-xs gap-1.5 px-3 text-muted-foreground"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {l ? '⏰ Recordar...' : '⏰ Remind me...'}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => snoozeUntil('tomorrow')}>
                    🕐 {l ? 'Mañana' : 'Tomorrow'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snoozeUntil('3days')}>
                    📅 {l ? 'En 3 días' : 'In 3 days'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snoozeUntil('weekend')}>
                    🗓️ {l ? 'El fin de semana' : 'This weekend'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snoozeUntil('endofmonth')}>
                    📆 {l ? 'Al final del mes' : 'End of month'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}

        {/* DB Notifications */}
        <AnimatePresence>
          {visibleNotifications.map((n, i) => {
            const Icon = TYPE_ICONS[n.type] || Info;
            const iconColor = TYPE_COLORS[n.type] || 'text-muted-foreground';
            const timeAgo = formatDistanceToNow(new Date(n.created_at), {
              addSuffix: true,
              locale: l ? es : enUS,
            });

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group"
              >
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        markRead.mutate(n.id);
                        navigate(n.action_url!);
                      }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => markRead.mutate(n.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more / less */}
      {notifications.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all border-t border-border/30"
        >
          {expanded
            ? (l ? 'Mostrar menos' : 'Show less')
            : (l ? `📬 Ver ${notifications.length - 2} más` : `📬 Show ${notifications.length - 2} more`)}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}
    </motion.div>
  );
}
