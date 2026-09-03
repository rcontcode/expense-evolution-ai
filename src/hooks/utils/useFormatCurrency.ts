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

  /**
   * Para ejes de graficos: abreviado de verdad ("$1,5 M"), con el simbolo y los separadores
   * del pais. Antes cada grafico armaba su propia etiqueta dividiendo por mil y pegando una "k"
   * a mano, con un signo de dolar fijo: en pesos chilenos eso salia mal en todos.
   */
  const formatAxis = useCallback(
    (amount: number, opts?: { currency?: string }) => {
      const curr = opts?.currency || currentCurrency;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    },
    [currentCurrency, locale],
  );

  return { formatCurrency, formatCompact, formatAxis, currentCurrency };
}
