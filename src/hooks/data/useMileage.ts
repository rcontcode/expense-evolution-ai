import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export type Mileage = Database['public']['Tables']['mileage']['Row'];
export type MileageInsert = Database['public']['Tables']['mileage']['Insert'];
export type MileageUpdate = Database['public']['Tables']['mileage']['Update'];

// CRA Mileage Rates 2024
export const CRA_MILEAGE_RATES = {
  first5000: 0.70, // $0.70/km for first 5,000 km
  after5000: 0.64, // $0.64/km after 5,000 km
  territoryBonus: 0.04, // Additional $0.04/km for Yukon, NWT, Nunavut
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

  // Calculate how much of this trip falls into each tier
  const totalAfterTrip = yearToDateKm + kilometers;
  
  if (yearToDateKm >= 5000) {
    // All km are at the lower rate
    deductible = kilometers * after5000;
  } else if (totalAfterTrip <= 5000) {
    // All km are at the higher rate
    deductible = kilometers * first5000;
  } else {
    // Split between rates
    const kmAtHighRate = 5000 - yearToDateKm;
    const kmAtLowRate = kilometers - kmAtHighRate;
    deductible = (kmAtHighRate * first5000) + (kmAtLowRate * after5000);
  }

  const avgRate = deductible / kilometers;
  return { deductible, rate: avgRate };
}

export const useMileage = (year?: number) => {
  return useQuery({
    queryKey: ['mileage', year],
    queryFn: async () => {
      let query = supabase
        .from('mileage')
        .select(`
          *,
          client:clients(id, name)
        `)
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
  });
};

export const useMileageSummary = (year?: number) => {
  return useQuery({
    queryKey: ['mileage-summary', year],
    queryFn: async () => {
      const currentYear = year || new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('mileage')
        .select('kilometers, date')
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

      // Calculate ITC (HST on mileage expenses like gas - estimated at 13% of deduction)
      // Note: Actual ITC depends on actual fuel receipts, this is an estimate
      const estimatedFuelPortion = totalDeductible * 0.4; // ~40% of mileage cost is fuel
      const hstRate = 0.13;
      const hstGstPaid = estimatedFuelPortion - (estimatedFuelPortion / (1 + hstRate));
      const itcClaimable = hstGstPaid; // 100% of fuel HST is claimable

      return {
        totalKilometers: totalKm,
        totalDeductibleAmount: totalDeductible,
        totalTrips: data?.length || 0,
        hstGstPaid,
        itcClaimable,
        yearToDateKm: totalKm,
      } as MileageSummary;
    },
  });
};

export const useCreateMileage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<MileageInsert, 'user_id'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('mileage')
        .insert({ ...data, user_id: userData.user.id })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['mileage-summary'] });
      toast({
        title: 'Viaje registrado',
        description: 'El kilometraje se ha guardado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateMileage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: MileageUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from('mileage')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['mileage-summary'] });
      toast({
        title: 'Viaje actualizado',
        description: 'Los cambios se han guardado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteMileage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mileage').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['mileage-summary'] });
      toast({
        title: 'Viaje eliminado',
        description: 'El registro de kilometraje se ha eliminado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
