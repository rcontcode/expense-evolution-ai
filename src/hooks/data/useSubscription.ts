import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PlanType } from './usePlanLimits';

// Stripe product and price configuration
export const STRIPE_CONFIG = {
  products: {
    premium_monthly: 'prod_TkhJLlgoAdGcGC',
    premium_annual: 'prod_TkhL8wDZL2MPDd',
    pro_monthly: 'prod_TkhKMQlrqFnKYc',
    pro_annual: 'prod_TkhLVXHrCf97Ir',
  },
  prices: {
    premium_monthly: 'price_1SnBvH7BLBLy48jQTW0FYtxP',
    premium_annual: 'price_1SnBwm7BLBLy48jQX7j8AA4S',
    pro_monthly: 'price_1SnBvY7BLBLy48jQ3SM3pbQY',
    pro_annual: 'price_1SnBx67BLBLy48jQFh5Cj6Xc',
  },
  pricing: {
    premium_monthly: 6.99,
    premium_annual: 67.10, // $5.59/month
    pro_monthly: 14.99,
    pro_annual: 143.90, // $11.99/month
  },
} as const;

export type BillingPeriod = 'monthly' | 'annual';

interface SubscriptionState {
  subscribed: boolean;
  plan_type: PlanType;
  billing_period: BillingPeriod | null;
  subscription_end: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Check subscription status from Stripe
  const { data: stripeStatus, isLoading: isLoadingStripe, refetch: refetchStripe } = useQuery({
    queryKey: ['stripe-subscription', user?.id],
    queryFn: async (): Promise<SubscriptionState> => {
      if (!session?.access_token) {
        return { subscribed: false, plan_type: 'free', billing_period: null, subscription_end: null };
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Error checking subscription:', error);
          return { subscribed: false, plan_type: 'free', billing_period: null, subscription_end: null };
        }

        return data as SubscriptionState;
      } catch (err) {
        console.error('Failed to check subscription:', err);
        return { subscribed: false, plan_type: 'free', billing_period: null, subscription_end: null };
      }
    },
    enabled: !!user?.id && !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Create checkout session
  const createCheckout = useCallback(async (planType: 'premium' | 'pro', billingPeriod: BillingPeriod) => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión para suscribirte');
      return null;
    }

    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType, billingPeriod },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Error al crear la sesión de pago');
        return null;
      }

      if (data?.url) {
        // Open in new tab
        window.open(data.url, '_blank');
        toast.success('Redirigiendo a Stripe...', {
          description: 'Completa el pago en la nueva pestaña',
        });
        return data.url;
      }

      return null;
    } catch (err) {
      console.error('Checkout failed:', err);
      toast.error('Error al procesar el pago');
      return null;
    } finally {
      setIsCheckingOut(false);
    }
  }, [session?.access_token]);

  // Open customer portal
  const openCustomerPortal = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Debes iniciar sesión para gestionar tu suscripción');
      return null;
    }

    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Portal error:', error);
        toast.error('Error al abrir el portal de gestión');
        return null;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Abriendo portal de Stripe...', {
          description: 'Gestiona tu suscripción en la nueva pestaña',
        });
        return data.url;
      }

      return null;
    } catch (err) {
      console.error('Portal failed:', err);
      toast.error('Error al abrir el portal');
      return null;
    } finally {
      setIsOpeningPortal(false);
    }
  }, [session?.access_token]);

  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    await refetchStripe();
    // Also invalidate local subscription query
    queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
  }, [refetchStripe, queryClient, user?.id]);

  // Get display price
  const getDisplayPrice = (planType: 'premium' | 'pro', billingPeriod: BillingPeriod) => {
    const key = `${planType}_${billingPeriod}` as keyof typeof STRIPE_CONFIG.pricing;
    const total = STRIPE_CONFIG.pricing[key];
    
    if (billingPeriod === 'annual') {
      return {
        monthly: (total / 12).toFixed(2),
        total: total.toFixed(2),
        savings: '20%',
      };
    }
    
    return {
      monthly: total.toFixed(2),
      total: total.toFixed(2),
      savings: null,
    };
  };

  return {
    // State
    isSubscribed: stripeStatus?.subscribed || false,
    planType: stripeStatus?.plan_type || 'free',
    billingPeriod: stripeStatus?.billing_period || null,
    subscriptionEnd: stripeStatus?.subscription_end || null,
    isLoading: isLoadingStripe,
    isCheckingOut,
    isOpeningPortal,
    
    // Actions
    createCheckout,
    openCustomerPortal,
    refreshSubscription,
    
    // Helpers
    getDisplayPrice,
    config: STRIPE_CONFIG,
  };
}
