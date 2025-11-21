import { ExpenseCategory } from '@/types/expense.types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'travel', label: 'Travel' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software & Subscriptions' },
  { value: 'mileage', label: 'Mileage' },
  { value: 'home_office', label: 'Home Office' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

export const getCategoryLabel = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
};
