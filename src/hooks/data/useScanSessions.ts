import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScanSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  receipts_captured: number;
  receipts_approved: number;
  receipts_rejected: number;
  total_amount: number;
  device_type: string | null;
  notes: string | null;
  created_at: string;
}

interface DailyStats {
  date: string;
  sessions: number;
  receipts_captured: number;
  receipts_approved: number;
  total_amount: number;
}

export function useScanSessions() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['scan-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ScanSession[];
    },
    enabled: !!user,
  });

  const dailyStatsQuery = useQuery({
    queryKey: ['scan-daily-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get sessions from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      // Group by date
      const sessions = data as ScanSession[];
      const dailyMap = new Map<string, DailyStats>();
      
      sessions.forEach(session => {
        const date = session.started_at.split('T')[0];
        const existing = dailyMap.get(date) || {
          date,
          sessions: 0,
          receipts_captured: 0,
          receipts_approved: 0,
          total_amount: 0,
        };
        
        existing.sessions++;
        existing.receipts_captured += session.receipts_captured || 0;
        existing.receipts_approved += session.receipts_approved || 0;
        existing.total_amount += Number(session.total_amount) || 0;
        
        dailyMap.set(date, existing);
      });
      
      return Array.from(dailyMap.values());
    },
    enabled: !!user,
  });

  const startSession = useMutation({
    mutationFn: async (deviceType?: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('scan_sessions')
        .insert({
          user_id: user.id,
          device_type: deviceType || (window.innerWidth < 768 ? 'mobile' : 'desktop'),
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScanSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-sessions'] });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({ 
      sessionId, 
      updates 
    }: { 
      sessionId: string; 
      updates: Partial<Pick<ScanSession, 'receipts_captured' | 'receipts_approved' | 'receipts_rejected' | 'total_amount' | 'ended_at' | 'notes'>> 
    }) => {
      const { data, error } = await supabase
        .from('scan_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as ScanSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['scan-daily-stats'] });
    },
  });

  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('scan_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as ScanSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['scan-daily-stats'] });
      toast.success(
        language === 'es' ? 'Sesión de escaneo finalizada' : 'Scan session ended'
      );
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('scan_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['scan-daily-stats'] });
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    dailyStats: dailyStatsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    startSession,
    updateSession,
    endSession,
    deleteSession,
    refetch: () => {
      sessionsQuery.refetch();
      dailyStatsQuery.refetch();
    },
  };
}

export type { ScanSession, DailyStats };
