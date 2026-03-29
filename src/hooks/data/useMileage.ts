import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useMissionTracker } from './useMissions';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';

export type Mileage = Database['public']['Tables']['mileage']['Row'];
export type MileageInsert = Database['public']['Tables']['mileage']['Insert'];
export type MileageUpdate = Database['public']['Tables']['mileage']['Update'];

// CRA Mileage Rates 2024
export const CRA_MILEAGE_RATES = {
  first5000: 0.70,
  after5000: 0.64,
  territoryBonus: 0.04,
};

export interface MileageWithClient extends Mileage {
  client?: {
    id: string;
    name: string;
  } | null;
}

export interface MileageSummary {
  totalKilometers: number;
  totalDeductibleAmount: number;
  totalTrips: number;
  hstGstPaid: number;
  itcClaimable: number;
  yearToDateKm: number;
}

export function calculateMileageDeduction(
  kilometers: number,
  yearToDateKm: number = 0
): { deductible: number; rate: number } {
  let deductible = 0;
  const { first5000, after5000 } = CRA_MILEAGE_RATES;

  const totalAfterTrip = yearToDateKm + kilometers;
  
  if (yearToDateKm >= 5000) {
    deductible = kilometers * after5000;
  } else if (totalAfterTrip <= 5000) {
    deductible = kilometers * first5000;
  } else {
    const kmAtHighRate = 5000 - yearToDateKm;
    const kmAtLowRate = kilometers - kmAtHighRate;
    deductible = (kmAtHighRate * first5000) + (kmAtLowRate * after5000);
  }

  const avgRate = deductible / kilometers;
  return { deductible, rate: avgRate };
}

export const useMileage = (year?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mileage', user?.id, year],
    queryFn: async () => {
      let query = supabase
        .from('mileage')
        .select(`
          *,
          client:clients(id, name)
        `)
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (year) {
        query = query
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MileageWithClient[];
    },
    enabled: !!user,
  });
};

export const useMileageSummary = (year?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mileage-summary', user?.id, year],
    queryFn: async () => {
      const currentYear = year || new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('mileage')
        .select('kilometers, date')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`)
        .order('date', { ascending: true });

      if (error) throw error;

      let totalKm = 0;
      let totalDeductible = 0;
      let runningKm = 0;

      (data || []).forEach((record) => {
        const km = parseFloat(record.kilometers.toString());
        const { deductible } = calculateMileageDeduction(km, runningKm);
        totalKm += km;
        totalDeductible += deductible;
        runningKm += km;
      });

      const estimatedFuelPortion = totalDeductible * 0.4;
      const hstRate = 0.13;
      const hstGstPaid = estimatedFuelPortion - (estimatedFuelPortion / (1 + hstRate));
      const itcClaimable = hstGstPaid;

      return {
        totalKilometers: totalKm,
        totalDeductibleAmount: totalDeductible,
        totalTrips: data?.length || 0,
        hstGstPaid,
        itcClaimable,
        yearToDateKm: totalKm,
      } as MileageSummary;
    },
    enabled: !!user,
  });
};

export const useCreateMileage = (defaultEntityId?: string) => {
  const { user } = useAuth();
  const { afterMileage } = useInvalidateRelated();
  const { trackAction } = useMissionTracker();

  return useMutation({
    mutationFn: async (data: Omit<MileageInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        ...data,
        user_id: user.id,
        entity_id: data.entity_id || defaultEntityId || null,
      };

      const { data: result, error } = await supabase
        .from('mileage')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      afterMileage();
      trackAction('add_mileage', 1);
      toast.success('Viaje registrado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar viaje');
    },
  });
};

export const useUpdateMileage = () => {
  const { user } = useAuth();
  const { afterMileage } = useInvalidateRelated();

  return useMutation({
    mutationFn: async ({ id, ...data }: MileageUpdate & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('mileage')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      afterMileage();
      toast.success('Viaje actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar viaje');
    },
  });
};

export const useDeleteMileage = () => {
  const { user } = useAuth();
  const { afterMileage } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('mileage').select('purpose, kilometers').eq('id', id).eq('user_id', user.id).single();
      const { error } = await supabase
        .from('mileage')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'mileage', entity_id: id,
        entity_name: existing?.purpose || null, old_values: existing ? { purpose: existing.purpose, kilometers: existing.kilometers } : null,
      });
    },
    onSuccess: () => {
      afterMileage();
      toast.success('Viaje eliminado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar viaje');
    },
  });
};
