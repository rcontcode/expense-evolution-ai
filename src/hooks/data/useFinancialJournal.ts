import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialJournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  entry_type: 'reflection' | 'decision' | 'lesson' | 'gratitude' | 'goal';
  content: string;
  related_expense_id: string | null;
  related_income_id: string | null;
  mood: string | null;
  lessons_learned: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialJournalFormData {
  entry_type: string;
  content: string;
  mood?: string;
  lessons_learned?: string;
  related_expense_id?: string;
  related_income_id?: string;
}

export function useFinancialJournal(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-journal', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('financial_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialJournalEntry[];
    },
    enabled: !!user,
  });
}

export function useJournalStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-journal-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('financial_journal')
        .select('entry_type, entry_date')
        .eq('user_id', user.id);

      if (error) throw error;

      const entries = data || [];
      const totalEntries = entries.length;
      
      // Count by type
      const byType = entries.reduce((acc, entry) => {
        acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate streak
      const today = new Date();
      const sortedDates = [...new Set(entries.map(e => e.entry_date))].sort().reverse();
      let streak = 0;
      
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (sortedDates[i] === expectedDateStr) {
          streak++;
        } else {
          break;
        }
      }

      // Entries this month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const entriesThisMonth = entries.filter(e => {
        const entryDate = new Date(e.entry_date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }).length;

      return {
        totalEntries,
        byType,
        streak,
        entriesThisMonth,
        hasEntryToday: sortedDates[0] === today.toISOString().split('T')[0],
      };
    },
    enabled: !!user,
  });
}

export function useCreateJournalEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FinancialJournalFormData) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('financial_journal')
        .insert({
          user_id: user.id,
          entry_date: new Date().toISOString().split('T')[0],
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-journal'] });
      queryClient.invalidateQueries({ queryKey: ['financial-journal-stats'] });
      toast.success('Entrada de diario guardada');
    },
  });
}

export function useDeleteJournalEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('financial_journal')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-journal'] });
      queryClient.invalidateQueries({ queryKey: ['financial-journal-stats'] });
      toast.success('Entrada eliminada');
    },
  });
}
