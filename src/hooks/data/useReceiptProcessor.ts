import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface LineItem {
  name: string;
  quantity?: number;
  unit_price?: number;
  total: number;
  original_code?: string | null;
  sku?: string | null;
  product_search_url?: string | null;
}

export interface TaxItem {
  name: string;
  rate?: number;
  amount: number;
}

export interface ExtractedExpenseData {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  currency: string;
  cra_deductible: boolean;
  cra_deduction_rate: number;
  typically_reimbursable: boolean;
  client_id?: string | null;
  line_items?: LineItem[];
  subtotal?: number;
  taxes?: TaxItem[];
  payment_method?: string;
  is_recurring_candidate?: boolean;
  recurring_bill_data?: {
    name: string;
    frequency: string;
    category: string;
    auto_pay: boolean;
    next_due_date: string | null;
  } | null;
}

export interface ProcessReceiptResult {
  expenses: ExtractedExpenseData[];
}

export function useReceiptProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useLanguage();

  const processReceipt = async (
    imageBase64?: string,
    voiceText?: string
  ): Promise<ProcessReceiptResult | null> => {
    if (!imageBase64 && !voiceText) {
      toast.error(t('quickCapture.noInput'));
      return null;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { imageBase64, voiceText },
      });

      if (error) {
        console.error('Receipt processing error:', error);
        if (error.message?.includes('429')) {
          toast.error(t('quickCapture.rateLimitError'));
        } else if (error.message?.includes('402')) {
          toast.error(t('quickCapture.creditsError'));
        } else {
          toast.error(t('quickCapture.processingError'));
        }
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      return data as ProcessReceiptResult;
    } catch (err) {
      console.error('Receipt processing failed:', err);
      toast.error(t('quickCapture.processingError'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processReceipt, isProcessing };
}
