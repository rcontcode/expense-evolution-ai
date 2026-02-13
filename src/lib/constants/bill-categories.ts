export type BillCategory =
  | 'housing'
  | 'utilities'
  | 'insurance'
  | 'transportation'
  | 'telecommunications'
  | 'education'
  | 'health'
  | 'food'
  | 'entertainment'
  | 'subscriptions'
  | 'debt_payments'
  | 'investments'
  | 'clothing'
  | 'gifts'
  | 'pharmacy'
  | 'pets'
  | 'other';

export type BillFrequency =
  | 'weekly'
  | 'bi_weekly'
  | 'monthly'
  | 'bi_monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual'
  | 'custom';

export const BILL_CATEGORY_CONFIG: Record<BillCategory, { es: string; en: string; icon: string; color: string }> = {
  housing:            { es: 'Vivienda',            en: 'Housing',            icon: '🏠', color: 'hsl(220, 70%, 55%)' },
  utilities:          { es: 'Servicios Básicos',   en: 'Utilities',          icon: '💡', color: 'hsl(45, 90%, 50%)' },
  insurance:          { es: 'Seguros',             en: 'Insurance',          icon: '🛡️', color: 'hsl(260, 60%, 55%)' },
  transportation:     { es: 'Transporte',          en: 'Transportation',     icon: '🚗', color: 'hsl(200, 70%, 50%)' },
  telecommunications: { es: 'Telecomunicaciones',  en: 'Telecom',            icon: '📱', color: 'hsl(170, 60%, 45%)' },
  education:          { es: 'Educación',           en: 'Education',          icon: '📚', color: 'hsl(280, 60%, 55%)' },
  health:             { es: 'Salud',               en: 'Health',             icon: '🏥', color: 'hsl(0, 70%, 55%)' },
  food:               { es: 'Alimentación',        en: 'Food & Groceries',   icon: '🛒', color: 'hsl(130, 55%, 45%)' },
  entertainment:      { es: 'Ocio / Entretenimiento', en: 'Entertainment',   icon: '🎬', color: 'hsl(330, 65%, 55%)' },
  subscriptions:      { es: 'Suscripciones',       en: 'Subscriptions',      icon: '📦', color: 'hsl(25, 80%, 55%)' },
  debt_payments:      { es: 'Pagos de Deuda',      en: 'Debt Payments',      icon: '💳', color: 'hsl(0, 60%, 45%)' },
  investments:        { es: 'Inversiones',         en: 'Investments',        icon: '📈', color: 'hsl(150, 70%, 40%)' },
  clothing:           { es: 'Ropa',                en: 'Clothing',           icon: '👕', color: 'hsl(300, 50%, 55%)' },
  gifts:              { es: 'Regalos / Fechas',    en: 'Gifts / Events',     icon: '🎁', color: 'hsl(350, 70%, 55%)' },
  pharmacy:           { es: 'Farmacia',            en: 'Pharmacy',           icon: '💊', color: 'hsl(180, 50%, 45%)' },
  pets:               { es: 'Mascotas',            en: 'Pets',               icon: '🐾', color: 'hsl(30, 60%, 50%)' },
  other:              { es: 'Otros',               en: 'Other',              icon: '📋', color: 'hsl(0, 0%, 50%)' },
};

export const BILL_FREQUENCY_CONFIG: Record<BillFrequency, { es: string; en: string; months: number }> = {
  weekly:      { es: 'Semanal',      en: 'Weekly',       months: 0.25 },
  bi_weekly:   { es: 'Quincenal',    en: 'Bi-weekly',    months: 0.5 },
  monthly:     { es: 'Mensual',      en: 'Monthly',      months: 1 },
  bi_monthly:  { es: 'Bimestral',    en: 'Bi-monthly',   months: 2 },
  quarterly:   { es: 'Trimestral',   en: 'Quarterly',    months: 3 },
  semi_annual: { es: 'Semestral',    en: 'Semi-annual',  months: 6 },
  annual:      { es: 'Anual',        en: 'Annual',       months: 12 },
  custom:      { es: 'Personalizado', en: 'Custom',      months: 0 },
};

export const BILL_PRIORITIES: Record<string, { es: string; en: string; color: string }> = {
  critical: { es: 'Crítico',  en: 'Critical', color: 'hsl(0, 80%, 50%)' },
  high:     { es: 'Alto',     en: 'High',     color: 'hsl(25, 80%, 50%)' },
  medium:   { es: 'Medio',    en: 'Medium',   color: 'hsl(45, 80%, 50%)' },
  low:      { es: 'Bajo',     en: 'Low',      color: 'hsl(130, 50%, 45%)' },
};

export function getBillCategoryLabel(category: string, language: 'es' | 'en'): string {
  return BILL_CATEGORY_CONFIG[category as BillCategory]?.[language] || category;
}

export function getBillFrequencyLabel(frequency: string, language: 'es' | 'en'): string {
  return BILL_FREQUENCY_CONFIG[frequency as BillFrequency]?.[language] || frequency;
}

export function getMonthlyEquivalent(amount: number, frequency: string, customMonths?: number): number {
  const freq = BILL_FREQUENCY_CONFIG[frequency as BillFrequency];
  if (!freq) return amount;
  const months = frequency === 'custom' ? (customMonths || 1) : freq.months;
  if (months === 0) return amount;
  return amount / months;
}

export function getNextDueDate(currentDue: Date, frequency: string, customMonths?: number): Date {
  const next = new Date(currentDue);
  const freq = BILL_FREQUENCY_CONFIG[frequency as BillFrequency];
  if (!freq) return next;

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi_weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'custom':
      next.setMonth(next.getMonth() + (customMonths || 1));
      break;
    default:
      next.setMonth(next.getMonth() + freq.months);
  }
  return next;
}
