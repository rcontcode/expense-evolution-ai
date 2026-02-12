import { useCallback } from 'react';
import { useEntity } from '@/contexts/EntityContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Centralized currency formatting hook.
 * Reads currency from EntityContext (fiscal entity → profile fallback → 'CAD').
 * All components MUST use this instead of hardcoding 'CAD'.
 */
export function useFormatCurrency() {
  const { currentCurrency } = useEntity();
  const { language } = useLanguage();

  const locale = language === 'es'
    ? (currentCurrency === 'CLP' ? 'es-CL' : 'es-CA')
    : (currentCurrency === 'CLP' ? 'en-US' : 'en-CA');

  const formatCurrency = useCallback(
    (amount: number, opts?: { decimals?: number; currency?: string }) => {
      const curr = opts?.currency || currentCurrency;
      const decimals = opts?.decimals ?? (curr === 'CLP' ? 0 : 2);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    },
    [currentCurrency, locale],
  );

  const formatCompact = useCallback(
    (amount: number, opts?: { currency?: string }) => {
      const curr = opts?.currency || currentCurrency;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    },
    [currentCurrency, locale],
  );

  return { formatCurrency, formatCompact, currentCurrency };
}
