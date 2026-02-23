import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth, addHours, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Trophy, Target, TrendingUp, Clock, CheckCheck, Trash2, Sparkles, ArrowUpRight,
  Filter, BellOff, Flame, AlertTriangle, Lightbulb, Calendar, Receipt, Wallet, PiggyBank,
  Car, FileText, Settings, Info, Zap, Shield, AlarmClockOff, CheckCircle, VolumeX,
  MoreHorizontal, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useSnoozeNotification, useCompleteNotification, useMuteNotification } from '@/hooks/data/useNotificationActions';
import { ReminderPreferencesPanel } from '@/components/notifications/ReminderPreferencesPanel';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
  snoozed_until?: string | null;
  completed_at?: string | null;
  muted?: boolean;
}

const NOTIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  achievement: Trophy, level_up: Sparkles, goal_complete: Target, savings_goal: Target,
  investment_goal: TrendingUp, goal_deadline: Clock, streak: Flame, reminder: Calendar,
  expense: Receipt, income: Wallet, savings: PiggyBank, mileage: Car, contract: FileText,
  tip: Lightbulb, alert: AlertTriangle, bill_reminder: Wallet, contract_reminder: FileText,
  tax_reminder: Calendar, budget_alert: AlertTriangle, default: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  achievement: 'text-amber-500 bg-amber-500/10', level_up: 'text-purple-500 bg-purple-500/10',
  goal_complete: 'text-green-500 bg-green-500/10', savings_goal: 'text-blue-500 bg-blue-500/10',
  investment_goal: 'text-emerald-500 bg-emerald-500/10', goal_deadline: 'text-orange-500 bg-orange-500/10',
  streak: 'text-red-500 bg-red-500/10', reminder: 'text-cyan-500 bg-cyan-500/10',
  expense: 'text-rose-500 bg-rose-500/10', income: 'text-green-500 bg-green-500/10',
  savings: 'text-blue-500 bg-blue-500/10', mileage: 'text-indigo-500 bg-indigo-500/10',
  contract: 'text-violet-500 bg-violet-500/10', tip: 'text-yellow-500 bg-yellow-500/10',
  alert: 'text-destructive bg-destructive/10', bill_reminder: 'text-blue-500 bg-blue-500/10',
  contract_reminder: 'text-violet-500 bg-violet-500/10', tax_reminder: 'text-cyan-500 bg-cyan-500/10',
  budget_alert: 'text-amber-500 bg-amber-500/10', default: 'text-muted-foreground bg-muted',
};

const REMINDER_TYPES = ['bill_reminder', 'contract_reminder', 'tax_reminder', 'budget_alert'];

export default function Notifications() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'achievements' | 'goals' | 'reminders'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const isEs = language === 'es';

  const snooze = useSnoozeNotification();
  const complete = useCompleteNotification();
  const mute = useMuteNotification();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]).map(n => ({
        ...n,
        snoozed_until: n.snoozed_until ?? null,
        completed_at: n.completed_at ?? null,
        muted: n.muted ?? false,
      })) as Notification[];
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAllNotifications = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from('notifications').delete().eq('user_id', user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Filter: hide snoozed (unless snooze time has passed) and completed
  const visibleNotifications = notifications?.filter(n => {
    if (n.completed_at) return false;
    if (n.snoozed_until && new Date(n.snoozed_until) > new Date()) return false;
    return true;
  });

  const filteredNotifications = visibleNotifications?.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'achievements') return n.type === 'achievement' || n.type === 'level_up' || n.type === 'streak';
    if (filter === 'goals') return n.type.includes('goal') || n.type === 'savings' || n.type === 'investment_goal';
    if (filter === 'reminders') return REMINDER_TYPES.includes(n.type);
    return true;
  });

  const unreadCount = visibleNotifications?.filter(n => !n.read).length || 0;

  const groupedNotifications = filteredNotifications?.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    let groupKey: string;
    if (isToday(date)) groupKey = isEs ? 'Hoy' : 'Today';
    else if (isYesterday(date)) groupKey = isEs ? 'Ayer' : 'Yesterday';
    else if (isThisWeek(date)) groupKey = isEs ? 'Esta semana' : 'This week';
    else if (isThisMonth(date)) groupKey = isEs ? 'Este mes' : 'This month';
    else groupKey = isEs ? 'Anteriores' : 'Earlier';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead.mutate(notification.id);
    if (notification.action_url) navigate(notification.action_url);
  };

  const getNotificationIcon = (type: string) => NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
  const getNotificationColor = (type: string) => NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return formatDistanceToNow(date, { addSuffix: true, locale: isEs ? es : enUS });
    return format(date, 'PP', { locale: isEs ? es : enUS });
  };

  const isReminderType = (type: string) => REMINDER_TYPES.includes(type);

  return (
    <Layout>
      <div className="page-container max-w-4xl mx-auto section-gap">
        <PageHeader
          title={isEs ? 'Notificaciones' : 'Notifications'}
          description={isEs ? 'Tu historial de logros, alertas y recordatorios' : 'Your history of achievements, alerts and reminders'}
        >
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            {isEs ? 'Configurar' : 'Settings'}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              {isEs ? 'Marcar todo leído' : 'Mark all read'}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {isEs ? 'Limpiar' : 'Clear'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isEs ? '¿Eliminar todas las notificaciones?' : 'Delete all notifications?'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isEs ? 'Esta acción no se puede deshacer.' : 'This action cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isEs ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearAllNotifications.mutate()}>
                  {isEs ? 'Eliminar todo' : 'Delete all'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PageHeader>

        {/* Settings Panel (collapsible) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ReminderPreferencesPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/20"><Bell className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-xl font-bold">{visibleNotifications?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20"><Clock className="h-4 w-4 text-blue-500" /></div>
                <div>
                  <p className="text-xl font-bold">{unreadCount}</p>
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'Sin leer' : 'Unread'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20"><Trophy className="h-4 w-4 text-amber-500" /></div>
                <div>
                  <p className="text-xl font-bold">{visibleNotifications?.filter(n => n.type === 'achievement' || n.type === 'level_up').length || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'Logros' : 'Achievements'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/20"><Target className="h-4 w-4 text-green-500" /></div>
                <div>
                  <p className="text-xl font-bold">{visibleNotifications?.filter(n => n.type.includes('goal')).length || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'Metas' : 'Goals'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />{isEs ? 'Todas' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Clock className="h-4 w-4" />{isEs ? 'Sin leer' : 'Unread'}
              {unreadCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4" />{isEs ? 'Recordatorios' : 'Reminders'}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />{isEs ? 'Logros' : 'Achievements'}
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />{isEs ? 'Metas' : 'Goals'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedNotifications && Object.keys(groupedNotifications).length > 0 ? (
              <AnimatePresence>
                {Object.entries(groupedNotifications).map(([group, groupNotifications], groupIndex) => (
                  <motion.div key={group} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: groupIndex * 0.1 }}>
                    <div className="px-4 py-2 bg-muted/30 border-b sticky top-0 z-10">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</h3>
                    </div>
                    <div className="divide-y">
                      {groupNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const colorClass = getNotificationColor(notification.type);
                        const isReminder = isReminderType(notification.type);
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors cursor-pointer group",
                              !notification.read && "bg-primary/5",
                              notification.muted && "opacity-50"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <motion.div className={cn("p-2 rounded-lg", colorClass)} whileHover={{ scale: 1.1 }}>
                              <Icon className="h-5 w-5" />
                            </motion.div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                                    {notification.title}
                                    {notification.muted && (
                                      <Badge variant="secondary" className="ml-2 text-[10px]">
                                        <VolumeX className="h-2.5 w-2.5 mr-0.5" />
                                        {isEs ? 'Silenciado' : 'Muted'}
                                      </Badge>
                                    )}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
                                  {!notification.read && (
                                    <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                                  )}
                                </div>
                              </div>
                              
                              {notification.action_url && (
                                <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}>
                                  {isEs ? 'Ver detalles' : 'View details'}
                                  <ArrowUpRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {/* Snooze submenu */}
                                {isReminder && (
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="gap-2">
                                      <Timer className="h-4 w-4" />
                                      {isEs ? 'Posponer' : 'Snooze'}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuItem onClick={() => snooze.mutate({ id: notification.id, snoozeUntil: addHours(new Date(), 1) })}>
                                        {isEs ? '1 hora' : '1 hour'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => snooze.mutate({ id: notification.id, snoozeUntil: addHours(new Date(), 3) })}>
                                        {isEs ? '3 horas' : '3 hours'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => snooze.mutate({ id: notification.id, snoozeUntil: addDays(new Date(), 1) })}>
                                        {isEs ? 'Mañana' : 'Tomorrow'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => snooze.mutate({ id: notification.id, snoozeUntil: addDays(new Date(), 3) })}>
                                        {isEs ? 'En 3 días' : 'In 3 days'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => snooze.mutate({ id: notification.id, snoozeUntil: addDays(new Date(), 7) })}>
                                        {isEs ? 'En 1 semana' : 'In 1 week'}
                                      </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                )}

                                {/* Mark as completed */}
                                {isReminder && (
                                  <DropdownMenuItem className="gap-2" onClick={() => complete.mutate(notification.id)}>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    {isEs ? 'Ya lo hice' : 'Mark as done'}
                                  </DropdownMenuItem>
                                )}

                                {/* Mute future */}
                                {isReminder && !notification.muted && (
                                  <DropdownMenuItem className="gap-2" onClick={() => mute.mutate(notification.id)}>
                                    <VolumeX className="h-4 w-4 text-orange-500" />
                                    {isEs ? 'Silenciar futuros' : 'Mute future'}
                                  </DropdownMenuItem>
                                )}

                                {isReminder && <DropdownMenuSeparator />}

                                {/* Mark as read */}
                                {!notification.read && (
                                  <DropdownMenuItem className="gap-2" onClick={() => markAsRead.mutate(notification.id)}>
                                    <CheckCheck className="h-4 w-4" />
                                    {isEs ? 'Marcar leída' : 'Mark as read'}
                                  </DropdownMenuItem>
                                )}

                                {/* Delete */}
                                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => deleteNotification.mutate(notification.id)}>
                                  <Trash2 className="h-4 w-4" />
                                  {isEs ? 'Eliminar' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0], y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <BellOff className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">
                  {filter === 'unread' ? (isEs ? '¡Todo al día!' : 'All caught up!') : (isEs ? 'Sin notificaciones aún' : 'No notifications yet')}
                </h3>
                <p className="text-muted-foreground text-sm mb-2 max-w-sm mx-auto">
                  {filter === 'unread'
                    ? (isEs ? 'Has leído todas tus notificaciones' : "You've read all your notifications")
                    : (isEs ? 'A medida que uses la app, aquí aparecerán alertas de logros, metas, rachas y más.' : 'As you use the app, alerts for achievements, goals, streaks and more will appear here.')}
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Contextual Guide */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {isEs ? '¿Qué es esta página?' : 'What is this page?'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>{isEs ? 'Tu centro de notificaciones reúne toda la actividad importante: logros, metas, rachas, alertas fiscales y recordatorios automáticos.' : 'Your notification center gathers all important activity: achievements, goals, streaks, tax alerts, and automatic reminders.'}</p>
              <p>{isEs ? 'Las notificaciones se generan automáticamente. Solo sigue registrando gastos, ingresos y cumpliendo tus metas.' : "Notifications are generated automatically. Just keep recording expenses, income, and completing your goals."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {isEs ? '¿Cómo funcionan?' : 'How do they work?'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Trophy, color: 'text-amber-500 bg-amber-500/10', title: isEs ? 'Logros y Niveles' : 'Achievements & Levels', desc: isEs ? 'Al subir de nivel o desbloquear logros' : 'When you level up or unlock achievements' },
                  { icon: Target, color: 'text-green-500 bg-green-500/10', title: isEs ? 'Metas Cumplidas' : 'Goals Completed', desc: isEs ? 'Cuando alcanzas una meta de ahorro o inversión' : 'When you reach a savings or investment goal' },
                  { icon: Flame, color: 'text-red-500 bg-red-500/10', title: isEs ? 'Rachas' : 'Streaks', desc: isEs ? 'Al mantener rachas de 7, 14, 30+ días' : 'When you maintain 7, 14, 30+ day streaks' },
                  { icon: Bell, color: 'text-cyan-500 bg-cyan-500/10', title: isEs ? 'Recordatorios' : 'Reminders', desc: isEs ? 'Pagos, contratos, impuestos y presupuesto — configurables' : 'Bills, contracts, taxes and budget — configurable' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className={cn("p-2 rounded-lg shrink-0", item.color)}><item.icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                {isEs ? 'Acciones disponibles' : 'Available actions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Timer className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                  {isEs ? 'Posponer: oculta el recordatorio por 1h, 3h, 1 día, 3 días o 1 semana.' : 'Snooze: hide the reminder for 1h, 3h, 1 day, 3 days, or 1 week.'}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  {isEs ? '"Ya lo hice": marca el recordatorio como atendido y lo archiva.' : '"Mark as done": marks the reminder as handled and archives it.'}
                </li>
                <li className="flex items-start gap-2">
                  <VolumeX className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
                  {isEs ? 'Silenciar: deja de recibir futuros recordatorios de ese pago, contrato o deadline.' : 'Mute: stop receiving future reminders for that bill, contract, or deadline.'}
                </li>
                <li className="flex items-start gap-2">
                  <Settings className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  {isEs ? 'Configurar: usa el botón ⚙ arriba para ajustar anticipación, frecuencia y máximo por tipo.' : 'Settings: use the ⚙ button above to adjust advance days, frequency, and max per type.'}
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
