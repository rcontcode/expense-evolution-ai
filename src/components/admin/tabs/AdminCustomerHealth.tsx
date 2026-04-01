import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, AlertTriangle, Users, Activity, SmilePlus, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { subDays, subMonths, format, differenceInDays } from 'date-fns';

interface AdminCustomerHealthProps {
  language: string;
}

export function AdminCustomerHealth({ language }: AdminCustomerHealthProps) {
  const isEs = language === 'es';

  // Feedback ratings
  const { data: feedbackData = [] } = useQuery({
    queryKey: ['admin-health-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('rating, ease_of_use, usefulness, design_rating, would_recommend, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });

  // Active users (feature_usage_logs)
  const { data: usageLogs = [] } = useQuery({
    queryKey: ['admin-health-usage'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('feature_usage_logs')
        .select('user_id, created_at')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });

  // All subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-health-subs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type, is_active, updated_at');
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });

  // Total profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-health-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at');
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });

  // Bug reports count
  const { data: bugCount = 0 } = useQuery({
    queryKey: ['admin-health-bugs'],
    queryFn: async () => {
      const { count } = await supabase
        .from('beta_bug_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', subDays(new Date(), 30).toISOString());
      return count || 0;
    },
    staleTime: 300000,
  });

  // Calculate metrics
  const avgRating = feedbackData.length > 0
    ? feedbackData.reduce((s, f) => s + f.rating, 0) / feedbackData.length
    : 0;

  const npsProxy = feedbackData.filter(f => f.would_recommend === true).length / Math.max(feedbackData.length, 1) * 100;

  const now = new Date();
  const activeUserIds7d = new Set(usageLogs.filter(l => differenceInDays(now, new Date(l.created_at)) <= 7).map(l => l.user_id));
  const activeUserIds30d = new Set(usageLogs.map(l => l.user_id));
  const totalUsers = profiles.length;

  const dau7dRate = totalUsers > 0 ? Math.round((activeUserIds7d.size / totalUsers) * 100) : 0;
  const mauRate = totalUsers > 0 ? Math.round((activeUserIds30d.size / totalUsers) * 100) : 0;

  const paidSubs = subscriptions.filter(s => s.plan_type !== 'free' && s.is_active);
  const churnedLast30 = subscriptions.filter(s => {
    if (s.plan_type === 'free' && s.updated_at) {
      return differenceInDays(now, new Date(s.updated_at)) <= 30;
    }
    return false;
  });
  const churnRate = paidSubs.length + churnedLast30.length > 0
    ? Math.round((churnedLast30.length / (paidSubs.length + churnedLast30.length)) * 100)
    : 0;

  // Engagement by plan
  const engagementByPlan = (() => {
    const planMap: Record<string, string> = {};
    subscriptions.forEach((s: any) => { planMap[s.user_id] = s.plan_type; });

    const plans: Record<string, { sessions: number; users: Set<string> }> = {};
    usageLogs.forEach((l: any) => {
      const plan = planMap[l.user_id] || 'free';
      if (!plans[plan]) plans[plan] = { sessions: 0, users: new Set() };
      plans[plan].sessions++;
      plans[plan].users.add(l.user_id);
    });

    return Object.entries(plans).map(([plan, data]) => ({
      plan,
      sessions: data.sessions,
      users: data.users.size,
      avgSessions: data.users.size > 0 ? Math.round(data.sessions / data.users.size) : 0,
    }));
  })();

  // At-risk users: paid, no activity in 14+ days
  const atRiskUsers = (() => {
    const lastActivity: Record<string, Date> = {};
    usageLogs.forEach((l: any) => {
      const d = new Date(l.created_at);
      if (!lastActivity[l.user_id] || d > lastActivity[l.user_id]) {
        lastActivity[l.user_id] = d;
      }
    });

    return paidSubs
      .filter(s => {
        const last = lastActivity[s.user_id];
        return !last || differenceInDays(now, last) > 14;
      })
      .map(s => {
        const profile = profiles.find(p => p.id === s.user_id);
        const last = lastActivity[s.user_id];
        return {
          userId: s.user_id,
          name: profile?.full_name || profile?.email || s.user_id.slice(0, 8),
          plan: s.plan_type,
          daysSinceActivity: last ? differenceInDays(now, last) : 999,
        };
      })
      .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)
      .slice(0, 10);
  })();

  // Satisfaction trend (last 6 months)
  const satisfactionTrend = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const monthKey = format(month, 'yyyy-MM');
    const monthFeedback = feedbackData.filter(f => f.created_at?.startsWith(monthKey));
    const avg = monthFeedback.length > 0
      ? monthFeedback.reduce((s, f) => s + f.rating, 0) / monthFeedback.length
      : null;
    return { month: format(month, 'MMM'), rating: avg ? Math.round(avg * 10) / 10 : null };
  });

  // Health score
  const healthScore = Math.min(100, Math.round(
    (avgRating / 5) * 30 + // 30% from satisfaction
    (mauRate / 100) * 30 + // 30% from engagement
    ((100 - churnRate) / 100) * 25 + // 25% from retention
    (Math.min(npsProxy, 100) / 100) * 15 // 15% from NPS
  ));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className={`p-4 bg-gradient-to-br ${healthScore >= 70 ? 'from-emerald-500 to-green-600' : healthScore >= 40 ? 'from-amber-500 to-yellow-600' : 'from-red-500 to-rose-600'} text-white`}>
              <p className="text-xs text-white/80">{isEs ? 'Salud General' : 'Health Score'}</p>
              <p className="text-3xl font-black">{healthScore}</p>
              <Progress value={healthScore} className="h-1 mt-1 bg-white/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <p className="text-xs text-white/80">{isEs ? 'Satisfacción' : 'Satisfaction'}</p>
              <p className="text-3xl font-black">{avgRating.toFixed(1)}<span className="text-lg">/5</span></p>
              <p className="text-[10px] text-white/70">{feedbackData.length} reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <p className="text-xs text-white/80">{isEs ? 'Retención 7d' : 'Retention 7d'}</p>
              <p className="text-3xl font-black">{dau7dRate}%</p>
              <p className="text-[10px] text-white/70">{activeUserIds7d.size}/{totalUsers} users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className={`p-4 bg-gradient-to-br ${churnRate <= 5 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-orange-500'} text-white`}>
              <p className="text-xs text-white/80">Churn Rate</p>
              <p className="text-3xl font-black">{churnRate}%</p>
              <p className="text-[10px] text-white/70">{churnedLast30.length} lost</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-yellow-600 text-white">
              <p className="text-xs text-white/80">NPS Proxy</p>
              <p className="text-3xl font-black">{Math.round(npsProxy)}%</p>
              <p className="text-[10px] text-white/70">{isEs ? 'Recomendarían' : 'Would recommend'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              {isEs ? 'Engagement por Plan (30d)' : 'Engagement by Plan (30d)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {engagementByPlan.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={engagementByPlan}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="plan" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="avgSessions" fill="#8b5cf6" name={isEs ? 'Sesiones prom/usuario' : 'Avg sessions/user'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">{isEs ? 'Sin datos' : 'No data'}</p>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <SmilePlus className="h-4 w-4 text-emerald-500" />
              {isEs ? 'Tendencia de Satisfacción' : 'Satisfaction Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={satisfactionTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[0, 5]} className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={2} connectNulls name="Rating" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {isEs ? '⚠️ Usuarios en Riesgo de Churn' : '⚠️ Users at Risk of Churn'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atRiskUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{isEs ? 'Usuario' : 'User'}</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">{isEs ? 'Días inactivo' : 'Days inactive'}</th>
                    <th className="pb-2 font-medium">{isEs ? 'Riesgo' : 'Risk'}</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskUsers.map((u) => (
                    <tr key={u.userId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{u.name}</td>
                      <td className="py-2"><Badge variant="outline" className="capitalize">{u.plan}</Badge></td>
                      <td className="py-2">{u.daysSinceActivity === 999 ? '∞' : `${u.daysSinceActivity}d`}</td>
                      <td className="py-2">
                        <Badge variant={u.daysSinceActivity > 30 ? 'destructive' : 'secondary'}>
                          {u.daysSinceActivity > 30 ? '🔴 Alto' : '🟡 Medio'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              {isEs ? '🎉 No hay usuarios en riesgo — ¡Excelente retención!' : '🎉 No users at risk — Great retention!'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
