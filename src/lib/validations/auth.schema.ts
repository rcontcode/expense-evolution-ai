import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Ingresa un email válido')
  .max(255, 'El email es muy largo')
  .refine(
    (email) => {
      // Block obviously fake domains
      const fakeDomains = ['test.com', 'example.com', 'fake.com', 'temp.com', 'asdf.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      return !fakeDomains.includes(domain);
    },
    { message: 'Por favor usa un email real (no temporal)' }
  );

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .max(72, 'La contraseña es muy larga');

// Full name validation schema
export const fullNameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre es muy largo')
  .refine(
    (name) => name.trim().length >= 2,
    { message: 'El nombre no puede estar vacío' }
  );

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Signup form schema
export const signupSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Helper to get friendly error messages from Supabase
export function getAuthErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Por favor confirma tu email antes de iniciar sesión',
    'User already registered': 'Este email ya está registrado. ¿Quieres iniciar sesión?',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Unable to validate email address: invalid format': 'El formato del email no es válido',
    'Signup requires a valid password': 'Ingresa una contraseña válida',
    'Email rate limit exceeded': 'Demasiados intentos. Espera un momento antes de intentar de nuevo',
    'For security purposes, you can only request this once every 60 seconds': 'Por seguridad, solo puedes solicitar esto cada 60 segundos',
    'User not found': 'No existe una cuenta con este email',
    'New password should be different from the old password': 'La nueva contraseña debe ser diferente a la anterior',
  };

  return errorMap[errorMessage] || errorMessage;
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
