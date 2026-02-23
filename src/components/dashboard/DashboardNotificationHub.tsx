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
  AlertTriangle, Receipt, ArrowRight, X, Eye, Volume2, VolumeX,
  Info, Trophy, Flame, Target
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

  // Nothing to show — confirmed and no notifications
  if (!hasItems && isConfirmed) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-medium">{l ? '¡Todo al día!' : 'All caught up!'}</span>
      </div>
    );
  }

  if (!hasItems) return null;

  const visibleNotifications = expanded ? notifications : notifications.slice(0, 2);

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {l ? 'Centro de avisos' : 'Notification center'}
          </span>
          {totalItems > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {totalItems}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => navigate('/notifications')}
            >
              {l ? 'Ver todo' : 'View all'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/30">
        {/* Data completeness prompt — always first if showing */}
        {shouldShowPrompt && (
          <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
            <div className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
              looksIncomplete ? "bg-amber-500/15" : "bg-muted/50"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4",
                looksIncomplete ? "text-amber-500" : "text-muted-foreground"
              )} />
            </div>
            <span className="flex-1 text-xs text-muted-foreground leading-snug">
              {looksIncomplete
                ? (l
                    ? `Solo ${expenseCount} gastos este mes — ¿estás al día?`
                    : `Only ${expenseCount} expenses this month — are you caught up?`)
                : (l
                    ? '¿Tus gastos del mes están completos?'
                    : 'Are your monthly expenses complete?')
              }
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={confirmUpToDate} className="h-6 text-[11px] gap-1 px-2">
                <CheckCircle2 className="h-3 w-3" />
                {l ? 'Al día' : 'Up to date'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => snoozeUntil('working')} className="h-6 text-[11px] gap-1 px-2 text-muted-foreground">
                <Receipt className="h-3 w-3" />
                {l ? 'En eso' : 'On it'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => snoozeUntil('tomorrow')}>
                    {l ? 'Recordar mañana' : 'Remind tomorrow'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snoozeUntil('3days')}>
                    {l ? 'En 3 días' : 'In 3 days'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snoozeUntil('weekend')}>
                    {l ? 'El fin de semana' : 'This weekend'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => snoozeUntil('endofmonth')}>
                    {l ? 'Al final del mes' : 'End of month'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* DB Notifications */}
        {visibleNotifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] || Info;
          const iconColor = TYPE_COLORS[n.type] || 'text-muted-foreground';
          const timeAgo = formatDistanceToNow(new Date(n.created_at), {
            addSuffix: true,
            locale: l ? es : enUS,
          });

          return (
            <div
              key={n.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/40 shrink-0">
                <Icon className={cn("h-4 w-4", iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 hidden sm:block">{timeAgo}</span>
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {n.action_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      markRead.mutate(n.id);
                      navigate(n.action_url!);
                    }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground"
                  onClick={() => markRead.mutate(n.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / less */}
      {notifications.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors border-t border-border/30"
        >
          {expanded
            ? (l ? 'Mostrar menos' : 'Show less')
            : (l ? `Ver ${notifications.length - 2} más` : `Show ${notifications.length - 2} more`)}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}
