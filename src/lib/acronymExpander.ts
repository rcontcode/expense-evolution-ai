/**
 * Acronym Expander for Speech Synthesis
 * 
 * Rules based on real Chilean/Canadian spoken conventions:
 * - Some acronyms are READ AS WORDS (IVA, RUT, FONASA) → no spelling needed
 * - Others are SPELLED OUT letter by letter (SII, PPM, AFP) → spelled + full name
 * - Form numbers get special treatment (F29 → "Formulario veintinueve")
 */

interface SpelledAcronym {
  type: 'spelled';
  es: string;
  en: string;
  spellEs: string;
  spellEn: string;
}

interface DirectReplacement {
  type: 'direct';
  es: string;
  en: string;
}

type AcronymEntry = SpelledAcronym | DirectReplacement;

// Acronyms and how they're ACTUALLY pronounced in spoken Spanish/English
const ACRONYM_DICTIONARY: Record<string, AcronymEntry> = {
  // ═══════════════════════════════════════════════════════════════
  // SPELLED OUT (letter by letter) — these are never said as words
  // ═══════════════════════════════════════════════════════════════
  SII: {
    type: 'spelled',
    es: 'Servicio de Impuestos Internos',
    en: 'Internal Revenue Service of Chile',
    spellEs: 'ese, i, i',
    spellEn: 'S, I, I',
  },
  PPM: {
    type: 'spelled',
    es: 'Pagos Provisionales Mensuales',
    en: 'Monthly Provisional Payments',
    spellEs: 'pe, pe, eme',
    spellEn: 'P, P, M',
  },
  AFP: {
    type: 'spelled',
    es: 'Administradora de Fondos de Pensiones',
    en: 'Pension Fund Administrator',
    spellEs: 'a, efe, pe',
    spellEn: 'A, F, P',
  },
  UTM: {
    type: 'spelled',
    es: 'Unidad Tributaria Mensual',
    en: 'Monthly Tax Unit',
    spellEs: 'u, te, eme',
    spellEn: 'U, T, M',
  },
  CPA: {
    type: 'spelled',
    es: 'Contador Público Certificado',
    en: 'Certified Public Accountant',
    spellEs: 'ce, pe, a',
    spellEn: 'C, P, A',
  },
  ROI: {
    type: 'spelled',
    es: 'Retorno sobre la Inversión',
    en: 'Return on Investment',
    spellEs: 'erre, o, i',
    spellEn: 'R, O, I',
  },
  // Canadian — always spelled out
  CRA: {
    type: 'spelled',
    es: 'Agencia de Ingresos de Canadá',
    en: 'Canada Revenue Agency',
    spellEs: 'ce, erre, a',
    spellEn: 'C, R, A',
  },
  GST: {
    type: 'spelled',
    es: 'Impuesto sobre Bienes y Servicios',
    en: 'Goods and Services Tax',
    spellEs: 'ge, ese, te',
    spellEn: 'G, S, T',
  },
  HST: {
    type: 'spelled',
    es: 'Impuesto Armonizado de Ventas',
    en: 'Harmonized Sales Tax',
    spellEs: 'ache, ese, te',
    spellEn: 'H, S, T',
  },
  RRSP: {
    type: 'spelled',
    es: 'Plan Registrado de Ahorro para Jubilación',
    en: 'Registered Retirement Savings Plan',
    spellEs: 'erre, erre, ese, pe',
    spellEn: 'R, R, S, P',
  },
  TFSA: {
    type: 'spelled',
    es: 'Cuenta de Ahorros Libre de Impuestos',
    en: 'Tax-Free Savings Account',
    spellEs: 'te, efe, ese, a',
    spellEn: 'T, F, S, A',
  },
  CPP: {
    type: 'spelled',
    es: 'Plan de Pensiones de Canadá',
    en: 'Canada Pension Plan',
    spellEs: 'ce, pe, pe',
    spellEn: 'C, P, P',
  },
  EI: {
    type: 'spelled',
    es: 'Seguro de Empleo',
    en: 'Employment Insurance',
    spellEs: 'e, i',
    spellEn: 'E, I',
  },

  // ═══════════════════════════════════════════════════════════════
  // READ AS WORDS — everyone says these naturally, NO spelling
  // The TTS engine reads them correctly as-is, so we just leave
  // them alone (no entry needed) or provide the full name only
  // ═══════════════════════════════════════════════════════════════
  // IVA → everyone says "IVA" naturally — NOT in dictionary
  // RUT → everyone says "RUT" naturally — NOT in dictionary
  // UF  → everyone says "UF" naturally — NOT in dictionary
  // FONASA → said as a word — NOT in dictionary
  // ISAPRE → said as a word — NOT in dictionary

  // ═══════════════════════════════════════════════════════════════
  // FORM NUMBERS — special spoken format
  // ═══════════════════════════════════════════════════════════════
  F29: {
    type: 'direct',
    es: 'Formulario veintinueve',
    en: 'Form twenty-nine',
  },
  F22: {
    type: 'direct',
    es: 'Formulario veintidós',
    en: 'Form twenty-two',
  },
  T1: {
    type: 'direct',
    es: 'formulario te uno',
    en: 'form T one',
  },
  T2125: {
    type: 'direct',
    es: 'formulario te dos uno dos cinco',
    en: 'form T twenty-one twenty-five',
  },
};

/**
 * Expand acronyms in text for natural speech synthesis.
 * - Spelled acronyms → letter spelling + full name
 * - Direct replacements → spoken form directly
 * - Word-acronyms (IVA, RUT, UF) → left untouched for natural TTS
 */
export function expandAcronymsForSpeech(text: string, lang: string): string {
  const isSpanish = lang.startsWith('es');

  // Sort by length descending to match longer acronyms first (e.g., ISAPRE before IS)
  const sortedAcronyms = Object.keys(ACRONYM_DICTIONARY).sort((a, b) => b.length - a.length);

  let result = text;

  for (const acronym of sortedAcronyms) {
    const entry = ACRONYM_DICTIONARY[acronym];
    const regex = new RegExp(`\\b${acronym}\\b`, 'g');

    if (entry.type === 'direct') {
      // Direct replacement (form numbers etc.)
      const directName = isSpanish ? entry.es : entry.en;
      result = result.replace(regex, directName);
    } else {
      // Spelled out + full name
      const spelling = isSpanish ? entry.spellEs : entry.spellEn;
      const fullName = isSpanish ? entry.es : entry.en;
      const spokenVersion = `${spelling}, ${fullName}`;
      result = result.replace(regex, spokenVersion);
    }
  }

  return result;
}
