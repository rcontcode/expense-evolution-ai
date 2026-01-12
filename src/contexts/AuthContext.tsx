import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Track login for missions
  const trackLoginAction = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastLoginTracked = localStorage.getItem('last_login_tracked');
    
    // Only track login once per day
    if (lastLoginTracked !== today) {
      // Dispatch custom event for mission tracking
      window.dispatchEvent(new CustomEvent('user-login'));
      localStorage.setItem('last_login_tracked', today);
    }
  }, []);

  // Check subscription status after sign in
  const checkSubscription = useCallback(async (accessToken: string) => {
    try {
      await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // Invalidate subscription queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['stripe-subscription'] });
    } catch (err) {
      console.error('Failed to check subscription on login:', err);
    }
  }, [queryClient]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Track login for missions on SIGNED_IN event
      if (event === 'SIGNED_IN') {
        trackLoginAction();
        // Check subscription status after sign in
        if (session?.access_token) {
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(() => checkSubscription(session.access_token), 100);
        }
      }
      
      // Clean up URL hash after OAuth callback.
      // IMPORTANT: Do not strip hash-router paths like "#/quiz" (used as a deep-link fallback on some hosts),
      // otherwise the app can end up at "/quiz" which may 404 on refresh.
      const hash = window.location.hash || "";
      const isHashRouterPath = hash.startsWith("#/");
      const looksLikeOAuthHash = !isHashRouterPath && /access_token=|refresh_token=|type=/.test(hash);

      if (event === 'SIGNED_IN' && hash && looksLikeOAuthHash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Track login if user already has session
      if (session?.user) {
        trackLoginAction();
        // Check subscription on initial load
        if (session?.access_token) {
          setTimeout(() => checkSubscription(session.access_token), 100);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [trackLoginAction, checkSubscription]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear subscription cache on sign out
    queryClient.removeQueries({ queryKey: ['subscription'] });
    queryClient.removeQueries({ queryKey: ['stripe-subscription'] });
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
