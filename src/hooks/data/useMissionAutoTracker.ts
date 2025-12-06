import { useCallback, useEffect, useRef } from 'react';
import { useMissionTracker } from './useMissions';

// Central hook for auto-tracking missions across the app
export function useMissionAutoTracker() {
  const { trackAction } = useMissionTracker();
  
  const trackExpenseAdded = useCallback((count: number = 1) => {
    trackAction('add_expense', count);
    trackAction('categorize_expense', count); // Categorizing happens on creation
  }, [trackAction]);
  
  const trackIncomeAdded = useCallback((count: number = 1) => {
    trackAction('add_income', count);
  }, [trackAction]);
  
  const trackSavingsAdded = useCallback(() => {
    trackAction('add_savings', 1);
  }, [trackAction]);
  
  const trackMileageAdded = useCallback(() => {
    trackAction('add_mileage', 1);
  }, [trackAction]);
  
  const trackDashboardVisit = useCallback(() => {
    trackAction('view_dashboard', 1);
  }, [trackAction]);
  
  const trackExpensesViewed = useCallback(() => {
    trackAction('view_expenses', 1);
  }, [trackAction]);
  
  const trackLogin = useCallback(() => {
    trackAction('login', 1);
  }, [trackAction]);
  
  return {
    trackExpenseAdded,
    trackIncomeAdded,
    trackSavingsAdded,
    trackMileageAdded,
    trackDashboardVisit,
    trackExpensesViewed,
    trackLogin,
  };
}

// Hook to track page visits (for Dashboard and Expenses pages)
export function usePageVisitTracker(action: 'view_dashboard' | 'view_expenses') {
  const { trackAction } = useMissionTracker();
  const hasTracked = useRef(false);
  
  useEffect(() => {
    // Only track once per mount
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackAction(action, 1);
    }
  }, [action, trackAction]);
}

// Hook to track login (call from AuthContext or App)
export function useLoginTracker() {
  const { trackAction } = useMissionTracker();
  
  const trackUserLogin = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastLoginTracked = localStorage.getItem('last_login_tracked');
    
    // Only track login once per day
    if (lastLoginTracked !== today) {
      trackAction('login', 1);
      localStorage.setItem('last_login_tracked', today);
    }
  }, [trackAction]);
  
  return { trackUserLogin };
}
