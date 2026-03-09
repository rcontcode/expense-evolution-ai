import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  User,
  Receipt,
  CircleDollarSign,
  MessageSquare,
  Bug,
  FileText,
  Star,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'expense' | 'income' | 'feedback' | 'bug' | 'signup';
  description: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
}

/**
 * Real-time activity feed for admins showing:
 * - Recent signups
 * - Recent expenses/income
 * - Beta feedback & bug reports
 */
export const AdminRecentActivity = memo(() => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Recent signups (last 7 days)
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentUsers?.forEach((user) => {
        items.push({
          id: `user-${user.id}`,
          type: 'signup',
          description: `${user.email?.split('@')[0] || 'User'}`,
          timestamp: user.created_at,
          icon: User,
          color: 'text-violet-600 bg-violet-100',
        });
      });

      // Recent feedback
      const { data: recentFeedback } = await supabase
        .from('beta_feedback')
        .select('id, section, rating, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentFeedback?.forEach((fb) => {
        items.push({
          id: `feedback-${fb.id}`,
          type: 'feedback',
          description: `${fb.section} (${fb.rating}⭐)`,
          timestamp: fb.created_at,
          icon: Star,
          color: 'text-amber-600 bg-amber-100',
        });
      });

      // Recent bug reports
      const { data: recentBugs } = await supabase
        .from('beta_bug_reports')
        .select('id, title, severity, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentBugs?.forEach((bug) => {
        items.push({
          id: `bug-${bug.id}`,
          type: 'bug',
          description: bug.title?.slice(0, 30) || 'Bug report',
          timestamp: bug.created_at,
          icon: Bug,
          color: 'text-rose-600 bg-rose-100',
        });
      });

      // Sort by timestamp
      return items.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);
    },
    refetchInterval: 30000, // Every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeLabel = (type: ActivityItem['type']) => {
    const labels = {
      expense: isEs ? 'Gasto' : 'Expense',
      income: isEs ? 'Ingreso' : 'Income',
      feedback: 'Feedback',
      bug: 'Bug',
      signup: isEs ? 'Registro' : 'Signup',
    };
    return labels[type];
  };

  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {isEs ? '🔄 Actividad Reciente' : '🔄 Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="p-4 space-y-2">
            {activities?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isEs ? 'Sin actividad reciente' : 'No recent activity'}
              </p>
            ) : (
              activities?.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-1.5 rounded-lg ${activity.color}`}>
                    <activity.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {getTypeLabel(activity.type)}
                      </Badge>
                      <span className="text-sm truncate">{activity.description}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(parseISO(activity.timestamp), {
                        addSuffix: true,
                        locale: isEs ? esLocale : enUS,
                      })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

AdminRecentActivity.displayName = 'AdminRecentActivity';
