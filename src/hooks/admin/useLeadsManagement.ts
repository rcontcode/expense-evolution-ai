import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateLeadScore, getLeadPriority, type LeadPriority } from './useLeadScoring';

export interface QuizLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  situation: string;
  goal: string;
  obstacle: string;
  time_spent: string | null;
  quiz_score: number;
  quiz_level: string;
  failed_questions: number[] | null;
  converted_to_user: boolean | null;
  contacted_at: string | null;
  contact_notes: string | null;
  comments: string | null;
  ghl_synced: boolean | null;
  lead_score: number | null;
  priority: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  created_at: string;
}

export interface LeadFilters {
  search: string;
  level: string;
  country: string;
  converted: string;
  contacted: string;
  hasComments: string;
  priority: string;
  situation: string;
  goal: string;
  obstacle: string;
  source: string;
  tag: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: LeadFilters = {
  search: '',
  level: '',
  country: '',
  converted: '',
  contacted: '',
  hasComments: '',
  priority: '',
  situation: '',
  goal: '',
  obstacle: '',
  source: '',
  tag: '',
  dateFrom: '',
  dateTo: '',
};

export const useLeadsManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch all leads
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as QuizLead[];
    },
  });

  // Get unique countries for filter dropdown
  const countries = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.country))].filter(Boolean);
    return unique.sort();
  }, [leads]);

  // Get unique levels for filter dropdown
  const levels = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.quiz_level))].filter(Boolean);
    return unique;
  }, [leads]);

  // Get unique situations for filter dropdown
  const situations = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.situation))].filter(Boolean);
    return unique.sort();
  }, [leads]);

  // Get unique goals for filter dropdown
  const goals = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.goal))].filter(Boolean);
    return unique.sort();
  }, [leads]);

  // Get unique obstacles for filter dropdown
  const obstacles = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.obstacle))].filter(Boolean);
    return unique.sort();
  }, [leads]);

  // Get unique tags for filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    leads.forEach((l) => (l.tags || []).forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [leads]);

  // Apply filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Level filter
      if (filters.level && lead.quiz_level !== filters.level) return false;

      // Country filter
      if (filters.country && lead.country !== filters.country) return false;

      // Converted filter
      if (filters.converted === 'yes' && !lead.converted_to_user) return false;
      if (filters.converted === 'no' && lead.converted_to_user) return false;

      // Contacted filter
      if (filters.contacted === 'yes' && !lead.contacted_at) return false;
      if (filters.contacted === 'no' && lead.contacted_at) return false;

      // Comments filter
      if (filters.hasComments === 'yes' && !lead.comments) return false;
      if (filters.hasComments === 'no' && lead.comments) return false;

      // Priority filter
      if (filters.priority) {
        const score = calculateLeadScore(lead);
        const priority = getLeadPriority(score);
        if (priority !== filters.priority) return false;
      }

      // Situation filter
      if (filters.situation && lead.situation !== filters.situation) return false;

      // Goal filter
      if (filters.goal && lead.goal !== filters.goal) return false;

      // Obstacle filter
      if (filters.obstacle && lead.obstacle !== filters.obstacle) return false;

      // Source filter
      if (filters.source && lead.source !== filters.source) return false;

      // Tag filter
      if (filters.tag && !(lead.tags || []).includes(filters.tag)) return false;

      // Date range filter
      if (filters.dateFrom) {
        const leadDate = new Date(lead.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (leadDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const leadDate = new Date(lead.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (leadDate > toDate) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Pagination
  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  // Mark as contacted mutation
  const markContacted = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await supabase
        .from('quiz_leads')
        .update({
          contacted_at: new Date().toISOString(),
          contact_notes: notes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Lead marcado como contactado');
    },
    onError: () => {
      toast.error('Error al actualizar el lead');
    },
  });

  // Mark as converted mutation
  const markConverted = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ converted_to_user: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Lead marcado como convertido');
    },
    onError: () => {
      toast.error('Error al actualizar el lead');
    },
  });

  // Stats with priority breakdown
  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l) => l.contacted_at).length;
    const converted = leads.filter((l) => l.converted_to_user).length;
    const synced = leads.filter((l) => l.ghl_synced).length;
    const withComments = leads.filter((l) => l.comments).length;

    // Calculate priority stats
    const priorityStats = { hot: 0, warm: 0, cool: 0, cold: 0 };
    const hotUncontacted: QuizLead[] = [];

    leads.forEach((lead) => {
      const score = calculateLeadScore(lead);
      const priority = getLeadPriority(score);
      priorityStats[priority]++;
      
      if (priority === 'hot' && !lead.contacted_at) {
        hotUncontacted.push(lead);
      }
    });

    const byLevel = leads.reduce(
      (acc, l) => {
        acc[l.quiz_level] = (acc[l.quiz_level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { 
      total, 
      contacted, 
      converted, 
      synced, 
      withComments,
      byLevel, 
      priorityStats,
      hotUncontacted,
    };
  }, [leads]);

  return {
    leads: paginatedLeads,
    allLeads: filteredLeads,
    rawLeads: leads,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters: () => {
      setFilters(defaultFilters);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    pageSize,
    countries,
    levels,
    situations,
    goals,
    obstacles,
    allTags,
    stats,
    markContacted,
    markConverted,
  };
};
