import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExtractedData, ReceiptDocument } from '@/components/capture/ReceiptReviewCard';
import { useInvalidateRelated } from './useInvalidateRelated';

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
  const { user } = useAuth();
  const { afterExpense, afterIncome, afterDocument } = useInvalidateRelated();

  const approveDocument = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExtractedData }) => {
      const isIncome = (data as any).invoice_direction === 'income';

      // Get user's primary fiscal entity
      const { data: primaryEntity } = await supabase
        .from('fiscal_entities')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_primary', true)
        .single();

      let linkedId: string;

      if (isIncome) {
        // Determine income_type from AI extraction
        const incomeType = (data as any).income_type || 'client_payment';
        const validIncomeTypes = ['salary','client_payment','bonus','gift','refund','investment_stocks','investment_crypto','investment_funds','passive_rental','passive_royalties','online_business','freelance','other'];
        
        // Create income record with document linkage
        const { data: income, error: incomeError } = await supabase
          .from('income')
          .insert({
            user_id: user!.id,
            amount: data.amount || 0,
            date: data.date || new Date().toISOString().split('T')[0],
            source: data.vendor || (data as any).source || 'Unknown',
            description: data.description || null,
            currency: data.currency || 'CAD',
            income_type: validIncomeTypes.includes(incomeType) ? incomeType : 'client_payment',
            client_id: data.client_id || null,
            project_id: data.project_id || null,
            entity_id: primaryEntity?.id || null,
            document_id: id, // Link back to document for audit trail
            is_taxable: true,
            recurrence: 'one_time' as const,
          })
          .select()
          .single();

        if (incomeError) throw incomeError;
        linkedId = income.id;
      } else {
        // Smart reimbursement_type from AI extraction
        let reimbursementType = 'pending_classification';
        if ((data as any).typically_reimbursable && data.client_id) {
          reimbursementType = 'client_reimbursable';
        } else if ((data as any).cra_deductible) {
          reimbursementType = 'cra_deductible';
        }

        // Create expense record with full data from AI
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
            client_id: data.client_id || null,
            project_id: data.project_id || null,
            entity_id: primaryEntity?.id || null,
            document_id: id, // Bidirectional link: expense ↔ document
            reimbursement_type: reimbursementType,
          })
          .select()
          .single();

        if (expenseError) throw expenseError;
        linkedId = expense.id;
      }

      // Update the document
      const { error } = await supabase
        .from('documents')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          extracted_data: JSON.parse(JSON.stringify(data)),
          expense_id: isIncome ? null : linkedId,
          status: 'classified',
        } as any)
        .eq('id', id);

      if (error) throw error;
      
      return { 
        id: linkedId, 
        isIncome, 
        suggestedRecurring: !!(data as any).suggested_recurring,
        recurringData: (data as any).suggested_recurring ? {
          name: data.vendor || 'Unknown',
          amount: data.amount || 0,
          category: data.category || 'utilities',
          currency: data.currency || 'CAD',
        } : null,
      };
    },
    onSuccess: (result) => {
      if (result.isIncome) {
        afterIncome();
      } else {
        afterExpense();
      }
      afterDocument();
      const msg = (result as any).isIncome
        ? (language === 'es' ? '¡Ingreso aprobado y guardado!' : 'Income approved and saved!')
        : (language === 'es' ? '¡Gasto aprobado y guardado!' : 'Expense approved and saved!');
      toast.success(msg);
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al aprobar' : 'Error approving');
      console.error(error);
    },
  });

  const rejectDocument = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('documents')
        .update({
          review_status: 'rejected',
          user_corrections: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      afterDocument();
      toast.success(language === 'es' ? 'Documento rechazado' : 'Document rejected');
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al rechazar' : 'Error rejecting');
      console.error(error);
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      if (!user) throw new Error('Not authenticated');
      // Get existing corrections
      const { data: doc } = await supabase
        .from('documents')
        .select('user_corrections')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

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
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      afterDocument();
      toast.success(language === 'es' ? 'Comentario guardado' : 'Comment saved');
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al guardar comentario' : 'Error saving comment');
      console.error(error);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      // First get the document to find file path
      const { data: doc } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      // Delete from storage if file exists
      if (doc?.file_path) {
        await supabase.storage
          .from('expense-documents')
          .remove([doc.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      afterDocument();
      toast.success(language === 'es' ? 'Documento eliminado' : 'Document deleted');
    },
    onError: (error) => {
      toast.error(language === 'es' ? 'Error al eliminar' : 'Error deleting');
      console.error(error);
    },
  });

  return { approveDocument, rejectDocument, addComment, deleteDocument };
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
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      } else {
        console.warn('Failed to get signed URL for:', filePath);
        setUrl(null);
      }
    };

    fetchUrl();
  }, [filePath]);

  return url;
}
