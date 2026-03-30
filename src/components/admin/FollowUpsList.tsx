import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone, Mail, MessageCircle, StickyNote, Users,
  CheckCircle, Clock, AlertCircle, Loader2, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface FollowUpsListProps {
  leadId: string;
  className?: string;
}

interface FollowUp {
  id: string;
  lead_id: string;
  task_type: string;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export function FollowUpsList({ leadId, className }: FollowUpsListProps) {
  const { language } = useLanguage();
  const es = language === 'es';
  const queryClient = useQueryClient();

  const taskTypeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
    call: { icon: <Phone className="h-4 w-4" />, label: es ? 'Llamada' : 'Call' },
    email: { icon: <Mail className="h-4 w-4" />, label: 'Email' },
    whatsapp: { icon: <MessageCircle className="h-4 w-4" />, label: 'WhatsApp' },
    meeting: { icon: <Users className="h-4 w-4" />, label: es ? 'Reunión' : 'Meeting' },
    note: { icon: <StickyNote className="h-4 w-4" />, label: es ? 'Recordatorio' : 'Reminder' },
  };

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['lead-follow-ups', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select('*')
        .eq('lead_id', leadId)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as FollowUp[];
    },
  });

  const completeFollowUp = useMutation({
    mutationFn: async (followUpId: string) => {
      const { error } = await supabase
        .from('lead_follow_ups')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', followUpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-follow-ups', leadId] });
      toast.success(es ? 'Seguimiento completado' : 'Follow-up completed');
    },
    onError: () => {
      toast.error(es ? 'Error al completar seguimiento' : 'Error completing follow-up');
    },
  });

  const deleteFollowUp = useMutation({
    mutationFn: async (followUpId: string) => {
      const { error } = await supabase
        .from('lead_follow_ups')
        .delete()
        .eq('id', followUpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-follow-ups', leadId] });
      toast.success(es ? 'Seguimiento eliminado' : 'Follow-up deleted');
    },
    onError: () => {
      toast.error(es ? 'Error al eliminar seguimiento' : 'Error deleting follow-up');
    },
  });

  const pendingFollowUps = followUps.filter(f => !f.completed_at);
  const completedFollowUps = followUps.filter(f => f.completed_at);

  const getStatusBadge = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    if (isPast(date) && !isToday(date)) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="mr-1 h-3 w-3" />
          {es ? 'Atrasado' : 'Overdue'}
        </Badge>
      );
    }
    if (isToday(date)) {
      return (
        <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
          <Clock className="mr-1 h-3 w-3" />
          {es ? 'Hoy' : 'Today'}
        </Badge>
      );
    }
    if (isTomorrow(date)) {
      return (
        <Badge variant="secondary" className="text-xs">
          {es ? 'Mañana' : 'Tomorrow'}
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dateLocale = es ? esLocale : undefined;

  return (
    <div className={cn('space-y-4', className)}>
      {pendingFollowUps.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            {es ? 'Pendientes' : 'Pending'} ({pendingFollowUps.length})
          </h5>
          <div className="space-y-2">
            {pendingFollowUps.map((followUp) => {
              const config = taskTypeConfig[followUp.task_type] || taskTypeConfig.note;
              const scheduledDate = new Date(followUp.scheduled_at);
              const isOverdue = isPast(scheduledDate) && !isToday(scheduledDate);

              return (
                <div
                  key={followUp.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    isOverdue ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10' : 'bg-card'
                  )}
                >
                  <div className="p-2 rounded-full bg-muted">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{config.label}</span>
                      {getStatusBadge(followUp.scheduled_at)}
                    </div>
                    {followUp.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{followUp.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(scheduledDate, es ? "EEEE dd MMM 'a las' HH:mm" : "EEEE dd MMM 'at' HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => completeFollowUp.mutate(followUp.id)} disabled={completeFollowUp.isPending}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => deleteFollowUp.mutate(followUp.id)} disabled={deleteFollowUp.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedFollowUps.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {es ? 'Completados' : 'Completed'} ({completedFollowUps.length})
          </h5>
          <div className="space-y-2">
            {completedFollowUps.slice(0, 3).map((followUp) => {
              const config = taskTypeConfig[followUp.task_type] || taskTypeConfig.note;
              return (
                <div key={followUp.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 opacity-75">
                  <div className="p-2 rounded-full bg-muted">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm line-through">{config.label}</span>
                      <Badge variant="outline" className="text-xs text-green-600">
                        {es ? 'Completado' : 'Completed'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(followUp.completed_at!), { addSuffix: true, locale: dateLocale })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {followUps.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {es ? 'No hay seguimientos programados' : 'No follow-ups scheduled'}
        </p>
      )}
    </div>
  );
}
