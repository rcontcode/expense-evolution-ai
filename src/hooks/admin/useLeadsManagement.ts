import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  created_at: string;
}

export interface LeadFilters {
  search: string;
  level: string;
  country: string;
  converted: string;
  hasComments: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: LeadFilters = {
  search: '',
  level: '',
  country: '',
  converted: '',
  hasComments: '',
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

      // Comments filter
      if (filters.hasComments === 'yes' && !lead.comments) return false;
      if (filters.hasComments === 'no' && lead.comments) return false;

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

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l) => l.contacted_at).length;
    const converted = leads.filter((l) => l.converted_to_user).length;
    const synced = leads.filter((l) => l.ghl_synced).length;

    const byLevel = leads.reduce(
      (acc, l) => {
        acc[l.quiz_level] = (acc[l.quiz_level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { total, contacted, converted, synced, byLevel };
  }, [leads]);

  return {
    leads: paginatedLeads,
    allLeads: filteredLeads,
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
    stats,
    markContacted,
    markConverted,
  };
};
