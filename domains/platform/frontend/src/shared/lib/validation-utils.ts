/**
 * Utilidades de validación
 * 
 * Helpers y constantes para validación de formularios
 */

import { ZodError } from 'zod';

/**
 * Mensajes de error comunes en español
 */
export const validationMessages = {
  required: 'Este campo es obligatorio',
  email: 'Ingresa un email válido',
  minLength: (min: number) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max: number) => `No puede exceder ${max} caracteres`,
  minValue: (min: number) => `El valor mínimo es ${min}`,
  maxValue: (max: number) => `El valor máximo es ${max}`,
  onlyLetters: 'Solo puede contener letras',
  onlyNumbers: 'Solo puede contener números',
  alphanumeric: 'Solo puede contener letras y números',
  invalidFormat: 'Formato inválido',
  passwordMismatch: 'Las contraseñas no coinciden',
  mustAccept: 'Debes aceptar para continuar',
  invalidDate: 'Fecha inválida',
  futureDate: 'La fecha debe ser futura',
  pastDate: 'La fecha debe ser pasada',
  invalidPhone: 'Número de teléfono inválido',
  invalidPostalCode: 'Código postal inválido',
  invalidUrl: 'URL inválida',
};

/**
 * Convierte errores de Zod a un objeto de errores por campo
 */
export function zodErrorsToFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (path) {
      fieldErrors[path] = err.message;
    }
  });
  
  return fieldErrors;
}

/**
 * Valida un email con regex más estricta
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Valida un teléfono español
 */
export function isValidSpanishPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s/g, '');
  // Formato: +34 o 0034 o 34 seguido de 9 dígitos que empiezan con 6, 7, 8 o 9
  return /^(\+34|0034|34)?[6789]\d{8}$/.test(cleanPhone);
}

/**
 * Valida un código postal español
 */
export function isValidSpanishPostalCode(postalCode: string): boolean {
  return /^\d{5}$/.test(postalCode);
}

/**
 * Valida una URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
}

/**
 * Valida que un string solo contenga letras (incluyendo acentos)
 */
export function isOnlyLetters(str: string): boolean {
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str);
}

/**
 * Valida que un string solo contenga números
 */
export function isOnlyNumbers(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Valida que un string sea alfanumérico
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Formatea un número de teléfono español
 */
export function formatSpanishPhone(phone: string): string {
  const cleanPhone = phone.replace(/\s/g, '');
  
  // Si tiene prefijo internacional, formatearlo
  if (cleanPhone.startsWith('+34') || cleanPhone.startsWith('0034')) {
    const number = cleanPhone.replace(/^(\+34|0034)/, '');
    return `+34 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }
  
  // Si tiene prefijo 34 sin +
  if (cleanPhone.startsWith('34') && cleanPhone.length === 11) {
    const number = cleanPhone.slice(2);
    return `+34 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }
  
  // Si es solo el número
  if (cleanPhone.length === 9) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  return phone;
}

/**
 * Formatea un código postal español
 */
export function formatSpanishPostalCode(postalCode: string): string {
  const cleanCode = postalCode.replace(/\s/g, '');
  if (cleanCode.length === 5) {
    return `${cleanCode.slice(0, 2)} ${cleanCode.slice(2)}`;
  }
  return postalCode;
}

/**
 * Valida fortaleza de contraseña y retorna score
 */
export function getPasswordStrengthScore(password: string): number {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  return Math.min(score, 5);
}

/**
 * Obtiene el label de fortaleza de contraseña
 */
export function getPasswordStrengthLabel(score: number): string {
  const labels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  return labels[Math.min(score, 4)];
}

/**
 * Obtiene el color de fortaleza de contraseña
 */
export function getPasswordStrengthColor(score: number): string {
  const colors = ['red', 'orange', 'yellow', 'green', 'emerald'];
  return colors[Math.min(score, 4)];
}

/**
 * Valida que dos valores sean iguales (útil para confirmación de contraseña)
 */
export function areValuesEqual(value1: string, value2: string): boolean {
  return value1 === value2;
}

/**
 * Valida que una fecha sea futura
 */
export function isFutureDate(date: Date): boolean {
  return date > new Date();
}

/**
 * Valida que una fecha sea pasada
 */
export function isPastDate(date: Date): boolean {
  return date < new Date();
}

/**
 * Valida que una fecha esté en un rango
 */
export function isDateInRange(date: Date, min: Date, max: Date): boolean {
  return date >= min && date <= max;
}

/**
 * Limpia un número de tarjeta de crédito (remueve espacios y guiones)
 */
export function cleanCardNumber(cardNumber: string): string {
  return cardNumber.replace(/[\s-]/g, '');
}

/**
 * Formatea un número de tarjeta de crédito con espacios
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cleanCardNumber(cardNumber);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

/**
 * Enmascara un número de tarjeta de crédito (muestra solo últimos 4 dígitos)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cleanCardNumber(cardNumber);
  if (cleaned.length < 4) return cleaned;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  return formatCardNumber(masked + lastFour);
}

/**
 * Valida un CVV según el tipo de tarjeta
 */
export function isValidCVV(cvv: string, cardType: 'amex' | 'other'): boolean {
  const expectedLength = cardType === 'amex' ? 4 : 3;
  return /^\d+$/.test(cvv) && cvv.length === expectedLength;
}

/**
 * Detecta el tipo de tarjeta basado en el número
 */
export function detectCardType(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown' {
  const cleaned = cleanCardNumber(cardNumber);
  
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  
  return 'unknown';
}

/**
 * Valida un número de tarjeta usando el algoritmo de Luhn
 */
export function validateLuhn(cardNumber: string): boolean {
  const cleaned = cleanCardNumber(cardNumber);
  if (!/^\d+$/.test(cleaned)) return false;

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
}

/**
 * Trunca un texto a un número máximo de caracteres
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convierte un string a title case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}
