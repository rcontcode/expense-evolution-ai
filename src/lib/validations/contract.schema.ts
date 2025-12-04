import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export const CONTRACT_TYPES = [
  { value: 'services', label: 'Contrato de Servicios', labelEn: 'Services Contract', icon: '📄' },
  { value: 'consulting', label: 'Acuerdo de Consultoría', labelEn: 'Consulting Agreement', icon: '📝' },
  { value: 'email', label: 'Acuerdo por Email', labelEn: 'Email Agreement', icon: '📧' },
  { value: 'employment', label: 'Contrato de Trabajo', labelEn: 'Employment Contract', icon: '💼' },
  { value: 'retainer', label: 'Retainer/Anticipo', labelEn: 'Retainer', icon: '🔄' },
  { value: 'purchase_order', label: 'Orden de Compra', labelEn: 'Purchase Order', icon: '🛒' },
  { value: 'nda', label: 'NDA/Confidencialidad', labelEn: 'NDA/Confidentiality', icon: '🤝' },
  { value: 'other', label: 'Otro', labelEn: 'Other', icon: '📜' },
] as const;

export const contractFormSchema = z.object({
  client_id: z.string().uuid().optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, 'El archivo no debe superar 10MB')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Solo se aceptan archivos PDF, PNG o JPG'
    ),
  // New fields
  title: z.string()
    .max(200, 'Title too long')
    .optional()
    .nullable(),
  contract_type: z.string()
    .default('services')
    .optional()
    .nullable(),
  start_date: z.date()
    .optional()
    .nullable(),
  end_date: z.date()
    .optional()
    .nullable(),
  auto_renew: z.boolean()
    .default(false)
    .optional(),
  renewal_notice_days: z.number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .optional()
    .nullable(),
  value: z.number()
    .min(0)
    .optional()
    .nullable(),
  description: z.string()
    .max(1000, 'Description too long')
    .optional()
    .nullable(),
  billing_profile: z.record(z.any()).optional(),
});

export type ContractFormSchema = z.infer<typeof contractFormSchema>;
