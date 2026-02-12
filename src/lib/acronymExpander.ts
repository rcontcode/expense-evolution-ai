/**
 * Acronym Expander for Speech Synthesis
 * 
 * Spells out acronyms letter by letter with pauses, then says the full name.
 * Example: "SII" → "ese... i... i... Servicio de Impuestos Internos"
 */

interface AcronymEntry {
  es: string; // Full name in Spanish
  en: string; // Full name in English
  /** How to spell each letter in Spanish */
  spellEs: string;
  /** How to spell each letter in English */
  spellEn: string;
}

// Known acronyms with their full names and letter-by-letter spelling
const ACRONYM_DICTIONARY: Record<string, AcronymEntry> = {
  SII: {
    es: 'Servicio de Impuestos Internos',
    en: 'Internal Revenue Service of Chile',
    spellEs: 'ese, i, i',
    spellEn: 'S, I, I',
  },
  CRA: {
    es: 'Agencia de Ingresos de Canadá',
    en: 'Canada Revenue Agency',
    spellEs: 'ce, erre, a',
    spellEn: 'C, R, A',
  },
  GST: {
    es: 'Impuesto sobre Bienes y Servicios',
    en: 'Goods and Services Tax',
    spellEs: 'ge, ese, te',
    spellEn: 'G, S, T',
  },
  HST: {
    es: 'Impuesto Armonizado de Ventas',
    en: 'Harmonized Sales Tax',
    spellEs: 'ache, ese, te',
    spellEn: 'H, S, T',
  },
  IVA: {
    es: 'Impuesto al Valor Agregado',
    en: 'Value Added Tax',
    spellEs: 'i, ve, a',
    spellEn: 'I, V, A',
  },
  RUT: {
    es: 'Rol Único Tributario',
    en: 'Tax Identification Number',
    spellEs: 'erre, u, te',
    spellEn: 'R, U, T',
  },
  PPM: {
    es: 'Pagos Provisionales Mensuales',
    en: 'Monthly Provisional Payments',
    spellEs: 'pe, pe, eme',
    spellEn: 'P, P, M',
  },
  RRSP: {
    es: 'Plan Registrado de Ahorro para Jubilación',
    en: 'Registered Retirement Savings Plan',
    spellEs: 'erre, erre, ese, pe',
    spellEn: 'R, R, S, P',
  },
  TFSA: {
    es: 'Cuenta de Ahorros Libre de Impuestos',
    en: 'Tax-Free Savings Account',
    spellEs: 'te, efe, ese, a',
    spellEn: 'T, F, S, A',
  },
  CPA: {
    es: 'Contador Público Certificado',
    en: 'Certified Public Accountant',
    spellEs: 'ce, pe, a',
    spellEn: 'C, P, A',
  },
  ROI: {
    es: 'Retorno sobre la Inversión',
    en: 'Return on Investment',
    spellEs: 'erre, o, i',
    spellEn: 'R, O, I',
  },
  AFP: {
    es: 'Administradora de Fondos de Pensiones',
    en: 'Pension Fund Administrator',
    spellEs: 'a, efe, pe',
    spellEn: 'A, F, P',
  },
  ISAPRE: {
    es: 'Institución de Salud Previsional',
    en: 'Private Health Insurance Institution',
    spellEs: 'i, ese, a, pe, erre, e',
    spellEn: 'I, S, A, P, R, E',
  },
  FONASA: {
    es: 'Fondo Nacional de Salud',
    en: 'National Health Fund',
    spellEs: 'efe, o, ene, a, ese, a',
    spellEn: 'F, O, N, A, S, A',
  },
  UF: {
    es: 'Unidad de Fomento',
    en: 'Unit of Account',
    spellEs: 'u, efe',
    spellEn: 'U, F',
  },
  UTM: {
    es: 'Unidad Tributaria Mensual',
    en: 'Monthly Tax Unit',
    spellEs: 'u, te, eme',
    spellEn: 'U, T, M',
  },
  EI: {
    es: 'Seguro de Empleo',
    en: 'Employment Insurance',
    spellEs: 'e, i',
    spellEn: 'E, I',
  },
  CPP: {
    es: 'Plan de Pensiones de Canadá',
    en: 'Canada Pension Plan',
    spellEs: 'ce, pe, pe',
    spellEn: 'C, P, P',
  },
  T1: {
    es: 'formulario te uno',
    en: 'form T one',
    spellEs: '',
    spellEn: '',
  },
  T2125: {
    es: 'formulario te dos uno dos cinco',
    en: 'form T twenty-one twenty-five',
    spellEs: '',
    spellEn: '',
  },
};

/**
 * Expand acronyms in text for natural speech synthesis.
 * Replaces known acronyms with spelled-out letters + full name.
 */
export function expandAcronymsForSpeech(text: string, lang: string): string {
  const isSpanish = lang.startsWith('es');

  // Sort by length descending to match longer acronyms first (e.g., ISAPRE before IS)
  const sortedAcronyms = Object.keys(ACRONYM_DICTIONARY).sort((a, b) => b.length - a.length);

  let result = text;

  for (const acronym of sortedAcronyms) {
    const entry = ACRONYM_DICTIONARY[acronym];
    // Special entries like T1, T2125 that have direct replacements
    if (!entry.spellEs && !entry.spellEn) {
      const directName = isSpanish ? entry.es : entry.en;
      const regex = new RegExp(`\\b${acronym}\\b`, 'g');
      result = result.replace(regex, directName);
      continue;
    }

    const spelling = isSpanish ? entry.spellEs : entry.spellEn;
    const fullName = isSpanish ? entry.es : entry.en;

    // Build the spoken version: "ese, i, i, Servicio de Impuestos Internos"
    const spokenVersion = `${spelling}, ${fullName}`;

    // Replace standalone acronym (word boundary match)
    const regex = new RegExp(`\\b${acronym}\\b`, 'g');
    result = result.replace(regex, spokenVersion);
  }

  return result;
}
