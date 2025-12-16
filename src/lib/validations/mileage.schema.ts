import { z } from 'zod';

export const mileageSchema = z.object({
  date: z.date({
    required_error: 'La fecha es requerida',
  }),
  kilometers: z.number({
    required_error: 'Los kilómetros son requeridos',
  })
    .positive('Los kilómetros deben ser positivos')
    .max(10000, 'Máximo 10,000 km por viaje'),
  route: z.string()
    .min(1, 'La ruta es requerida')
    .max(500, 'La ruta debe tener menos de 500 caracteres')
    .trim(),
  purpose: z.string()
    .max(500, 'El propósito debe tener menos de 500 caracteres')
    .trim()
    .optional(),
  client_id: z.string().uuid().optional().nullable(),
  start_address: z.string().max(500).trim().optional().nullable(),
  end_address: z.string().max(500).trim().optional().nullable(),
  start_lat: z.number().min(-90).max(90).optional().nullable(),
  start_lng: z.number().min(-180).max(180).optional().nullable(),
  end_lat: z.number().min(-90).max(90).optional().nullable(),
  end_lng: z.number().min(-180).max(180).optional().nullable(),
});

export type MileageFormValues = z.infer<typeof mileageSchema>;
