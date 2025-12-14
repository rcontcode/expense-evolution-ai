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
        .select('resource_type, status, impact_rating')
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

      return {
        total: resources.length,
        completed: completed.length,
        inProgress: inProgress.length,
        wishlist: wishlist.length,
        byType,
        avgImpactRating: avgImpact,
      };
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
      }
      if (data.status === 'in_progress') {
        updateData.started_date = new Date().toISOString().split('T')[0];
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
