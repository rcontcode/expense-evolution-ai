import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend } from 'recharts';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { TrendingUp, Clock, Target, Zap, BarChart3, Users, ArrowUpRight, Calendar, Phone, Layers, Gauge, Activity } from 'lucide-react';
import { differenceInDays, differenceInHours, format, eachWeekOfInterval, subMonths, eachMonthOfInterval } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

export const AdminAdvancedMetrics = ({ language }: Props) => {
  const isEs = language === 'es';
  const [activeSection, setActiveSection] = useState('overview');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['metrics-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quiz_leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: automationLogs = [] } = useQuery({
    queryKey: ['metrics-automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('automation_logs').select('*').order('executed_at', { ascending: false }).limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    if (!leads.length) return null;

    const total = leads.length;
    const allContacted = leads.filter((l: any) => l.contacted_at);
    const manualContacted = allContacted.filter((l: any) => !l.contact_notes?.startsWith('[AUTO]'));
    const autoContacted = allContacted.filter((l: any) => l.contact_notes?.startsWith('[AUTO]'));
    const converted = leads.filter((l: any) => l.converted_to_user);
    const contactRate = total > 0 ? (manualContacted.length / total) * 100 : 0;
    const overallConversion = total > 0 ? (converted.length / total) * 100 : 0;

    const contactTimes = manualContacted
      .filter((l: any) => l.contacted_at && l.created_at)
      .map((l: any) => differenceInHours(new Date(l.contacted_at), new Date(l.created_at)));
    const avgContactTime = contactTimes.length > 0 ? contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length : 0;

    const conversionTimes = converted
      .filter((l: any) => l.contacted_at && l.created_at)
      .map((l: any) => differenceInDays(new Date(l.contacted_at), new Date(l.created_at)));
    const avgConversionDays = conversionTimes.length > 0 ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length : 0;

    const threeMonthsAgo = subMonths(new Date(), 3);
    const recentLeads = leads.filter((l: any) => new Date(l.created_at) >= threeMonthsAgo);
    const weeks = eachWeekOfInterval({ start: threeMonthsAgo, end: new Date() });
    const weeklyData = weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      const wl = recentLeads.filter((l: any) => { const d = new Date(l.created_at); return d >= weekStart && d < weekEnd; });
      return { week: format(weekStart, 'dd MMM', { locale: isEs ? esLocale : enUS }), leads: wl.length, converted: wl.filter((l: any) => l.converted_to_user).length };
    });

    const sources: Record<string, { total: number; contacted: number; converted: number }> = {};
    leads.forEach((l: any) => {
      const src = l.source || 'evofinz';
      if (!sources[src]) sources[src] = { total: 0, contacted: 0, converted: 0 };
      sources[src].total++;
      if (l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')) sources[src].contacted++;
      if (l.converted_to_user) sources[src].converted++;
    });
    const sourceData = Object.entries(sources).map(([name, data]) => ({ name, ...data }));

    const priorityDist = { hot: 0, warm: 0, cool: 0, cold: 0 };
    leads.forEach((l: any) => { const s = calculateLeadScore(l); priorityDist[getLeadPriority(s)]++; });
    const pieData = [
      { name: 'Hot 🔥', value: priorityDist.hot, color: '#ef4444' },
      { name: 'Warm 🌡️', value: priorityDist.warm, color: '#f97316' },
      { name: 'Cool ❄️', value: priorityDist.cool, color: '#3b82f6' },
      { name: 'Cold 🧊', value: priorityDist.cold, color: '#6b7280' },
    ];

    const contactedByDay: Record<number, number> = {};
    manualContacted.forEach((l: any) => { const d = new Date(l.contacted_at); contactedByDay[d.getDay()] = (contactedByDay[d.getDay()] || 0) + 1; });
    const bestDay = Object.entries(contactedByDay).sort(([, a], [, b]) => b - a)[0];
    const contactedByHour: Record<number, number> = {};
    manualContacted.forEach((l: any) => { const d = new Date(l.contacted_at); contactedByHour[d.getHours()] = (contactedByHour[d.getHours()] || 0) + 1; });
    const bestHour = Object.entries(contactedByHour).sort(([, a], [, b]) => b - a)[0];
    const dayNames = isEs ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const countryMap: Record<string, number> = {};
    leads.forEach((l: any) => { countryMap[l.country] = (countryMap[l.country] || 0) + 1; });
    const topCountries = Object.entries(countryMap).sort(([, a], [, b]) => b - a).slice(0, 5);

    const funnelData = [
      { stage: isEs ? 'Leads totales' : 'Total Leads', value: total, color: '#6366f1', percent: 100 },
      { stage: isEs ? 'Contactados' : 'Contacted', value: manualContacted.length, color: '#f59e0b', percent: total > 0 ? Math.round((manualContacted.length / total) * 100) : 0 },
      { stage: isEs ? 'Convertidos' : 'Converted', value: converted.length, color: '#10b981', percent: total > 0 ? Math.round((converted.length / total) * 100) : 0 },
    ];

    const kpiSparkline = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (13 - i));
      const dayStr = format(date, 'yyyy-MM-dd');
      return { d: i, v: leads.filter((l: any) => format(new Date(l.created_at), 'yyyy-MM-dd') === dayStr).length };
    });

    const lastMonthDate = subMonths(new Date(), 1);
    const lastMonthLeads = leads.filter((l: any) => { const d = new Date(l.created_at); return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear(); });
    const lastContactRate = lastMonthLeads.length > 0 ? (lastMonthLeads.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length / lastMonthLeads.length) * 100 : 0;
    const contactRateDelta = contactRate - lastContactRate;
    const lastConversionRate = lastMonthLeads.length > 0 ? (lastMonthLeads.filter((l: any) => l.converted_to_user).length / lastMonthLeads.length) * 100 : 0;
    const conversionDelta = overallConversion - lastConversionRate;

    // Cohort Analysis
    const sixMonthsAgo = subMonths(new Date(), 6);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() });
    const cohortData = months.map((ms) => {
      const me = new Date(ms); me.setMonth(me.getMonth() + 1);
      const cl = leads.filter((l: any) => { const d = new Date(l.created_at); return d >= ms && d < me; });
      const cc = cl.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length;
      const cv = cl.filter((l: any) => l.converted_to_user).length;
      return { month: format(ms, 'MMM yy', { locale: isEs ? esLocale : enUS }), total: cl.length, contacted: cc, converted: cv, conversionRate: cl.length > 0 ? Math.round((cv / cl.length) * 100) : 0 };
    });

    // Lead Velocity
    const velocityData = weeklyData.reduce((acc: any[], week, i) => {
      acc.push({ ...week, cumulative: (i > 0 ? acc[i - 1].cumulative : 0) + week.leads });
      return acc;
    }, []);

    // Forecast
    const rw = weeklyData.slice(-8).map((w, i) => ({ x: i, y: w.converted }));
    let forecastNext4 = 0;
    if (rw.length >= 3) {
      const n = rw.length, sx = rw.reduce((s, p) => s + p.x, 0), sy = rw.reduce((s, p) => s + p.y, 0);
      const sxy = rw.reduce((s, p) => s + p.x * p.y, 0), sx2 = rw.reduce((s, p) => s + p.x * p.x, 0);
      const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx) || 0, intercept = (sy - slope * sx) / n;
      forecastNext4 = Math.max(0, Math.round(Array.from({ length: 4 }, (_, i) => Math.max(0, slope * (n + i) + intercept)).reduce((a, b) => a + b, 0)));
    }

    // Response time distribution
    const rtb: Record<string, number> = { '< 1h': 0, '1-6h': 0, '6-24h': 0, '1-3d': 0, '3d+': 0 };
    manualContacted.forEach((l: any) => {
      const h = differenceInHours(new Date(l.contacted_at), new Date(l.created_at));
      if (h < 1) rtb['< 1h']++; else if (h < 6) rtb['1-6h']++; else if (h < 24) rtb['6-24h']++; else if (h < 72) rtb['1-3d']++; else rtb['3d+']++;
    });
    const responseTimeData = Object.entries(rtb).map(([name, value]) => ({ name, value }));

    const autoSuccess = automationLogs.filter((l: any) => l.status === 'success').length;
    const autoTotal = automationLogs.length;

    return {
      total, contactRate, overallConversion,
      contactedCount: manualContacted.length, convertedCount: converted.length,
      autoContactedCount: autoContacted.length,
      avgContactTime, avgConversionDays, weeklyData, sourceData, pieData,
      bestDay: bestDay ? dayNames[parseInt(bestDay[0])] : '-',
      bestHour: bestHour ? `${bestHour[0]}:00` : '-',
      topCountries, funnelData, kpiSparkline,
      contactRateDelta, conversionDelta,
      cohortData, velocityData, forecastNext4,
      autoSuccessRate: autoTotal > 0 ? (autoSuccess / autoTotal) * 100 : 0, autoTotal,
      responseTimeData,
    };
  }, [leads, isEs, automationLogs]);

  if (isLoading || !metrics) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>;
  }

  const MomBadge = ({ delta }: { delta: number }) => {
    if (Math.abs(delta) < 0.1) return null;
    return <Badge variant="outline" className={`text-[9px] ml-1 ${delta > 0 ? 'border-emerald-500 text-emerald-600' : 'border-red-400 text-red-500'}`}>{delta > 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}pp</Badge>;
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs gap-1"><Gauge className="h-3 w-3" /> {isEs ? 'General' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="cohorts" className="text-xs gap-1"><Layers className="h-3 w-3" /> {isEs ? 'Cohortes' : 'Cohorts'}</TabsTrigger>
          <TabsTrigger value="velocity" className="text-xs gap-1"><TrendingUp className="h-3 w-3" /> {isEs ? 'Velocidad' : 'Velocity'}</TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs gap-1"><Activity className="h-3 w-3" /> {isEs ? 'Pronóstico' : 'Forecast'}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isEs ? 'Tasa contacto' : 'Contact Rate', value: `${metrics.contactRate.toFixed(1)}%`, sub: `${metrics.contactedCount}/${metrics.total}`, icon: Phone, color: 'text-amber-600', delta: metrics.contactRateDelta },
              { label: isEs ? 'Tasa conversión' : 'Conversion Rate', value: `${metrics.overallConversion.toFixed(1)}%`, sub: `${metrics.convertedCount}/${metrics.total}`, icon: Target, color: 'text-emerald-600', delta: metrics.conversionDelta },
              { label: isEs ? 'Tiempo avg contacto' : 'Avg Contact Time', value: `${metrics.avgContactTime.toFixed(0)}h`, sub: isEs ? 'horas' : 'hours', icon: Clock, color: 'text-blue-600' },
              { label: isEs ? 'Tiempo avg conversión' : 'Avg Conversion', value: `${metrics.avgConversionDays.toFixed(0)}d`, sub: isEs ? 'días' : 'days', icon: Zap, color: 'text-violet-600' },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 pb-1">
                    <div className="flex items-center justify-between mb-2">
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                      <div className="flex items-center">{kpi.delta !== undefined && <MomBadge delta={kpi.delta} />}<ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-1" /></div>
                    </div>
                    <p className="text-2xl font-black">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
                    <p className="text-[9px] text-muted-foreground">{kpi.sub}</p>
                  </CardContent>
                  <div className="h-8 px-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.kpiSparkline}>
                        <defs><linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                        <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill={`url(#spark-${i})`} strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-emerald-500" />{isEs ? '🔻 Funnel de Conversión' : '🔻 Conversion Funnel'}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.funnelData.map((stage, i) => (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span className="font-medium">{stage.stage}</span><span className="font-bold">{stage.value} <span className="text-muted-foreground font-normal text-xs">({stage.percent}%)</span></span></div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ backgroundColor: stage.color }} initial={{ width: 0 }} animate={{ width: `${stage.percent}%` }} transition={{ delay: i * 0.15, duration: 0.6 }} /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center"><Calendar className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xs text-muted-foreground font-medium">{isEs ? 'Mejor día' : 'Best Day'}</p><p className="text-xl font-black">{metrics.bestDay}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xs text-muted-foreground font-medium">{isEs ? 'Mejor hora' : 'Best Hour'}</p><p className="text-xl font-black">{metrics.bestHour}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs font-bold text-muted-foreground mb-2">{isEs ? '🌍 Top países' : '🌍 Top Countries'}</p><div className="space-y-1">{metrics.topCountries.map(([country, count], i) => (<div key={country} className="flex items-center justify-between text-xs"><span className="truncate">{i + 1}. {country}</span><Badge variant="secondary" className="text-[9px]">{count}</Badge></div>))}</div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{isEs ? 'Leads/semana' : 'Leads/week'}</CardTitle></CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={metrics.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="week" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
                    <Line type="monotone" dataKey="converted" name={isEs ? 'Convertidos' : 'Converted'} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />{isEs ? 'Prioridad' : 'Priority'}</CardTitle></CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={metrics.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{metrics.pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{isEs ? 'Por fuente' : 'By Source'}</CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.sourceData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                  <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="contacted" name={isEs ? 'Contactados' : 'Contacted'} fill="#f59e0b" radius={[4, 4, 0, 0]} /><Bar dataKey="converted" name={isEs ? 'Convertidos' : 'Converted'} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COHORTS */}
        <TabsContent value="cohorts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-violet-500" />{isEs ? '📊 Cohortes Mensuales' : '📊 Monthly Cohorts'}</CardTitle><CardDescription className="text-[10px]">{isEs ? 'Leads agrupados por mes de creación' : 'Leads grouped by creation month'}</CardDescription></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={metrics.cohortData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis yAxisId="left" tick={{ fontSize: 10 }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="left" dataKey="total" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Bar yAxisId="left" dataKey="converted" name={isEs ? 'Convertidos' : 'Converted'} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="% Conv" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{isEs ? '📋 Tabla de Cohortes' : '📋 Cohort Table'}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b bg-muted/30"><th className="px-3 py-2 text-left font-bold">{isEs ? 'Cohorte' : 'Cohort'}</th><th className="px-3 py-2 text-center font-bold">Leads</th><th className="px-3 py-2 text-center font-bold">{isEs ? 'Contactados' : 'Contacted'}</th><th className="px-3 py-2 text-center font-bold">{isEs ? 'Convertidos' : 'Converted'}</th><th className="px-3 py-2 text-center font-bold">% Conv</th></tr></thead>
                  <tbody>{metrics.cohortData.map((c, i) => (<tr key={i} className="border-b hover:bg-muted/20"><td className="px-3 py-2 font-semibold">{c.month}</td><td className="px-3 py-2 text-center">{c.total}</td><td className="px-3 py-2 text-center">{c.contacted}</td><td className="px-3 py-2 text-center font-bold text-emerald-600">{c.converted}</td><td className="px-3 py-2 text-center"><Badge className={`text-[9px] ${c.conversionRate >= 20 ? 'bg-emerald-100 text-emerald-700' : c.conversionRate >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{c.conversionRate}%</Badge></td></tr>))}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" />{isEs ? '⏱ Tiempo de Respuesta' : '⏱ Response Time'}</CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.responseTimeData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                  <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>{metrics.responseTimeData.map((_, i) => (<Cell key={i} fill={i === 0 ? '#10b981' : i === 1 ? '#22c55e' : i === 2 ? '#f59e0b' : i === 3 ? '#f97316' : '#ef4444'} />))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VELOCITY */}
        <TabsContent value="velocity" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{isEs ? '🚀 Velocidad Acumulada' : '🚀 Cumulative Velocity'}</CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="week" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <defs><linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="cumulative" name={isEs ? 'Acumulados' : 'Cumulative'} stroke="#6366f1" fill="url(#velGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="leads" name={isEs ? 'Nuevos' : 'New'} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="text-center"><CardContent className="p-4"><Zap className="h-5 w-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-black">{metrics.autoTotal}</p><p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Automatizaciones' : 'Automations'}</p></CardContent></Card>
            <Card className="text-center"><CardContent className="p-4"><Target className="h-5 w-5 text-emerald-500 mx-auto mb-2" /><p className="text-2xl font-black text-emerald-600">{metrics.autoSuccessRate.toFixed(0)}%</p><p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Éxito' : 'Success'}</p></CardContent></Card>
            <Card className="text-center"><CardContent className="p-4"><Users className="h-5 w-5 text-violet-500 mx-auto mb-2" /><p className="text-2xl font-black">{metrics.autoContactedCount}</p><p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Auto-contactados' : 'Auto-contacted'}</p></CardContent></Card>
          </div>
        </TabsContent>

        {/* FORECAST */}
        <TabsContent value="forecast" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-xs text-muted-foreground font-medium mb-1">{isEs ? '📈 Conversiones estimadas (4 semanas)' : '📈 Est. conversions (4 weeks)'}</p>
                <p className="text-5xl font-black text-primary">{metrics.forecastNext4}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{isEs ? 'Regresión lineal últimas 8 semanas' : 'Linear regression last 8 weeks'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-bold mb-3">{isEs ? '📊 Resumen' : '📊 Summary'}</p>
                <div className="space-y-3">
                  {[
                    { l: isEs ? 'Tasa conversión actual' : 'Current conv. rate', v: `${metrics.overallConversion.toFixed(1)}%`, cls: 'bg-emerald-100 text-emerald-700' },
                    { l: isEs ? 'Leads promedio/semana' : 'Avg leads/week', v: (metrics.total / Math.max(1, metrics.weeklyData.length)).toFixed(1) },
                    { l: isEs ? 'Tiempo avg conversión' : 'Avg conv. time', v: `${metrics.avgConversionDays.toFixed(0)} ${isEs ? 'días' : 'days'}` },
                    { l: isEs ? 'Tendencia MoM' : 'MoM trend', v: `${metrics.conversionDelta >= 0 ? '↑' : '↓'} ${Math.abs(metrics.conversionDelta).toFixed(1)}pp`, cls: metrics.conversionDelta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700' },
                  ].map((item) => (
                    <div key={item.l} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-xs">{item.l}</span>
                      <Badge className={item.cls || ''} variant={item.cls ? 'default' : 'outline'}>{item.v}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />{isEs ? 'Leads vs Conversiones' : 'Leads vs Conversions'}</CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={metrics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="week" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="leads" name={isEs ? 'Leads' : 'Leads'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.5} />
                  <Line type="monotone" dataKey="converted" name={isEs ? 'Convertidos' : 'Converted'} stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
