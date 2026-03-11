import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarCheck, Clock, AlertTriangle, CheckCircle2, User, 
  ArrowRight, Calendar 
} from 'lucide-react';
import { format, isToday, isBefore, addDays, startOfDay } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LeadDetail } from '../LeadDetail';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface Props {
  language: 'es' | 'en';
}

export const AdminFollowUpsAgenda = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<QuizLead | null>(null);

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['all-follow-ups-agenda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select('*, quiz_leads(*)')
        .is('completed_at', null)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allLeads = [] } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as QuizLead[];
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      const { error } = await supabase
        .from('lead_follow_ups')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', followUpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-follow-ups-agenda'] });
      queryClient.invalidateQueries({ queryKey: ['all-follow-ups'] });
      toast.success(isEs ? '✅ Follow-up completado' : '✅ Follow-up completed');
    },
  });

  const grouped = useMemo(() => {
    const now = startOfDay(new Date());
    const next7 = addDays(now, 7);

    const overdue: typeof followUps = [];
    const today: typeof followUps = [];
    const upcoming: typeof followUps = [];
    const later: typeof followUps = [];

    followUps.forEach((fu: any) => {
      const scheduled = new Date(fu.scheduled_at);
      if (isBefore(scheduled, now) && !isToday(scheduled)) {
        overdue.push(fu);
      } else if (isToday(scheduled)) {
        today.push(fu);
      } else if (isBefore(scheduled, next7)) {
        upcoming.push(fu);
      } else {
        later.push(fu);
      }
    });

    return { overdue, today, upcoming, later };
  }, [followUps]);

  const sections = [
    { 
      key: 'overdue', 
      label: isEs ? '🚨 Vencidos' : '🚨 Overdue', 
      items: grouped.overdue, 
      color: 'border-red-400 bg-red-50/50 dark:bg-red-950/20',
      badgeColor: 'bg-red-500 text-white',
    },
    { 
      key: 'today', 
      label: isEs ? '📌 Hoy' : '📌 Today', 
      items: grouped.today, 
      color: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20',
      badgeColor: 'bg-amber-500 text-white',
    },
    { 
      key: 'upcoming', 
      label: isEs ? '📅 Próximos 7 días' : '📅 Next 7 days', 
      items: grouped.upcoming, 
      color: 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/10',
      badgeColor: 'bg-blue-500 text-white',
    },
    { 
      key: 'later', 
      label: isEs ? '🗓️ Más adelante' : '🗓️ Later', 
      items: grouped.later, 
      color: 'border-muted',
      badgeColor: 'bg-muted text-muted-foreground',
    },
  ];

  const handleOpenLead = (leadData: any) => {
    if (leadData?.quiz_leads) {
      setSelectedLead(leadData.quiz_leads as QuizLead);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Clock className="h-5 w-5 animate-spin mr-2" /> {isEs ? 'Cargando agenda...' : 'Loading agenda...'}
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border-t-4 ${s.color}`}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black">{s.items.length}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Follow-up Lists */}
      {sections.map((section) => {
        if (section.items.length === 0) return null;
        return (
          <Card key={section.key} className={`border-l-4 ${section.color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{section.label}</span>
                <Badge className={section.badgeColor}>{section.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.map((fu: any, i: number) => (
                <motion.div
                  key={fu.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-emerald-600"
                    onClick={() => completeMutation.mutate(fu.id)}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenLead(fu)}>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-bold text-sm truncate">
                        {(fu.quiz_leads as any)?.name || 'Unknown'}
                      </span>
                    </div>
                    {fu.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{fu.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">{fu.follow_up_type}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(fu.scheduled_at), 'dd MMM HH:mm', { locale: isEs ? esLocale : enUS })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {followUps.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{isEs ? '¡Agenda limpia!' : 'Clean agenda!'}</p>
            <p className="text-xs mt-1">{isEs ? 'No hay follow-ups pendientes' : 'No pending follow-ups'}</p>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Dialog */}
      <LeadDetail
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => { if (!open) setSelectedLead(null); }}
        onMarkContacted={() => {}}
        onMarkConverted={() => {}}
        allLeads={allLeads}
      />
    </div>
  );
};
