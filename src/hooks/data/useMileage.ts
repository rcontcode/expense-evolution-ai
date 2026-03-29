import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useMissionTracker } from './useMissions';
import { useInvalidateRelated } from './useInvalidateRelated';
import { insertAuditLog } from './useAuditLog';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';
import type { CountryCode } from '@/lib/constants/country-tax-config';

export type Mileage = Database['public']['Tables']['mileage']['Row'];
export type MileageInsert = Database['public']['Tables']['mileage']['Insert'];
export type MileageUpdate = Database['public']['Tables']['mileage']['Update'];

// === CRA (Canada) Rates ===
export const CRA_MILEAGE_RATES_BY_YEAR: Record<number, { first5000: number; after5000: number; territoryBonus: number }> = {
  2024: { first5000: 0.70, after5000: 0.64, territoryBonus: 0.04 },
  2025: { first5000: 0.72, after5000: 0.66, territoryBonus: 0.04 },
  2026: { first5000: 0.73, after5000: 0.67, territoryBonus: 0.04 },
};
export const CRA_MILEAGE_RATES = CRA_MILEAGE_RATES_BY_YEAR[2026];
export function getCRAMileageRates(year: number) { return CRA_MILEAGE_RATES_BY_YEAR[year] || CRA_MILEAGE_RATES; }

// === SII (Chile) Rates — Estimated based on SII tabla de gastos presuntos ===
export const SII_MILEAGE_RATES_BY_YEAR: Record<number, { perKm: number }> = {
  2024: { perKm: 120 }, // CLP per km estimate
  2025: { perKm: 125 },
  2026: { perKm: 130 },
};
export const SII_MILEAGE_RATES = SII_MILEAGE_RATES_BY_YEAR[2026];
export function getSIIMileageRates(year: number) { return SII_MILEAGE_RATES_BY_YEAR[year] || SII_MILEAGE_RATES; }

export interface MileageWithClient extends Mileage {
  client?: { id: string; name: string } | null;
}

export interface MileageSummary {
  totalKilometers: number; totalDeductibleAmount: number; totalTrips: number;
  hstGstPaid: number; itcClaimable: number; yearToDateKm: number;
  country?: CountryCode | null;
}

// === CRA Deduction (Canada) ===
export function calculateMileageDeduction(kilometers: number, yearToDateKm: number = 0, year?: number): { deductible: number; rate: number } {
  let deductible = 0;
  const rates = year ? getCRAMileageRates(year) : CRA_MILEAGE_RATES;
  const { first5000, after5000 } = rates;
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
  return { deductible, rate: kilometers > 0 ? deductible / kilometers : 0 };
}

// === SII Deduction (Chile) — flat rate per km in CLP ===
export function calculateChileMileageDeduction(kilometers: number, year?: number): { deductible: number; rate: number } {
  const rates = year ? getSIIMileageRates(year) : SII_MILEAGE_RATES;
  const deductible = kilometers * rates.perKm;
  return { deductible, rate: rates.perKm };
}

// === Country-aware deduction ===
export function calculateMileageDeductionByCountry(
  kilometers: number, 
  yearToDateKm: number, 
  country: CountryCode | null | undefined, 
  year?: number
): { deductible: number; rate: number; currency: string } | null {
  if (!country) return null;
  if (country === 'CA') {
    const result = calculateMileageDeduction(kilometers, yearToDateKm, year);
    return { ...result, currency: 'CAD' };
  }
  if (country === 'CL') {
    const result = calculateChileMileageDeduction(kilometers, year);
    return { ...result, currency: 'CLP' };
  }
  return null;
}

export const useMileage = (year?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mileage', user?.id, year],
    queryFn: async () => {
      let query = supabase.from('mileage').select(`*, client:clients(id, name)`)
        .eq('user_id', user!.id).is('deleted_at', null).order('date', { ascending: false });
      if (year) {
        query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as MileageWithClient[];
    },
    enabled: !!user,
  });
};

export const useMileageSummary = (year?: number, country?: CountryCode | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mileage-summary', user?.id, year, country],
    queryFn: async () => {
      const currentYear = year || new Date().getFullYear();
      const { data, error } = await supabase.from('mileage').select('kilometers, date')
        .eq('user_id', user!.id).is('deleted_at', null)
        .gte('date', `${currentYear}-01-01`).lte('date', `${currentYear}-12-31`)
        .order('date', { ascending: true });
      if (error) throw error;

      let totalKm = 0, totalDeductible = 0, runningKm = 0;

      if (country === 'CA') {
        (data || []).forEach((record) => {
          const km = parseFloat(record.kilometers.toString());
          const { deductible } = calculateMileageDeduction(km, runningKm, currentYear);
          totalKm += km; totalDeductible += deductible; runningKm += km;
        });
      } else if (country === 'CL') {
        (data || []).forEach((record) => {
          const km = parseFloat(record.kilometers.toString());
          const { deductible } = calculateChileMileageDeduction(km, currentYear);
          totalKm += km; totalDeductible += deductible; runningKm += km;
        });
      } else {
        // No country — just totals, no deduction
        (data || []).forEach((record) => {
          const km = parseFloat(record.kilometers.toString());
          totalKm += km; runningKm += km;
        });
      }

      // HST/GST ITC only for Canada
      let hstGstPaid = 0;
      if (country === 'CA') {
        const estimatedFuelPortion = totalDeductible * 0.4;
        const hstRate = 0.13;
        hstGstPaid = estimatedFuelPortion - (estimatedFuelPortion / (1 + hstRate));
      }

      return {
        totalKilometers: totalKm, totalDeductibleAmount: totalDeductible,
        totalTrips: data?.length || 0, hstGstPaid, itcClaimable: hstGstPaid, yearToDateKm: totalKm,
        country,
      } as MileageSummary;
    },
    enabled: !!user,
  });
};

export const useCreateMileage = (defaultEntityId?: string) => {
  const { user } = useAuth();
  const { afterMileage } = useInvalidateRelated();
  const { trackAction } = useMissionTracker();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: Omit<MileageInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const insertData = { ...data, user_id: user.id, entity_id: data.entity_id || defaultEntityId || null };
      const { data: result, error } = await supabase.from('mileage').insert(insertData).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      afterMileage();
      trackAction('add_mileage', 1);
      t.success('Viaje registrado', 'Trip recorded');
    },
    onError: () => {
      t.error('Error al registrar viaje', 'Error recording trip');
    },
  });
};

export const useUpdateMileage = () => {
  const { user } = useAuth();
  const { afterMileage } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: MileageUpdate & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase.from('mileage').update(data).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      afterMileage();
      t.success('Viaje actualizado', 'Trip updated');
    },
    onError: () => {
      t.error('Error al actualizar viaje', 'Error updating trip');
    },
  });
};

export const useDeleteMileage = () => {
  const { user } = useAuth();
  const { afterMileage } = useInvalidateRelated();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('mileage').select('purpose, kilometers').eq('id', id).eq('user_id', user.id).maybeSingle();
      const { error } = await supabase.from('mileage').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await insertAuditLog(user.id, {
        action: 'delete', entity_type: 'mileage', entity_id: id,
        entity_name: existing?.purpose || null, old_values: existing ? { purpose: existing.purpose, kilometers: existing.kilometers } : null,
      });
    },
    onSuccess: () => {
      afterMileage();
      t.success('Viaje eliminado', 'Trip deleted');
    },
    onError: () => {
      t.error('Error al eliminar viaje', 'Error deleting trip');
    },
  });
};
