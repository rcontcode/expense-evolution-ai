export type ExpenseCategory = 
  | 'meals'
  | 'travel'
  | 'equipment'
  | 'software'
  | 'mileage'
  | 'home_office'
  | 'professional_services'
  | 'office_supplies'
  | 'utilities'
  | 'fuel'
  | 'advertising'
  | 'materials'
  | 'hobbies'
  | 'family_outings'
  | 'gifts'
  | 'scheduled_purchases'
  | 'other';

export const EXPENSE_CATEGORY_TRANSLATIONS: Record<ExpenseCategory, { es: string; en: string; icon: string; color: string }> = {
  meals:                 { es: 'Comidas y Entretenimiento', en: 'Meals & Entertainment',  icon: '🍽️', color: 'hsl(25, 80%, 55%)' },
  travel:                { es: 'Viajes',                    en: 'Travel',                  icon: '✈️', color: 'hsl(200, 70%, 50%)' },
  fuel:                  { es: 'Combustible / Gasolina',    en: 'Fuel / Gas',              icon: '⛽', color: 'hsl(15, 75%, 50%)' },
  equipment:             { es: 'Equipos',                   en: 'Equipment',               icon: '🔧', color: 'hsl(210, 50%, 50%)' },
  software:              { es: 'Software y Suscripciones',  en: 'Software & Subscriptions',icon: '💻', color: 'hsl(260, 60%, 55%)' },
  mileage:               { es: 'Kilometraje',               en: 'Mileage',                 icon: '🚙', color: 'hsl(170, 50%, 45%)' },
  home_office:           { es: 'Oficina en Casa',           en: 'Home Office',             icon: '🏡', color: 'hsl(130, 55%, 45%)' },
  professional_services: { es: 'Servicios Profesionales',   en: 'Professional Services',   icon: '👔', color: 'hsl(220, 60%, 50%)' },
  office_supplies:       { es: 'Suministros de Oficina',    en: 'Office Supplies',         icon: '📎', color: 'hsl(45, 80%, 50%)' },
  utilities:             { es: 'Servicios Públicos',        en: 'Utilities',               icon: '💡', color: 'hsl(50, 90%, 50%)' },
  advertising:           { es: 'Publicidad y Marketing',    en: 'Advertising & Marketing', icon: '📣', color: 'hsl(330, 65%, 55%)' },
  materials:             { es: 'Materiales',                en: 'Materials',               icon: '🧱', color: 'hsl(20, 60%, 45%)' },
  hobbies:               { es: 'Hobbies / Pasatiempos',     en: 'Hobbies',                 icon: '🎨', color: 'hsl(270, 65%, 60%)' },
  family_outings:        { es: 'Salidas Familiares',        en: 'Family Outings',          icon: '👨‍👩‍👧‍👦', color: 'hsl(190, 65%, 50%)' },
  gifts:                 { es: 'Regalos / Cumpleaños',      en: 'Gifts / Birthdays',       icon: '🎁', color: 'hsl(350, 70%, 55%)' },
  scheduled_purchases:   { es: 'Compras Programadas',       en: 'Scheduled Purchases',     icon: '🛍️', color: 'hsl(340, 60%, 55%)' },
  other:                 { es: 'Otros',                     en: 'Other',                   icon: '📋', color: 'hsl(0, 0%, 50%)' },
};

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'meals', label: 'Comidas y Entretenimiento' },
  { value: 'travel', label: 'Viajes' },
  { value: 'fuel', label: 'Combustible / Gasolina' },
  { value: 'equipment', label: 'Equipos' },
  { value: 'software', label: 'Software y Suscripciones' },
  { value: 'mileage', label: 'Kilometraje' },
  { value: 'home_office', label: 'Oficina en Casa' },
  { value: 'professional_services', label: 'Servicios Profesionales' },
  { value: 'office_supplies', label: 'Suministros de Oficina' },
  { value: 'utilities', label: 'Servicios Públicos' },
  { value: 'advertising', label: 'Publicidad y Marketing' },
  { value: 'materials', label: 'Materiales' },
  { value: 'hobbies', label: 'Hobbies / Pasatiempos' },
  { value: 'family_outings', label: 'Salidas Familiares' },
  { value: 'gifts', label: 'Regalos / Cumpleaños' },
  { value: 'scheduled_purchases', label: 'Compras Programadas' },
  { value: 'other', label: 'Otros' },
];

export const getCategoryLabel = (category: ExpenseCategory, language?: 'es' | 'en'): string => {
  const lang = language || (typeof window !== 'undefined' ? (localStorage.getItem('language') as 'es' | 'en') || 'es' : 'es');
  return getCategoryLabelByLanguage(category, lang);
};

export const getCategoryLabelByLanguage = (category: ExpenseCategory | string, language: 'es' | 'en'): string => {
  const translations = EXPENSE_CATEGORY_TRANSLATIONS[category as ExpenseCategory];
  if (translations) {
    return translations[language];
  }
  return category;
};

export const getCategoryIcon = (category: string): string => {
  return EXPENSE_CATEGORY_TRANSLATIONS[category as ExpenseCategory]?.icon || '📋';
};

export const getCategoryColor = (category: string): string => {
  return EXPENSE_CATEGORY_TRANSLATIONS[category as ExpenseCategory]?.color || 'hsl(0, 0%, 50%)';
};
