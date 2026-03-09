import { memo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Crown, Shield, Clock, MoreVertical, UserCheck, UserX, CalendarPlus, Mail } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_beta_tester: boolean | null;
  beta_expires_at: string | null;
  beta_plan_level: string | null;
  created_at: string;
}

/**
 * Admin widget showing users with management actions:
 * toggle beta, extend access, view details.
 */
export const AdminUserOverview = memo(() => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-user-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_beta_tester, beta_expires_at, beta_plan_level, created_at')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data || []) as UserRow[];
    },
    refetchInterval: 60000,
  });

  const { data: adminIds } = useQuery({
    queryKey: ['admin-role-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (error) return [];
      return (data || []).map(r => r.user_id);
    },
  });

  const handleActivateBeta = async (userId: string, days: number = 90) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('activate_beta_tester', {
        p_user_id: userId,
        p_days: days,
      });
      if (error) throw error;
      toast.success(isEs ? `✅ Beta activado (${days} días)` : `✅ Beta activated (${days} days)`);
      queryClient.invalidateQueries({ queryKey: ['admin-user-overview'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeBeta = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('revoke_beta_access', {
        p_user_id: userId,
        p_reason: 'Revocado por admin',
      });
      if (error) throw error;
      toast.success(isEs ? '❌ Beta revocado' : '❌ Beta revoked');
      queryClient.invalidateQueries({ queryKey: ['admin-user-overview'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendBeta = async (userId: string, days: number = 30) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('extend_beta_access', {
        p_user_id: userId,
        p_days: days,
        p_reason: `Extensión admin +${days}d`,
      });
      if (error) throw error;
      toast.success(isEs ? `📅 +${days} días añadidos` : `📅 +${days} days added`);
      queryClient.invalidateQueries({ queryKey: ['admin-user-overview'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><div className="h-5 w-40 bg-muted rounded" /></CardHeader>
        <CardContent><div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-muted rounded" />)}</div></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {isEs ? '👥 Gestión de Usuarios' : '👥 User Management'}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {users?.length || 0} {isEs ? 'recientes' : 'recent'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px]">
          <div className="p-4 space-y-1">
            {users?.map((user, index) => {
              const isAdmin = adminIds?.includes(user.id);
              const displayName = user.full_name || user.email?.split('@')[0] || '—';
              const isLoading = actionLoading === user.id;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isAdmin ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium truncate">{displayName}</span>
                      {isAdmin && <Shield className="h-2.5 w-2.5 text-primary flex-shrink-0" />}
                      {user.is_beta_tester && <Crown className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[9px] text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {user.is_beta_tester && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                        {user.beta_plan_level || 'beta'}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLoading}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {!user.is_beta_tester ? (
                          <>
                            <DropdownMenuItem onClick={() => handleActivateBeta(user.id, 90)}>
                              <UserCheck className="h-3.5 w-3.5 mr-2" />
                              {isEs ? 'Activar Beta (90d)' : 'Activate Beta (90d)'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActivateBeta(user.id, 30)}>
                              <UserCheck className="h-3.5 w-3.5 mr-2" />
                              {isEs ? 'Activar Beta (30d)' : 'Activate Beta (30d)'}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleExtendBeta(user.id, 30)}>
                              <CalendarPlus className="h-3.5 w-3.5 mr-2" />
                              {isEs ? 'Extender +30 días' : 'Extend +30 days'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtendBeta(user.id, 90)}>
                              <CalendarPlus className="h-3.5 w-3.5 mr-2" />
                              {isEs ? 'Extender +90 días' : 'Extend +90 days'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRevokeBeta(user.id)}
                            >
                              <UserX className="h-3.5 w-3.5 mr-2" />
                              {isEs ? 'Revocar Beta' : 'Revoke Beta'}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(user.email || '');
                            toast.success(isEs ? 'Email copiado' : 'Email copied');
                          }}
                        >
                          <Mail className="h-3.5 w-3.5 mr-2" />
                          {isEs ? 'Copiar Email' : 'Copy Email'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

AdminUserOverview.displayName = 'AdminUserOverview';
