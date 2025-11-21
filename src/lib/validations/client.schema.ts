import { z } from 'zod';

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
});

export type ClientFormValues = z.infer<typeof clientSchema>;
