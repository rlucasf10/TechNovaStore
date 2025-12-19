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
 * Esquema de Tarjeta de Crédito con validación Luhn
 */
export const creditCardSchema = z.object({
  cardNumber: z.string()
    .min(1, 'Número de tarjeta es obligatorio')
    .transform((val) => val.replace(/\s/g, '')) // Remover espacios
    .refine(
      (val) => val.length >= 13 && val.length <= 19,
      'Número de tarjeta debe tener entre 13 y 19 dígitos'
    )
    .refine(
      (val) => /^\d+$/.test(val),
      'Número de tarjeta solo puede contener dígitos'
    )
    .refine(
      (val) => isValidLuhn(val),
      'Número de tarjeta inválido (verificación Luhn falló)'
    ),
  cardholderName: z.string()
    .min(1, 'Nombre del titular es obligatorio')
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo puede contener letras'),
  expiryMonth: z.string()
    .min(1, 'Mes es obligatorio')
    .regex(/^(0[1-9]|1[0-2])$/, 'Mes inválido (debe ser 01-12)'),
  expiryYear: z.string()
    .min(1, 'Año es obligatorio')
    .regex(/^\d{4}$/, 'Año inválido (debe ser YYYY)')
    .refine((year: string) => {
      const currentYear = new Date().getFullYear();
      const yearNum = parseInt(year);
      return yearNum >= currentYear && yearNum <= currentYear + 20;
    }, 'La tarjeta está expirada o el año es inválido'),
  cvv: z.string()
    .min(1, 'CVV es obligatorio')
    .regex(/^\d{3,4}$/, 'CVV debe tener 3 o 4 dígitos'),
  saveCard: z.boolean().optional(),
}).refine((data) => {
  // Validar que la tarjeta no esté expirada considerando mes y año
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 0-indexed
  
  const expiryYear = parseInt(data.expiryYear);
  const expiryMonth = parseInt(data.expiryMonth);
  
  if (expiryYear < currentYear) return false;
  if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
  
  return true;
}, {
  message: 'La tarjeta ha expirado',
  path: ['expiryYear'],
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
  query: z.string()
    .min(1, 'Ingresa un término de búsqueda')
    .max(100, 'La búsqueda no puede exceder 100 caracteres')
    .trim(),
});

export type SearchFormData = z.infer<typeof searchSchema>;

/**
 * Esquema de Contacto/Soporte
 */
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string()
    .min(5, 'El asunto debe tener al menos 5 caracteres')
    .max(100, 'El asunto no puede exceder 100 caracteres'),
  message: z.string()
    .min(20, 'El mensaje debe tener al menos 20 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
  category: z.enum(['general', 'technical', 'billing', 'shipping', 'returns'], {
    errorMap: () => ({ message: 'Selecciona una categoría válida' }),
  }).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/**
 * Esquema de Newsletter
 */
export const newsletterSchema = z.object({
  email: emailSchema,
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar la política de privacidad',
  }),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

/**
 * Esquema de Cantidad de Producto
 */
export const productQuantitySchema = z.object({
  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(99, 'La cantidad máxima es 99'),
});

export type ProductQuantityFormData = z.infer<typeof productQuantitySchema>;

/**
 * Esquema de Código de Descuento
 */
export const discountCodeSchema = z.object({
  code: z.string()
    .min(1, 'Ingresa un código de descuento')
    .max(50, 'Código inválido')
    .trim()
    .toUpperCase(),
});

export type DiscountCodeFormData = z.infer<typeof discountCodeSchema>;

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
