import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface CategoryStats {
  category: string;
  total: number;
}

interface ClientStats {
  client_name: string;
  total: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
}

interface DashboardStats {
  monthlyTotal: number;
  pendingDocs: number;
  billableExpenses: number;
  totalExpenses: number;
  categoryBreakdown: CategoryStats[];
  clientBreakdown: ClientStats[];
  monthlyTrends: MonthlyTrend[];
}

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('No user');

      const now = new Date();
      const firstDayThisMonth = startOfMonth(now);
      const lastDayThisMonth = endOfMonth(now);

      // Get monthly total
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', firstDayThisMonth.toISOString())
        .lte('date', lastDayThisMonth.toISOString());

      const monthlyTotal = monthlyExpenses?.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      ) || 0;

      // Get pending documents count
      const { count: pendingCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Get billable expenses count
      const { count: billableCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'reimbursable');

      // Get total expenses count
      const { count: totalCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get expenses by category
      const { data: expensesByCategory } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .gte('date', firstDayThisMonth.toISOString())
        .lte('date', lastDayThisMonth.toISOString());

      const categoryBreakdown = expensesByCategory?.reduce((acc, exp) => {
        const category = exp.category || 'other';
        const existing = acc.find((c) => c.category === category);
        const amount = parseFloat(exp.amount.toString());
        
        if (existing) {
          existing.total += amount;
        } else {
          acc.push({ category, total: amount });
        }
        return acc;
      }, [] as CategoryStats[]) || [];

      // Get expenses by client
      const { data: expensesByClient } = await supabase
        .from('expenses')
        .select('client_id, amount, clients(name)')
        .eq('user_id', user.id)
        .gte('date', firstDayThisMonth.toISOString())
        .lte('date', lastDayThisMonth.toISOString())
        .not('client_id', 'is', null);

      const clientBreakdown = expensesByClient?.reduce((acc, exp) => {
        const clientName = (exp.clients as any)?.name || 'Unknown';
        const existing = acc.find((c) => c.client_name === clientName);
        const amount = parseFloat(exp.amount.toString());
        
        if (existing) {
          existing.total += amount;
        } else {
          acc.push({ client_name: clientName, total: amount });
        }
        return acc;
      }, [] as ClientStats[]) || [];

      // Get monthly trends (last 6 months)
      const monthlyTrends: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const firstDay = startOfMonth(monthDate);
        const lastDay = endOfMonth(monthDate);

        const { data: monthExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', firstDay.toISOString())
          .lte('date', lastDay.toISOString());

        const total = monthExpenses?.reduce(
          (sum, exp) => sum + parseFloat(exp.amount.toString()),
          0
        ) || 0;

        monthlyTrends.push({
          month: format(monthDate, 'MMM'),
          total,
        });
      }

      return {
        monthlyTotal,
        pendingDocs: pendingCount || 0,
        billableExpenses: billableCount || 0,
        totalExpenses: totalCount || 0,
        categoryBreakdown: categoryBreakdown.sort((a, b) => b.total - a.total).slice(0, 5),
        clientBreakdown: clientBreakdown.sort((a, b) => b.total - a.total).slice(0, 5),
        monthlyTrends,
      };
    },
    enabled: !!user,
  });
};
