import { IncomeType, RecurrenceType } from '@/types/income.types';

export const INCOME_CATEGORIES: { 
  value: IncomeType; 
  label: string; 
  labelEn: string; 
  icon: string; 
  color: string;
  group: string;
}[] = [
  // Employment
  { value: 'salary', label: 'Salario/Nómina', labelEn: 'Salary/Payroll', icon: '💼', color: '#3B82F6', group: 'employment' },
  { value: 'bonus', label: 'Bonos', labelEn: 'Bonuses', icon: '🎯', color: '#8B5CF6', group: 'employment' },
  
  // Business
  { value: 'client_payment', label: 'Pagos de Clientes', labelEn: 'Client Payments', icon: '🏢', color: '#10B981', group: 'business' },
  { value: 'freelance', label: 'Freelance', labelEn: 'Freelance', icon: '💻', color: '#06B6D4', group: 'business' },
  { value: 'online_business', label: 'Negocios Online', labelEn: 'Online Business', icon: '🌐', color: '#F59E0B', group: 'business' },
  
  // Investments
  { value: 'investment_stocks', label: 'Acciones/Bolsa', labelEn: 'Stocks', icon: '📈', color: '#EF4444', group: 'investments' },
  { value: 'investment_crypto', label: 'Criptomonedas', labelEn: 'Cryptocurrency', icon: '₿', color: '#F97316', group: 'investments' },
  { value: 'investment_funds', label: 'Fondos de Inversión', labelEn: 'Investment Funds', icon: '🏦', color: '#14B8A6', group: 'investments' },
  
  // Passive Income
  { value: 'passive_rental', label: 'Rentas/Alquileres', labelEn: 'Rental Income', icon: '🏠', color: '#84CC16', group: 'passive' },
  { value: 'passive_royalties', label: 'Regalías', labelEn: 'Royalties', icon: '📚', color: '#A855F7', group: 'passive' },
  
  // Other
  { value: 'gift', label: 'Regalos', labelEn: 'Gifts', icon: '🎁', color: '#EC4899', group: 'other' },
  { value: 'refund', label: 'Devoluciones', labelEn: 'Refunds', icon: '↩️', color: '#6B7280', group: 'other' },
  { value: 'other', label: 'Otros', labelEn: 'Other', icon: '📋', color: '#9CA3AF', group: 'other' },
];

export const INCOME_GROUPS = [
  { key: 'employment', label: 'Empleo', labelEn: 'Employment' },
  { key: 'business', label: 'Negocios', labelEn: 'Business' },
  { key: 'investments', label: 'Inversiones', labelEn: 'Investments' },
  { key: 'passive', label: 'Ingresos Pasivos', labelEn: 'Passive Income' },
  { key: 'other', label: 'Otros', labelEn: 'Other' },
];

export const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; labelEn: string }[] = [
  { value: 'one_time', label: 'Único', labelEn: 'One-time' },
  { value: 'daily', label: 'Diario', labelEn: 'Daily' },
  { value: 'weekly', label: 'Semanal', labelEn: 'Weekly' },
  { value: 'biweekly', label: 'Quincenal', labelEn: 'Biweekly' },
  { value: 'monthly', label: 'Mensual', labelEn: 'Monthly' },
  { value: 'quarterly', label: 'Trimestral', labelEn: 'Quarterly' },
  { value: 'yearly', label: 'Anual', labelEn: 'Yearly' },
];

export const PROJECT_STATUSES = [
  { value: 'active', label: 'Activo', labelEn: 'Active', color: '#10B981' },
  { value: 'completed', label: 'Completado', labelEn: 'Completed', color: '#3B82F6' },
  { value: 'on_hold', label: 'En pausa', labelEn: 'On Hold', color: '#F59E0B' },
  { value: 'cancelled', label: 'Cancelado', labelEn: 'Cancelled', color: '#EF4444' },
];

export const getIncomeCategory = (type: IncomeType) => {
  return INCOME_CATEGORIES.find(c => c.value === type);
};

export const getIncomeCategoryLabel = (type: IncomeType, language: 'es' | 'en' = 'es') => {
  const category = getIncomeCategory(type);
  return language === 'es' ? category?.label : category?.labelEn;
};
