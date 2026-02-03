import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  fullNameSchema,
  loginSchema,
  signupSchema,
  getAuthErrorMessage,
} from '@/lib/validations/auth.schema';

describe('Auth Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@gmail.com',
        'test.user@company.co',
        'name+tag@domain.org',
        'user123@subdomain.domain.com',
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success, `Expected ${email} to be valid`).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@nodomain.com',
        'user@',
        'user@.com',
        'user space@domain.com',
      ];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success, `Expected ${email} to be invalid`).toBe(false);
      });
    });

    it('should block disposable/fake email domains', () => {
      const blockedDomains = [
        'user@test.com',
        'user@example.com',
        'user@fake.com',
        'user@temp.com',
        'user@asdf.com',
      ];

      blockedDomains.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success, `Expected ${email} to be blocked`).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('email real');
        }
      });
    });

    it('should reject emails exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@domain.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        '123456',
        'password123',
        'MySecureP@ssw0rd!',
        'a'.repeat(72),
      ];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success, `Expected "${password}" to be valid`).toBe(true);
      });
    });

    it('should reject passwords shorter than 6 characters', () => {
      const shortPasswords = ['', '1', '12', '123', '1234', '12345'];

      shortPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success, `Expected "${password}" to be too short`).toBe(false);
      });
    });

    it('should reject passwords exceeding 72 characters', () => {
      const longPassword = 'a'.repeat(73);
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
    });
  });

  describe('fullNameSchema', () => {
    it('should accept valid names', () => {
      const validNames = [
        'Jo',
        'John',
        'John Doe',
        'María García',
        'José-Luis',
        "O'Connor",
      ];

      validNames.forEach((name) => {
        const result = fullNameSchema.safeParse(name);
        expect(result.success, `Expected "${name}" to be valid`).toBe(true);
      });
    });

    it('should reject names shorter than 2 characters', () => {
      const shortNames = ['', 'J', ' ', '  '];

      shortNames.forEach((name) => {
        const result = fullNameSchema.safeParse(name);
        expect(result.success, `Expected "${name}" to be too short`).toBe(false);
      });
    });

    it('should reject names exceeding 100 characters', () => {
      const longName = 'A'.repeat(101);
      const result = fullNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace and validate', () => {
      const result = fullNameSchema.safeParse('  A  '); // Trimmed = 1 char
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@gmail.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject login with empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@gmail.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject login with invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should accept valid signup data', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Doe',
        email: 'john@gmail.com',
        password: 'securepassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject signup with short password', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Doe',
        email: 'john@gmail.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject signup with blocked email domain', () => {
      const result = signupSchema.safeParse({
        fullName: 'John Doe',
        email: 'john@test.com',
        password: 'securepassword123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject signup with short name', () => {
      const result = signupSchema.safeParse({
        fullName: 'J',
        email: 'john@gmail.com',
        password: 'securepassword123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should translate known Supabase errors to Spanish', () => {
      expect(getAuthErrorMessage('Invalid login credentials')).toBe(
        'Email o contraseña incorrectos'
      );
      expect(getAuthErrorMessage('Email not confirmed')).toBe(
        'Por favor confirma tu email antes de iniciar sesión'
      );
      expect(getAuthErrorMessage('User already registered')).toBe(
        'Este email ya está registrado. ¿Quieres iniciar sesión?'
      );
      expect(getAuthErrorMessage('Email rate limit exceeded')).toBe(
        'Demasiados intentos. Espera un momento antes de intentar de nuevo'
      );
    });

    it('should return original message for unknown errors', () => {
      const unknownError = 'Some unknown error message';
      expect(getAuthErrorMessage(unknownError)).toBe(unknownError);
    });

    it('should handle password validation errors', () => {
      expect(getAuthErrorMessage('Password should be at least 6 characters')).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );
    });
  });
});
