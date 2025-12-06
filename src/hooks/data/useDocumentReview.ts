import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExtractedData, ReceiptDocument } from '@/components/capture/ReceiptReviewCard';

export function useDocumentsForReview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents-review', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(doc => ({
        ...doc,
        extracted_data: (doc.extracted_data || {}) as ExtractedData,
        review_status: doc.review_status || 'pending_review',
      })) as ReceiptDocument[];
    },
    enabled: !!user,
  });
}

export function useDocumentReviewActions() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const approveDocument = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExtractedData }) => {
      // First create the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: user!.id,
          vendor: data.vendor || 'Unknown',
          amount: data.amount || 0,
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'other',
          description: data.description,
          status: 'pending',
          currency: data.currency || 'CAD',
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Then update the document
      const { error } = await supabase
        .from('documents')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          extracted_data: JSON.parse(JSON.stringify(data)),
          expense_id: expense.id,
          status: 'classified',
        } as any)
        .eq('id', id);

      if (error) throw error;
      
      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-review'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(language === 'es' ? '¡Gasto aprobado y guardado!' : 'Expense approved and saved!');
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al aprobar' : 'Error approving');
      console.error(error);
    },
  });

  const rejectDocument = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('documents')
        .update({
          review_status: 'rejected',
          user_corrections: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-review'] });
      toast.success(language === 'es' ? 'Documento rechazado' : 'Document rejected');
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al rechazar' : 'Error rejecting');
      console.error(error);
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      // Get existing corrections
      const { data: doc } = await supabase
        .from('documents')
        .select('user_corrections')
        .eq('id', id)
        .single();

      const existingCorrections = doc?.user_corrections || '';
      const newCorrections = existingCorrections 
        ? `${existingCorrections}\n---\n${new Date().toLocaleString()}: ${comment}`
        : `${new Date().toLocaleString()}: ${comment}`;

      const { error } = await supabase
        .from('documents')
        .update({
          review_status: 'needs_correction',
          user_corrections: newCorrections,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-review'] });
      toast.success(language === 'es' ? 'Comentario guardado' : 'Comment saved');
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al guardar comentario' : 'Error saving comment');
      console.error(error);
    },
  });

  return { approveDocument, rejectDocument, addComment };
}

export function useRealtimeDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('documents-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Document change:', payload);
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}

export function useDocumentImageUrl(filePath: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setUrl(null);
      return;
    }

    const fetchUrl = async () => {
      const { data } = await supabase.storage
        .from('expense-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    };

    fetchUrl();
  }, [filePath]);

  return url;
}
