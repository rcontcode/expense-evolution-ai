import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Flame, Clock, TrendingUp, Users, CalendarCheck, AlertTriangle, 
  DollarSign, ArrowRight, BarChart3, Mail, Send, Zap, HelpCircle, ChevronDown
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

const TAB_GUIDE = [
  { tab: 'home', emoji: '🏠', nameEs: 'Home', nameEn: 'Home', descEs: 'Panel principal con KPIs, leads del día, follow-ups vencidos, conversión y accesos rápidos.', descEn: 'Main dashboard with KPIs, today\'s leads, overdue follow-ups, conversion rate and quick actions.' },
  { tab: 'agenda', emoji: '📅', nameEs: 'Agenda', nameEn: 'Agenda', descEs: 'Calendario de follow-ups programados. Ve qué leads necesitan seguimiento hoy, esta semana o están vencidos.', descEn: 'Scheduled follow-up calendar. See which leads need follow-up today, this week, or are overdue.' },
  { tab: 'users', emoji: '👥', nameEs: 'Usuarios', nameEn: 'Users', descEs: 'Lista de todos los usuarios registrados con su plan, actividad, uso de IA y estado de suscripción.', descEn: 'All registered users with plan, activity, AI usage and subscription status.' },
  { tab: 'leads', emoji: '🎯', nameEs: 'Leads', nameEn: 'Leads', descEs: 'Tabla completa de leads del quiz. Filtra por app, temperatura, etapa. Edita, contacta o cambia estado.', descEn: 'Full lead table from quizzes. Filter by app, temperature, stage. Edit, contact or change status.' },
  { tab: 'pipeline', emoji: '📊', nameEs: 'Pipeline', nameEn: 'Pipeline', descEs: 'Vista Kanban del pipeline de ventas. Arrastra leads entre etapas (nuevo → contactado → negociando → convertido).', descEn: 'Kanban sales pipeline. Drag leads between stages (new → contacted → negotiating → converted).' },
  { tab: 'ranking', emoji: '🏆', nameEs: 'Ranking', nameEn: 'Ranking', descEs: 'Ranking de usuarios por adopción multi-app. Ve quién usa EvoFinz, FokusPark y UniversMind juntos.', descEn: 'User ranking by multi-app adoption. See who uses EvoFinz, FokusPark, and UniversMind together.' },
  { tab: 'queue', emoji: '📞', nameEs: 'Contactar', nameEn: 'Contact Queue', descEs: 'Cola inteligente de leads para contactar. Genera mensajes con IA, copia para WhatsApp o envía email. Prioriza HOT.', descEn: 'Smart lead contact queue. Generate AI messages, copy for WhatsApp or send email. Prioritizes HOT leads.' },
  { tab: 'history', emoji: '📜', nameEs: 'Historial', nameEn: 'History', descEs: 'Historial de interacciones: emails, WhatsApp, llamadas, notas y cambios de estado con cada lead.', descEn: 'Interaction history: emails, WhatsApp, calls, notes and status changes for each lead.' },
  { tab: 'templates', emoji: '📝', nameEs: 'Plantillas', nameEn: 'Templates', descEs: 'Galería de plantillas WhatsApp y Email para las 3 apps. Primer contacto, follow-up, reactivación y ofertas.', descEn: 'WhatsApp & Email template gallery for all 3 apps. First contact, follow-up, reactivation and offers.' },
  { tab: 'metrics', emoji: '📈', nameEs: 'Métricas', nameEn: 'Metrics', descEs: 'Métricas avanzadas: tendencias de leads, tasas de contacto/conversión, tiempos de respuesta, distribución por fuente.', descEn: 'Advanced metrics: lead trends, contact/conversion rates, response times, source distribution.' },
  { tab: 'automation', emoji: '⚡', nameEs: 'Automatización', nameEn: 'Automation', descEs: 'Motor de reglas automáticas por temperatura (email auto a HOT, tag inactivos, notificaciones).', descEn: 'Auto rule engine by temperature (auto-email HOT leads, tag inactive, notifications).' },
  { tab: 'subscriptions', emoji: '💳', nameEs: 'Planes', nameEn: 'Plans', descEs: 'Suscripciones activas por plan (Free/Premium/Pro). Cuántos pagan, ciclos de facturación y estado.', descEn: 'Active subscriptions by plan (Free/Premium/Pro). How many pay, billing cycles and status.' },
  { tab: 'revenue', emoji: '💵', nameEs: 'Revenue', nameEn: 'Revenue', descEs: 'Dashboard de ingresos Stripe: MRR, ARR, revenue mensual, crecimiento. Datos directos de Stripe.', descEn: 'Stripe revenue dashboard: MRR, ARR, monthly revenue, growth. Direct Stripe data.' },
  { tab: 'roi', emoji: '💰', nameEs: 'ROI', nameEn: 'ROI', descEs: 'ROI por fuente de lead. ¿Cuánto genera cada app? ¿Cuál convierte mejor? Lead → usuario pago.', descEn: 'ROI by lead source. How much does each app generate? Which converts best?' },
  { tab: 'nurturing', emoji: '🔄', nameEs: 'Nurturing', nameEn: 'Nurturing', descEs: 'Secuencias automáticas de 2-5 pasos con delays entre emails/WhatsApp para nutrir leads fríos.', descEn: 'Automated 2-5 step sequences with delays between emails/WhatsApp to warm up cold leads.' },
  { tab: 'emails', emoji: '📧', nameEs: 'Emails', nameEn: 'Emails', descEs: 'Dashboard de emails: estado (enviado/fallido/suprimido), plantilla, destinatario. Monitoreo de entrega.', descEn: 'Email dashboard: status (sent/failed/suppressed), template, recipient. Delivery monitoring.' },
  { tab: 'webhook', emoji: '🔗', nameEs: 'Webhook', nameEn: 'Webhook', descEs: 'Webhook de entrada. Código para conectar quizzes y formularios externos al CRM automáticamente.', descEn: 'Inbound webhook. Code to connect quizzes and external forms to CRM automatically.' },
  { tab: 'abtests', emoji: '🧪', nameEs: 'A/B Testing', nameEn: 'A/B Testing', descEs: 'Pruebas A/B de emails. Crea variantes y mide apertura/conversión para optimizar mensajes.', descEn: 'Email A/B testing. Create variants and measure open/conversion rates to optimize messaging.' },
  { tab: 'webhooksout', emoji: '📤', nameEs: 'WH Out', nameEn: 'WH Out', descEs: 'Webhooks salientes. Envía datos de leads a Zapier, Make u otros CRMs cuando ocurren eventos.', descEn: 'Outgoing webhooks. Send lead data to Zapier, Make or other CRMs when events occur.' },
  { tab: 'pnl', emoji: '📊', nameEs: 'P&L', nameEn: 'P&L', descEs: 'Pérdidas y Ganancias. Ingresos vs costos (IA, hosting, emails, fees). Margen neto y tendencias.', descEn: 'Profit & Loss. Revenue vs costs (AI, hosting, emails, fees). Net margin and trends.' },
  { tab: 'health', emoji: '❤️', nameEs: 'Salud', nameEn: 'Health', descEs: 'Salud del cliente: satisfacción, retención, churn, NPS, engagement por plan, usuarios en riesgo.', descEn: 'Customer health: satisfaction, retention, churn, NPS, engagement by plan, at-risk users.' },
  { tab: 'simulator', emoji: '🧮', nameEs: 'Simulador', nameEn: 'Simulator', descEs: 'Simulador de precios. Ajusta precios, ve margen por usuario con costos reales de IA, proyecta conversión.', descEn: 'Pricing simulator. Adjust prices, see per-user margin with real AI costs, project conversion.' },
  { tab: 'bi', emoji: '🧠', nameEs: 'Business Intel', nameEn: 'Business Intel', descEs: 'Geografía, idioma, funnel de conversión, sugerencias de pricing y revenue por región.', descEn: 'Geography, language, conversion funnel, pricing suggestions and revenue by region.' },
];

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

    // This month
    const thisMonth = leads.filter((l: any) => {
      const d = new Date(l.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const contactedThisMonth = thisMonth.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length;
    const convertedThisMonth = thisMonth.filter((l: any) => l.converted_to_user).length;
    const contactRate = thisMonth.length > 0 ? Math.round((contactedThisMonth / thisMonth.length) * 100) : 0;
    const conversionRate = thisMonth.length > 0 ? Math.round((convertedThisMonth / thisMonth.length) * 100) : 0;

    // Last month for MoM comparison
    const lastMonthDate = subDays(now, 30);
    const lastMonth = leads.filter((l: any) => {
      const d = new Date(l.created_at);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });
    const lastMonthContactRate = lastMonth.length > 0 ? Math.round((lastMonth.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length / lastMonth.length) * 100) : 0;
    const lastMonthConversionRate = lastMonth.length > 0 ? Math.round((lastMonth.filter((l: any) => l.converted_to_user).length / lastMonth.length) * 100) : 0;
    const lastWeekLeads = leads.filter((l: any) => {
      const d = new Date(l.created_at);
      const weekAgo = subDays(now, 14);
      const twoWeeksAgo = subDays(now, 7);
      return d >= weekAgo && d < twoWeeksAgo;
    }).length;

    const hotUncontacted = leads.filter((l: any) => {
      const score = calculateLeadScore(l);
      const isManuallyContacted = l.contacted_at && !l.contact_notes?.startsWith('[AUTO]');
      return getLeadPriority(score) === 'hot' && !isManuallyContacted;
    }).length;

    // Email stats from automation logs
    const emailsSent = automationLogs.filter((l: any) => l.action_type === 'email' && l.status === 'success').length;
    const emailsFailed = automationLogs.filter((l: any) => l.action_type === 'email' && l.status !== 'success').length;
    const automationsRun = automationLogs.length;

    // MoM deltas
    const contactRateDelta = contactRate - lastMonthContactRate;
    const conversionRateDelta = conversionRate - lastMonthConversionRate;
    const weekDelta = leadsThisWeek - lastWeekLeads;

    return { leadsToday, leadsThisWeek, overdueFollowUps, contactRate, conversionRate, hotUncontacted, emailsSent, emailsFailed, automationsRun, contactRateDelta, conversionRateDelta, weekDelta };
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

  // Weekly activity heatmap (last 7 weeks × 7 days)
  const heatmapData = useMemo(() => {
    const weeks: { day: number; week: number; count: number; label: string }[] = [];
    for (let w = 6; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const date = subDays(new Date(), w * 7 + (6 - d));
        const dayStr = format(date, 'yyyy-MM-dd');
        const count = leads.filter((l: any) => format(new Date(l.created_at), 'yyyy-MM-dd') === dayStr).length;
        weeks.push({ day: d, week: 6 - w, count, label: format(date, 'dd MMM') });
      }
    }
    return weeks;
  }, [leads]);

  const maxHeat = Math.max(1, ...heatmapData.map(d => d.count));

  const MomBadge = ({ delta, suffix = '' }: { delta: number; suffix?: string }) => {
    if (delta === 0) return null;
    return (
      <span className={`text-[9px] font-bold ${delta > 0 ? 'text-white/90' : 'text-white/70'}`}>
        {delta > 0 ? '↑' : '↓'}{Math.abs(delta)}{suffix} vs {isEs ? 'mes ant.' : 'prev mo.'}
      </span>
    );
  };

  const cards = [
    { 
      label: isEs ? 'Leads hoy' : 'Leads today', 
      value: kpis.leadsToday, 
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '📥',
    },
    { 
      label: isEs ? 'Esta semana' : 'This week', 
      value: kpis.leadsThisWeek, 
      gradient: 'from-violet-500 to-purple-500',
      emoji: '📊',
      mom: kpis.weekDelta,
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
      emoji: '📞',
      mom: kpis.contactRateDelta,
      momSuffix: 'pp',
    },
    { 
      label: isEs ? 'Conversión mes' : 'Monthly conversion', 
      value: `${kpis.conversionRate}%`, 
      gradient: 'from-emerald-500 to-teal-600',
      emoji: '💰',
      mom: kpis.conversionRateDelta,
      momSuffix: 'pp',
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
                  {(card as any).mom !== undefined && (card as any).mom !== 0 && (
                    <MomBadge delta={(card as any).mom} suffix={(card as any).momSuffix || ''} />
                  )}
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

      {/* Activity Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              {isEs ? '🗓️ Actividad de leads (7 semanas)' : '🗓️ Lead Activity (7 weeks)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex gap-1">
              {Array.from({ length: 7 }, (_, w) => (
                <div key={w} className="flex flex-col gap-1 flex-1">
                  {Array.from({ length: 7 }, (_, d) => {
                    const cell = heatmapData.find(c => c.week === w && c.day === d);
                    const intensity = cell ? cell.count / maxHeat : 0;
                    return (
                      <div
                        key={d}
                        className="aspect-square rounded-sm cursor-default"
                        style={{
                          backgroundColor: intensity === 0
                            ? 'hsl(var(--muted))'
                            : `rgba(16, 185, 129, ${0.15 + intensity * 0.85})`,
                        }}
                        title={cell ? `${cell.label}: ${cell.count} leads` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 justify-end">
              <span className="text-[9px] text-muted-foreground">{isEs ? 'Menos' : 'Less'}</span>
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: v === 0 ? 'hsl(var(--muted))' : `rgba(16, 185, 129, ${0.15 + v * 0.85})` }} />
              ))}
              <span className="text-[9px] text-muted-foreground">{isEs ? 'Más' : 'More'}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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

      {/* CRM Guide — All Tabs Explained */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Collapsible>
          <Card className="border-2 border-dashed border-primary/30">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {isEs ? '📖 Guía Completa del CRM — ¿Qué hace cada pestaña?' : '📖 Complete CRM Guide — What does each tab do?'}
                  <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-3 md:grid-cols-2">
                  {TAB_GUIDE.map((item) => (
                    <div
                      key={item.tab}
                      className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => onNavigateTab(item.tab)}
                    >
                      <span className="text-xl flex-shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">{isEs ? item.nameEs : item.nameEn}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{isEs ? item.descEs : item.descEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </div>
  );
};
