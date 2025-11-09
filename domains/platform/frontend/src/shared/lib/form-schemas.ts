/**
 * Esquemas de validación con Zod
 * 
 * Esquemas reutilizables para validación de formularios
 */

import { z } from 'zod';

/**
 * Esquema de validación de email
 */
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Email inválido')
  .toLowerCase();

/**
 * Esquema de validación de contraseña
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

/**
 * Esquema de validación de nombre
 */
export const nameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(50, 'El nombre no puede tener más de 50 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras');

/**
 * Esquema de validación de teléfono
 */
export const phoneSchema = z
  .string()
  .min(1, 'El teléfono es requerido')
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Teléfono inválido');

/**
 * Esquema de Login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Esquema de Registro
 */
export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  acceptTerms: z.boolean().refine((val: boolean) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Esquema de Recuperación de Contraseña (Paso 1)
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Esquema de Restablecer Contraseña (Paso 2)
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Esquema de Establecer Contraseña (para usuarios OAuth)
 */
export const setPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

/**
 * Esquema de Cambiar Contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
}).refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data: { currentPassword: string; newPassword: string }) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Esquema de Dirección
 */
export const addressSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado/provincia es requerido'),
  postalCode: z.string().min(4, 'El código postal es requerido'),
  country: z.string().min(2, 'El país es requerido'),
  phone: phoneSchema,
  isDefault: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Esquema de Tarjeta de Crédito
 */
export const creditCardSchema = z.object({
  cardNumber: z.string()
    .min(13, 'Número de tarjeta inválido')
    .max(19, 'Número de tarjeta inválido')
    .regex(/^[0-9]+$/, 'Solo números'),
  cardholderName: z.string().min(3, 'Nombre del titular requerido'),
  expiryMonth: z.string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Mes inválido (01-12)'),
  expiryYear: z.string()
    .regex(/^[0-9]{2}$/, 'Año inválido (YY)')
    .refine((year: string) => {
      const currentYear = new Date().getFullYear() % 100;
      return parseInt(year) >= currentYear;
    }, 'La tarjeta está vencida'),
  cvv: z.string()
    .regex(/^[0-9]{3,4}$/, 'CVV inválido (3-4 dígitos)'),
  saveCard: z.boolean().optional(),
});

export type CreditCardFormData = z.infer<typeof creditCardSchema>;

/**
 * Esquema de Review de Producto
 */
export const productReviewSchema = z.object({
  rating: z.number().min(1, 'Selecciona una calificación').max(5),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  comment: z.string().min(20, 'El comentario debe tener al menos 20 caracteres').max(1000),
  recommend: z.boolean().optional(),
});

export type ProductReviewFormData = z.infer<typeof productReviewSchema>;

/**
 * Esquema de Búsqueda
 */
export const searchSchema = z.object({
  query: z.string().min(1, 'Ingresa un término de búsqueda').max(100),
});

export type SearchFormData = z.infer<typeof searchSchema>;

/**
 * Helper para validar fortaleza de contraseña
 */
export const getPasswordStrength = (password: string): {
  score: number; // 0-4
  label: 'Muy débil' | 'Débil' | 'Media' | 'Fuerte' | 'Muy fuerte';
  color: 'red' | 'orange' | 'yellow' | 'green' | 'emerald';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  const labels: Array<'Muy débil' | 'Débil' | 'Media' | 'Fuerte' | 'Muy fuerte'> = [
    'Muy débil',
    'Débil',
    'Media',
    'Fuerte',
    'Muy fuerte',
  ];
  
  const colors: Array<'red' | 'orange' | 'yellow' | 'green' | 'emerald'> = [
    'red',
    'orange',
    'yellow',
    'green',
    'emerald',
  ];
  
  return {
    score,
    label: labels[score],
    color: colors[score],
    checks,
  };
};
