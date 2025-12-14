import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTags } from './useTags';

interface TagSuggestion {
  tagId: string;
  tagName: string;
  tagColor: string;
  confidence: number;
  reason: string;
}

interface SuggestTagsParams {
  vendor?: string;
  category?: string;
  description?: string;
}

export function useTagSuggestions() {
  const { data: tags } = useTags();

  return useMutation({
    mutationFn: async (params: SuggestTagsParams): Promise<TagSuggestion[]> => {
      if (!tags || tags.length === 0) {
        return [];
      }

      // Get user's tagging history for context
      const { data: expenseTags } = await supabase
        .from('expense_tags')
        .select(`
          tag_id,
          tags:tag_id(name),
          expenses:expense_id(vendor, category)
        `)
        .limit(50);

      const userTagHistory = expenseTags?.map(et => ({
        tagId: et.tag_id,
        tagName: (et.tags as any)?.name || '',
        vendor: (et.expenses as any)?.vendor,
        category: (et.expenses as any)?.category,
      })).filter(h => h.tagName) || [];

      const { data, error } = await supabase.functions.invoke('suggest-tags', {
        body: {
          vendor: params.vendor,
          category: params.category,
          description: params.description,
          existingTags: tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
          userTagHistory,
        },
      });

      if (error) throw error;
      return data?.suggestions || [];
    },
  });
}

// Hook to get tag analytics data
export function useTagAnalytics() {
  return useQuery({
    queryKey: ['tag-analytics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all tags with expense counts
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('user_id', user.id);

      const { data: expenseTags } = await supabase
        .from('expense_tags')
        .select('tag_id, expense_id, expenses:expense_id(date, amount)');

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, date, amount')
        .eq('user_id', user.id);

      // Calculate tag usage stats
      const tagStats = new Map<string, { 
        count: number; 
        totalAmount: number;
        monthlyData: Map<string, { count: number; amount: number }>;
      }>();

      expenseTags?.forEach(et => {
        const expense = et.expenses as any;
        if (!expense) return;

        const current = tagStats.get(et.tag_id) || { 
          count: 0, 
          totalAmount: 0,
          monthlyData: new Map()
        };
        
        current.count++;
        current.totalAmount += Number(expense.amount) || 0;

        // Monthly breakdown
        const monthKey = expense.date?.substring(0, 7) || 'unknown';
        const monthData = current.monthlyData.get(monthKey) || { count: 0, amount: 0 };
        monthData.count++;
        monthData.amount += Number(expense.amount) || 0;
        current.monthlyData.set(monthKey, monthData);

        tagStats.set(et.tag_id, current);
      });

      // Build analytics result
      const tagAnalytics = (tags || []).map(tag => {
        const stats = tagStats.get(tag.id);
        const monthlyArray = stats?.monthlyData 
          ? Array.from(stats.monthlyData.entries())
              .map(([month, data]) => ({ month, ...data }))
              .sort((a, b) => a.month.localeCompare(b.month))
          : [];

        return {
          id: tag.id,
          name: tag.name,
          color: tag.color || '#3B82F6',
          count: stats?.count || 0,
          totalAmount: stats?.totalAmount || 0,
          monthlyData: monthlyArray,
        };
      }).sort((a, b) => b.count - a.count);

      // Get last 6 months for trends
      const last6Months: string[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push(d.toISOString().substring(0, 7));
      }

      // Calculate monthly trends
      const monthlyTrends = last6Months.map(month => {
        const tagBreakdown: Record<string, number> = {};
        let totalCount = 0;
        
        tagAnalytics.forEach(tag => {
          const monthData = tag.monthlyData.find(m => m.month === month);
          if (monthData) {
            tagBreakdown[tag.name] = monthData.count;
            totalCount += monthData.count;
          }
        });

        return {
          month,
          totalCount,
          ...tagBreakdown,
        };
      });

      const totalTaggedExpenses = expenseTags?.length || 0;
      const totalExpenses = expenses?.length || 0;
      const untaggedExpenses = totalExpenses - new Set(expenseTags?.map(et => et.expense_id)).size;

      return {
        tags: tagAnalytics,
        monthlyTrends,
        summary: {
          totalTags: tags?.length || 0,
          totalTaggedExpenses,
          totalExpenses,
          untaggedExpenses,
          coveragePercent: totalExpenses > 0 
            ? Math.round(((totalExpenses - untaggedExpenses) / totalExpenses) * 100) 
            : 0,
        },
      };
    },
    staleTime: 60000,
  });
}
