import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface BetaFeedback {
  id: string;
  user_id: string;
  section: string;
  rating: number;
  ease_of_use: number | null;
  usefulness: number | null;
  design_rating: number | null;
  comment: string | null;
  suggestions: string | null;
  would_recommend: boolean | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface BetaBugReport {
  id: string;
  user_id: string;
  report_type: string;
  severity: string;
  title: string;
  description: string;
  page_path: string | null;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface FeatureUsage {
  feature_name: string;
  total_uses: number;
  unique_users: number;
  last_used: string;
}

interface UserStats {
  user_id: string;
  user_email: string;
  user_name: string;
  total_actions: number;
  unique_features: number;
  unique_pages: number;
  first_activity: string;
  last_activity: string;
  days_active: number;
  feedback_count: number;
  avg_rating: number;
  beta_expires_at: string | null;
}

interface CreateFeedbackParams {
  section: string;
  rating: number;
  ease_of_use?: number;
  usefulness?: number;
  design_rating?: number;
  comment?: string;
  suggestions?: string;
  would_recommend?: boolean;
}

interface CreateBugReportParams {
  report_type: string;
  severity?: string;
  title: string;
  description: string;
  page_path?: string;
  screenshot_url?: string;
}

export const useBetaFeedback = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all feedback (admin only)
  const { data: allFeedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['beta-feedback-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set((data || []).map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(feedback => ({
        ...feedback,
        user_email: profileMap.get(feedback.user_id)?.email || 'N/A',
        user_name: profileMap.get(feedback.user_id)?.full_name || 'N/A',
      })) as BetaFeedback[];
    },
  });

  // Fetch all bug reports (admin only)
  const { data: bugReports, isLoading: isLoadingBugReports } = useQuery({
    queryKey: ['beta-bug-reports-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(report => ({
        ...report,
        user_email: profileMap.get(report.user_id)?.email || 'N/A',
        user_name: profileMap.get(report.user_id)?.full_name || 'N/A',
      })) as BetaBugReport[];
    },
  });

  // Fetch feature usage stats (admin only)
  const { data: featureUsage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['feature-usage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_usage_logs')
        .select('feature_name, user_id, created_at');

      if (error) throw error;

      // Aggregate by feature
      const usageMap = new Map<string, { users: Set<string>; count: number; lastUsed: string }>();
      
      (data || []).forEach(log => {
        const existing = usageMap.get(log.feature_name) || { 
          users: new Set<string>(), 
          count: 0, 
          lastUsed: log.created_at 
        };
        existing.users.add(log.user_id);
        existing.count++;
        if (log.created_at > existing.lastUsed) {
          existing.lastUsed = log.created_at;
        }
        usageMap.set(log.feature_name, existing);
      });

      return Array.from(usageMap.entries()).map(([feature_name, stats]) => ({
        feature_name,
        total_uses: stats.count,
        unique_users: stats.users.size,
        last_used: stats.lastUsed,
      })).sort((a, b) => b.total_uses - a.total_uses) as FeatureUsage[];
    },
  });

  // Fetch user stats (admin only)
  const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
    queryKey: ['beta-user-stats'],
    queryFn: async () => {
      // Get all beta testers (users who have used a code)
      const { data: codeUses } = await supabase
        .from('beta_code_uses')
        .select('used_by');

      const userIds = [...new Set((codeUses || []).map(u => u.used_by).filter(Boolean))];
      
      if (userIds.length === 0) return [];

      // Get profiles with beta_expires_at
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, beta_expires_at')
        .in('id', userIds);

      // Get usage logs
      const { data: usageLogs } = await supabase
        .from('feature_usage_logs')
        .select('user_id, feature_name, page_path, created_at')
        .in('user_id', userIds);

      // Get feedback
      const { data: feedback } = await supabase
        .from('beta_feedback')
        .select('user_id, rating')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return userIds.map(userId => {
        const userLogs = (usageLogs || []).filter(l => l.user_id === userId);
        const userFeedback = (feedback || []).filter(f => f.user_id === userId);
        const profile = profileMap.get(userId);

        const uniqueFeatures = new Set(userLogs.map(l => l.feature_name)).size;
        const uniquePages = new Set(userLogs.map(l => l.page_path)).size;
        const dates = userLogs.map(l => l.created_at.split('T')[0]);
        const uniqueDays = new Set(dates).size;

        return {
          user_id: userId,
          user_email: profile?.email || 'N/A',
          user_name: profile?.full_name || 'N/A',
          total_actions: userLogs.length,
          unique_features: uniqueFeatures,
          unique_pages: uniquePages,
          first_activity: userLogs.length > 0 ? userLogs[userLogs.length - 1]?.created_at : null,
          last_activity: userLogs.length > 0 ? userLogs[0]?.created_at : null,
          days_active: uniqueDays,
          feedback_count: userFeedback.length,
          avg_rating: userFeedback.length > 0 
            ? userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length 
            : 0,
          beta_expires_at: profile?.beta_expires_at || null,
        };
      }).sort((a, b) => b.total_actions - a.total_actions) as UserStats[];
    },
  });

  // Submit feedback (for beta users)
  const submitFeedback = useMutation({
    mutationFn: async (params: CreateFeedbackParams) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('beta_feedback')
        .insert({
          user_id: user.id,
          ...params,
        })
        .select()
        .single();

      if (error) throw error;

      // Award points for feedback
      const hasDetailedComment = (params.comment?.length || 0) > 100 || (params.suggestions?.length || 0) > 100;
      const basePoints = 25;
      const bonusPoints = hasDetailedComment ? 25 : 0;
      
      await supabase.rpc('award_beta_points', {
        p_user_id: user.id,
        p_points: basePoints + bonusPoints,
        p_category: 'feedback',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-feedback-all'] });
      queryClient.invalidateQueries({ queryKey: ['beta-points'] });
      toast({
        title: '¡Gracias por tu feedback!',
        description: 'Tu opinión nos ayuda a mejorar. +25 puntos 🎉',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit bug report
  const submitBugReport = useMutation({
    mutationFn: async (params: CreateBugReportParams) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('beta_bug_reports')
        .insert({
          user_id: user.id,
          ...params,
        })
        .select()
        .single();

      if (error) throw error;

      // Award points for bug report based on severity
      const severityPoints: Record<string, number> = {
        low: 25,
        medium: 50,
        high: 75,
        critical: 150,
      };
      const points = severityPoints[params.severity || 'medium'] || 50;
      const screenshotBonus = params.screenshot_url ? 25 : 0;
      
      await supabase.rpc('award_beta_points', {
        p_user_id: user.id,
        p_points: points + screenshotBonus,
        p_category: 'bug_report',
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beta-bug-reports-all'] });
      queryClient.invalidateQueries({ queryKey: ['beta-points'] });
      const points = { low: 25, medium: 50, high: 75, critical: 150 }[variables.severity || 'medium'] || 50;
      toast({
        title: '¡Reporte enviado!',
        description: `Revisaremos tu reporte pronto. +${points} puntos 🎉`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update bug report status (admin)
  const updateBugReport = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: string; admin_notes?: string }) => {
      const { error } = await supabase
        .from('beta_bug_reports')
        .update({ 
          status, 
          admin_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-bug-reports-all'] });
      toast({
        title: 'Reporte actualizado',
      });
    },
  });

  // Log feature usage
  const logFeatureUsage = useMutation({
    mutationFn: async ({ 
      feature_name, 
      page_path, 
      action_type = 'view',
      metadata 
    }: { 
      feature_name: string; 
      page_path: string; 
      action_type?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;

      const { error } = await supabase
        .from('feature_usage_logs')
        .insert({
          user_id: user.id,
          feature_name,
          page_path,
          action_type,
          metadata: metadata as Record<string, unknown> | null,
          session_id: sessionStorage.getItem('session_id') || null,
        } as never);

      if (error) console.error('Failed to log feature usage:', error);
    },
  });

  // Calculate summary stats
  const feedbackStats = {
    totalFeedback: allFeedback?.length || 0,
    avgRating: allFeedback?.length 
      ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length).toFixed(1)
      : '0',
    avgEaseOfUse: allFeedback?.filter(f => f.ease_of_use)?.length
      ? (allFeedback.filter(f => f.ease_of_use).reduce((sum, f) => sum + (f.ease_of_use || 0), 0) / 
         allFeedback.filter(f => f.ease_of_use).length).toFixed(1)
      : '0',
    avgUsefulness: allFeedback?.filter(f => f.usefulness)?.length
      ? (allFeedback.filter(f => f.usefulness).reduce((sum, f) => sum + (f.usefulness || 0), 0) /
         allFeedback.filter(f => f.usefulness).length).toFixed(1)
      : '0',
    wouldRecommend: allFeedback?.filter(f => f.would_recommend !== null)?.length
      ? Math.round((allFeedback.filter(f => f.would_recommend === true).length /
         allFeedback.filter(f => f.would_recommend !== null).length) * 100)
      : 0,
    bySection: allFeedback?.reduce((acc, f) => {
      acc[f.section] = (acc[f.section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  const bugStats = {
    total: bugReports?.length || 0,
    new: bugReports?.filter(r => r.status === 'new').length || 0,
    inProgress: bugReports?.filter(r => r.status === 'in_progress').length || 0,
    resolved: bugReports?.filter(r => r.status === 'resolved').length || 0,
    bySeverity: bugReports?.reduce((acc, r) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return {
    // Data
    allFeedback,
    bugReports,
    featureUsage,
    userStats,
    feedbackStats,
    bugStats,
    // Loading states
    isLoading: isLoadingFeedback || isLoadingBugReports || isLoadingUsage || isLoadingUserStats,
    // Mutations
    submitFeedback,
    submitBugReport,
    updateBugReport,
    logFeatureUsage,
  };
};
