import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useEntity } from '@/contexts/EntityContext';

export type DocumentClassificationType = 
  | 'receipt' | 'utility_bill' | 'bank_statement' | 'income_proof'
  | 'contract' | 'tax_document' | 'invoice'
  | 'tax_slip' | 'medical_receipt' | 'donation_receipt' | 'insurance_policy'
  | 'rental_receipt' | 'investment_statement' | 'government_form'
  | 'unknown';

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
    extracted_preview: Record<string, any>;
  };
  status: 'uploading' | 'classifying' | 'classified' | 'pending_direction' | 'processing' | 'processed' | 'error';
  error?: string;
  processedResult?: any;
  invoiceDirection?: 'income' | 'expense';
  invoiceDirectionSuggestion?: {
    direction: 'income' | 'expense' | 'unknown';
    confidence: number;
    reason: string;
    matchedClient?: string;
  };
}

export interface HistoryEntry {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentClassificationType;
  confidence: number;
  summary: string;
  processedResult: any;
  processedAt: string;
  extractedPreview?: Record<string, any>;
}

const TYPE_LABELS: Record<DocumentClassificationType, { es: string; en: string; icon: string }> = {
  receipt: { es: 'Recibo/Compra', en: 'Receipt', icon: '🧾' },
  utility_bill: { es: 'Boleta de Servicio', en: 'Utility Bill', icon: '💡' },
  bank_statement: { es: 'Extracto Bancario', en: 'Bank Statement', icon: '🏦' },
  income_proof: { es: 'Comprobante de Ingreso', en: 'Income Proof', icon: '💰' },
  contract: { es: 'Contrato', en: 'Contract', icon: '📄' },
  tax_document: { es: 'Documento Fiscal', en: 'Tax Document', icon: '📋' },
  invoice: { es: 'Factura', en: 'Invoice', icon: '🧾' },
  tax_slip: { es: 'Formulario Fiscal (T4/T5/AFP)', en: 'Tax Slip (T4/T5/AFP)', icon: '📑' },
  medical_receipt: { es: 'Recibo Médico', en: 'Medical Receipt', icon: '🏥' },
  donation_receipt: { es: 'Recibo de Donación', en: 'Donation Receipt', icon: '💝' },
  insurance_policy: { es: 'Póliza de Seguro', en: 'Insurance Policy', icon: '🛡️' },
  rental_receipt: { es: 'Recibo de Arriendo', en: 'Rental Receipt', icon: '🏢' },
  investment_statement: { es: 'Estado de Inversiones', en: 'Investment Statement', icon: '📈' },
  government_form: { es: 'Formulario Gubernamental', en: 'Government Form', icon: '🏛️' },
  unknown: { es: 'Sin clasificar', en: 'Unclassified', icon: '❓' },
};

export { TYPE_LABELS };

export function useUnifiedChaosInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { currentEntity } = useEntity();
  const userCountry = (currentEntity?.country as string) || 'CA';
  const userCurrency = userCountry === 'CL' ? 'CLP' : 'CAD';
  const [documents, setDocuments] = useState<ClassifiedDocument[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

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
            country: userCountry,
          },
        });

        if (classifyError) throw classifyError;

        // For invoices, detect direction before marking as classified
        if (classification.document_type === 'invoice') {
          const ep = classification.extracted_preview || {};
          
          // Fetch user's clients for matching
          let matchedClient: string | undefined;
          let directionFromClients: 'income' | 'expense' | 'unknown' = 'unknown';
          
          try {
            const { data: clients } = await supabase
              .from('clients')
              .select('name')
              .eq('user_id', user.id);
            
            if (clients && clients.length > 0) {
              const toEntity = (ep.to_entity || ep.bill_to || '').toLowerCase();
              const fromEntity = (ep.from_entity || ep.remit_to?.name || ep.vendor || '').toLowerCase();
              
              for (const client of clients) {
                const clientName = client.name.toLowerCase();
                // If "to" matches a client → we invoiced them → income
                if (toEntity.includes(clientName) || clientName.includes(toEntity.slice(0, 5))) {
                  directionFromClients = 'income';
                  matchedClient = client.name;
                  break;
                }
                // If "from" matches a client → they invoiced us → expense
                if (fromEntity.includes(clientName) || clientName.includes(fromEntity.slice(0, 5))) {
                  directionFromClients = 'expense';
                  matchedClient = client.name;
                  break;
                }
              }
            }
          } catch (e) {
            console.warn('Could not fetch clients for matching:', e);
          }

          // Combine AI suggestion + client matching
          const aiDirection = ep.invoice_direction || 'unknown';
          const aiConfidence = ep.invoice_direction_confidence || 0;
          
          let finalDirection: 'income' | 'expense' | 'unknown' = 'unknown';
          let finalConfidence = 0;
          let reason = '';
          
          if (directionFromClients !== 'unknown') {
            finalDirection = directionFromClients;
            finalConfidence = 0.9;
            reason = `Cliente "${matchedClient}" detectado`;
          } else if (aiDirection !== 'unknown' && aiConfidence >= 0.7) {
            finalDirection = aiDirection;
            finalConfidence = aiConfidence;
            reason = 'Detección automática por IA';
          } else {
            reason = 'No se pudo determinar automáticamente';
          }
          
          updateDoc(doc.id, {
            classification,
            status: 'pending_direction',
            invoiceDirectionSuggestion: {
              direction: finalDirection,
              confidence: finalConfidence,
              reason,
              matchedClient,
            },
          });
        } else {
          updateDoc(doc.id, {
            classification,
            status: 'classified',
          });
        }

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
      let processedResult: any = {};

      switch (type) {
        case 'receipt': {
          const { data: result, error } = await supabase.functions.invoke('process-receipt', {
            body: {
              imageBase64: doc.base64,
              detectMultipleReceipts: true,
              country: userCountry,
            },
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
                receipts_detected: result.receipts_detected || 1,
              })) : {},
            })
            .select()
            .single();

          processedResult = { type: 'receipt', data: result, docId: dbDoc?.id };
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }

        case 'invoice': {
          const classData = doc.classification!;
          const ep = classData.extracted_preview || {};
          const direction = doc.invoiceDirection;
          
          if (!direction) {
            updateDoc(docId, { status: 'pending_direction' });
            return;
          }

          const lineItems = (ep.line_items || []).map((item: any) => ({
            name: item.description || item.name || 'Item',
            quantity: parseFloat(String(item.quantity || '1').replace(/,/g, '')) || 1,
            unit_price: parseFloat(String(item.unit_price || '0').replace(/,/g, '')) || 0,
            total: parseFloat(String(item.total || item.amount || '0').replace(/,/g, '')) || 0,
          }));

          const totalAmount = parseFloat(String(ep.total || ep.amount || '0').replace(/,/g, '')) || 0;
          const subtotal = parseFloat(String(ep.subtotal || '0').replace(/,/g, '')) || totalAmount;
          const taxAmount = parseFloat(String(ep.tax || '0').replace(/,/g, '')) || 0;

          if (direction === 'income') {
            // Save as document for review - do NOT insert directly into income
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
                extracted_data: {
                  invoice_direction: 'income',
                  vendor: ep.to_entity || ep.bill_to || '',
                  source: ep.to_entity || ep.bill_to || ep.vendor || doc.fileName,
                  amount: totalAmount,
                  date: ep.date || new Date().toISOString().split('T')[0],
                  currency: ep.currency || userCurrency,
                  description: `Factura ${ep.invoice_number || ''}: ${lineItems.map((i: any) => i.name).join('; ') || ep.description || ''}`.trim(),
                  income_type: 'freelance',
                  line_items: lineItems,
                  subtotal,
                  taxes: taxAmount > 0 ? [{ name: 'Tax', amount: taxAmount }] : [],
                  invoice_number: ep.invoice_number,
                },
              })
              .select()
              .single();

            processedResult = { type: 'invoice_income', amount: totalAmount, currency: ep.currency || userCurrency, docId: dbDoc?.id };
            queryClient.invalidateQueries({ queryKey: ['documents-review'] });
            toast.success(`📋 Ingreso de $${totalAmount.toLocaleString()} enviado al Centro de Revisión`);

          } else {
            const extractedData = {
              vendor: ep.remit_to?.name || ep.vendor || ep.from_entity || classData.document_type,
              amount: totalAmount,
              date: ep.date || new Date().toISOString().split('T')[0],
              category: 'professional_services',
              description: lineItems.map((i: any) => i.name).join('; ') || ep.description || '',
              currency: ep.currency || userCurrency,
              confidence: classData.confidence > 0.8 ? 'high' : classData.confidence > 0.5 ? 'medium' : 'low',
              cra_deductible: true,
              cra_deduction_rate: 100,
              typically_reimbursable: true,
              invoice_direction: 'expense',
              line_items: lineItems,
              subtotal,
              taxes: taxAmount > 0 ? [{ name: 'Tax', amount: taxAmount }] : [],
            };

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
                extracted_data: extractedData,
              })
              .select()
              .single();

            processedResult = { type: 'invoice_expense', data: { expenses: [extractedData] }, docId: dbDoc?.id };
            queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          }
          break;
        }

        case 'utility_bill': {
          const { data: result, error } = await supabase.functions.invoke('process-receipt', {
            body: { imageBase64: doc.base64, country: userCountry },
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

          processedResult = { type: 'utility_bill', data: result, docId: dbDoc?.id, suggestRecurring: true };
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }

        case 'bank_statement': {
          const { data: result, error } = await supabase.functions.invoke('process-bank-statement', {
            body: { image: doc.base64 },
          });

          if (error) throw error;

          // Persist bank statement document to DB for audit trail
          await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_path: doc.storagePath,
              file_name: doc.fileName,
              file_type: doc.fileType,
              file_size: doc.fileSize,
              status: 'classified',
              review_status: 'approved',
              reviewed_at: new Date().toISOString(),
              extracted_data: {
                document_classification: 'bank_statement',
                transactions_count: result?.transactions?.length || 0,
                ...preview,
              },
            });

          processedResult = { type: 'bank_statement', transactions: result?.transactions || [] };
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }

        case 'income_proof': {
          const { data: result, error } = await supabase.functions.invoke('process-receipt', {
            body: { imageBase64: doc.base64, country: userCountry },
          });

          if (error) throw error;

          const suggestedAmount = preview.amount || result?.expenses?.[0]?.amount;
          const suggestedDate = preview.date || result?.expenses?.[0]?.date;
          const suggestedSource = preview.vendor || result?.expenses?.[0]?.vendor;

          // Persist income proof as document for Review Center
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
              extracted_data: {
                invoice_direction: 'income',
                amount: suggestedAmount,
                date: suggestedDate,
                source: suggestedSource,
                vendor: suggestedSource,
                currency: preview.currency || userCurrency,
                income_type: 'freelance',
                document_classification: 'income_proof',
              },
            })
            .select()
            .single();

          processedResult = {
            type: 'income_proof',
            data: result,
            docId: dbDoc?.id,
            suggestedIncome: {
              amount: suggestedAmount,
              date: suggestedDate,
              source: suggestedSource,
              currency: preview.currency || userCurrency,
            },
          };
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }

        case 'contract': {
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

            processedResult = { type: 'contract', contractId: contract?.id, analysis };
          } catch {
            processedResult = { type: 'contract', contractId: contract?.id, analysisError: true };
          }

          queryClient.invalidateQueries({ queryKey: ['contracts'] });
          break;
        }

        case 'tax_document':
        case 'tax_slip':
        case 'medical_receipt':
        case 'donation_receipt':
        case 'insurance_policy':
        case 'rental_receipt':
        case 'investment_statement':
        case 'government_form':
        default: {
          const extractedMetadata: Record<string, any> = {
            document_classification: type,
            ...preview,
          };

          // For rental receipts, mark as recurring
          if (type === 'rental_receipt') {
            extractedMetadata.is_recurring = true;
            extractedMetadata.suggested_recurring = true;
          }

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
              extracted_data: extractedMetadata,
            });

          processedResult = { type: type === 'tax_document' || type === 'unknown' ? 'manual_review' : type };
          queryClient.invalidateQueries({ queryKey: ['documents-review'] });
          break;
        }
      }

      // Update doc with the ACTUAL processedResult
      updateDoc(docId, { status: 'processed', processedResult });
      toast.success(`✅ ${doc.fileName} procesado`);

      // Add to history using the ACTUAL processedResult (not stale closure)
      if (doc.classification) {
        setHistory(prev => [{
          id: doc.id + '-' + Date.now(),
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          documentType: doc.classification!.document_type,
          confidence: doc.classification!.confidence,
          summary: doc.classification!.summary,
          processedResult: processedResult,
          processedAt: new Date().toISOString(),
          extractedPreview: doc.classification!.extracted_preview,
        }, ...prev]);
      }
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

  const retryDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !user) return;

    updateDoc(docId, { status: 'classifying', error: undefined });

    try {
      const { data: classification, error: classifyError } = await supabase.functions.invoke('classify-document', {
        body: {
          imageBase64: doc.base64,
          fileName: doc.fileName,
          fileType: doc.fileType,
          country: userCountry,
        },
      });

      if (classifyError) throw classifyError;

      updateDoc(docId, {
        classification,
        status: 'classified',
      });
    } catch (error: any) {
      console.error('Retry failed:', doc.fileName, error);
      updateDoc(docId, {
        status: 'error',
        error: error.message || 'Error al reintentar',
      });
    }
  }, [documents, user, updateDoc]);

  const clearProcessed = useCallback(() => {
    const processed = documents.filter(d => d.status === 'processed' && d.classification);
    const newHistoryEntries: HistoryEntry[] = processed.map(d => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      documentType: d.classification!.document_type,
      confidence: d.classification!.confidence,
      summary: d.classification!.summary,
      processedResult: d.processedResult,
      processedAt: new Date().toISOString(),
      extractedPreview: d.classification!.extracted_preview,
    }));
    setHistory(prev => [...newHistoryEntries, ...prev]);
    setDocuments(prev => prev.filter(d => d.status !== 'processed'));
  }, [documents]);

  const setInvoiceDirection = useCallback((docId: string, direction: 'income' | 'expense') => {
    updateDoc(docId, { invoiceDirection: direction, status: 'classified' });
  }, [updateDoc]);

  const stats = {
    total: documents.length,
    uploading: documents.filter(d => d.status === 'uploading').length,
    classifying: documents.filter(d => d.status === 'classifying').length,
    classified: documents.filter(d => d.status === 'classified').length,
    pendingDirection: documents.filter(d => d.status === 'pending_direction').length,
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

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    documents,
    history,
    stats,
    isProcessingBatch,
    uploadAndClassify,
    processDocument,
    processAllClassified,
    reclassify,
    setInvoiceDirection,
    retryDocument,
    removeDoc,
    clearProcessed,
    clearHistory,
  };
}
