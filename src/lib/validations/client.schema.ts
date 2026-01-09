import { z } from 'zod';

export const CLIENT_TYPES = [
  { value: 'private', label: 'Empresa Privada', labelEn: 'Private Company', icon: '🏢' },
  { value: 'government', label: 'Gobierno/Estatal', labelEn: 'Government', icon: '🏛️' },
  { value: 'nonprofit', label: 'Sin Fines de Lucro', labelEn: 'Non-Profit', icon: '🤝' },
  { value: 'individual', label: 'Persona Física', labelEn: 'Individual', icon: '👤' },
] as const;

export const INDUSTRIES = [
  { value: 'technology', label: 'Tecnología', labelEn: 'Technology' },
  { value: 'healthcare', label: 'Salud', labelEn: 'Healthcare' },
  { value: 'finance', label: 'Finanzas', labelEn: 'Finance' },
  { value: 'retail', label: 'Retail/Comercio', labelEn: 'Retail' },
  { value: 'manufacturing', label: 'Manufactura', labelEn: 'Manufacturing' },
  { value: 'education', label: 'Educación', labelEn: 'Education' },
  { value: 'consulting', label: 'Consultoría', labelEn: 'Consulting' },
  { value: 'construction', label: 'Construcción', labelEn: 'Construction' },
  { value: 'hospitality', label: 'Hotelería/Turismo', labelEn: 'Hospitality' },
  { value: 'media', label: 'Medios/Entretenimiento', labelEn: 'Media/Entertainment' },
  { value: 'other', label: 'Otro', labelEn: 'Other' },
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  { value: 15, label: '15 días', labelEn: '15 days' },
  { value: 30, label: '30 días', labelEn: '30 days' },
  { value: 45, label: '45 días', labelEn: '45 days' },
  { value: 60, label: '60 días', labelEn: '60 days' },
  { value: 90, label: '90 días', labelEn: '90 days' },
] as const;

export const clientSchema = z.object({
  name: z.string()
    .min(1, 'Client name is required')
    .max(200, 'Client name must be less than 200 characters')
    .trim(),
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country name too long')
    .default('Canada'),
  province: z.string()
    .max(100, 'Province name too long')
    .optional()
    .nullable(),
  notes: z.string()
    .max(1000, 'Notes too long')
    .trim()
    .optional()
    .nullable(),
  // New fields
  industry: z.string()
    .max(100, 'Industry name too long')
    .optional()
    .nullable(),
  client_type: z.string()
    .max(50, 'Client type too long')
    .default('private')
    .optional()
    .nullable(),
  contact_email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional()
    .nullable()
    .or(z.literal('')),
  contact_phone: z.string()
    .max(50, 'Phone number too long')
    .optional()
    .nullable(),
  payment_terms: z.number()
    .int()
    .min(1, 'Payment terms must be at least 1 day')
    .max(365, 'Payment terms must be less than 365 days')
    .default(30)
    .optional()
    .nullable(),
  currency: z.string()
    .max(10, 'Currency code too long')
    .default('CAD')
    .optional()
    .nullable(),
  tax_id: z.string()
    .max(50, 'Tax ID too long')
    .optional()
    .nullable(),
  website: z.string()
    .url('Invalid URL format')
    .max(255, 'Website URL too long')
    .optional()
    .nullable()
    .or(z.literal('')),
  entity_id: z.string().uuid().optional().nullable(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
