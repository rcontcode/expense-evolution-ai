import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Flame, Clock, TrendingUp, Users, CalendarCheck, AlertTriangle, 
  DollarSign, ArrowRight, BarChart3, Mail, Send, Zap
} from 'lucide-react';
import { differenceInDays, subDays, format, startOfDay, isToday, isThisWeek } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

interface Props {
  language: 'es' | 'en';
  onNavigateTab: (tab: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  evofinz: '#10b981',
  fokuspark: '#8b5cf6',
  universmind: '#7c3aed',
};

const SOURCE_LABELS: Record<string, string> = {
  evofinz: '💰 EvoFinz',
  fokuspark: '🧠 Fokuspark',
  universmind: '🌌 UniversMind',
};

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

  const { data: automationLogs = [] } = useQuery({
    queryKey: ['automation-logs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .gte('executed_at', subDays(new Date(), 30).toISOString())
        .order('executed_at', { ascending: false });
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
    const contactedThisMonth = thisMonth.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length;
    const convertedThisMonth = thisMonth.filter((l: any) => l.converted_to_user).length;
    const contactRate = thisMonth.length > 0 ? Math.round((contactedThisMonth / thisMonth.length) * 100) : 0;
    const conversionRate = thisMonth.length > 0 ? Math.round((convertedThisMonth / thisMonth.length) * 100) : 0;

    const hotUncontacted = leads.filter((l: any) => {
      const score = calculateLeadScore(l);
      const isManuallyContacted = l.contacted_at && !l.contact_notes?.startsWith('[AUTO]');
      return getLeadPriority(score) === 'hot' && !isManuallyContacted;
    }).length;

    // Email stats from automation logs
    const emailsSent = automationLogs.filter((l: any) => l.action_type === 'email' && l.status === 'success').length;
    const emailsFailed = automationLogs.filter((l: any) => l.action_type === 'email' && l.status !== 'success').length;
    const automationsRun = automationLogs.length;

    return { leadsToday, leadsThisWeek, overdueFollowUps, contactRate, conversionRate, hotUncontacted, emailsSent, emailsFailed, automationsRun };
  }, [leads, followUps, automationLogs]);

  // Source breakdown for pie chart
  const sourceData = useMemo(() => {
    const bySource: Record<string, number> = {};
    leads.forEach((l: any) => {
      const src = (l.source || 'evofinz').toLowerCase().replace(/[_\- ]/g, '');
      const key = src.includes('fokus') ? 'fokuspark' : src.includes('univers') ? 'universmind' : 'evofinz';
      bySource[key] = (bySource[key] || 0) + 1;
    });
    return Object.entries(bySource).map(([name, value]) => ({
      name: SOURCE_LABELS[name] || name,
      value,
      color: SOURCE_COLORS[name] || '#6b7280',
    }));
  }, [leads]);

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
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '📥'
    },
    { 
      label: isEs ? 'Esta semana' : 'This week', 
      value: kpis.leadsThisWeek, 
      gradient: 'from-violet-500 to-purple-500',
      emoji: '📊'
    },
    { 
      label: isEs ? 'Follow-ups vencidos' : 'Overdue follow-ups', 
      value: kpis.overdueFollowUps, 
      gradient: kpis.overdueFollowUps > 0 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-teal-500',
      emoji: kpis.overdueFollowUps > 0 ? '🚨' : '✅',
      action: () => onNavigateTab('agenda'),
    },
    { 
      label: isEs ? 'HOT sin contactar' : 'HOT uncontacted', 
      value: kpis.hotUncontacted, 
      gradient: kpis.hotUncontacted > 0 ? 'from-red-600 to-rose-500' : 'from-emerald-500 to-green-500',
      emoji: kpis.hotUncontacted > 0 ? '🔥' : '👍',
      action: () => onNavigateTab('queue'),
    },
    { 
      label: isEs ? 'Tasa contacto' : 'Contact rate', 
      value: `${kpis.contactRate}%`, 
      gradient: 'from-amber-500 to-yellow-500',
      emoji: '📞'
    },
    { 
      label: isEs ? 'Conversión mes' : 'Monthly conversion', 
      value: `${kpis.conversionRate}%`, 
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

      {/* Email & Automation Stats + Source Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {isEs ? '⚡ Automatizaciones (30d)' : '⚡ Automations (30d)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-black text-primary">{kpis.automationsRun}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Ejecutadas' : 'Executed'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <p className="text-2xl font-black text-emerald-600">{kpis.emailsSent}</p>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                    <Send className="h-3 w-3" /> {isEs ? 'Emails OK' : 'Emails OK'}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <p className="text-2xl font-black text-red-500">{kpis.emailsFailed}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Fallidos' : 'Failed'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                {isEs ? '🌐 Leads por App' : '🌐 Leads by App'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-[100px] h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2}>
                        {sourceData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {sourceData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-medium flex-1">{s.name}</span>
                      <span className="text-xs font-bold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leads Sparkline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isEs ? 'Ver leads' : 'View leads', tab: 'leads', emoji: '🎯', color: 'hover:border-orange-400' },
            { label: 'Pipeline', tab: 'pipeline', emoji: '📊', color: 'hover:border-blue-400' },
            { label: isEs ? 'Cola de contacto' : 'Contact queue', tab: 'queue', emoji: '📞', color: 'hover:border-amber-400' },
            { label: isEs ? 'Ranking Apps' : 'App Ranking', tab: 'ranking', emoji: '🏆', color: 'hover:border-violet-400' },
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
