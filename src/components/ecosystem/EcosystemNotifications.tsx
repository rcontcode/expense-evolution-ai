import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { openFokusparkTool, type FokusparkTool } from '@/lib/ecosystem/deeplinks';
import { formatDistanceToNow } from 'date-fns';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';
import { es, enUS } from 'date-fns/locale';

export const EcosystemNotifications = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEs = language === 'es';
  const [expanded, setExpanded] = useState(false);

  const { data: notifications, isLoading, isError, refetch } = useQuery({
    queryKey: ['ecosystem-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('ecosystem_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) { console.error(error); return []; }
      return data || [];
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 2,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('ecosystem_notifications')
        .update({ is_read: true })
        .eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ecosystem-notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('ecosystem_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ecosystem-notifications'] }),
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={() => refetch()} compact />;
  if (isLoading || !notifications || notifications.length === 0) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              onClick={() => setExpanded(!expanded)}
            >
              <Bell className="h-3.5 w-3.5 text-primary" />
              {isEs ? 'Notificaciones del Ecosistema' : 'Ecosystem Notifications'}
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
              {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </CardTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-2"
                onClick={() => markAllReadMutation.mutate()}
              >
                <Check className="h-3 w-3 mr-1" />
                {isEs ? 'Leer todo' : 'Read all'}
              </Button>
            )}
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="px-4 pb-3 space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                      n.is_read ? 'bg-muted/30' : 'bg-primary/5 border border-primary/10'
                    }`}
                  >
                    <span className="text-sm shrink-0">{n.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-medium ${n.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {isEs ? n.title_es : n.title_en}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {isEs ? n.message_es : n.message_en}
                      </p>
                      <p className="text-[8px] text-muted-foreground/60 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: isEs ? es : enUS })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {n.action_tool && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => openFokusparkTool(n.action_tool as FokusparkTool, 'notification')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => markReadMutation.mutate(n.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {!expanded && unreadCount > 0 && (
          <CardContent className="px-4 pb-2 pt-0">
            <p className="text-[10px] text-muted-foreground">
              {isEs ? `${unreadCount} sin leer — toca para ver` : `${unreadCount} unread — tap to view`}
            </p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
});

EcosystemNotifications.displayName = 'EcosystemNotifications';
