import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

export interface FinancialJournalEntry {
  id: string; user_id: string; entry_date: string;
  entry_type: 'reflection' | 'decision' | 'lesson' | 'gratitude' | 'goal';
  content: string; related_expense_id: string | null; related_income_id: string | null;
  mood: string | null; lessons_learned: string | null; created_at: string; updated_at: string;
}

export interface FinancialJournalFormData {
  entry_type: string; content: string; mood?: string; lessons_learned?: string;
  related_expense_id?: string; related_income_id?: string;
}

export function useFinancialJournal(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-journal', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('financial_journal').select('*').eq('user_id', user.id)
        .order('entry_date', { ascending: false }).order('created_at', { ascending: false });
      query = query.limit(limit || 500);
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
      const { data, error } = await supabase.from('financial_journal').select('entry_type, entry_date').eq('user_id', user.id);
      if (error) throw error;

      const entries = data || [];
      const byType = entries.reduce((acc, entry) => {
        acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1; return acc;
      }, {} as Record<string, number>);

      const today = new Date();
      const sortedDates = [...new Set(entries.map(e => e.entry_date))].sort().reverse();
      let streak = 0;
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        if (sortedDates[i] === expectedDate.toISOString().split('T')[0]) { streak++; } else { break; }
      }

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const entriesThisMonth = entries.filter(e => {
        const d = new Date(e.entry_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      return {
        totalEntries: entries.length, byType, streak, entriesThisMonth,
        hasEntryToday: sortedDates[0] === today.toISOString().split('T')[0],
      };
    },
    enabled: !!user,
  });
}

export function useCreateJournalEntry() {
  const { user } = useAuth();
  const { afterJournal } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: FinancialJournalFormData) => {
      if (!user) throw new Error('No user');
      const { error } = await supabase.from('financial_journal').insert({
        user_id: user.id, entry_date: new Date().toISOString().split('T')[0], ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      afterJournal();
      t.success('Entrada de diario guardada', 'Journal entry saved');
    },
  });
}

export function useDeleteJournalEntry() {
  const { user } = useAuth();
  const { afterJournal } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user');
      const { data: existing } = await supabase.from('financial_journal').select('entry_type, content').eq('id', id).eq('user_id', user.id).single();
      const { error } = await supabase.from('financial_journal').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'journal_entry', entity_id: id,
        entity_name: existing?.entry_type || null,
        old_values: existing ? { entry_type: existing.entry_type, content: existing.content?.substring(0, 100) } : null,
      });
    },
    onSuccess: () => {
      afterJournal();
      t.success('Entrada eliminada', 'Entry deleted');
    },
  });
}
