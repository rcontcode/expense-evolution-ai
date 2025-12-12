import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: string;
  current_value: number;
  purchase_value: number | null;
  purchase_date: string | null;
  currency: string;
  notes: string | null;
  is_liquid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  category: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  due_date: string | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  created_at: string;
}

export const ASSET_CATEGORIES = [
  { value: 'cash', label: 'Efectivo y Cuentas Bancarias', icon: 'Wallet', group: 'general' },
  { value: 'investments', label: 'Inversiones (Acciones/ETFs)', icon: 'TrendingUp', group: 'general' },
  { value: 'real_estate', label: 'Bienes Raíces', icon: 'Home', group: 'general' },
  { value: 'vehicles', label: 'Vehículos', icon: 'Car', group: 'general' },
  { value: 'retirement', label: 'Cuentas de Retiro (RRSP/TFSA)', icon: 'PiggyBank', group: 'general' },
  { value: 'collectibles', label: 'Coleccionables', icon: 'Gem', group: 'general' },
  { value: 'business', label: 'Negocios', icon: 'Building2', group: 'general' },
  { value: 'other', label: 'Otros Activos', icon: 'Package', group: 'general' },
  // Crypto categories
  { value: 'crypto_btc', label: 'Bitcoin (BTC)', icon: 'Bitcoin', group: 'crypto' },
  { value: 'crypto_eth', label: 'Ethereum (ETH)', icon: 'Hexagon', group: 'crypto' },
  { value: 'crypto_stablecoins', label: 'Stablecoins (USDT/USDC)', icon: 'CircleDollarSign', group: 'crypto' },
  { value: 'crypto_altcoins', label: 'Altcoins', icon: 'Coins', group: 'crypto' },
  { value: 'crypto_defi', label: 'DeFi / Staking', icon: 'Layers', group: 'crypto' },
  { value: 'crypto_nft', label: 'NFTs', icon: 'ImageIcon', group: 'crypto' },
];

export const LIABILITY_CATEGORIES = [
  { value: 'mortgage', label: 'Hipoteca', icon: 'Home' },
  { value: 'car_loan', label: 'Préstamo de Auto', icon: 'Car' },
  { value: 'student_loan', label: 'Préstamo Estudiantil', icon: 'GraduationCap' },
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: 'CreditCard' },
  { value: 'personal_loan', label: 'Préstamo Personal', icon: 'HandCoins' },
  { value: 'line_of_credit', label: 'Línea de Crédito', icon: 'Banknote' },
  { value: 'business_loan', label: 'Préstamo de Negocio', icon: 'Building2' },
  { value: 'other', label: 'Otras Deudas', icon: 'Receipt' },
];

export function useAssets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('current_value', { ascending: false });

      if (error) throw error;
      return data as Asset[];
    },
    enabled: !!user,
  });
}

export function useLiabilities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['liabilities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liabilities')
        .select('*')
        .order('current_balance', { ascending: false });

      if (error) throw error;
      return data as Liability[];
    },
    enabled: !!user,
  });
}

export function useNetWorthSnapshots() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['net-worth-snapshots', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true })
        .limit(12);

      if (error) throw error;
      return data as NetWorthSnapshot[];
    },
    enabled: !!user,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (asset: Partial<Asset>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: asset.name!,
          category: asset.category || 'other',
          current_value: asset.current_value || 0,
          purchase_value: asset.purchase_value,
          purchase_date: asset.purchase_date,
          currency: asset.currency || 'CAD',
          notes: asset.notes,
          is_liquid: asset.is_liquid || false,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(t('netWorth.assetAdded') || 'Activo agregado');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...asset }: Partial<Asset> & { id: string }) => {
      const { data, error } = await supabase
        .from('assets')
        .update(asset)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(t('netWorth.assetUpdated') || 'Activo actualizado');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(t('netWorth.assetDeleted') || 'Activo eliminado');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateLiability() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (liability: Partial<Liability>) => {
      const { data, error } = await supabase
        .from('liabilities')
        .insert({
          name: liability.name!,
          category: liability.category || 'other',
          original_amount: liability.original_amount || 0,
          current_balance: liability.current_balance || 0,
          interest_rate: liability.interest_rate,
          minimum_payment: liability.minimum_payment,
          due_date: liability.due_date,
          currency: liability.currency || 'CAD',
          notes: liability.notes,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast.success(t('netWorth.liabilityAdded') || 'Pasivo agregado');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateLiability() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...liability }: Partial<Liability> & { id: string }) => {
      const { data, error } = await supabase
        .from('liabilities')
        .update(liability)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast.success(t('netWorth.liabilityUpdated') || 'Pasivo actualizado');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteLiability() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('liabilities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast.success(t('netWorth.liabilityDeleted') || 'Pasivo eliminado');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (snapshot: { total_assets: number; total_liabilities: number; net_worth: number }) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if snapshot exists for today
      const { data: existing } = await supabase
        .from('net_worth_snapshots')
        .select('id')
        .eq('user_id', user!.id)
        .eq('snapshot_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing snapshot
        const { data, error } = await supabase
          .from('net_worth_snapshots')
          .update(snapshot)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new snapshot
        const { data, error } = await supabase
          .from('net_worth_snapshots')
          .insert({
            ...snapshot,
            user_id: user!.id,
            snapshot_date: today,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth-snapshots'] });
    },
  });
}
