/**
 * Acronym Expander for Speech Synthesis
 * 
 * All acronyms are replaced with their natural spoken form.
 * - SII → "el Servicio de Impuestos Internos" (not spelled out)
 * - IVA, RUT, UF, FONASA, ISAPRE → left untouched (TTS reads them naturally)
 * - Form numbers → spoken format (F29 → "Formulario veintinueve")
 */

interface AcronymEntry {
  es: string;
  en: string;
}

// Acronyms and how they're ACTUALLY pronounced in spoken Spanish/English
const ACRONYM_DICTIONARY: Record<string, AcronymEntry> = {
  // ═══════════════════════════════════════════════════════════════
  // REPLACED WITH FULL NAME — for natural, fluent speech
  // ═══════════════════════════════════════════════════════════════
  SII: {
    es: 'el Servicio de Impuestos Internos',
    en: 'the Internal Revenue Service of Chile',
  },
  PPM: {
    es: 'los Pagos Provisionales Mensuales',
    en: 'Monthly Provisional Payments',
  },
  AFP: {
    es: 'la AFP',
    en: 'the Pension Fund Administrator',
  },
  UTM: {
    es: 'la Unidad Tributaria Mensual',
    en: 'the Monthly Tax Unit',
  },
  CPA: {
    es: 'el Contador Público Certificado',
    en: 'Certified Public Accountant',
  },
  ROI: {
    es: 'el retorno sobre la inversión',
    en: 'Return on Investment',
  },
  // Canadian
  CRA: {
    es: 'la Agencia de Ingresos de Canadá',
    en: 'the Canada Revenue Agency',
  },
  GST: {
    es: 'el Impuesto sobre Bienes y Servicios',
    en: 'the Goods and Services Tax',
  },
  HST: {
    es: 'el Impuesto Armonizado de Ventas',
    en: 'the Harmonized Sales Tax',
  },
  RRSP: {
    es: 'el plan de ahorro para jubilación',
    en: 'the Registered Retirement Savings Plan',
  },
  TFSA: {
    es: 'la cuenta de ahorros libre de impuestos',
    en: 'the Tax-Free Savings Account',
  },
  CPP: {
    es: 'el Plan de Pensiones de Canadá',
    en: 'the Canada Pension Plan',
  },
  EI: {
    es: 'el Seguro de Empleo',
    en: 'Employment Insurance',
  },

  // ═══════════════════════════════════════════════════════════════
  // READ AS WORDS — everyone says these naturally, NO expansion
  // ═══════════════════════════════════════════════════════════════
  // IVA, RUT, UF, FONASA, ISAPRE → left untouched

  // ═══════════════════════════════════════════════════════════════
  // FORM NUMBERS — special spoken format
  // ═══════════════════════════════════════════════════════════════
  F29: {
    es: 'Formulario veintinueve',
    en: 'Form twenty-nine',
  },
  F22: {
    es: 'Formulario veintidós',
    en: 'Form twenty-two',
  },
  T1: {
    es: 'formulario te uno',
    en: 'form T one',
  },
  T2125: {
    es: 'formulario te dos uno dos cinco',
    en: 'form T twenty-one twenty-five',
  },
};

/**
 * Expand acronyms in text for natural speech synthesis.
 * All acronyms are replaced with their full spoken name.
 * Word-acronyms (IVA, RUT, UF) are left untouched for natural TTS.
 */
export function expandAcronymsForSpeech(text: string, lang: string): string {
  const isSpanish = lang.startsWith('es');

  // Sort by length descending to match longer acronyms first
  const sortedAcronyms = Object.keys(ACRONYM_DICTIONARY).sort((a, b) => b.length - a.length);

  let result = text;

  for (const acronym of sortedAcronyms) {
    const entry = ACRONYM_DICTIONARY[acronym];
    const regex = new RegExp(`\\b${acronym}\\b`, 'g');
    const replacement = isSpanish ? entry.es : entry.en;
    result = result.replace(regex, replacement);
  }

  return result;
}
