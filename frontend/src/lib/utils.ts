/**
 * Utilidades generales del proyecto
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind CSS de forma inteligente
 * Resuelve conflictos y elimina duplicados
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un precio en formato de moneda
 */
export function formatPrice(
  price: number,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'es-ES'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Verifica si estamos en el cliente (browser)
 */
export const isClient = typeof window !== 'undefined';

/**
 * Verifica si estamos en el servidor
 */
export const isServer = typeof window === 'undefined';

/**
 * Sleep function para delays
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
