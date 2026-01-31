import { useMemo } from 'react';
import { useEntity } from '@/contexts/EntityContext';
import { useFiscalEntities } from '@/hooks/data/useFiscalEntities';
import { 
  getCountryConfig, 
  type CountryCode, 
  type CountryConfig 
} from '@/lib/constants/country-tax-config';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CountryContextValue {
  // Current active country (from selected entity)
  currentCountry: CountryCode;
  
  // All countries the user has entities for
  activeCountries: CountryCode[];
  
  // Whether user operates in multiple countries
  isMultiCountry: boolean;
  
  // Country-specific configuration
  countryConfig: CountryConfig;
  
  // Get config for any country
  getConfigFor: (country: CountryCode) => CountryConfig;
  
  // Helper to get localized text based on current country context
  getCountryText: <T extends { es: string; en: string }>(text: T) => string;
  
  // Helper to check if a specific country is active
  hasCountry: (country: CountryCode) => boolean;
  
  // Get tax authority name (CRA, SII, etc.)
  taxAuthority: string;
  
  // Get primary currency for display
  primaryCurrency: string;
}

/**
 * Hook that provides country-specific context based on user's fiscal entities.
 * 
 * This is the SINGLE SOURCE OF TRUTH for country localization:
 * - If user has only Chile entities → everything is Chile-focused
 * - If user has only Canada entities → everything is Canada-focused
 * - If user has both → context comes from currently selected entity
 * 
 * Use this hook in components that need to adapt content based on user's jurisdiction.
 */
export function useCountryContext(): CountryContextValue {
  const { currentEntity, activeEntities } = useEntity();
  const { language } = useLanguage();
  
  return useMemo(() => {
    // Extract unique countries from user's active entities
    const activeCountries = [...new Set(
      activeEntities.map(e => e.country as CountryCode)
    )].filter(Boolean);
    
    // Default to CA if no entities
    const currentCountry = (currentEntity?.country as CountryCode) || 'CA';
    const countryConfig = getCountryConfig(currentCountry);
    
    return {
      currentCountry,
      activeCountries: activeCountries.length > 0 ? activeCountries : ['CA'],
      isMultiCountry: activeCountries.length > 1,
      countryConfig,
      
      getConfigFor: (country: CountryCode) => getCountryConfig(country),
      
      getCountryText: <T extends { es: string; en: string }>(text: T) => 
        language === 'es' ? text.es : text.en,
      
      hasCountry: (country: CountryCode) => activeCountries.includes(country),
      
      taxAuthority: countryConfig.taxAuthority.name,
      primaryCurrency: countryConfig.currency,
    };
  }, [currentEntity, activeEntities, language]);
}

/**
 * Types for country-specific content
 */
export interface CountrySpecificContent<T> {
  CA?: T;
  CL?: T;
  default?: T;
}

/**
 * Get content specific to a country, with fallback to default
 */
export function getCountryContent<T>(
  content: CountrySpecificContent<T>,
  country: CountryCode
): T | undefined {
  return content[country] ?? content.default;
}

/**
 * Type for bilingual + country-specific text
 */
export interface LocalizedCountryText {
  CA: { es: string; en: string };
  CL: { es: string; en: string };
}

/**
 * Get text for current country and language
 */
export function getLocalizedCountryText(
  text: LocalizedCountryText,
  country: CountryCode,
  language: 'es' | 'en'
): string {
  const countryText = text[country] || text.CA;
  return countryText[language];
}
