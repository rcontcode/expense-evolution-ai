import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface LifeProfile {
  id: string;
  user_id: string;
  
  // Family & Relationships
  relationship_status: string | null;
  has_children: boolean;
  children_count: number;
  children_ages: string[];
  dependents_count: number;
  pets: string[];
  
  // Work & Career
  employment_status: string | null;
  job_title: string | null;
  industry: string | null;
  company_size: string | null;
  years_experience: number | null;
  career_goals: string[];
  side_hustle: boolean;
  side_hustle_type: string | null;
  
  // Lifestyle & Interests
  hobbies: string[];
  sports: string[];
  passions: string[];
  interests: string[];
  daily_routine: string | null;
  work_life_balance: string | null;
  
  // Dreams & Aspirations
  life_dreams: string[];
  bucket_list: string[];
  biggest_fears: string[];
  motivations: string[];
  role_models: string | null;
  
  // Financial Psychology
  money_personality: string | null;
  biggest_financial_mistake: string | null;
  proudest_financial_achievement: string | null;
  financial_fears: string[];
  
  // Celebrations
  birthday_month: number | null;
  anniversary_date: string | null;
  custom_milestones: Json[] | null;
  
  // Progress
  sections_completed: string[];
  last_profile_prompt: string | null;
  profile_prompts_dismissed: number;
  
  created_at: string;
  updated_at: string;
}

export type LifeProfileSection = 'family' | 'work' | 'lifestyle' | 'dreams' | 'psychology';

export function useLifeProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['life-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_life_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as LifeProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpsertLifeProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      
      // Remove id and user_id from updates if present
      const { id, user_id, ...cleanUpdates } = updates as Record<string, unknown>;
      
      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_life_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('user_life_profile')
          .update(cleanUpdates as any)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_life_profile')
          .insert({ user_id: user.id, ...cleanUpdates } as any)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-profile', user?.id] });
    },
  });
}

export function useMarkSectionComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (section: LifeProfileSection) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get current sections
      const { data: profile } = await supabase
        .from('user_life_profile')
        .select('sections_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const currentSections = (profile?.sections_completed as string[]) || [];
      
      if (!currentSections.includes(section)) {
        const newSections = [...currentSections, section];
        
        const { error } = await supabase
          .from('user_life_profile')
          .upsert({
            user_id: user.id,
            sections_completed: newSections,
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-profile', user?.id] });
    },
  });
}

// Calculate profile completion percentage
export function calculateProfileCompletion(profile: LifeProfile | null): number {
  if (!profile) return 0;
  
  const sections = {
    family: ['relationship_status', 'has_children'],
    work: ['employment_status', 'job_title'],
    lifestyle: ['hobbies', 'sports'],
    dreams: ['life_dreams', 'motivations'],
    psychology: ['money_personality'],
  };
  
  let filled = 0;
  let total = 0;
  
  for (const fields of Object.values(sections)) {
    for (const field of fields) {
      total++;
      const value = profile[field as keyof LifeProfile];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) filled++;
        else if (typeof value === 'boolean') filled++;
        else if (typeof value === 'string' && value.trim()) filled++;
      }
    }
  }
  
  return Math.round((filled / total) * 100);
}

// Get pending sections that user hasn't completed
export function getPendingSections(profile: LifeProfile | null): LifeProfileSection[] {
  const allSections: LifeProfileSection[] = ['family', 'work', 'lifestyle', 'dreams', 'psychology'];
  if (!profile) return allSections;
  
  const completed = profile.sections_completed || [];
  return allSections.filter(s => !completed.includes(s));
}
