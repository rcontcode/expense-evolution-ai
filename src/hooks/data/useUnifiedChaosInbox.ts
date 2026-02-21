import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export type DocumentClassificationType = 
  | 'receipt' | 'utility_bill' | 'bank_statement' | 'income_proof'
  | 'contract' | 'tax_document' | 'invoice' | 'unknown';

export interface ClassifiedDocument {
  id: string;
  file: File;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64: string;
  storagePath?: string;
  classification?: {
    document_type: DocumentClassificationType;
    confidence: number;
    summary: string;
    suggested_actions: string[];
    extracted_preview: {
      vendor?: string;
      amount?: number;
      date?: string;
      description?: string;
      currency?: string;
      is_recurring?: boolean;
      recurrence_frequency?: string;
      parties?: string[];
    };
  };
  status: 'uploading' | 'classifying' | 'classified' | 'processing' | 'processed' | 'error';
  error?: string;
  processedResult?: any;
}

const TYPE_LABELS: Record<DocumentClassificationType, { es: string; en: string; icon: string }> = {
  receipt: { es: 'Recibo/Compra', en: 'Receipt', icon: '🧾' },
  utility_bill: { es: 'Boleta de Servicio', en: 'Utility Bill', icon: '💡' },
  bank_statement: { es: 'Extracto Bancario', en: 'Bank Statement', icon: '🏦' },
  income_proof: { es: 'Comprobante de Ingreso', en: 'Income Proof', icon: '💰' },
  contract: { es: 'Contrato', en: 'Contract', icon: '📄' },
  tax_document: { es: 'Documento Fiscal', en: 'Tax Document', icon: '📋' },
  invoice: { es: 'Factura', en: 'Invoice', icon: '🧾' },
  unknown: { es: 'Sin clasificar', en: 'Unclassified', icon: '❓' },
};

export { TYPE_LABELS };

export function useUnifiedChaosInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState<ClassifiedDocument[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const updateDoc = useCallback((id: string, updates: Partial<ClassifiedDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const uploadAndClassify = useCallback(async (files: File[]) => {
    if (!user) return;

    const newDocs: ClassifiedDocument[] = files.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      base64: '',
      status: 'uploading' as const,
    }));

    setDocuments(prev => [...newDocs, ...prev]);

    // Process each file: upload → classify
    for (const doc of newDocs) {
      try {
        // Read as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(doc.file);
        });

        updateDoc(doc.id, { base64, status: 'uploading' });

        // Upload to storage
        const fileExt = doc.fileName.split('.').pop();
        const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('expense-documents')
          .upload(storagePath, doc.file);

        if (uploadError) throw uploadError;

        updateDoc(doc.id, { storagePath, status: 'classifying' });

        // Classify with AI
        const { data: classification, error: classifyError } = await supabase.functions.invoke('classify-document', {
          body: {
            imageBase64: base64,
            fileName: doc.fileName,
            fileType: doc.fileType,
          },
        });

        if (classifyError) throw classifyError;

        updateDoc(doc.id, {
          classification: classification,
          status: 'classified',
        });

      } catch (error: any) {
        console.error('Error processing document:', doc.fileName, error);
        updateDoc(doc.id, {
          status: 'error',
          error: error.message || 'Error al procesar',
        });
      }
    }
  }, [user, updateDoc]);

  const processDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc?.classification || !user || !doc.storagePath) return;

    updateDoc(docId, { status: 'processing' });

    try {
      const type = doc.classification.document_type;
      const preview = doc.classification.extracted_preview;

      switch (type) {
        case 'receipt':
        case 'invoice': {
          // Process through receipt pipeline
          const { data: result, error } = await supabase.functions.invoke('process-receipt', {
            body: {
              imageBase64: doc.base64,
              detectMultipleReceipts: true,
            },
          });

          if (error) throw error;

          // Save document record
          const { data: dbDoc } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_path: doc.storagePath,
              file_name: doc.fileName,
              file_type: doc.fileType,
              file_size: doc.fileSize,
              status: 'classified',
              review_status: 'pending_review',
              extracted_data: result?.expenses?.[0] ? JSON.parse(JSON.stringify({
                ...result.expenses[0],
                all_expenses: result.expenses,
                receipts_detected: result.receipts_detected || 1,
              })) : {},
            })
            .select()
            .single();

          updateDoc(docId, { status: 'processed', processedResult: { type: 'receipt', data: result, docId: dbDoc?.id } });
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }

        case 'utility_bill': {
          // Process as receipt + suggest recurring bill
          const { data: result, error } = await supabase.functions.invoke('process-receipt', {
            body: { imageBase64: doc.base64 },
          });

          if (error) throw error;

          const { data: dbDoc } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_path: doc.storagePath,
              file_name: doc.fileName,
              file_type: doc.fileType,
              file_size: doc.fileSize,
              status: 'classified',
              review_status: 'pending_review',
              extracted_data: result?.expenses?.[0] ? JSON.parse(JSON.stringify({
                ...result.expenses[0],
                all_expenses: result.expenses,
                is_utility: true,
                suggested_recurring: true,
              })) : {},
            })
            .select()
            .single();

          updateDoc(docId, {
            status: 'processed',
            processedResult: { type: 'utility_bill', data: result, docId: dbDoc?.id, suggestRecurring: true },
          });
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }

        case 'bank_statement': {
          // Process through bank statement pipeline
          const { data: result, error } = await supabase.functions.invoke('process-bank-statement', {
            body: { image: doc.base64 },
          });

          if (error) throw error;

          updateDoc(docId, {
            status: 'processed',
            processedResult: { type: 'bank_statement', transactions: result?.transactions || [] },
          });
          break;
        }

        case 'income_proof': {
          // Process as receipt to extract amount/date, then flag as income
          const { data: result, error } = await supabase.functions.invoke('process-receipt', {
            body: { imageBase64: doc.base64 },
          });

          if (error) throw error;

          updateDoc(docId, {
            status: 'processed',
            processedResult: {
              type: 'income_proof',
              data: result,
              suggestedIncome: {
                amount: preview.amount || result?.expenses?.[0]?.amount,
                date: preview.date || result?.expenses?.[0]?.date,
                source: preview.vendor || result?.expenses?.[0]?.vendor,
                currency: preview.currency || 'CAD',
              },
            },
          });
          break;
        }

        case 'contract': {
          // Upload contract to contracts table
          const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .insert({
              user_id: user.id,
              file_path: doc.storagePath,
              file_name: doc.fileName,
              file_type: doc.fileType,
              title: preview.description || doc.fileName.replace(/\.[^.]+$/, ''),
              status: 'uploaded',
            })
            .select()
            .single();

          if (contractError) throw contractError;

          // Trigger AI analysis
          try {
            const { data: analysis } = await supabase.functions.invoke('analyze-contract', {
              body: {
                documentBase64: doc.base64,
                documentType: doc.fileType,
                contractTitle: preview.description || doc.fileName,
                targetLanguage: 'es',
              },
            });

            if (analysis && contract) {
              await supabase
                .from('contracts')
                .update({
                  extracted_terms: analysis,
                  reimbursement_terms: analysis.reimbursement_policy || {},
                  ai_processed_at: new Date().toISOString(),
                  status: 'ready',
                })
                .eq('id', contract.id);
            }

            updateDoc(docId, {
              status: 'processed',
              processedResult: { type: 'contract', contractId: contract?.id, analysis },
            });
          } catch {
            // Contract saved even if analysis fails
            updateDoc(docId, {
              status: 'processed',
              processedResult: { type: 'contract', contractId: contract?.id, analysisError: true },
            });
          }

          queryClient.invalidateQueries({ queryKey: ['contracts'] });
          break;
        }

        case 'tax_document':
        default: {
          // Save as document for manual review
          await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_path: doc.storagePath,
              file_name: doc.fileName,
              file_type: doc.fileType,
              file_size: doc.fileSize,
              status: 'pending',
              review_status: 'pending_review',
            });

          updateDoc(docId, {
            status: 'processed',
            processedResult: { type: 'manual_review' },
          });
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }
      }

      toast.success(`✅ ${doc.fileName} procesado`);
    } catch (error: any) {
      console.error('Error processing:', error);
      updateDoc(docId, { status: 'error', error: error.message });
      toast.error(`Error: ${doc.fileName}`);
    }
  }, [documents, user, updateDoc, queryClient]);

  const processAllClassified = useCallback(async () => {
    const classified = documents.filter(d => d.status === 'classified');
    if (classified.length === 0) return;

    setIsProcessingBatch(true);
    for (const doc of classified) {
      await processDocument(doc.id);
    }
    setIsProcessingBatch(false);
    toast.success(`🎉 ${classified.length} documentos procesados`);
  }, [documents, processDocument]);

  const reclassify = useCallback((docId: string, newType: DocumentClassificationType) => {
    updateDoc(docId, {
      classification: {
        ...documents.find(d => d.id === docId)?.classification!,
        document_type: newType,
      },
    });
  }, [documents, updateDoc]);

  const stats = {
    total: documents.length,
    uploading: documents.filter(d => d.status === 'uploading').length,
    classifying: documents.filter(d => d.status === 'classifying').length,
    classified: documents.filter(d => d.status === 'classified').length,
    processing: documents.filter(d => d.status === 'processing').length,
    processed: documents.filter(d => d.status === 'processed').length,
    errors: documents.filter(d => d.status === 'error').length,
    byType: Object.entries(
      documents
        .filter(d => d.classification)
        .reduce((acc, d) => {
          const type = d.classification!.document_type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    ),
  };

  return {
    documents,
    stats,
    isProcessingBatch,
    uploadAndClassify,
    processDocument,
    processAllClassified,
    reclassify,
    removeDoc,
  };
}
