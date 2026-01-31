/**
 * Country-Specific Content System
 * ================================
 * 
 * This module provides a scalable way to manage content that varies by country.
 * When adding new countries, simply add their entries to the content objects.
 * 
 * USAGE:
 * 1. Define country-specific text using CountryLocalizedText type
 * 2. Use getCountryLocalizedText() to retrieve based on current context
 * 
 * FUTURE EXPANSION:
 * To add Mexico (MX), simply add MX entries to each content object.
 * No structural changes needed.
 */

import type { CountryCode } from './constants/country-tax-config';

// ========================================
// TYPES
// ========================================

/**
 * Text that varies by country AND language
 */
export interface CountryLocalizedText {
  CA: { es: string; en: string };
  CL: { es: string; en: string };
  // Future countries:
  // MX: { es: string; en: string };
}

/**
 * Content that varies by country only (not language)
 */
export interface CountryContent<T> {
  CA: T;
  CL: T;
  // Future: MX: T;
}

/**
 * Optional country content with fallback
 */
export interface OptionalCountryContent<T> {
  CA?: T;
  CL?: T;
  default: T;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get localized text for a specific country and language
 */
export function getCountryLocalizedText(
  text: CountryLocalizedText,
  country: CountryCode,
  language: 'es' | 'en'
): string {
  const countryText = text[country];
  if (!countryText) {
    // Fallback to Canada if country not defined
    return text.CA[language];
  }
  return countryText[language];
}

/**
 * Get country-specific content with fallback
 */
export function getCountryContentWithFallback<T>(
  content: OptionalCountryContent<T>,
  country: CountryCode
): T {
  return content[country] ?? content.default;
}

/**
 * Create a function that resolves country content given a country
 */
export function createCountryResolver<T>(
  content: CountryContent<T>
): (country: CountryCode) => T {
  return (country) => content[country];
}

// ========================================
// COMMON LABELS & TERMS
// ========================================

/**
 * Tax authority labels by country
 */
export const TAX_AUTHORITY_LABELS: CountryLocalizedText = {
  CA: { 
    es: 'Agencia de Ingresos de Canadá (CRA)', 
    en: 'Canada Revenue Agency (CRA)' 
  },
  CL: { 
    es: 'Servicio de Impuestos Internos (SII)', 
    en: 'Internal Revenue Service (SII)' 
  },
};

/**
 * Tax ID field labels
 */
export const TAX_ID_LABELS: CountryLocalizedText = {
  CA: { 
    es: 'Número de Negocio', 
    en: 'Business Number' 
  },
  CL: { 
    es: 'RUT', 
    en: 'Tax ID (RUT)' 
  },
};

/**
 * Region/Province labels
 */
export const REGION_LABELS: CountryLocalizedText = {
  CA: { 
    es: 'Provincia', 
    en: 'Province' 
  },
  CL: { 
    es: 'Región', 
    en: 'Region' 
  },
};

/**
 * Sales tax labels
 */
export const SALES_TAX_LABELS: CountryLocalizedText = {
  CA: { 
    es: 'GST/HST', 
    en: 'GST/HST' 
  },
  CL: { 
    es: 'IVA', 
    en: 'VAT' 
  },
};

/**
 * Income tax form labels
 */
export const TAX_FORM_LABELS: CountryLocalizedText = {
  CA: { 
    es: 'Declaración T1/T2125', 
    en: 'T1/T2125 Return' 
  },
  CL: { 
    es: 'Formulario 22', 
    en: 'Form 22' 
  },
};

/**
 * Monthly tax declaration labels
 */
export const MONTHLY_TAX_LABELS: CountryLocalizedText = {
  CA: { 
    es: 'Remesas GST/HST', 
    en: 'GST/HST Remittances' 
  },
  CL: { 
    es: 'Formulario 29', 
    en: 'Form 29' 
  },
};

// ========================================
// TOOLTIPS & HELP TEXT
// ========================================

export const TAX_DEDUCTION_TOOLTIPS: CountryLocalizedText = {
  CA: {
    es: 'Basado en las reglas de deducción del CRA. Las comidas son 50% deducibles, otros gastos de negocio generalmente 100%.',
    en: 'Based on CRA deduction rules. Meals are 50% deductible, other business expenses generally 100%.',
  },
  CL: {
    es: 'Basado en las normas del SII. Gastos deben estar respaldados con documentación tributaria válida.',
    en: 'Based on SII regulations. Expenses must be backed by valid tax documentation.',
  },
};

export const MILEAGE_TOOLTIPS: CountryLocalizedText = {
  CA: {
    es: 'Tasa de kilometraje del CRA: $0.70/km para los primeros 5,000 km, luego $0.64/km.',
    en: 'CRA mileage rate: $0.70/km for first 5,000 km, then $0.64/km.',
  },
  CL: {
    es: 'El SII permite deducir gastos de vehículo proporcionales al uso comercial demostrable.',
    en: 'SII allows deducting vehicle expenses proportional to demonstrable business use.',
  },
};

// ========================================
// PLACEHOLDERS
// ========================================

export const TAX_ID_PLACEHOLDERS: CountryContent<string> = {
  CA: '123456789',
  CL: '12.345.678-9',
};

export const CURRENCY_EXAMPLES: CountryContent<string> = {
  CA: '$1,234.56',
  CL: '$1.234.567',
};

// ========================================
// LEGAL DISCLAIMERS
// ========================================

export const TAX_DISCLAIMERS: CountryLocalizedText = {
  CA: {
    es: 'Esta información es solo de referencia y no constituye asesoría fiscal. Consulte con un contador certificado (CPA) para su situación específica.',
    en: 'This information is for reference only and does not constitute tax advice. Consult with a Certified Public Accountant (CPA) for your specific situation.',
  },
  CL: {
    es: 'Esta información es solo de referencia y no constituye asesoría tributaria. Consulte con un contador auditor para su situación específica.',
    en: 'This information is for reference only and does not constitute tax advice. Consult with a certified accountant for your specific situation.',
  },
};

// ========================================
// MULTI-COUNTRY PROMPTS
// ========================================

/**
 * Messages shown when user must select which country context to use
 */
export const COUNTRY_SELECTION_PROMPTS = {
  expenseEntry: {
    es: '¿Para cuál jurisdicción fiscal es este gasto?',
    en: 'Which tax jurisdiction is this expense for?',
  },
  incomeEntry: {
    es: '¿En cuál jurisdicción fiscal registraste este ingreso?',
    en: 'Which tax jurisdiction did you record this income in?',
  },
  report: {
    es: 'Selecciona el país para generar el reporte',
    en: 'Select the country to generate the report',
  },
  taxCalculation: {
    es: '¿Para cuál país deseas calcular los impuestos?',
    en: 'Which country do you want to calculate taxes for?',
  },
};

// ========================================
// HELPER: Get all active countries' content combined
// ========================================

/**
 * For messages that need to mention both countries when user has both
 * e.g., "Based on CRA (Canada) and SII (Chile) rules..."
 */
export function getCombinedCountryText(
  content: CountryLocalizedText,
  countries: CountryCode[],
  language: 'es' | 'en',
  separator: string = ' / '
): string {
  return countries
    .map(country => content[country]?.[language])
    .filter(Boolean)
    .join(separator);
}
