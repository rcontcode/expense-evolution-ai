import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/data/useSubscription';

// Tab → route redirect map
const TAB_REDIRECTS: Record<string, string> = {
  charts: '/analytics',
  analytics: '/analytics',
  budget: '/budget',
  budgets: '/budget',
  mentorship: '/mentorship',
  goals: '/budget?tab=savings',
  tax: '/tax-optimizer',
  mileage: '/mileage',
  subscriptions: '/subscriptions',
  fire: '/investments',
  debt: '/investments',
  portfolio: '/investments',
  education: '/mentorship',
};

interface DeepLinkState {
  deepLinkArea: string | null;
  deepLinkTab: string | null;
  deepLinkKey: number;
}

export function useDashboardDeepLinks(
  viewMode: string,
  setViewMode: (mode: string) => void
): DeepLinkState {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();

  const [deepLinkArea, setDeepLinkArea] = useState<string | null>(null);
  const [deepLinkTab, setDeepLinkTab] = useState<string | null>(null);
  const [deepLinkKey, setDeepLinkKey] = useState(0);

  // Handle subscription success/cancel from Stripe redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      toast.success('¡Suscripción activada! 🎉', {
        description: 'Tu plan ha sido actualizado correctamente',
      });
      refreshSubscription();
      setSearchParams({});
    } else if (subscriptionStatus === 'cancelled') {
      toast.info('Pago cancelado', {
        description: 'Puedes intentar de nuevo cuando quieras',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  // Deep-link redirect: ?tab=X → dedicated route
  // Deep-link to Centro de Control: ?area=X&atab=Y
  useEffect(() => {
    const tab = searchParams.get('tab');
    const area = searchParams.get('area');
    const areaTab = searchParams.get('atab');

    if (area) {
      setDeepLinkArea(area);
      setDeepLinkTab(areaTab || null);
      setDeepLinkKey(k => k + 1);
      if (viewMode !== 'organized') {
        setViewMode('organized');
      }
      searchParams.delete('area');
      searchParams.delete('atab');
      searchParams.delete('tool');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (!tab) return;
    const redirectTo = TAB_REDIRECTS[tab];
    if (redirectTo) {
      setSearchParams({}, { replace: true });
      navigate(redirectTo, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate, viewMode, setViewMode]);

  return { deepLinkArea, deepLinkTab, deepLinkKey };
}
