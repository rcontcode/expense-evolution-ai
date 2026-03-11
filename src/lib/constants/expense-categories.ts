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
  | 'medical'
  | 'insurance_business'
  | 'education_training'
  | 'donations'
  | 'rent'
  | 'bank_fees'
  | 'maintenance_repairs'
  | 'moving'
  | 'interest_loans'
  | 'vehicle_maintenance'
  | 'parking_tolls'
  | 'telephone'
  | 'other';

export const EXPENSE_CATEGORY_TRANSLATIONS: Record<ExpenseCategory, { es: string; en: string; icon: string; color: string }> = {
  meals:                 { es: 'Comidas y Entretenimiento', en: 'Meals & Entertainment',       icon: '🍽️', color: 'hsl(25, 80%, 55%)' },
  travel:                { es: 'Viajes',                    en: 'Travel',                       icon: '✈️', color: 'hsl(200, 70%, 50%)' },
  fuel:                  { es: 'Combustible / Gasolina',    en: 'Fuel / Gas',                   icon: '⛽', color: 'hsl(15, 75%, 50%)' },
  equipment:             { es: 'Equipos',                   en: 'Equipment',                    icon: '🔧', color: 'hsl(210, 50%, 50%)' },
  software:              { es: 'Software y Suscripciones',  en: 'Software & Subscriptions',     icon: '💻', color: 'hsl(260, 60%, 55%)' },
  mileage:               { es: 'Kilometraje',               en: 'Mileage',                      icon: '🚙', color: 'hsl(170, 50%, 45%)' },
  home_office:           { es: 'Oficina en Casa',           en: 'Home Office',                  icon: '🏡', color: 'hsl(130, 55%, 45%)' },
  professional_services: { es: 'Servicios Profesionales',   en: 'Professional Services',        icon: '👔', color: 'hsl(220, 60%, 50%)' },
  office_supplies:       { es: 'Suministros de Oficina',    en: 'Office Supplies',              icon: '📎', color: 'hsl(45, 80%, 50%)' },
  utilities:             { es: 'Servicios Públicos',        en: 'Utilities',                    icon: '💡', color: 'hsl(50, 90%, 50%)' },
  advertising:           { es: 'Publicidad y Marketing',    en: 'Advertising & Marketing',      icon: '📣', color: 'hsl(330, 65%, 55%)' },
  materials:             { es: 'Materiales',                en: 'Materials',                     icon: '🧱', color: 'hsl(20, 60%, 45%)' },
  hobbies:               { es: 'Hobbies / Pasatiempos',     en: 'Hobbies',                      icon: '🎨', color: 'hsl(270, 65%, 60%)' },
  family_outings:        { es: 'Salidas Familiares',        en: 'Family Outings',               icon: '👨‍👩‍👧‍👦', color: 'hsl(190, 65%, 50%)' },
  gifts:                 { es: 'Regalos / Cumpleaños',      en: 'Gifts / Birthdays',            icon: '🎁', color: 'hsl(350, 70%, 55%)' },
  scheduled_purchases:   { es: 'Compras Programadas',       en: 'Scheduled Purchases',          icon: '🛍️', color: 'hsl(340, 60%, 55%)' },
  medical:               { es: 'Gastos Médicos',            en: 'Medical Expenses',             icon: '🏥', color: 'hsl(0, 65%, 50%)' },
  insurance_business:    { es: 'Seguros de Negocio',        en: 'Business Insurance',           icon: '🛡️', color: 'hsl(215, 55%, 50%)' },
  education_training:    { es: 'Educación / Capacitación',  en: 'Education / Training',         icon: '🎓', color: 'hsl(280, 55%, 55%)' },
  donations:             { es: 'Donaciones / Caridad',      en: 'Donations / Charity',          icon: '💝', color: 'hsl(340, 75%, 55%)' },
  rent:                  { es: 'Arriendo / Alquiler',       en: 'Rent',                         icon: '🏢', color: 'hsl(195, 50%, 45%)' },
  bank_fees:             { es: 'Comisiones Bancarias',      en: 'Bank Fees',                    icon: '🏦', color: 'hsl(230, 45%, 50%)' },
  maintenance_repairs:   { es: 'Mantención / Reparaciones', en: 'Maintenance / Repairs',        icon: '🔨', color: 'hsl(30, 60%, 45%)' },
  moving:                { es: 'Gastos de Mudanza',         en: 'Moving Expenses',              icon: '📦', color: 'hsl(35, 55%, 50%)' },
  interest_loans:        { es: 'Intereses de Préstamos',    en: 'Loan Interest',                icon: '💳', color: 'hsl(240, 50%, 55%)' },
  vehicle_maintenance:   { es: 'Mantención Vehículo',       en: 'Vehicle Maintenance',          icon: '🔧', color: 'hsl(160, 50%, 45%)' },
  parking_tolls:         { es: 'Estacionamiento / Peajes',  en: 'Parking / Tolls',              icon: '🅿️', color: 'hsl(180, 40%, 45%)' },
  telephone:             { es: 'Teléfono (% Negocio)',      en: 'Telephone (Business %)',       icon: '📱', color: 'hsl(145, 50%, 45%)' },
  other:                 { es: 'Otros',                     en: 'Other',                        icon: '📋', color: 'hsl(0, 0%, 50%)' },
};

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = Object.entries(EXPENSE_CATEGORY_TRANSLATIONS).map(
  ([value, { es }]) => ({ value: value as ExpenseCategory, label: es })
);

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
