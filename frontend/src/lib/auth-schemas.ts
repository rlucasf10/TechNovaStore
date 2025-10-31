/**
 * Esquemas de validación con Zod para formularios de autenticación
 */

import { z } from 'zod';
import { validatePassword } from './password-validation';

// ============================================================================
// Esquemas de Validación
// ============================================================================

/**
 * Esquema de validación para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Esquema de validación para registro
 */
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
    lastName: z
      .string()
      .min(1, 'El apellido es requerido')
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email válido')
      .toLowerCase(),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .refine(
        (password) => {
          const validation = validatePassword(password);
          return validation.valid;
        },
        {
          message: 'La contraseña no cumple con los requisitos de seguridad',
        }
      ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Debes aceptar los términos y condiciones',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Esquema de validación para recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .toLowerCase(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Esquema de validación para restablecer contraseña
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .refine(
        (password) => {
          const validation = validatePassword(password);
          return validation.valid;
        },
        {
          message: 'La contraseña no cumple con los requisitos de seguridad',
        }
      ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Esquema de validación para establecer contraseña (usuarios OAuth)
 */
export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .refine(
        (password) => {
          const validation = validatePassword(password);
          return validation.valid;
        },
        {
          message: 'La contraseña no cumple con los requisitos de seguridad',
        }
      ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

/**
 * Esquema de validación para cambiar contraseña
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(1, 'La nueva contraseña es requerida')
      .refine(
        (password) => {
          const validation = validatePassword(password);
          return validation.valid;
        },
        {
          message: 'La contraseña no cumple con los requisitos de seguridad',
        }
      ),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Esquema de validación para actualizar perfil
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .toLowerCase(),
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => {
        if (!phone) return true;
        // Validar formato de teléfono (español)
        return /^(\+34|0034|34)?[6789]\d{8}$/.test(phone.replace(/\s/g, ''));
      },
      {
        message: 'Ingresa un número de teléfono válido',
      }
    ),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

/**
 * Esquema de validación para dirección
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(1, 'La dirección es requerida')
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  city: z
    .string()
    .min(1, 'La ciudad es requerida')
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),
  state: z
    .string()
    .min(1, 'La provincia/estado es requerida')
    .min(2, 'La provincia/estado debe tener al menos 2 caracteres')
    .max(100, 'La provincia/estado no puede exceder 100 caracteres'),
  postalCode: z
    .string()
    .min(1, 'El código postal es requerido')
    .regex(/^\d{5}$/, 'Ingresa un código postal válido (5 dígitos)'),
  country: z
    .string()
    .min(1, 'El país es requerido')
    .min(2, 'El país debe tener al menos 2 caracteres')
    .max(100, 'El país no puede exceder 100 caracteres'),
  isDefault: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
