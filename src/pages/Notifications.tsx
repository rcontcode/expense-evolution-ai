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
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCheck, 
  Trash2,
  Sparkles,
  ArrowUpRight,
  Filter,
  BellOff,
  Flame,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Receipt,
  Wallet,
  PiggyBank,
  Car,
  FileText,
  ArrowRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  achievement: Trophy,
  level_up: Sparkles,
  goal_complete: Target,
  savings_goal: Target,
  investment_goal: TrendingUp,
  goal_deadline: Clock,
  streak: Flame,
  reminder: Calendar,
  expense: Receipt,
  income: Wallet,
  savings: PiggyBank,
  mileage: Car,
  contract: FileText,
  tip: Lightbulb,
  alert: AlertTriangle,
  default: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  achievement: 'text-amber-500 bg-amber-500/10',
  level_up: 'text-purple-500 bg-purple-500/10',
  goal_complete: 'text-green-500 bg-green-500/10',
  savings_goal: 'text-blue-500 bg-blue-500/10',
  investment_goal: 'text-emerald-500 bg-emerald-500/10',
  goal_deadline: 'text-orange-500 bg-orange-500/10',
  streak: 'text-red-500 bg-red-500/10',
  reminder: 'text-cyan-500 bg-cyan-500/10',
  expense: 'text-rose-500 bg-rose-500/10',
  income: 'text-green-500 bg-green-500/10',
  savings: 'text-blue-500 bg-blue-500/10',
  mileage: 'text-indigo-500 bg-indigo-500/10',
  contract: 'text-violet-500 bg-violet-500/10',
  tip: 'text-yellow-500 bg-yellow-500/10',
  alert: 'text-destructive bg-destructive/10',
  default: 'text-muted-foreground bg-muted',
};

export default function Notifications() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'achievements' | 'goals'>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllNotifications = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filteredNotifications = notifications?.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'achievements') return n.type === 'achievement' || n.type === 'level_up' || n.type === 'streak';
    if (filter === 'goals') return n.type.includes('goal') || n.type === 'savings' || n.type === 'investment_goal';
    return true;
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // Group notifications by date
  const groupedNotifications = filteredNotifications?.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    let groupKey: string;
    
    if (isToday(date)) {
      groupKey = language === 'es' ? 'Hoy' : 'Today';
    } else if (isYesterday(date)) {
      groupKey = language === 'es' ? 'Ayer' : 'Yesterday';
    } else if (isThisWeek(date)) {
      groupKey = language === 'es' ? 'Esta semana' : 'This week';
    } else if (isThisMonth(date)) {
      groupKey = language === 'es' ? 'Este mes' : 'This month';
    } else {
      groupKey = language === 'es' ? 'Anteriores' : 'Earlier';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
  };

  const getNotificationColor = (type: string) => {
    return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: language === 'es' ? es : enUS 
      });
    }
    return format(date, 'PP', { locale: language === 'es' ? es : enUS });
  };

  // Quick actions for empty state
  const quickActions = [
    {
      icon: Receipt,
      label: language === 'es' ? 'Agregar gasto' : 'Add expense',
      description: language === 'es' ? 'Registra un gasto para comenzar' : 'Record an expense to get started',
      path: '/expenses',
      color: 'text-rose-500 bg-rose-500/10'
    },
    {
      icon: Target,
      label: language === 'es' ? 'Crear meta' : 'Create goal',
      description: language === 'es' ? 'Define una meta de ahorro o inversión' : 'Set a savings or investment goal',
      path: '/net-worth',
      color: 'text-green-500 bg-green-500/10'
    },
    {
      icon: Car,
      label: language === 'es' ? 'Registrar viaje' : 'Log trip',
      description: language === 'es' ? 'Registra un viaje para deducción CRA' : 'Log a trip for CRA deduction',
      path: '/mileage',
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      icon: TrendingUp,
      label: language === 'es' ? 'Ver progreso' : 'View progress',
      description: language === 'es' ? 'Revisa tu progreso financiero' : 'Check your financial progress',
      path: '/dashboard',
      color: 'text-emerald-500 bg-emerald-500/10'
    },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title={language === 'es' ? 'Notificaciones' : 'Notifications'}
          description={language === 'es' 
            ? 'Tu historial de logros, alertas y recordatorios' 
            : 'Your history of achievements, alerts and reminders'}
        >
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Marcar todo leído' : 'Mark all read'}
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Limpiar' : 'Clear'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {language === 'es' ? '¿Eliminar todas las notificaciones?' : 'Delete all notifications?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'es' 
                    ? 'Esta acción no se puede deshacer. Se eliminarán todas tus notificaciones.'
                    : 'This action cannot be undone. All your notifications will be deleted.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{language === 'es' ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearAllNotifications.mutate()}>
                  {language === 'es' ? 'Eliminar todo' : 'Delete all'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PageHeader>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Sin leer' : 'Unread'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications?.filter(n => n.type === 'achievement' || n.type === 'level_up').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Logros' : 'Achievements'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications?.filter(n => n.type.includes('goal')).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Metas' : 'Goals'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              {language === 'es' ? 'Todas' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Clock className="h-4 w-4" />
              {language === 'es' ? 'Sin leer' : 'Unread'}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              {language === 'es' ? 'Logros' : 'Achievements'}
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              {language === 'es' ? 'Metas' : 'Goals'}
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
                  <motion.div
                    key={group}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                  >
                    {/* Group Header */}
                    <div className="px-4 py-2 bg-muted/30 border-b sticky top-0 z-10">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group}
                      </h3>
                    </div>
                    
                    {/* Group Notifications */}
                    <div className="divide-y">
                      {groupNotifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const colorClass = getNotificationColor(notification.type);
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors cursor-pointer group",
                              !notification.read && "bg-primary/5"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <motion.div 
                              className={cn("p-2 rounded-lg", colorClass)}
                              whileHover={{ scale: 1.1 }}
                            >
                              <Icon className="h-5 w-5" />
                            </motion.div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className={cn(
                                    "font-medium text-sm",
                                    !notification.read && "font-semibold"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {notification.message}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(notification.created_at)}
                                  </span>
                                  {!notification.read && (
                                    <motion.div 
                                      className="w-2 h-2 rounded-full bg-primary"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                  )}
                                </div>
                              </div>
                              
                              {notification.action_url && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  {language === 'es' ? 'Ver detalles' : 'View details'}
                                  <ArrowUpRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification.mutate(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    y: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <BellOff className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                </motion.div>
                
                <h3 className="font-semibold text-lg mb-2">
                  {filter === 'unread' 
                    ? (language === 'es' ? '¡Todo al día!' : 'All caught up!')
                    : (language === 'es' ? 'Sin notificaciones aún' : 'No notifications yet')
                  }
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  {filter === 'unread' 
                    ? (language === 'es' ? 'Has leído todas tus notificaciones' : "You've read all your notifications")
                    : (language === 'es' 
                        ? 'Comienza a usar la app para recibir notificaciones de logros, metas cumplidas, recordatorios y más' 
                        : 'Start using the app to receive notifications about achievements, completed goals, reminders and more')
                  }
                </p>

                {filter === 'all' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={action.path}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-auto p-4 flex items-start gap-3 justify-start hover:bg-muted/50"
                          onClick={() => navigate(action.path)}
                        >
                          <div className={cn("p-2 rounded-lg", action.color)}>
                            <action.icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{action.label}</p>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        {(!notifications || notifications.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  {language === 'es' ? '¿Cómo ganar notificaciones?' : 'How to earn notifications?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {language === 'es' ? 'Completa metas de ahorro o inversión' : 'Complete savings or investment goals'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {language === 'es' ? 'Sube de nivel registrando actividad financiera' : 'Level up by recording financial activity'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {language === 'es' ? 'Desbloquea logros por hábitos financieros' : 'Unlock achievements for financial habits'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {language === 'es' ? 'Mantén rachas diarias de uso de la app' : 'Maintain daily app usage streaks'}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}