import { z } from 'zod';

export const tagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be less than 50 characters')
    .trim(),
  color: z.string()
    .regex(/^#([A-Fa-f0-9]{6})$/, 'Invalid color format')
    .default('#3B82F6'),
});

export type TagFormValues = z.infer<typeof tagSchema>;
