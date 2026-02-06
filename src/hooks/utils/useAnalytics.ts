import { useCallback, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'evofinz_cookie_consent';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

// Get consent state from localStorage
const getConsentState = (): ConsentState | null => {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

// Check if analytics consent was given
export const hasAnalyticsConsent = (): boolean => {
  const consent = getConsentState();
  return consent?.analytics === true;
};

// Log event to console in development, could be extended to send to analytics service
const logEvent = (event: AnalyticsEvent) => {
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event.event, event.properties);
  }
  
  // Store events locally for potential future sync
  try {
    const events = JSON.parse(localStorage.getItem('evofinz_analytics_queue') || '[]');
    events.push(event);
    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }
    localStorage.setItem('evofinz_analytics_queue', JSON.stringify(events));
  } catch {
    // Ignore storage errors
  }
};

export const useAnalytics = () => {
  // Track page views
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    
    const pathname = window.location.pathname;
    logEvent({
      event: 'page_view',
      properties: { 
        path: pathname,
        referrer: document.referrer,
        title: document.title
      },
      timestamp: Date.now()
    });
  }, []);

  // Track custom events
  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (!hasAnalyticsConsent()) return;
    
    logEvent({
      event: eventName,
      properties,
      timestamp: Date.now()
    });
  }, []);

  // Track user registration
  const trackRegistration = useCallback((method: 'email' | 'google') => {
    trackEvent('user_registered', { method });
  }, [trackEvent]);

  // Track user login
  const trackLogin = useCallback((method: 'email' | 'google') => {
    trackEvent('user_login', { method });
  }, [trackEvent]);

  // Track checkout initiation
  const trackCheckoutStart = useCallback((plan: string, billingPeriod: string) => {
    trackEvent('checkout_started', { plan, billingPeriod });
  }, [trackEvent]);

  // Track subscription success
  const trackSubscriptionSuccess = useCallback((plan: string, billingPeriod: string) => {
    trackEvent('subscription_success', { plan, billingPeriod });
  }, [trackEvent]);

  // Track feature usage
  const trackFeatureUsage = useCallback((feature: string, action?: string) => {
    trackEvent('feature_used', { feature, action });
  }, [trackEvent]);

  // Track errors
  const trackError = useCallback((error: string, context?: string) => {
    trackEvent('error_occurred', { error, context });
  }, [trackEvent]);

  // NEW: Track CTA clicks for conversion optimization
  const trackCtaClick = useCallback((location: string, variant?: string, scrollDepth?: number) => {
    trackEvent('cta_clicked', { 
      location, 
      variant, 
      scroll_depth: scrollDepth,
      page: window.location.pathname 
    });
  }, [trackEvent]);

  // NEW: Track pricing section views
  const trackPricingView = useCallback((plan: string, billingPeriod: 'monthly' | 'annual') => {
    trackEvent('pricing_viewed', { plan, billingPeriod });
  }, [trackEvent]);

  // NEW: Track beta code entry
  const trackBetaCodeEntry = useCallback((valid: boolean, code?: string) => {
    trackEvent('beta_code_entered', { valid, code_length: code?.length });
  }, [trackEvent]);

  // NEW: Track scroll depth milestones
  const trackScrollDepth = useCallback((depth: number) => {
    trackEvent('scroll_depth_reached', { depth, page: window.location.pathname });
  }, [trackEvent]);

  // NEW: Track social proof interaction
  const trackSocialProofView = useCallback(() => {
    trackEvent('social_proof_viewed', { page: window.location.pathname });
  }, [trackEvent]);

  return {
    trackEvent,
    trackRegistration,
    trackLogin,
    trackCheckoutStart,
    trackSubscriptionSuccess,
    trackFeatureUsage,
    trackError,
    // New conversion tracking methods
    trackCtaClick,
    trackPricingView,
    trackBetaCodeEntry,
    trackScrollDepth,
    trackSocialProofView
  };
};
