import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialEducationResource {
  id: string;
  user_id: string;
  resource_type: 'book' | 'course' | 'podcast' | 'video' | 'article';
  title: string;
  author: string | null;
  url: string | null;
  started_date: string | null;
  completed_date: string | null;
  status: 'wishlist' | 'in_progress' | 'completed';
  key_lessons: string | null;
  impact_rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  progress_percentage: number | null;
  pages_read: number | null;
  total_pages: number | null;
  minutes_consumed: number | null;
  total_minutes: number | null;
  daily_goal_pages: number | null;
  daily_goal_minutes: number | null;
  suggested_resource_id: string | null;
  category: string | null;
}

export interface EducationFormData {
  resource_type: string;
  title: string;
  author?: string;
  url?: string;
  status?: string;
  key_lessons?: string;
  impact_rating?: number;
  notes?: string;
  progress_percentage?: number;
  pages_read?: number;
  total_pages?: number;
  minutes_consumed?: number;
  total_minutes?: number;
  daily_goal_pages?: number;
  daily_goal_minutes?: number;
  suggested_resource_id?: string;
  category?: string;
  started_date?: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  resource_id: string;
  log_date: string;
  pages_read: number;
  minutes_consumed: number;
  notes: string | null;
  created_at: string;
}

export interface PracticeLog {
  id: string;
  user_id: string;
  resource_id: string | null;
  suggested_resource_id: string | null;
  practice_description: string;
  practice_date: string;
  practice_type: string;
  outcome: string | null;
  impact_rating: number | null;
  created_at: string;
}

export function useFinancialEducation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-education', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('financial_education')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FinancialEducationResource[];
    },
    enabled: !!user,
  });
}

export function useEducationStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-education-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('financial_education')
        .select('resource_type, status, impact_rating, progress_percentage')
        .eq('user_id', user.id);

      if (error) throw error;

      const resources = data || [];
      const completed = resources.filter(r => r.status === 'completed');
      const inProgress = resources.filter(r => r.status === 'in_progress');
      const wishlist = resources.filter(r => r.status === 'wishlist');

      // Count by type
      const byType = resources.reduce((acc, r) => {
        acc[r.resource_type] = (acc[r.resource_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Average impact rating
      const completedWithRating = completed.filter(r => r.impact_rating);
      const avgImpact = completedWithRating.length > 0
        ? completedWithRating.reduce((sum, r) => sum + (r.impact_rating || 0), 0) / completedWithRating.length
        : 0;

      // Average progress for in_progress resources
      const avgProgress = inProgress.length > 0
        ? inProgress.reduce((sum, r) => sum + (r.progress_percentage || 0), 0) / inProgress.length
        : 0;

      return {
        total: resources.length,
        completed: completed.length,
        inProgress: inProgress.length,
        wishlist: wishlist.length,
        byType,
        avgImpactRating: avgImpact,
        avgProgress,
      };
    },
    enabled: !!user,
  });
}

export function useDailyLogs(resourceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['education-daily-logs', user?.id, resourceId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('education_daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DailyLog[];
    },
    enabled: !!user,
  });
}

export function usePracticeLogs(resourceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['education-practice-logs', user?.id, resourceId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('education_practice_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('practice_date', { ascending: false });

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PracticeLog[];
    },
    enabled: !!user,
  });
}

export function useCreateEducationResource() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EducationFormData) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('financial_education')
        .insert({
          user_id: user.id,
          started_date: data.status === 'in_progress' ? new Date().toISOString().split('T')[0] : null,
          completed_date: data.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-education'] });
      queryClient.invalidateQueries({ queryKey: ['financial-education-stats'] });
      toast.success('Recurso educativo agregado');
    },
  });
}

export function useUpdateEducationResource() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: EducationFormData & { id: string }) => {
      if (!user) throw new Error('No user');

      const updateData: any = { ...data, updated_at: new Date().toISOString() };
      
      // Set completed date if status changed to completed
      if (data.status === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
        updateData.progress_percentage = 100;
      }
      if (data.status === 'in_progress' && !data.started_date) {
        updateData.started_date = new Date().toISOString().split('T')[0];
      }

      // Calculate progress percentage if pages/minutes provided
      if (data.pages_read && data.total_pages) {
        updateData.progress_percentage = Math.min(100, Math.round((data.pages_read / data.total_pages) * 100));
      } else if (data.minutes_consumed && data.total_minutes) {
        updateData.progress_percentage = Math.min(100, Math.round((data.minutes_consumed / data.total_minutes) * 100));
      }

      const { error } = await supabase
        .from('financial_education')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-education'] });
      queryClient.invalidateQueries({ queryKey: ['financial-education-stats'] });
      toast.success('Recurso actualizado');
    },
  });
}

export function useDeleteEducationResource() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('financial_education')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-education'] });
      queryClient.invalidateQueries({ queryKey: ['financial-education-stats'] });
      toast.success('Recurso eliminado');
    },
  });
}

export function useLogDailyProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      resource_id: string; 
      pages_read?: number; 
      minutes_consumed?: number; 
      notes?: string;
    }) => {
      if (!user) throw new Error('No user');

      const today = new Date().toISOString().split('T')[0];

      // Upsert daily log
      const { error: logError } = await supabase
        .from('education_daily_logs')
        .upsert({
          user_id: user.id,
          resource_id: data.resource_id,
          log_date: today,
          pages_read: data.pages_read || 0,
          minutes_consumed: data.minutes_consumed || 0,
          notes: data.notes,
        }, { onConflict: 'user_id,resource_id,log_date' });

      if (logError) throw logError;

      // Update resource totals
      const { data: logs } = await supabase
        .from('education_daily_logs')
        .select('pages_read, minutes_consumed')
        .eq('resource_id', data.resource_id)
        .eq('user_id', user.id);

      const totalPages = logs?.reduce((sum, l) => sum + (l.pages_read || 0), 0) || 0;
      const totalMinutes = logs?.reduce((sum, l) => sum + (l.minutes_consumed || 0), 0) || 0;

      const { error: updateError } = await supabase
        .from('financial_education')
        .update({ 
          pages_read: totalPages, 
          minutes_consumed: totalMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.resource_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-education'] });
      queryClient.invalidateQueries({ queryKey: ['education-daily-logs'] });
      toast.success('¡Progreso registrado!');
    },
  });
}

export function useLogPractice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      resource_id?: string;
      suggested_resource_id?: string;
      practice_description: string;
      practice_type?: string;
      outcome?: string;
      impact_rating?: number;
    }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('education_practice_logs')
        .insert({
          user_id: user.id,
          resource_id: data.resource_id,
          suggested_resource_id: data.suggested_resource_id,
          practice_description: data.practice_description,
          practice_type: data.practice_type || 'action',
          outcome: data.outcome,
          impact_rating: data.impact_rating,
          practice_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education-practice-logs'] });
      toast.success('¡Práctica registrada! Sigue aplicando lo aprendido.');
    },
  });
}
