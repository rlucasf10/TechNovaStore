/**
 * Helpers para React Hook Form
 * 
 * Utilidades para trabajar con formularios
 */

import { FieldError, FieldErrors } from 'react-hook-form';

/**
 * Obtener mensaje de error de un campo
 */
export const getFieldError = (
  errors: FieldErrors,
  fieldName: string
): string | undefined => {
  const error = errors[fieldName] as FieldError | undefined;
  return error?.message;
};

/**
 * Verificar si un campo tiene error
 */
export const hasFieldError = (
  errors: FieldErrors,
  fieldName: string
): boolean => {
  return !!errors[fieldName];
};

/**
 * Obtener clases CSS para input según estado
 */
export const getInputClasses = (
  hasError: boolean,
  baseClasses: string = ''
): string => {
  const errorClasses = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
  
  return `${baseClasses} ${errorClasses}`.trim();
};

/**
 * Formatear errores de API para mostrar en formulario
 */
export const formatApiErrors = (
  apiErrors: Record<string, string[]> | undefined
): Record<string, { message: string }> => {
  if (!apiErrors) return {};
  
  const formattedErrors: Record<string, { message: string }> = {};
  
  Object.entries(apiErrors).forEach(([field, messages]) => {
    formattedErrors[field] = {
      message: messages[0] || 'Error de validación',
    };
  });
  
  return formattedErrors;
};

/**
 * Validar número de tarjeta de crédito (Algoritmo de Luhn)
 */
export const validateCreditCard = (cardNumber: string): boolean => {
  // Remover espacios y guiones
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Verificar que solo contenga números
  if (!/^\d+$/.test(cleaned)) return false;
  
  // Verificar longitud (13-19 dígitos)
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
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
};

/**
 * Detectar tipo de tarjeta de crédito
 */
export const detectCardType = (cardNumber: string): string | null => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^(?:2131|1800|35)/,
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }
  
  return null;
};

/**
 * Formatear número de tarjeta con espacios
 */
export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const match = cleaned.match(/.{1,4}/g);
  return match ? match.join(' ') : cleaned;
};

/**
 * Formatear fecha de expiración (MM/YY)
 */
export const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  
  return cleaned;
};

/**
 * Validar fecha de expiración
 */
export const validateExpiryDate = (month: string, year: string): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);
  
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
};

/**
 * Enmascarar número de tarjeta (mostrar solo últimos 4 dígitos)
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  const lastFour = cleaned.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
};

/**
 * Validar CVV según tipo de tarjeta
 */
export const validateCVV = (cvv: string, cardType?: string | null): boolean => {
  const cleaned = cvv.replace(/\D/g, '');
  
  // American Express usa 4 dígitos, otros usan 3
  if (cardType === 'amex') {
    return cleaned.length === 4;
  }
  
  return cleaned.length === 3;
};

/**
 * Sanitizar input de texto (remover caracteres peligrosos)
 */
export const sanitizeInput = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
};

/**
 * Validar código postal según país
 */
export const validatePostalCode = (postalCode: string, country: string): boolean => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    MX: /^\d{5}$/,
    ES: /^\d{5}$/,
    AR: /^[A-Z]?\d{4}[A-Z]{0,3}$/i,
  };
  
  const pattern = patterns[country.toUpperCase()];
  if (!pattern) return true; // Si no hay patrón, aceptar cualquier valor
  
  return pattern.test(postalCode);
};
