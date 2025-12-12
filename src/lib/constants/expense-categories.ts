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
  | 'other';

export const EXPENSE_CATEGORY_TRANSLATIONS: Record<ExpenseCategory, { es: string; en: string }> = {
  meals: { es: 'Comidas y Entretenimiento', en: 'Meals & Entertainment' },
  travel: { es: 'Viajes', en: 'Travel' },
  fuel: { es: 'Combustible / Gasolina', en: 'Fuel / Gas' },
  equipment: { es: 'Equipos', en: 'Equipment' },
  software: { es: 'Software y Suscripciones', en: 'Software & Subscriptions' },
  mileage: { es: 'Kilometraje', en: 'Mileage' },
  home_office: { es: 'Oficina en Casa', en: 'Home Office' },
  professional_services: { es: 'Servicios Profesionales', en: 'Professional Services' },
  office_supplies: { es: 'Suministros de Oficina', en: 'Office Supplies' },
  utilities: { es: 'Servicios Públicos', en: 'Utilities' },
  advertising: { es: 'Publicidad y Marketing', en: 'Advertising & Marketing' },
  materials: { es: 'Materiales', en: 'Materials' },
  other: { es: 'Otros', en: 'Other' },
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
  { value: 'other', label: 'Otros' },
];

export const getCategoryLabel = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
};

export const getCategoryLabelByLanguage = (category: ExpenseCategory | string, language: 'es' | 'en'): string => {
  const translations = EXPENSE_CATEGORY_TRANSLATIONS[category as ExpenseCategory];
  if (translations) {
    return translations[language];
  }
  return category;
};
