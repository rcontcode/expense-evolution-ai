import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { TrendingUp, Clock, Target, Zap, BarChart3, Users, ArrowUpRight, Calendar, Phone } from 'lucide-react';
import { differenceInDays, differenceInHours, format, eachWeekOfInterval, subMonths } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280', '#10b981', '#8b5cf6', '#ec4899'];

export const AdminAdvancedMetrics = ({ language }: Props) => {
  const isEs = language === 'es';

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['metrics-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    if (!leads.length) return null;

    // 1. Conversion funnel — separate auto vs manual contacts
    const total = leads.length;
    const allContacted = leads.filter((l: any) => l.contacted_at);
    const manualContacted = allContacted.filter((l: any) => !l.contact_notes?.startsWith('[AUTO]'));
    const autoContacted = allContacted.filter((l: any) => l.contact_notes?.startsWith('[AUTO]'));
    const converted = leads.filter((l: any) => l.converted_to_user);
    const contactRate = total > 0 ? (manualContacted.length / total) * 100 : 0;
    const autoContactRate = total > 0 ? (autoContacted.length / total) * 100 : 0;
    const conversionRate = manualContacted.length > 0 ? (converted.length / manualContacted.length) * 100 : 0;
    const overallConversion = total > 0 ? (converted.length / total) * 100 : 0;

    // 2. Avg time to contact (hours) — only manual contacts
    const contactTimes = manualContacted
      .filter((l: any) => l.contacted_at && l.created_at)
      .map((l: any) => differenceInHours(new Date(l.contacted_at), new Date(l.created_at)));
    const avgContactTime = contactTimes.length > 0 ? contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length : 0;

    // 3. Avg time to convert (days)
    const conversionTimes = converted
      .filter((l: any) => l.contacted_at && l.created_at)
      .map((l: any) => differenceInDays(new Date(l.contacted_at), new Date(l.created_at)));
    const avgConversionDays = conversionTimes.length > 0 ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length : 0;

    // 4. Lead volume by week (last 3 months)
    const threeMonthsAgo = subMonths(new Date(), 3);
    const recentLeads = leads.filter((l: any) => new Date(l.created_at) >= threeMonthsAgo);
    const weeks = eachWeekOfInterval({ start: threeMonthsAgo, end: new Date() });
    const weeklyData = weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = recentLeads.filter((l: any) => {
        const d = new Date(l.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      return {
        week: format(weekStart, 'dd MMM', { locale: isEs ? esLocale : enUS }),
        leads: count,
      };
    });

    // 5. Conversion by source
    const sources: Record<string, { total: number; contacted: number; converted: number }> = {};
    leads.forEach((l: any) => {
      const src = l.source || 'evofinz';
      if (!sources[src]) sources[src] = { total: 0, contacted: 0, converted: 0 };
      sources[src].total++;
      if (l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')) sources[src].contacted++;
      if (l.converted_to_user) sources[src].converted++;
    });
    const sourceData = Object.entries(sources).map(([name, data]) => ({
      name, ...data,
      contactRate: data.total > 0 ? Math.round((data.contacted / data.total) * 100) : 0,
      conversionRate: data.contacted > 0 ? Math.round((data.converted / data.contacted) * 100) : 0,
    }));

    // 6. Priority distribution
    const priorityDist = { hot: 0, warm: 0, cool: 0, cold: 0 };
    leads.forEach((l: any) => {
      const score = calculateLeadScore(l);
      const p = getLeadPriority(score);
      priorityDist[p]++;
    });
    const pieData = [
      { name: 'Hot 🔥', value: priorityDist.hot, color: '#ef4444' },
      { name: 'Warm 🌡️', value: priorityDist.warm, color: '#f97316' },
      { name: 'Cool ❄️', value: priorityDist.cool, color: '#3b82f6' },
      { name: 'Cold 🧊', value: priorityDist.cold, color: '#6b7280' },
    ];

    // 7. Best day/hour to contact (manual only)
    const contactedByDay: Record<number, number> = {};
    const contactedByHour: Record<number, number> = {};
    manualContacted.forEach((l: any) => {
      const d = new Date(l.contacted_at);
      contactedByDay[d.getDay()] = (contactedByDay[d.getDay()] || 0) + 1;
      contactedByHour[d.getHours()] = (contactedByHour[d.getHours()] || 0) + 1;
    });
    const bestDay = Object.entries(contactedByDay).sort(([, a], [, b]) => b - a)[0];
    const bestHour = Object.entries(contactedByHour).sort(([, a], [, b]) => b - a)[0];
    const dayNames = isEs
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 8. Top countries
    const countryMap: Record<string, number> = {};
    leads.forEach((l: any) => { countryMap[l.country] = (countryMap[l.country] || 0) + 1; });
    const topCountries = Object.entries(countryMap).sort(([, a], [, b]) => b - a).slice(0, 5);

    return {
      total, contactRate, conversionRate, overallConversion,
      contactedCount: manualContacted.length, convertedCount: converted.length,
      autoContactedCount: autoContacted.length, autoContactRate,
      avgContactTime, avgConversionDays, weeklyData, sourceData, pieData,
      bestDay: bestDay ? dayNames[parseInt(bestDay[0])] : '-',
      bestHour: bestHour ? `${bestHour[0]}:00` : '-',
      topCountries,
    };
  }, [leads, isEs]);

  if (isLoading || !metrics) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isEs ? 'Tasa contacto (manual)' : 'Contact Rate (manual)', value: `${metrics.contactRate.toFixed(1)}%`, sub: `${metrics.contactedCount}/${metrics.total} · Auto: ${metrics.autoContactedCount}`, icon: Phone, color: 'text-amber-600' },
          { label: isEs ? 'Tasa conversión' : 'Conversion Rate', value: `${metrics.overallConversion.toFixed(1)}%`, sub: `${metrics.convertedCount}/${metrics.total}`, icon: Target, color: 'text-emerald-600' },
          { label: isEs ? 'Tiempo avg contacto' : 'Avg Contact Time', value: `${metrics.avgContactTime.toFixed(0)}h`, sub: isEs ? 'horas promedio' : 'average hours', icon: Clock, color: 'text-blue-600' },
          { label: isEs ? 'Tiempo avg conversión' : 'Avg Conversion Time', value: `${metrics.avgConversionDays.toFixed(0)}d`, sub: isEs ? 'días promedio' : 'average days', icon: Zap, color: 'text-violet-600' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-black">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Best time + Top countries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">{isEs ? 'Mejor día' : 'Best Day'}</p>
            <p className="text-xl font-black">{metrics.bestDay}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">{isEs ? 'Mejor hora' : 'Best Hour'}</p>
            <p className="text-xl font-black">{metrics.bestHour}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">{isEs ? '🌍 Top países' : '🌍 Top Countries'}</p>
            <div className="space-y-1">
              {metrics.topCountries.map(([country, count], i) => (
                <div key={country} className="flex items-center justify-between text-xs">
                  <span className="truncate">{i + 1}. {country}</span>
                  <Badge variant="secondary" className="text-[9px]">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Weekly trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isEs ? 'Leads por semana (3 meses)' : 'Leads per Week (3 months)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isEs ? 'Distribución de prioridad' : 'Priority Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={metrics.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {metrics.pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Source performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {isEs ? 'Rendimiento por fuente' : 'Performance by Source'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total" name={isEs ? 'Total' : 'Total'} fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contacted" name={isEs ? 'Contactados' : 'Contacted'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name={isEs ? 'Convertidos' : 'Converted'} fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

