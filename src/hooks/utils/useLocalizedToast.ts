import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useLocalizedToast() {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return {
    success: (es: string, en: string) => toast.success(isEs ? es : en),
    error: (es: string, en: string) => toast.error(isEs ? es : en),
    info: (es: string, en: string) => toast.info(isEs ? es : en),
    warning: (es: string, en: string) => toast.warning(isEs ? es : en),
  };
}
