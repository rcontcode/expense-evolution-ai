import { Client } from '@/types/expense.types';

export interface ClientCompletenessField {
  key: keyof Client | string;
  label: string;
  labelEn: string;
  weight: number;
  required: boolean;
}

export const CLIENT_COMPLETENESS_FIELDS: ClientCompletenessField[] = [
  { key: 'name', label: 'Nombre', labelEn: 'Name', weight: 20, required: true },
  { key: 'contact_email', label: 'Email de contacto', labelEn: 'Contact email', weight: 15, required: false },
  { key: 'contact_phone', label: 'Teléfono', labelEn: 'Phone', weight: 10, required: false },
  { key: 'country', label: 'País', labelEn: 'Country', weight: 10, required: false },
  { key: 'province', label: 'Provincia', labelEn: 'Province', weight: 5, required: false },
  { key: 'industry', label: 'Industria', labelEn: 'Industry', weight: 10, required: false },
  { key: 'client_type', label: 'Tipo de cliente', labelEn: 'Client type', weight: 10, required: false },
  { key: 'payment_terms', label: 'Términos de pago', labelEn: 'Payment terms', weight: 10, required: false },
  { key: 'tax_id', label: 'ID Fiscal', labelEn: 'Tax ID', weight: 10, required: false },
];

export type ClientStatus = 'incomplete' | 'in_progress' | 'complete' | 'active';

export interface ClientCompletenessResult {
  percentage: number;
  status: ClientStatus;
  missingFields: ClientCompletenessField[];
  completedFields: ClientCompletenessField[];
}

export function calculateClientCompleteness(client: Client, hasActiveExpenses: boolean = false): ClientCompletenessResult {
  let totalWeight = 0;
  let completedWeight = 0;
  const missingFields: ClientCompletenessField[] = [];
  const completedFields: ClientCompletenessField[] = [];

  CLIENT_COMPLETENESS_FIELDS.forEach(field => {
    totalWeight += field.weight;
    const value = (client as any)[field.key];
    
    if (value && value !== '' && value !== null) {
      completedWeight += field.weight;
      completedFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  const percentage = Math.round((completedWeight / totalWeight) * 100);
  
  let status: ClientStatus;
  if (hasActiveExpenses) {
    status = 'active';
  } else if (percentage >= 80) {
    status = 'complete';
  } else if (percentage >= 40) {
    status = 'in_progress';
  } else {
    status = 'incomplete';
  }

  return {
    percentage,
    status,
    missingFields,
    completedFields,
  };
}

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { 
  label: string; 
  labelEn: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  incomplete: {
    label: 'Incompleto',
    labelEn: 'Incomplete',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🔴',
  },
  in_progress: {
    label: 'En progreso',
    labelEn: 'In Progress',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: '🟡',
  },
  complete: {
    label: 'Completo',
    labelEn: 'Complete',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '🟢',
  },
  active: {
    label: 'En uso activo',
    labelEn: 'Actively Used',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '🔵',
  },
};
