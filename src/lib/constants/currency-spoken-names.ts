/**
 * Currency spoken names for TTS and assistant responses.
 * Maps ISO currency codes to their spoken equivalents in each language.
 */
export const CURRENCY_SPOKEN_NAMES: Record<string, { es: string; en: string }> = {
  CAD: { es: 'dólares canadienses', en: 'Canadian dollars' },
  CLP: { es: 'pesos chilenos', en: 'Chilean pesos' },
  USD: { es: 'dólares', en: 'dollars' },
  EUR: { es: 'euros', en: 'euros' },
  MXN: { es: 'pesos mexicanos', en: 'Mexican pesos' },
};

/**
 * Get the spoken name of a currency symbol ($, €) based on the active currency code.
 */
export function getSpokenCurrencyForSymbol(
  symbol: string,
  currency: string,
  lang: 'es' | 'en'
): string {
  if (symbol === '$') {
    const entry = CURRENCY_SPOKEN_NAMES[currency];
    if (entry) return entry[lang];
    // Default for unknown $ currencies
    return lang === 'es' ? 'dólares' : 'dollars';
  }
  if (symbol === '€') {
    return 'euros';
  }
  return symbol;
}
