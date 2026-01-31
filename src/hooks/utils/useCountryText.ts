import { useCountryContext } from '@/hooks/utils/useCountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getCountryLocalizedText, 
  type CountryLocalizedText 
} from '@/lib/country-content';

/**
 * Hook to get country-localized text based on current context.
 * 
 * This is the main way to get text that varies by country.
 * 
 * Usage:
 * ```tsx
 * const { getText, getTooltip } = useCountryText();
 * 
 * // In component:
 * <p>{getText(TAX_AUTHORITY_LABELS)}</p>
 * <Tooltip content={getTooltip(TAX_DEDUCTION_TOOLTIPS)} />
 * ```
 */
export function useCountryText() {
  const { currentCountry, activeCountries, isMultiCountry } = useCountryContext();
  const { language } = useLanguage();

  /**
   * Get text for current country and language
   */
  const getText = (text: CountryLocalizedText): string => {
    return getCountryLocalizedText(text, currentCountry, language);
  };

  /**
   * Get text for a specific country (useful when iterating)
   */
  const getTextFor = (text: CountryLocalizedText, country: typeof currentCountry): string => {
    return getCountryLocalizedText(text, country, language);
  };

  /**
   * Get combined text for all active countries
   * e.g., "CRA (Canada) / SII (Chile)"
   */
  const getCombinedText = (
    text: CountryLocalizedText, 
    separator: string = ' / '
  ): string => {
    return activeCountries
      .map(country => getCountryLocalizedText(text, country, language))
      .join(separator);
  };

  /**
   * Get text with country prefix when in multi-country mode
   * e.g., "🇨🇦 CRA rules apply" vs just "CRA rules apply"
   */
  const getTextWithContext = (text: CountryLocalizedText): string => {
    const baseText = getText(text);
    if (!isMultiCountry) return baseText;
    
    const flag = currentCountry === 'CA' ? '🇨🇦' : '🇨🇱';
    return `${flag} ${baseText}`;
  };

  /**
   * Alias for getText - commonly used for tooltips
   */
  const getTooltip = getText;

  return {
    getText,
    getTextFor,
    getCombinedText,
    getTextWithContext,
    getTooltip,
    currentCountry,
    language,
    isMultiCountry,
  };
}

/**
 * Hook for country-specific placeholders and examples
 */
export function useCountryPlaceholders() {
  const { currentCountry, countryConfig } = useCountryContext();
  const { language } = useLanguage();

  return {
    /** Tax ID placeholder (e.g., "123456789" for CA, "12.345.678-9" for CL) */
    taxIdPlaceholder: countryConfig.businessIdConfig.placeholder,
    
    /** Tax ID label */
    taxIdLabel: language === 'es' 
      ? countryConfig.businessIdConfig.name.es 
      : countryConfig.businessIdConfig.name.en,
    
    /** Currency symbol */
    currencySymbol: countryConfig.currencySymbol,
    
    /** Currency code */
    currencyCode: countryConfig.currency,
    
    /** Tax authority name */
    taxAuthority: countryConfig.taxAuthority.name,
    
    /** Format function for tax ID */
    formatTaxId: countryConfig.businessIdConfig.formatFunction,
    
    /** Region label (Province vs Región) */
    regionLabel: currentCountry === 'CA' 
      ? (language === 'es' ? 'Provincia' : 'Province')
      : (language === 'es' ? 'Región' : 'Region'),
  };
}
