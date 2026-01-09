import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Income, IncomeWithRelations, IncomeFormData } from '@/types/income.types';
import { useMissionTracker } from './useMissions';
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
        .select(`
          *,
          client:clients(id, name),
          project:projects(id, name, color)
        `)
        .order('date', { ascending: false });

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

      // Entity/Jurisdiction filtering
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { trackAction } = useMissionTracker();

  return useMutation({
    mutationFn: async (data: IncomeFormData) => {
      const { error, data: newIncome } = await supabase
        .from('income')
        .insert({
          user_id: user!.id,
          amount: data.amount,
          currency: data.currency,
          date: data.date.toISOString().split('T')[0],
          income_type: data.income_type,
          description: data.description || null,
          source: data.source || null,
          client_id: data.client_id || null,
          project_id: data.project_id || null,
          recurrence: data.recurrence,
          recurrence_end_date: data.recurrence_end_date?.toISOString().split('T')[0] || null,
          is_taxable: data.is_taxable,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newIncome;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      // Track mission progress
      trackAction('add_income', 1);
      toast.success('Ingreso registrado');
    },
    onError: (error) => {
      toast.error('Error al registrar ingreso');
      console.error(error);
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IncomeFormData> }) => {
      const updateData: any = { ...data };
      
      if (data.date) {
        updateData.date = data.date instanceof Date 
          ? data.date.toISOString().split('T')[0] 
          : data.date;
      }
      
      if (data.recurrence_end_date) {
        updateData.recurrence_end_date = data.recurrence_end_date instanceof Date
          ? data.recurrence_end_date.toISOString().split('T')[0]
          : data.recurrence_end_date;
      }

      const { error } = await supabase
        .from('income')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Ingreso actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar ingreso');
      console.error(error);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Ingreso eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar ingreso');
      console.error(error);
    },
  });
}

export function useIncomeSummary(year?: number) {
  const { user } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['income-summary', user?.id, currentYear],
    queryFn: async () => {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from('income')
        .select('amount, income_type, date, is_taxable')
        .gte('date', startDate)
        .lte('date', endDate);

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
        totalIncome,
        taxableIncome,
        nonTaxableIncome: totalIncome - taxableIncome,
        byType,
        byMonth,
        count: data.length,
      };
    },
    enabled: !!user,
  });
}
