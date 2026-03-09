import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, UserPlus, Target, CreditCard, Crown, Mail, FileText, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

interface ActivityEvent {
  id: string;
  type: 'signup' | 'lead' | 'subscription' | 'beta_activated' | 'feedback' | 'bug_report';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const eventIcons: Record<string, typeof UserPlus> = {
  signup: UserPlus,
  lead: Target,
  subscription: CreditCard,
  beta_activated: Crown,
  feedback: Mail,
  bug_report: FileText,
};

const eventColors: Record<string, string> = {
  signup: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  lead: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  subscription: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  beta_activated: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  feedback: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  bug_report: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

export const AdminActivityFeed = ({ language }: Props) => {
  const isEs = language === 'es';

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async () => {
      const activities: ActivityEvent[] = [];

      // Recent signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      
      for (const p of profiles || []) {
        activities.push({
          id: `signup-${p.id}`,
          type: 'signup',
          title: isEs ? 'Nuevo usuario' : 'New user',
          description: p.full_name || p.email?.split('@')[0] || 'Usuario',
          timestamp: p.created_at,
        });
      }

      // Recent leads
      const { data: leads } = await supabase
        .from('quiz_leads')
        .select('id, name, email, created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      for (const l of leads || []) {
        activities.push({
          id: `lead-${l.id}`,
          type: 'lead',
          title: isEs ? 'Nuevo lead' : 'New lead',
          description: l.name || l.email,
          timestamp: l.created_at,
        });
      }

      // Recent subscriptions (active, non-free)
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, plan_type, updated_at')
        .neq('plan_type', 'free')
        .eq('is_active', true)
        .gte('updated_at', weekAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      const subUserIds = subs?.map(s => s.user_id) || [];
      const { data: subProfiles } = subUserIds.length > 0 
        ? await supabase.from('profiles').select('id, full_name, email').in('id', subUserIds)
        : { data: [] };
      const subProfileMap: Record<string, { name: string; email: string }> = {};
      for (const p of subProfiles || []) {
        subProfileMap[p.id] = { name: (p as any).full_name || '', email: (p as any).email || '' };
      }

      for (const s of subs || []) {
        const profile = subProfileMap[s.user_id];
        activities.push({
          id: `sub-${s.id}`,
          type: 'subscription',
          title: `${s.plan_type?.toUpperCase()} ${isEs ? 'activado' : 'activated'}`,
          description: profile?.name || profile?.email || s.user_id.slice(0, 8),
          timestamp: s.updated_at,
          metadata: { plan: s.plan_type },
        });
      }

      // Recent beta activations
      const { data: betaActivations } = await supabase
        .from('profiles')
        .select('id, full_name, email, updated_at')
        .eq('is_beta_tester', true)
        .gte('updated_at', weekAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      for (const b of betaActivations || []) {
        // Avoid duplicating signup events
        if (!activities.some(a => a.id === `signup-${b.id}`)) {
          activities.push({
            id: `beta-${b.id}`,
            type: 'beta_activated',
            title: isEs ? 'Beta activado' : 'Beta activated',
            description: b.full_name || b.email?.split('@')[0] || 'Usuario',
            timestamp: b.updated_at,
          });
        }
      }

      // Recent feedback
      const { data: feedback } = await supabase
        .from('beta_feedback')
        .select('id, section, rating, created_at, user_id')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      for (const f of feedback || []) {
        activities.push({
          id: `feedback-${f.id}`,
          type: 'feedback',
          title: isEs ? 'Nuevo feedback' : 'New feedback',
          description: `${f.section} — ⭐ ${f.rating}`,
          timestamp: f.created_at,
        });
      }

      // Recent bug reports
      const { data: bugs } = await supabase
        .from('beta_bug_reports')
        .select('id, title, severity, created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      for (const b of bugs || []) {
        activities.push({
          id: `bug-${b.id}`,
          type: 'bug_report',
          title: isEs ? 'Bug reportado' : 'Bug reported',
          description: `${b.title} (${b.severity})`,
          timestamp: b.created_at,
        });
      }

      // Sort all by timestamp
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 25);
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><div className="h-5 w-40 bg-muted rounded" /></CardHeader>
        <CardContent><div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted rounded" />)}</div></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{isEs ? '📡 Actividad Reciente' : '📡 Recent Activity'}</CardTitle>
            <CardDescription className="text-xs">{isEs ? 'Últimos 7 días' : 'Last 7 days'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <div className="p-4 space-y-2">
            {events.map((event, i) => {
              const Icon = eventIcons[event.type] || Sparkles;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${eventColors[event.type]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.timestamp), { 
                      addSuffix: true, 
                      locale: isEs ? esLocale : enUS 
                    })}
                  </span>
                </motion.div>
              );
            })}
            {events.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {isEs ? 'No hay actividad reciente' : 'No recent activity'}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
