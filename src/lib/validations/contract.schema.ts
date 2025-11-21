import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export const contractFormSchema = z.object({
  client_id: z.string().uuid().optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, 'El archivo no debe superar 10MB')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Solo se aceptan archivos PDF, PNG o JPG'
    ),
  billing_profile: z.record(z.any()).optional(),
});

export type ContractFormSchema = z.infer<typeof contractFormSchema>;
