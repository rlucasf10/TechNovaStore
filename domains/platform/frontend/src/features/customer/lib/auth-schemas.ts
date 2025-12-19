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


/**
 * Validación del algoritmo de Luhn para números de tarjeta
 */
function isValidLuhn(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (!/^\d+$/.test(cleanNumber)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Esquema de validación para método de pago
 */
export const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card'], {
    required_error: 'Selecciona el tipo de tarjeta',
  }),
  label: z
    .string()
    .min(1, 'La etiqueta es requerida')
    .max(50, 'La etiqueta no puede exceder 50 caracteres'),
  cardNumber: z
    .string()
    .min(1, 'El número de tarjeta es requerido')
    .refine(
      (val) => {
        const cleanNumber = val.replace(/\s/g, '');
        return cleanNumber.length >= 13 && cleanNumber.length <= 19;
      },
      { message: 'El número de tarjeta debe tener entre 13 y 19 dígitos' }
    )
    .refine(
      (val) => isValidLuhn(val),
      { message: 'El número de tarjeta no es válido' }
    ),
  cardholderName: z
    .string()
    .min(1, 'El nombre del titular es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'El nombre solo puede contener letras'
    ),
  expiryMonth: z
    .string()
    .min(1, 'El mes es requerido')
    .regex(/^(0[1-9]|1[0-2])$/, 'Mes inválido (01-12)'),
  expiryYear: z
    .string()
    .min(1, 'El año es requerido')
    .regex(/^\d{2}$/, 'Año inválido (2 dígitos)')
    .refine(
      (val) => {
        const currentYear = new Date().getFullYear() % 100;
        const year = parseInt(val, 10);
        return year >= currentYear && year <= currentYear + 20;
      },
      { message: 'La tarjeta está expirada o el año es inválido' }
    ),
  cvv: z
    .string()
    .min(1, 'El CVV es requerido')
    .regex(/^\d{3,4}$/, 'CVV inválido (3-4 dígitos)'),
  billingStreet: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{5}$/.test(val),
      { message: 'Código postal inválido (5 dígitos)' }
    ),
  billingCountry: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;
