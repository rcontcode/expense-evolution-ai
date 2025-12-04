export interface DefaultTag {
  name: string;
  nameEn: string;
  color: string;
  description: string;
  descriptionEn: string;
}

export const DEFAULT_TAGS: DefaultTag[] = [
  {
    name: 'Urgente',
    nameEn: 'Urgent',
    color: '#EF4444',
    description: 'Gastos que requieren atención inmediata',
    descriptionEn: 'Expenses requiring immediate attention',
  },
  {
    name: 'Reembolsado',
    nameEn: 'Reimbursed',
    color: '#22C55E',
    description: 'Gastos ya reembolsados',
    descriptionEn: 'Expenses already reimbursed',
  },
  {
    name: 'Pendiente',
    nameEn: 'Pending',
    color: '#EAB308',
    description: 'Gastos esperando aprobación',
    descriptionEn: 'Expenses waiting for approval',
  },
  {
    name: 'Recurrente',
    nameEn: 'Recurring',
    color: '#3B82F6',
    description: 'Suscripciones y pagos mensuales',
    descriptionEn: 'Subscriptions and monthly payments',
  },
  {
    name: 'Cliente Premium',
    nameEn: 'Premium Client',
    color: '#8B5CF6',
    description: 'Gastos de clientes importantes',
    descriptionEn: 'Important client expenses',
  },
  {
    name: 'Viaje de Negocios',
    nameEn: 'Business Trip',
    color: '#F97316',
    description: 'Gastos durante viajes de trabajo',
    descriptionEn: 'Expenses during business trips',
  },
  {
    name: 'Personal',
    nameEn: 'Personal',
    color: '#6B7280',
    description: 'Gastos no deducibles/personales',
    descriptionEn: 'Non-deductible/personal expenses',
  },
  {
    name: 'Marketing',
    nameEn: 'Marketing',
    color: '#EC4899',
    description: 'Gastos de publicidad y promoción',
    descriptionEn: 'Advertising and promotion expenses',
  },
];

export const TAG_COLOR_PALETTE = [
  { color: '#EF4444', name: 'Rojo', nameEn: 'Red' },
  { color: '#F97316', name: 'Naranja', nameEn: 'Orange' },
  { color: '#EAB308', name: 'Amarillo', nameEn: 'Yellow' },
  { color: '#22C55E', name: 'Verde', nameEn: 'Green' },
  { color: '#14B8A6', name: 'Turquesa', nameEn: 'Teal' },
  { color: '#3B82F6', name: 'Azul', nameEn: 'Blue' },
  { color: '#6366F1', name: 'Índigo', nameEn: 'Indigo' },
  { color: '#8B5CF6', name: 'Púrpura', nameEn: 'Purple' },
  { color: '#EC4899', name: 'Rosa', nameEn: 'Pink' },
  { color: '#6B7280', name: 'Gris', nameEn: 'Gray' },
];
