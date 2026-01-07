import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    expenses_per_month: 50,
    incomes_per_month: 20,
    ocr_scans_per_month: 5,
    clients: 2,
    projects: 2,
    contract_analyses_per_month: 0,
    bank_analyses_per_month: 0,
    // Features
    mileage: false,
    gamification: false,
    net_worth: false,
    tax_calendar: false,
    tags_unlimited: false,
    export_excel: false,
    fire_calculator: false,
    mentorship_components: 0,
    voice_assistant: false,
    tax_optimizer: false,
    rrsp_tfsa_optimizer: false,
    t2125_export: false,
  },
  premium: {
    expenses_per_month: Infinity,
    incomes_per_month: Infinity,
    ocr_scans_per_month: 50,
    clients: Infinity,
    projects: Infinity,
    contract_analyses_per_month: 0,
    bank_analyses_per_month: 0,
    // Features
    mileage: true,
    gamification: true,
    net_worth: true,
    tax_calendar: true,
    tags_unlimited: true,
    export_excel: true,
    fire_calculator: false,
    mentorship_components: 4,
    voice_assistant: false,
    tax_optimizer: false,
    rrsp_tfsa_optimizer: false,
    t2125_export: false,
  },
  pro: {
    expenses_per_month: Infinity,
    incomes_per_month: Infinity,
    ocr_scans_per_month: Infinity,
    clients: Infinity,
    projects: Infinity,
    contract_analyses_per_month: Infinity,
    bank_analyses_per_month: Infinity,
    // Features
    mileage: true,
    gamification: true,
    net_worth: true,
    tax_calendar: true,
    tags_unlimited: true,
    export_excel: true,
    fire_calculator: true,
    mentorship_components: 8,
    voice_assistant: true,
    tax_optimizer: true,
    rrsp_tfsa_optimizer: true,
    t2125_export: true,
  },
} as const;

export type PlanType = 'free' | 'premium' | 'pro';
export type FeatureKey = keyof typeof PLAN_LIMITS.free;

interface UsageData {
  expenses_count: number;
  incomes_count: number;
  ocr_scans_count: number;
  contract_analyses_count: number;
  bank_analyses_count: number;
}

interface SubscriptionData {
  plan_type: PlanType;
  billing_period: 'monthly' | 'annual';
  is_active: boolean;
  expires_at: string | null;
}

export function usePlanLimits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_type, billing_period, is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
      
      // If no subscription exists, create one
      if (!data) {
        const { data: newSub, error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: user.id, plan_type: 'free' })
          .select('plan_type, billing_period, is_active, expires_at')
          .single();
        
        if (insertError) {
          console.error('Error creating subscription:', insertError);
          return { plan_type: 'free' as PlanType, billing_period: 'monthly' as const, is_active: true, expires_at: null };
        }
        return newSub as SubscriptionData;
      }
      
      return data as SubscriptionData;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch current month usage
  const { data: usage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const currentPeriod = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('expenses_count, incomes_count, ocr_scans_count, contract_analyses_count, bank_analyses_count')
        .eq('user_id', user.id)
        .eq('period_start', currentPeriod)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching usage:', error);
        return null;
      }
      
      return data as UsageData | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch client count
  const { data: clientCount = 0 } = useQuery({
    queryKey: ['clientCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch project count
  const { data: projectCount = 0 } = useQuery({
    queryKey: ['projectCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Increment usage mutation
  const incrementUsage = useMutation({
    mutationFn: async (usageType: 'expense' | 'income' | 'ocr' | 'contract' | 'bank') => {
      if (!user?.id) throw new Error('No user');
      
      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_usage_type: usageType,
      });
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage', user?.id] });
    },
  });

  const planType = subscription?.plan_type || 'free';
  const limits = PLAN_LIMITS[planType];
  const currentUsage = usage || {
    expenses_count: 0,
    incomes_count: 0,
    ocr_scans_count: 0,
    contract_analyses_count: 0,
    bank_analyses_count: 0,
  };

  // Check functions
  const canAddExpense = () => {
    if (limits.expenses_per_month === Infinity) return true;
    return currentUsage.expenses_count < limits.expenses_per_month;
  };

  const canAddIncome = () => {
    if (limits.incomes_per_month === Infinity) return true;
    return currentUsage.incomes_count < limits.incomes_per_month;
  };

  const canUseOCR = () => {
    if (limits.ocr_scans_per_month === Infinity) return true;
    return currentUsage.ocr_scans_count < limits.ocr_scans_per_month;
  };

  const canAddClient = () => {
    if (limits.clients === Infinity) return true;
    return clientCount < limits.clients;
  };

  const canAddProject = () => {
    if (limits.projects === Infinity) return true;
    return projectCount < limits.projects;
  };

  const canAnalyzeContract = () => {
    if (limits.contract_analyses_per_month === Infinity) return true;
    if (limits.contract_analyses_per_month === 0) return false;
    return currentUsage.contract_analyses_count < limits.contract_analyses_per_month;
  };

  const canAnalyzeBank = () => {
    if (limits.bank_analyses_per_month === Infinity) return true;
    if (limits.bank_analyses_per_month === 0) return false;
    return currentUsage.bank_analyses_count < limits.bank_analyses_per_month;
  };

  const hasFeature = (feature: FeatureKey): boolean => {
    const value = limits[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return true;
  };

  const getUsagePercentage = (type: 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects'): number => {
    switch (type) {
      case 'expenses':
        if (limits.expenses_per_month === Infinity) return 0;
        return (currentUsage.expenses_count / limits.expenses_per_month) * 100;
      case 'incomes':
        if (limits.incomes_per_month === Infinity) return 0;
        return (currentUsage.incomes_count / limits.incomes_per_month) * 100;
      case 'ocr':
        if (limits.ocr_scans_per_month === Infinity) return 0;
        return (currentUsage.ocr_scans_count / limits.ocr_scans_per_month) * 100;
      case 'clients':
        if (limits.clients === Infinity) return 0;
        return (clientCount / limits.clients) * 100;
      case 'projects':
        if (limits.projects === Infinity) return 0;
        return (projectCount / limits.projects) * 100;
      default:
        return 0;
    }
  };

  const getRemainingUsage = (type: 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects'): number | 'unlimited' => {
    switch (type) {
      case 'expenses':
        if (limits.expenses_per_month === Infinity) return 'unlimited';
        return Math.max(0, limits.expenses_per_month - currentUsage.expenses_count);
      case 'incomes':
        if (limits.incomes_per_month === Infinity) return 'unlimited';
        return Math.max(0, limits.incomes_per_month - currentUsage.incomes_count);
      case 'ocr':
        if (limits.ocr_scans_per_month === Infinity) return 'unlimited';
        return Math.max(0, limits.ocr_scans_per_month - currentUsage.ocr_scans_count);
      case 'clients':
        if (limits.clients === Infinity) return 'unlimited';
        return Math.max(0, limits.clients - clientCount);
      case 'projects':
        if (limits.projects === Infinity) return 'unlimited';
        return Math.max(0, limits.projects - projectCount);
      default:
        return 0;
    }
  };

  const getUpgradePlan = (): PlanType | null => {
    if (planType === 'free') return 'premium';
    if (planType === 'premium') return 'pro';
    return null;
  };

  return {
    // State
    planType,
    limits,
    usage: currentUsage,
    clientCount,
    projectCount,
    isLoading: isLoadingSubscription || isLoadingUsage,
    subscription,
    
    // Check functions
    canAddExpense,
    canAddIncome,
    canUseOCR,
    canAddClient,
    canAddProject,
    canAnalyzeContract,
    canAnalyzeBank,
    hasFeature,
    
    // Usage info
    getUsagePercentage,
    getRemainingUsage,
    getUpgradePlan,
    
    // Mutations
    incrementUsage: incrementUsage.mutate,
  };
}
