export type BillCategory =
  | 'housing'
  | 'utilities'
  | 'insurance'
  | 'transportation'
  | 'telecommunications'
  | 'education'
  | 'childcare'
  | 'health'
  | 'food'
  | 'entertainment'
  | 'subscriptions'
  | 'debt_payments'
  | 'investments'
  | 'legal_financial'
  | 'clothing'
  | 'gifts'
  | 'pharmacy'
  | 'pets'
  | 'hobbies'
  | 'family_outings'
  | 'scheduled_purchases'
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

export type PaymentMethodType =
  | 'automatic'
  | 'manual_online'
  | 'etransfer'
  | 'cash'
  | 'cheque'
  | 'other';

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethodType, { es: string; en: string; icon: string; description_es: string; description_en: string }> = {
  automatic:     { es: 'Automático',       en: 'Automatic',      icon: '🔄', description_es: 'Se cobra automáticamente de tu cuenta', description_en: 'Automatically charged from your account' },
  manual_online: { es: 'Pago Online',      en: 'Online Payment', icon: '💻', description_es: 'Pagas manualmente por la web del banco', description_en: 'Pay manually via bank website' },
  etransfer:     { es: 'e-Transfer',       en: 'e-Transfer',     icon: '📧', description_es: 'Transferencia electrónica (Interac)', description_en: 'Electronic transfer (Interac)' },
  cash:          { es: 'Efectivo',         en: 'Cash',           icon: '💵', description_es: 'Pago en efectivo o en persona', description_en: 'Cash or in-person payment' },
  cheque:        { es: 'Cheque',           en: 'Cheque',         icon: '📝', description_es: 'Pago con cheque', description_en: 'Payment by cheque' },
  other:         { es: 'Otro',             en: 'Other',          icon: '📋', description_es: 'Otro método de pago', description_en: 'Other payment method' },
};

export const COMMON_BANKS = [
  'TD Canada Trust',
  'RBC Royal Bank',
  'Scotiabank',
  'BMO',
  'CIBC',
  'National Bank',
  'Desjardins',
  'Tangerine',
  'Simplii Financial',
  'EQ Bank',
  'Wealthsimple',
  'HSBC',
  'Otro / Other',
];

export const BILL_CATEGORY_CONFIG: Record<BillCategory, { es: string; en: string; icon: string; color: string }> = {
  housing:             { es: 'Vivienda',              en: 'Housing',              icon: '🏠', color: 'hsl(220, 70%, 55%)' },
  utilities:           { es: 'Servicios Básicos',     en: 'Utilities',            icon: '💡', color: 'hsl(45, 90%, 50%)' },
  insurance:           { es: 'Seguros',               en: 'Insurance',            icon: '🛡️', color: 'hsl(260, 60%, 55%)' },
  transportation:      { es: 'Transporte',            en: 'Transportation',       icon: '🚗', color: 'hsl(200, 70%, 50%)' },
  telecommunications:  { es: 'Telecomunicaciones',    en: 'Telecom',              icon: '📱', color: 'hsl(170, 60%, 45%)' },
  education:           { es: 'Educación',             en: 'Education',            icon: '📚', color: 'hsl(280, 60%, 55%)' },
  childcare:           { es: 'Cuidado Infantil',      en: 'Childcare',            icon: '👶', color: 'hsl(310, 55%, 55%)' },
  health:              { es: 'Salud',                 en: 'Health',               icon: '🏥', color: 'hsl(0, 70%, 55%)' },
  food:                { es: 'Alimentación',          en: 'Food & Groceries',     icon: '🛒', color: 'hsl(130, 55%, 45%)' },
  entertainment:       { es: 'Ocio / Entretenimiento', en: 'Entertainment',       icon: '🎬', color: 'hsl(330, 65%, 55%)' },
  subscriptions:       { es: 'Suscripciones',         en: 'Subscriptions',        icon: '📦', color: 'hsl(25, 80%, 55%)' },
  debt_payments:       { es: 'Pagos de Deuda',        en: 'Debt Payments',        icon: '💳', color: 'hsl(0, 60%, 45%)' },
  investments:         { es: 'Inversiones',           en: 'Investments',          icon: '📈', color: 'hsl(150, 70%, 40%)' },
  legal_financial:     { es: 'Legal / Financiero',    en: 'Legal / Financial',    icon: '⚖️', color: 'hsl(210, 50%, 50%)' },
  clothing:            { es: 'Ropa',                  en: 'Clothing',             icon: '👕', color: 'hsl(300, 50%, 55%)' },
  gifts:               { es: 'Regalos / Cumpleaños',  en: 'Gifts / Birthdays',    icon: '🎁', color: 'hsl(350, 70%, 55%)' },
  pharmacy:            { es: 'Farmacia',              en: 'Pharmacy',             icon: '💊', color: 'hsl(180, 50%, 45%)' },
  pets:                { es: 'Mascotas',              en: 'Pets',                 icon: '🐾', color: 'hsl(30, 60%, 50%)' },
  hobbies:             { es: 'Hobbies / Pasatiempos', en: 'Hobbies',              icon: '🎨', color: 'hsl(270, 65%, 60%)' },
  family_outings:      { es: 'Salidas Familiares',    en: 'Family Outings',       icon: '👨‍👩‍👧‍👦', color: 'hsl(190, 65%, 50%)' },
  scheduled_purchases: { es: 'Compras Programadas',   en: 'Scheduled Purchases',  icon: '🛍️', color: 'hsl(340, 60%, 55%)' },
  other:               { es: 'Otros',                 en: 'Other',                icon: '📋', color: 'hsl(0, 0%, 50%)' },
};

export const BILL_FREQUENCY_CONFIG: Record<BillFrequency, { es: string; en: string; months: number }> = {
  weekly:      { es: 'Semanal',       en: 'Weekly',       months: 0.25 },
  bi_weekly:   { es: 'Quincenal',     en: 'Bi-weekly',    months: 0.5 },
  monthly:     { es: 'Mensual',       en: 'Monthly',      months: 1 },
  bi_monthly:  { es: 'Bimestral',     en: 'Bi-monthly',   months: 2 },
  quarterly:   { es: 'Trimestral',    en: 'Quarterly',    months: 3 },
  semi_annual: { es: 'Semestral',     en: 'Semi-annual',  months: 6 },
  annual:      { es: 'Anual',         en: 'Annual',       months: 12 },
  custom:      { es: 'Personalizado', en: 'Custom',       months: 0 },
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

export function getPaymentMethodLabel(method: string, language: 'es' | 'en'): string {
  return PAYMENT_METHOD_CONFIG[method as PaymentMethodType]?.[language] || method;
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
