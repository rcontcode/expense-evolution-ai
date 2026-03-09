import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Crown, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_beta_tester: boolean | null;
  created_at: string;
}

/**
 * Admin widget showing recent users with their roles and beta status.
 */
export const AdminUserOverview = memo(() => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-user-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_beta_tester, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
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
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {isEs ? '👥 Usuarios Recientes' : '👥 Recent Users'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="p-4 space-y-1.5">
            {users?.map((user, index) => {
              const isAdmin = adminIds?.includes(user.id);
              const displayName = user.full_name || user.email?.split('@')[0] || '—';
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isAdmin ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{displayName}</span>
                      {isAdmin && (
                        <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                      {user.is_beta_tester && (
                        <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(parseISO(user.created_at), {
                        addSuffix: true,
                        locale: isEs ? esLocale : enUS,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {user.is_beta_tester && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">Beta</Badge>
                    )}
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
