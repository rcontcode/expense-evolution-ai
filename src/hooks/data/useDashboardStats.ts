import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ExpenseStatus, ExpenseCategory } from '@/types/expense.types';

interface DashboardFilters {
  clientId?: string;
  status?: ExpenseStatus | 'all';
  category?: ExpenseCategory | 'all';
  entityId?: string;
  showAllEntities?: boolean;
}

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

export const useDashboardStats = (filters?: DashboardFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id, filters],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('No user');

      const now = new Date();
      const firstDayThisMonth = startOfMonth(now);
      const lastDayThisMonth = endOfMonth(now);
      
      // Get first day of 6 months ago for trends query
      const sixMonthsAgo = subMonths(now, 5);
      const firstDayForTrends = startOfMonth(sixMonthsAgo);

      // Build base filter conditions
      const clientFilter = filters?.clientId && filters.clientId !== 'all' ? filters.clientId : null;
      const statusFilter = filters?.status && filters.status !== 'all' ? filters.status : null;
      const categoryFilter = filters?.category && filters.category !== 'all' ? filters.category : null;
      const entityFilter = !filters?.showAllEntities && filters?.entityId ? filters.entityId : null;

      // Execute all queries in parallel for better performance
      const [
        monthlyExpensesResult,
        pendingCountResult,
        billableCountResult,
        totalCountResult,
        expensesByCategoryResult,
        expensesByClientResult,
        trendsExpensesResult,
      ] = await Promise.all([
        // Monthly expenses query - include currency for multi-entity
        (() => {
          let query = supabase
            .from('expenses')
            .select('amount, currency')
            .eq('user_id', user.id)
            .gte('date', firstDayThisMonth.toISOString())
            .lte('date', lastDayThisMonth.toISOString());
          if (clientFilter) query = query.eq('client_id', clientFilter);
          if (statusFilter) query = query.eq('status', statusFilter);
          if (categoryFilter) query = query.eq('category', categoryFilter);
          if (entityFilter) query = query.eq('entity_id', entityFilter);
          return query;
        })(),
        
        // Pending documents count
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
        
        // Billable expenses count
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'reimbursable'),
        
        // Total expenses count
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Expenses by category
        (() => {
          let query = supabase
            .from('expenses')
            .select('category, amount, currency')
            .eq('user_id', user.id)
            .gte('date', firstDayThisMonth.toISOString())
            .lte('date', lastDayThisMonth.toISOString());
          if (clientFilter) query = query.eq('client_id', clientFilter);
          if (statusFilter) query = query.eq('status', statusFilter);
          if (categoryFilter) query = query.eq('category', categoryFilter);
          if (entityFilter) query = query.eq('entity_id', entityFilter);
          return query;
        })(),
        
        // Expenses by client
        (() => {
          let query = supabase
            .from('expenses')
            .select('client_id, amount, currency, clients(name)')
            .eq('user_id', user.id)
            .gte('date', firstDayThisMonth.toISOString())
            .lte('date', lastDayThisMonth.toISOString())
            .not('client_id', 'is', null);
          if (clientFilter) query = query.eq('client_id', clientFilter);
          if (statusFilter) query = query.eq('status', statusFilter);
          if (categoryFilter) query = query.eq('category', categoryFilter);
          if (entityFilter) query = query.eq('entity_id', entityFilter);
          return query;
        })(),
        
        // All expenses for last 6 months (single query instead of 6)
        (() => {
          let query = supabase
            .from('expenses')
            .select('amount, date, currency')
            .eq('user_id', user.id)
            .gte('date', firstDayForTrends.toISOString())
            .lte('date', lastDayThisMonth.toISOString());
          if (clientFilter) query = query.eq('client_id', clientFilter);
          if (statusFilter) query = query.eq('status', statusFilter);
          if (categoryFilter) query = query.eq('category', categoryFilter);
          if (entityFilter) query = query.eq('entity_id', entityFilter);
          return query;
        })(),
      ]);

      // Process monthly total
      const monthlyTotal = monthlyExpensesResult.data?.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      ) || 0;

      // Process category breakdown
      const categoryBreakdown = expensesByCategoryResult.data?.reduce((acc, exp) => {
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

      // Process client breakdown
      const clientBreakdown = expensesByClientResult.data?.reduce((acc, exp) => {
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

      // Process monthly trends from single query result
      const monthlyTrendsMap = new Map<string, number>();
      
      // Initialize all 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'MMM');
        monthlyTrendsMap.set(monthKey, 0);
      }
      
      // Aggregate expenses by month
      trendsExpensesResult.data?.forEach((exp) => {
        const expDate = new Date(exp.date);
        const monthKey = format(expDate, 'MMM');
        const current = monthlyTrendsMap.get(monthKey) || 0;
        monthlyTrendsMap.set(monthKey, current + parseFloat(exp.amount.toString()));
      });
      
      // Convert to array maintaining order
      const monthlyTrends: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'MMM');
        monthlyTrends.push({
          month: monthKey,
          total: monthlyTrendsMap.get(monthKey) || 0,
        });
      }

      return {
        monthlyTotal,
        pendingDocs: pendingCountResult.count || 0,
        billableExpenses: billableCountResult.count || 0,
        totalExpenses: totalCountResult.count || 0,
        categoryBreakdown: categoryBreakdown.sort((a, b) => b.total - a.total).slice(0, 5),
        clientBreakdown: clientBreakdown.sort((a, b) => b.total - a.total).slice(0, 5),
        monthlyTrends,
      };
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds to reduce refetches
  });
};
