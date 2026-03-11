import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Flame, Clock, TrendingUp, Users, CalendarCheck, AlertTriangle, 
  DollarSign, ArrowRight, BarChart3 
} from 'lucide-react';
import { differenceInDays, subDays, format, startOfDay, isToday, isThisWeek } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip } from 'recharts';

interface Props {
  language: 'es' | 'en';
  onNavigateTab: (tab: string) => void;
}

export const AdminCRMHome = ({ language, onNavigateTab }: Props) => {
  const isEs = language === 'es';

  const { data: leads = [] } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ['all-follow-ups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select('*, quiz_leads(name)')
        .is('completed_at', null)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const kpis = useMemo(() => {
    const now = new Date();
    const leadsToday = leads.filter((l: any) => isToday(new Date(l.created_at))).length;
    const leadsThisWeek = leads.filter((l: any) => isThisWeek(new Date(l.created_at), { weekStartsOn: 1 })).length;

    const overdueFollowUps = followUps.filter((f: any) => new Date(f.scheduled_at) < now).length;

    const thisMonth = leads.filter((l: any) => {
      const d = new Date(l.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const contactedThisMonth = thisMonth.filter((l: any) => l.contacted_at).length;
    const convertedThisMonth = thisMonth.filter((l: any) => l.converted_to_user).length;
    const contactRate = thisMonth.length > 0 ? Math.round((contactedThisMonth / thisMonth.length) * 100) : 0;
    const conversionRate = thisMonth.length > 0 ? Math.round((convertedThisMonth / thisMonth.length) * 100) : 0;

    const hotUncontacted = leads.filter((l: any) => {
      const score = calculateLeadScore(l);
      return getLeadPriority(score) === 'hot' && !l.contacted_at;
    }).length;

    return { leadsToday, leadsThisWeek, overdueFollowUps, contactRate, conversionRate, hotUncontacted };
  }, [leads, followUps]);

  // Sparkline data: leads per day last 30 days
  const sparklineData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, 'yyyy-MM-dd');
      const label = format(day, 'dd MMM', { locale: isEs ? esLocale : enUS });
      const count = leads.filter((l: any) => format(new Date(l.created_at), 'yyyy-MM-dd') === dayStr).length;
      days.push({ date: label, count });
    }
    return days;
  }, [leads, isEs]);

  const cards = [
    { 
      label: isEs ? 'Leads hoy' : 'Leads today', 
      value: kpis.leadsToday, 
      icon: Users, 
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '📥'
    },
    { 
      label: isEs ? 'Esta semana' : 'This week', 
      value: kpis.leadsThisWeek, 
      icon: TrendingUp, 
      gradient: 'from-violet-500 to-purple-500',
      emoji: '📊'
    },
    { 
      label: isEs ? 'Follow-ups vencidos' : 'Overdue follow-ups', 
      value: kpis.overdueFollowUps, 
      icon: AlertTriangle, 
      gradient: kpis.overdueFollowUps > 0 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-teal-500',
      emoji: kpis.overdueFollowUps > 0 ? '🚨' : '✅',
      action: () => onNavigateTab('agenda'),
    },
    { 
      label: isEs ? 'HOT sin contactar' : 'HOT uncontacted', 
      value: kpis.hotUncontacted, 
      icon: Flame, 
      gradient: kpis.hotUncontacted > 0 ? 'from-red-600 to-rose-500' : 'from-emerald-500 to-green-500',
      emoji: kpis.hotUncontacted > 0 ? '🔥' : '👍',
      action: () => onNavigateTab('queue'),
    },
    { 
      label: isEs ? 'Tasa contacto' : 'Contact rate', 
      value: `${kpis.contactRate}%`, 
      icon: CalendarCheck, 
      gradient: 'from-amber-500 to-yellow-500',
      emoji: '📞'
    },
    { 
      label: isEs ? 'Conversión mes' : 'Monthly conversion', 
      value: `${kpis.conversionRate}%`, 
      icon: DollarSign, 
      gradient: 'from-emerald-500 to-teal-600',
      emoji: '💰'
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <motion.div 
            key={card.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
          >
            <Card 
              className={`overflow-hidden border-0 shadow-lg ${card.action ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
              onClick={card.action}
            >
              <CardContent className="p-0">
                <div className={`p-4 bg-gradient-to-br ${card.gradient} text-white`}>
                  <p className="text-[10px] text-white/80 font-medium">{card.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{card.emoji}</span>
                    <p className="text-2xl font-black">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Leads Sparkline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isEs ? '📈 Leads últimos 30 días' : '📈 Leads last 30 days'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <RechartsTooltip 
                  contentStyle={{ fontSize: 12, borderRadius: 8 }} 
                  formatter={(value: number) => [value, isEs ? 'Leads' : 'Leads']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#leadGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isEs ? 'Ver leads' : 'View leads', tab: 'leads', emoji: '🎯', color: 'hover:border-orange-400' },
            { label: 'Pipeline', tab: 'pipeline', emoji: '📊', color: 'hover:border-blue-400' },
            { label: isEs ? 'Cola de contacto' : 'Contact queue', tab: 'queue', emoji: '📞', color: 'hover:border-amber-400' },
            { label: isEs ? 'Agenda' : 'Agenda', tab: 'agenda', emoji: '📅', color: 'hover:border-violet-400' },
          ].map((item) => (
            <Button
              key={item.tab}
              variant="outline"
              className={`h-14 flex items-center justify-start gap-3 ${item.color} transition-colors`}
              onClick={() => onNavigateTab(item.tab)}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="font-semibold text-sm">{item.label}</span>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
