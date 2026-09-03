import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
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
  monthlyIncome: number;
  savingsRate: number;
  pendingDocs: number;
  billableExpenses: number;
  totalExpenses: number;
  categoryBreakdown: CategoryStats[];
  clientBreakdown: ClientStats[];
  monthlyTrends: MonthlyTrend[];
}

export const useDashboardStats = (filters?: DashboardFilters) => {
  const { user } = useAuth();
  const { language } = useLanguage();

  return useQuery({
    // El idioma entra en la llave: las etiquetas de los meses se arman aca dentro, asi que al
    // cambiar de idioma hay que rehacerlas y no servir las del idioma anterior desde la cache.
    queryKey: ['dashboard-stats', user?.id, filters, language],
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
        monthlyIncomeResult,
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
            .is('deleted_at', null)
            .gte('date', firstDayThisMonth.toISOString())
            .lte('date', lastDayThisMonth.toISOString());
          if (clientFilter) query = query.eq('client_id', clientFilter);
          if (statusFilter) query = query.eq('status', statusFilter);
          if (categoryFilter) query = query.eq('category', categoryFilter);
          if (entityFilter) query = query.eq('entity_id', entityFilter);
          return query;
        })(),

        // Monthly income query
        (() => {
          let query = supabase
            .from('income')
            .select('amount')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .gte('date', format(firstDayThisMonth, 'yyyy-MM-dd'))
            .lte('date', format(lastDayThisMonth, 'yyyy-MM-dd'));
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
          .is('deleted_at', null)
          .eq('status', 'reimbursable'),
        
        // Total expenses count
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null),
        
        // Expenses by category
        (() => {
          let query = supabase
            .from('expenses')
            .select('category, amount, currency')
            .eq('user_id', user.id)
            .is('deleted_at', null)
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
            .is('deleted_at', null)
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
            .is('deleted_at', null)
            .gte('date', firstDayForTrends.toISOString())
            .lte('date', lastDayThisMonth.toISOString());
          if (clientFilter) query = query.eq('client_id', clientFilter);
          if (statusFilter) query = query.eq('status', statusFilter);
          if (categoryFilter) query = query.eq('category', categoryFilter);
          if (entityFilter) query = query.eq('entity_id', entityFilter);
          return query;
        })(),
      ]);

      // Process monthly income
      const monthlyIncome = monthlyIncomeResult.data?.reduce(
        (sum, inc) => sum + parseFloat(inc.amount.toString()),
        0
      ) || 0;

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

      // Process monthly trends from single query result.
      // Se agrupa por 'yyyy-MM' (que es unico) y recien al final se arma la etiqueta con el
      // idioma. Antes se agrupaba Y se etiquetaba con 'MMM' sin idioma, asi que el grafico de
      // gastos de una app en espanol decia "Apr May Jun Jul Aug Sep".
      const etiquetaMes = (d: Date) =>
        format(d, 'MMM', { locale: language === 'es' ? es : enUS });

      const monthlyTrendsMap = new Map<string, number>();

      for (let i = 5; i >= 0; i--) {
        monthlyTrendsMap.set(format(subMonths(now, i), 'yyyy-MM'), 0);
      }

      trendsExpensesResult.data?.forEach((exp) => {
        const monthKey = format(new Date(exp.date), 'yyyy-MM');
        if (!monthlyTrendsMap.has(monthKey)) return;
        monthlyTrendsMap.set(monthKey, (monthlyTrendsMap.get(monthKey) || 0) + parseFloat(exp.amount.toString()));
      });

      const monthlyTrends: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        monthlyTrends.push({
          month: etiquetaMes(monthDate),
          total: monthlyTrendsMap.get(format(monthDate, 'yyyy-MM')) || 0,
        });
      }

      // Calculate savings rate
      const savingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyTotal) / monthlyIncome) * 100 
        : 0;

      return {
        monthlyTotal,
        monthlyIncome,
        savingsRate,
        pendingDocs: pendingCountResult.count || 0,
        billableExpenses: billableCountResult.count || 0,
        totalExpenses: totalCountResult.count || 0,
        categoryBreakdown: categoryBreakdown.sort((a, b) => b.total - a.total).slice(0, 5),
        clientBreakdown: clientBreakdown.sort((a, b) => b.total - a.total).slice(0, 5),
        monthlyTrends,
      };
    },
    enabled: !!user,
    staleTime: 300000, // Cache for 5 minutes (global standard)
  });
};
