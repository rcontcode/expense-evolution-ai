import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ExtractedExpenseData {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  currency: string;
}

export function useReceiptProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useLanguage();

  const processReceipt = async (
    imageBase64?: string,
    voiceText?: string
  ): Promise<ExtractedExpenseData | null> => {
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

      return data as ExtractedExpenseData;
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
