import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Users, Crown, Zap, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  premium: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  pro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pro_beta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  bundle: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const planEmojis: Record<string, string> = {
  free: '🆓', premium: '💎', pro: '🚀', pro_beta: '🧪', bundle: '🔥',
};

export const AdminSubscriptionsTab = ({ language }: Props) => {
  const isEs = language === 'es';

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profileMap } = useQuery({
    queryKey: ['admin-sub-profiles', subscriptions?.map(s => s.user_id)],
    queryFn: async () => {
      if (!subscriptions || subscriptions.length === 0) return {};
      const ids = [...new Set(subscriptions.map(s => s.user_id))];
      const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
      const map: Record<string, { name: string; email: string }> = {};
      for (const p of data || []) {
        map[p.id] = { name: (p as any).full_name || '—', email: (p as any).email || '' };
      }
      return map;
    },
    enabled: !!subscriptions && subscriptions.length > 0,
  });

  // Stats
  const stats = subscriptions?.reduce((acc, s) => {
    const plan = s.plan_type || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const activeCount = subscriptions?.filter(s => s.is_active && s.plan_type !== 'free').length || 0;
  const totalCount = subscriptions?.length || 0;
  const conversionRate = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><div className="h-6 w-48 bg-muted rounded" /></CardHeader>
        <CardContent><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded" />)}</div></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan breakdown cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['free', 'premium', 'pro', 'pro_beta', 'bundle'].map(plan => (
          <motion.div key={plan} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="text-center">
              <CardContent className="p-4">
                <span className="text-2xl">{planEmojis[plan]}</span>
                <p className="text-3xl font-black mt-1">{stats[plan] || 0}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold mt-1">{plan.replace('_', ' ')}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Conversion indicator */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-bold">{isEs ? 'Tasa de Conversión' : 'Conversion Rate'}</p>
              <p className="text-xs text-muted-foreground">{isEs ? 'Usuarios de pago vs total' : 'Paid users vs total'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-emerald-600">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">{activeCount} / {totalCount}</p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription table */}
      <Card className="border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>{isEs ? '💳 Suscripciones Activas' : '💳 Active Subscriptions'}</CardTitle>
              <CardDescription>{isEs ? 'Estado de planes de todos los usuarios' : 'Plan status for all users'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">{isEs ? 'Usuario' : 'User'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'Plan' : 'Plan'}</TableHead>
                <TableHead className="text-center font-bold">{isEs ? 'Estado' : 'Status'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'Periodo' : 'Period'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'Expira' : 'Expires'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'Stripe ID' : 'Stripe ID'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.filter(s => s.plan_type !== 'free').map((sub, i) => {
                const profile = profileMap?.[sub.user_id];
                return (
                  <motion.tr key={sub.id || sub.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{profile?.name || sub.user_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[sub.plan_type || 'free']}>
                        {planEmojis[sub.plan_type || 'free']} {(sub.plan_type || 'free').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                        {sub.is_active ? '✅' : '⏸️'} {sub.is_active ? (isEs ? 'Activo' : 'Active') : (isEs ? 'Inactivo' : 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{sub.billing_period || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.expires_at ? format(new Date(sub.expires_at), 'dd MMM yyyy', { locale: isEs ? esLocale : undefined }) : '—'}
                    </TableCell>
                    <TableCell>
                      {sub.stripe_subscription_id ? (
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{sub.stripe_subscription_id.slice(0, 16)}...</code>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                  </motion.tr>
                );
              })}
              {subscriptions?.filter(s => s.plan_type !== 'free').length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{isEs ? 'No hay suscripciones de pago' : 'No paid subscriptions'}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
