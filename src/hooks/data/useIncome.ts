import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Income, IncomeWithRelations, IncomeFormData } from '@/types/income.types';
import { useMissionTracker } from './useMissions';
import { useGamificationTriggers, getTableCount } from '@/hooks/utils/useGamificationTriggers';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';

export interface IncomeFilters {
  year?: number;
  month?: number;
  type?: string;
  entityId?: string | null;
  showAllEntities?: boolean;
}

export function useIncome(filters?: IncomeFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['income', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('income')
        .select(`*, client:clients(id, name), project:projects(id, name, color), document:documents(id, file_path, file_name)`)
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(500);

      if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
      if (filters?.month && filters?.year) {
        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const lastDay = new Date(filters.year, filters.month, 0).getDate();
        const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${lastDay}`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
      if (filters?.type) {
        query = query.eq('income_type', filters.type as any);
      }
      if (filters?.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as IncomeWithRelations[];
    },
    enabled: !!user,
  });
}

export function useCreateIncome() {
  const { user } = useAuth();
  const { trackAction } = useMissionTracker();
  const { triggers } = useGamificationTriggers();
  const { afterIncome, invalidate } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: IncomeFormData) => {
      if (!user) throw new Error('Not authenticated');
      const currentCount = await getTableCount('income', user.id);

      const { error, data: newIncome } = await supabase
        .from('income')
        .insert({
          user_id: user.id, amount: data.amount, currency: data.currency,
          date: data.date.toISOString().split('T')[0], income_type: data.income_type,
          description: data.description || null, source: data.source || null,
          client_id: data.client_id || null, project_id: data.project_id || null,
          recurrence: data.recurrence,
          recurrence_end_date: data.recurrence_end_date?.toISOString().split('T')[0] || null,
          is_taxable: data.is_taxable, notes: data.notes || null,
          entity_id: data.entity_id || null,
        })
        .select().single();

      if (error) throw error;
      await triggers.income(currentCount);

      await insertAuditLog(user.id, {
        action: 'create', entity_type: 'income', entity_id: newIncome.id,
        entity_name: data.source || data.description || null,
        new_values: { amount: data.amount, source: data.source, income_type: data.income_type },
      });
      return newIncome;
    },
    onSuccess: () => {
      afterIncome();
      invalidate('user-level', 'user-achievements');
      trackAction('add_income', 1);
      t.success('Ingreso registrado', 'Income recorded');
    },
    onError: (error) => {
      t.error('Error al registrar ingreso', 'Error recording income');
      console.error(error);
    },
  });
}

export function useUpdateIncome() {
  const { afterIncome } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IncomeFormData> }) => {
      const updateData: any = { ...data };
      if (data.date) {
        updateData.date = data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date;
      }
      if (data.recurrence_end_date) {
        updateData.recurrence_end_date = data.recurrence_end_date instanceof Date
          ? data.recurrence_end_date.toISOString().split('T')[0] : data.recurrence_end_date;
      }
      const { error } = await supabase.from('income').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      afterIncome();
      t.success('Ingreso actualizado', 'Income updated');
    },
    onError: (error) => {
      t.error('Error al actualizar ingreso', 'Error updating income');
      console.error(error);
    },
  });
}

export function useDeleteIncome() {
  const { user } = useAuth();
  const { afterIncome } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('income').select('source, amount').eq('id', id).eq('user_id', user.id).maybeSingle();
      const { error } = await supabase.from('income').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'income', entity_id: id,
        entity_name: existing?.source || null,
        old_values: existing ? { source: existing.source, amount: existing.amount } : null,
      });
    },
    onSuccess: () => {
      afterIncome();
      t.success('Ingreso movido a la papelera', 'Income moved to trash');
    },
    onError: (error) => {
      t.error('Error al eliminar ingreso', 'Error deleting income');
      console.error(error);
    },
  });
}

export function useIncomeSummary(year?: number, entityId?: string | null) {
  const { user } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['income-summary', user?.id, currentYear, entityId],
    queryFn: async () => {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      let query = supabase
        .from('income')
        .select('amount, income_type, date, is_taxable')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(2000);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalIncome = data.reduce((sum, i) => sum + Number(i.amount), 0);
      const taxableIncome = data.filter(i => i.is_taxable).reduce((sum, i) => sum + Number(i.amount), 0);
      
      const byType: Record<string, number> = {};
      data.forEach(i => {
        byType[i.income_type] = (byType[i.income_type] || 0) + Number(i.amount);
      });

      const byMonth: Record<string, number> = {};
      data.forEach(i => {
        const month = i.date.substring(0, 7);
        byMonth[month] = (byMonth[month] || 0) + Number(i.amount);
      });

      return {
        totalIncome, taxableIncome,
        nonTaxableIncome: totalIncome - taxableIncome,
        byType, byMonth, count: data.length,
      };
    },
    enabled: !!user,
  });
}
