import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crown, Shield, Calendar, Mail, CreditCard, Activity, 
  BarChart3, UserCheck, UserX, CalendarPlus, Copy, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserDetailSheetProps {
  userId: string | null;
  onClose: () => void;
  language: 'es' | 'en';
}

export const UserDetailSheet = ({ userId, onClose, language }: UserDetailSheetProps) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: subscription } = useQuery({
    queryKey: ['admin-user-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: usage } = useQuery({
    queryKey: ['admin-user-usage', userId],
    queryFn: async () => {
      if (!userId) return null;
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', currentMonth)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ['admin-user-is-admin', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      return !!data;
    },
    enabled: !!userId,
  });

  const { data: betaPoints } = useQuery({
    queryKey: ['admin-user-beta-points', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('beta_tester_points')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    enabled: !!userId && user?.is_beta_tester,
  });

  const handleActivateBeta = async (days: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('activate_beta_tester', { p_user_id: userId, p_days: days });
      if (error) throw error;
      toast.success(isEs ? `✅ Beta activado (${days} días)` : `✅ Beta activated (${days} days)`);
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-overview-all'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally { setActionLoading(false); }
  };

  const handleRevokeBeta = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('revoke_beta_access', { p_user_id: userId, p_reason: 'Revocado por admin desde CRM' });
      if (error) throw error;
      toast.success(isEs ? '❌ Beta revocado' : '❌ Beta revoked');
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-overview-all'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally { setActionLoading(false); }
  };

  const handleExtendBeta = async (days: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('extend_beta_access', { p_user_id: userId, p_days: days, p_reason: `Extensión admin +${days}d` });
      if (error) throw error;
      toast.success(isEs ? `📅 +${days} días añadidos` : `📅 +${days} days added`);
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-overview-all'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally { setActionLoading(false); }
  };

  if (!userId) return null;

  const displayName = user?.full_name || user?.email?.split('@')[0] || '—';
  const planType = subscription?.plan_type || 'free';

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-800',
    premium: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30',
    pro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
    pro_beta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
    bundle: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30',
  };

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              isAdmin ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate">{displayName}</span>
                {isAdmin && <Shield className="h-4 w-4 text-primary" />}
                {user?.is_beta_tester && <Crown className="h-4 w-4 text-amber-500" />}
              </div>
              <SheetDescription className="text-xs truncate">{user?.email}</SheetDescription>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Plan & Status */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {isEs ? 'Plan Actual' : 'Current Plan'}
                  </span>
                  <Badge className={planColors[planType]}>
                    {planType.toUpperCase()}
                  </Badge>
                </div>
                {subscription?.is_active && subscription?.expires_at && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isEs ? 'Expira' : 'Expires'}</span>
                    <span>{format(new Date(subscription.expires_at), 'dd MMM yyyy', { locale: isEs ? esLocale : undefined })}</span>
                  </div>
                )}
                {subscription?.stripe_subscription_id && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Stripe ID</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{subscription.stripe_subscription_id.slice(0, 20)}...</code>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Beta Status */}
            <Card className={user?.is_beta_tester ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Beta Tester
                  </span>
                  <Badge variant={user?.is_beta_tester ? 'default' : 'secondary'}>
                    {user?.is_beta_tester ? '✅ Activo' : '⏸️ Inactivo'}
                  </Badge>
                </div>
                {user?.is_beta_tester && user?.beta_expires_at && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isEs ? 'Expira' : 'Expires'}</span>
                    <span>{format(new Date(user.beta_expires_at), 'dd MMM yyyy', { locale: isEs ? esLocale : undefined })}</span>
                  </div>
                )}
                {betaPoints && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{isEs ? 'Puntos Beta' : 'Beta Points'}</span>
                    <span className="font-bold">{betaPoints.total_points} pts ({betaPoints.tier})</span>
                  </div>
                )}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {!user?.is_beta_tester ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleActivateBeta(90)} disabled={actionLoading}>
                        <UserCheck className="h-3 w-3 mr-1" /> +90d
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleActivateBeta(30)} disabled={actionLoading}>
                        <UserCheck className="h-3 w-3 mr-1" /> +30d
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleExtendBeta(30)} disabled={actionLoading}>
                        <CalendarPlus className="h-3 w-3 mr-1" /> +30d
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleExtendBeta(90)} disabled={actionLoading}>
                        <CalendarPlus className="h-3 w-3 mr-1" /> +90d
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleRevokeBeta} disabled={actionLoading}>
                        <UserX className="h-3 w-3 mr-1" /> {isEs ? 'Revocar' : 'Revoke'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage This Month */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{isEs ? 'Uso Este Mes' : 'Usage This Month'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{isEs ? 'Gastos' : 'Expenses'}</span>
                    <span className="font-bold">{usage?.expenses_count || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{isEs ? 'Ingresos' : 'Income'}</span>
                    <span className="font-bold">{usage?.incomes_count || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>OCR Scans</span>
                    <span className="font-bold">{usage?.ocr_scans_count || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span>{isEs ? 'Contratos' : 'Contracts'}</span>
                    <span className="font-bold">{usage?.contract_analyses_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{isEs ? 'Info de Cuenta' : 'Account Info'}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {isEs ? 'Registro' : 'Joined'}
                    </span>
                    <span>{user?.created_at ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: isEs ? esLocale : undefined }) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isEs ? 'País' : 'Country'}</span>
                    <span>{user?.country || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isEs ? 'Idioma' : 'Language'}</span>
                    <span>{user?.preferred_language?.toUpperCase() || '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(user?.email || ''); toast.success(isEs ? 'Email copiado' : 'Email copied'); }}>
                <Copy className="h-3 w-3 mr-1" /> {isEs ? 'Copiar Email' : 'Copy Email'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(userId); toast.success('User ID copied'); }}>
                <Copy className="h-3 w-3 mr-1" /> Copy ID
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
