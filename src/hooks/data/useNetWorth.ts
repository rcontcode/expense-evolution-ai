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
  // General Assets
  { value: 'cash', label: 'Efectivo y Cuentas Bancarias', icon: 'Wallet', group: 'general' },
  { value: 'bank_accounts', label: 'Cuentas de Ahorro', icon: 'PiggyBank', group: 'general' },
  { value: 'investments', label: 'Inversiones (Acciones/ETFs)', icon: 'TrendingUp', group: 'general' },
  { value: 'bonds', label: 'Bonos y Renta Fija', icon: 'FileText', group: 'general' },
  { value: 'mutual_funds', label: 'Fondos Mutuos', icon: 'BarChart3', group: 'general' },
  { value: 'index_funds', label: 'Fondos Indexados', icon: 'LineChart', group: 'general' },
  { value: 'etfs', label: 'ETFs', icon: 'Activity', group: 'general' },
  { value: 'retirement', label: 'Cuentas de Retiro (RRSP/TFSA/401k)', icon: 'Landmark', group: 'general' },
  { value: 'pension', label: 'Pensión / Jubilación', icon: 'Users', group: 'general' },
  
  // Real Estate
  { value: 'real_estate', label: 'Propiedad Principal', icon: 'Home', group: 'real_estate' },
  { value: 'rental_property', label: 'Propiedad de Renta', icon: 'Building', group: 'real_estate' },
  { value: 'vacation_property', label: 'Propiedad Vacacional', icon: 'Sun', group: 'real_estate' },
  { value: 'land', label: 'Terrenos', icon: 'Mountain', group: 'real_estate' },
  { value: 'commercial_property', label: 'Propiedad Comercial', icon: 'Building2', group: 'real_estate' },
  { value: 'reits', label: 'REITs (Fondos Inmobiliarios)', icon: 'Castle', group: 'real_estate' },
  
  // Vehicles
  { value: 'vehicles', label: 'Vehículo Personal', icon: 'Car', group: 'vehicles' },
  { value: 'motorcycle', label: 'Motocicleta', icon: 'Bike', group: 'vehicles' },
  { value: 'boat', label: 'Barco / Yate', icon: 'Ship', group: 'vehicles' },
  { value: 'rv', label: 'Casa Rodante / RV', icon: 'Caravan', group: 'vehicles' },
  { value: 'aircraft', label: 'Aeronave', icon: 'Plane', group: 'vehicles' },
  
  // Precious Metals
  { value: 'gold', label: 'Oro', icon: 'CircleDollarSign', group: 'precious_metals' },
  { value: 'silver', label: 'Plata', icon: 'Circle', group: 'precious_metals' },
  { value: 'platinum', label: 'Platino', icon: 'Gem', group: 'precious_metals' },
  { value: 'palladium', label: 'Paladio', icon: 'Diamond', group: 'precious_metals' },
  { value: 'precious_metals_other', label: 'Otros Metales Preciosos', icon: 'Sparkles', group: 'precious_metals' },
  
  // Collectibles & Art
  { value: 'art', label: 'Arte y Pinturas', icon: 'Palette', group: 'collectibles' },
  { value: 'antiques', label: 'Antigüedades', icon: 'Clock', group: 'collectibles' },
  { value: 'jewelry', label: 'Joyería', icon: 'Gem', group: 'collectibles' },
  { value: 'watches', label: 'Relojes de Lujo', icon: 'Watch', group: 'collectibles' },
  { value: 'wine', label: 'Vinos y Licores', icon: 'Wine', group: 'collectibles' },
  { value: 'collectible_cards', label: 'Tarjetas Coleccionables', icon: 'Square', group: 'collectibles' },
  { value: 'coins', label: 'Monedas Coleccionables', icon: 'Coins', group: 'collectibles' },
  { value: 'stamps', label: 'Estampillas', icon: 'Stamp', group: 'collectibles' },
  { value: 'memorabilia', label: 'Memorabilia Deportiva', icon: 'Trophy', group: 'collectibles' },
  { value: 'musical_instruments', label: 'Instrumentos Musicales', icon: 'Music', group: 'collectibles' },
  { value: 'designer_items', label: 'Artículos de Diseñador', icon: 'ShoppingBag', group: 'collectibles' },
  { value: 'collectibles_other', label: 'Otros Coleccionables', icon: 'Package', group: 'collectibles' },
  
  // Business & Intellectual Property
  { value: 'business', label: 'Negocio / Empresa', icon: 'Building2', group: 'business' },
  { value: 'franchise', label: 'Franquicia', icon: 'Store', group: 'business' },
  { value: 'patents', label: 'Patentes', icon: 'FileText', group: 'business' },
  { value: 'trademarks', label: 'Marcas Registradas', icon: 'Award', group: 'business' },
  { value: 'copyrights', label: 'Derechos de Autor', icon: 'Copyright', group: 'business' },
  { value: 'royalties', label: 'Regalías', icon: 'Crown', group: 'business' },
  { value: 'domain_names', label: 'Dominios Web', icon: 'Globe', group: 'business' },
  
  // Other Assets
  { value: 'equipment', label: 'Equipos y Maquinaria', icon: 'Wrench', group: 'other' },
  { value: 'livestock', label: 'Ganado / Animales', icon: 'Dog', group: 'other' },
  { value: 'crops', label: 'Cultivos / Agricultura', icon: 'Leaf', group: 'other' },
  { value: 'insurance_cash_value', label: 'Valor en Efectivo de Seguros', icon: 'Shield', group: 'other' },
  { value: 'annuities', label: 'Anualidades', icon: 'Calendar', group: 'other' },
  { value: 'receivables', label: 'Cuentas por Cobrar', icon: 'FileCheck', group: 'other' },
  { value: 'other', label: 'Otros Activos', icon: 'Package', group: 'other' },
  
  // TOP CRYPTOCURRENCIES (Top 50 by market cap)
  { value: 'crypto_btc', label: 'Bitcoin (BTC)', icon: 'Bitcoin', group: 'crypto_major' },
  { value: 'crypto_eth', label: 'Ethereum (ETH)', icon: 'Hexagon', group: 'crypto_major' },
  { value: 'crypto_usdt', label: 'Tether (USDT)', icon: 'CircleDollarSign', group: 'crypto_stablecoin' },
  { value: 'crypto_bnb', label: 'BNB (BNB)', icon: 'Coins', group: 'crypto_major' },
  { value: 'crypto_usdc', label: 'USD Coin (USDC)', icon: 'CircleDollarSign', group: 'crypto_stablecoin' },
  { value: 'crypto_xrp', label: 'XRP (Ripple)', icon: 'Waves', group: 'crypto_major' },
  { value: 'crypto_sol', label: 'Solana (SOL)', icon: 'Sun', group: 'crypto_major' },
  { value: 'crypto_ada', label: 'Cardano (ADA)', icon: 'Hexagon', group: 'crypto_major' },
  { value: 'crypto_doge', label: 'Dogecoin (DOGE)', icon: 'Dog', group: 'crypto_meme' },
  { value: 'crypto_trx', label: 'TRON (TRX)', icon: 'Zap', group: 'crypto_altcoin' },
  { value: 'crypto_ton', label: 'Toncoin (TON)', icon: 'Send', group: 'crypto_altcoin' },
  { value: 'crypto_dot', label: 'Polkadot (DOT)', icon: 'CircleDot', group: 'crypto_altcoin' },
  { value: 'crypto_matic', label: 'Polygon (MATIC)', icon: 'Pentagon', group: 'crypto_altcoin' },
  { value: 'crypto_ltc', label: 'Litecoin (LTC)', icon: 'Circle', group: 'crypto_altcoin' },
  { value: 'crypto_shib', label: 'Shiba Inu (SHIB)', icon: 'Dog', group: 'crypto_meme' },
  { value: 'crypto_avax', label: 'Avalanche (AVAX)', icon: 'Mountain', group: 'crypto_altcoin' },
  { value: 'crypto_link', label: 'Chainlink (LINK)', icon: 'Link', group: 'crypto_defi' },
  { value: 'crypto_bch', label: 'Bitcoin Cash (BCH)', icon: 'Bitcoin', group: 'crypto_altcoin' },
  { value: 'crypto_atom', label: 'Cosmos (ATOM)', icon: 'Orbit', group: 'crypto_altcoin' },
  { value: 'crypto_xlm', label: 'Stellar (XLM)', icon: 'Star', group: 'crypto_altcoin' },
  { value: 'crypto_uni', label: 'Uniswap (UNI)', icon: 'Repeat', group: 'crypto_defi' },
  { value: 'crypto_etc', label: 'Ethereum Classic (ETC)', icon: 'Hexagon', group: 'crypto_altcoin' },
  { value: 'crypto_xmr', label: 'Monero (XMR)', icon: 'Eye', group: 'crypto_privacy' },
  { value: 'crypto_icp', label: 'Internet Computer (ICP)', icon: 'Globe', group: 'crypto_altcoin' },
  { value: 'crypto_fil', label: 'Filecoin (FIL)', icon: 'HardDrive', group: 'crypto_storage' },
  { value: 'crypto_apt', label: 'Aptos (APT)', icon: 'Box', group: 'crypto_altcoin' },
  { value: 'crypto_hbar', label: 'Hedera (HBAR)', icon: 'Hexagon', group: 'crypto_altcoin' },
  { value: 'crypto_arb', label: 'Arbitrum (ARB)', icon: 'Layers', group: 'crypto_layer2' },
  { value: 'crypto_near', label: 'NEAR Protocol (NEAR)', icon: 'Circle', group: 'crypto_altcoin' },
  { value: 'crypto_crv', label: 'Curve DAO (CRV)', icon: 'Waves', group: 'crypto_defi' },
  { value: 'crypto_op', label: 'Optimism (OP)', icon: 'Layers', group: 'crypto_layer2' },
  { value: 'crypto_vet', label: 'VeChain (VET)', icon: 'Check', group: 'crypto_altcoin' },
  { value: 'crypto_qnt', label: 'Quant (QNT)', icon: 'Network', group: 'crypto_altcoin' },
  { value: 'crypto_algo', label: 'Algorand (ALGO)', icon: 'Triangle', group: 'crypto_altcoin' },
  { value: 'crypto_grt', label: 'The Graph (GRT)', icon: 'BarChart', group: 'crypto_defi' },
  { value: 'crypto_ftm', label: 'Fantom (FTM)', icon: 'Ghost', group: 'crypto_altcoin' },
  { value: 'crypto_aave', label: 'Aave (AAVE)', icon: 'Ghost', group: 'crypto_defi' },
  { value: 'crypto_sand', label: 'The Sandbox (SAND)', icon: 'Box', group: 'crypto_metaverse' },
  { value: 'crypto_mana', label: 'Decentraland (MANA)', icon: 'MapPin', group: 'crypto_metaverse' },
  { value: 'crypto_axs', label: 'Axie Infinity (AXS)', icon: 'Gamepad2', group: 'crypto_gaming' },
  { value: 'crypto_theta', label: 'Theta Network (THETA)', icon: 'Video', group: 'crypto_media' },
  { value: 'crypto_egld', label: 'MultiversX (EGLD)', icon: 'X', group: 'crypto_altcoin' },
  { value: 'crypto_xtz', label: 'Tezos (XTZ)', icon: 'Box', group: 'crypto_altcoin' },
  { value: 'crypto_eos', label: 'EOS (EOS)', icon: 'Circle', group: 'crypto_altcoin' },
  { value: 'crypto_flow', label: 'Flow (FLOW)', icon: 'Droplet', group: 'crypto_nft' },
  { value: 'crypto_rndr', label: 'Render (RNDR)', icon: 'Cpu', group: 'crypto_ai' },
  { value: 'crypto_inj', label: 'Injective (INJ)', icon: 'Syringe', group: 'crypto_defi' },
  { value: 'crypto_imx', label: 'Immutable X (IMX)', icon: 'Layers', group: 'crypto_nft' },
  { value: 'crypto_rune', label: 'THORChain (RUNE)', icon: 'Hammer', group: 'crypto_defi' },
  { value: 'crypto_mkr', label: 'Maker (MKR)', icon: 'Building', group: 'crypto_defi' },
  { value: 'crypto_snx', label: 'Synthetix (SNX)', icon: 'Repeat', group: 'crypto_defi' },
  { value: 'crypto_ldo', label: 'Lido DAO (LDO)', icon: 'Droplet', group: 'crypto_defi' },
  { value: 'crypto_pepe', label: 'Pepe (PEPE)', icon: 'Smile', group: 'crypto_meme' },
  { value: 'crypto_wif', label: 'dogwifhat (WIF)', icon: 'Dog', group: 'crypto_meme' },
  { value: 'crypto_bonk', label: 'Bonk (BONK)', icon: 'Hammer', group: 'crypto_meme' },
  { value: 'crypto_floki', label: 'Floki (FLOKI)', icon: 'Dog', group: 'crypto_meme' },
  
  // Crypto categories for general grouping
  { value: 'crypto_defi_other', label: 'DeFi / Staking (Otros)', icon: 'Layers', group: 'crypto_defi' },
  { value: 'crypto_nft_other', label: 'NFTs', icon: 'ImageIcon', group: 'crypto_nft' },
  { value: 'crypto_altcoins_other', label: 'Altcoins (Otros)', icon: 'Coins', group: 'crypto_altcoin' },
  { value: 'crypto_stablecoins_other', label: 'Stablecoins (Otros)', icon: 'CircleDollarSign', group: 'crypto_stablecoin' },
];

// Groups for organizing the dropdown
export const ASSET_CATEGORY_GROUPS = {
  general: { label: 'Inversiones y Cuentas', icon: 'TrendingUp' },
  real_estate: { label: 'Bienes Raíces', icon: 'Home' },
  vehicles: { label: 'Vehículos', icon: 'Car' },
  precious_metals: { label: 'Metales Preciosos', icon: 'Gem' },
  collectibles: { label: 'Coleccionables y Arte', icon: 'Palette' },
  business: { label: 'Negocios y Propiedad Intelectual', icon: 'Building2' },
  other: { label: 'Otros Activos', icon: 'Package' },
  crypto_major: { label: 'Criptomonedas Principales', icon: 'Bitcoin' },
  crypto_stablecoin: { label: 'Stablecoins', icon: 'CircleDollarSign' },
  crypto_altcoin: { label: 'Altcoins', icon: 'Coins' },
  crypto_defi: { label: 'DeFi', icon: 'Layers' },
  crypto_layer2: { label: 'Layer 2', icon: 'Layers' },
  crypto_meme: { label: 'Memecoins', icon: 'Dog' },
  crypto_nft: { label: 'NFTs y Coleccionables', icon: 'ImageIcon' },
  crypto_metaverse: { label: 'Metaverso', icon: 'Globe' },
  crypto_gaming: { label: 'Gaming', icon: 'Gamepad2' },
  crypto_media: { label: 'Media y Streaming', icon: 'Video' },
  crypto_storage: { label: 'Storage', icon: 'HardDrive' },
  crypto_ai: { label: 'AI y Computación', icon: 'Cpu' },
  crypto_privacy: { label: 'Privacidad', icon: 'Eye' },
};

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
