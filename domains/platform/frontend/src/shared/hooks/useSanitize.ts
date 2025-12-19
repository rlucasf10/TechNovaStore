/**
 * Hook useSanitize
 * 
 * Proporciona funciones de sanitización XSS para usar en componentes React
 * 
 * Requisitos: 20.1 - Seguridad de autenticación y protección de datos
 * 
 * @example
 * const { sanitize, sanitizeUrl, escapeHtml } = useSanitize();
 * 
 * // Sanitizar HTML para renderizar
 * const safeHtml = sanitize(userContent);
 * 
 * // Sanitizar URL
 * const safeUrl = sanitizeUrl(userUrl);
 */

import { useCallback, useMemo } from 'react';
import {
  sanitizeHtml,
  sanitizeStrict,
  sanitizeMarkdown,
  sanitizeUrl as sanitizeUrlFn,
  escapeHtml as escapeHtmlFn,
  sanitizeFormInput,
  sanitizeObject,
  detectXssAttempt,
} from '../lib/xss-security';

export type SanitizeMode = 'default' | 'strict' | 'markdown';

interface UseSanitizeOptions {
  // Modo de sanitización por defecto
  defaultMode?: SanitizeMode;
  // Callback cuando se detecta un intento de XSS
  onXssDetected?: (value: string) => void;
  // Longitud máxima para inputs de formulario
  maxInputLength?: number;
}

interface UseSanitizeReturn {
  // Sanitiza HTML según el modo especificado
  sanitize: (value: string, mode?: SanitizeMode) => string;
  // Sanitiza URL (previene javascript:, data:, etc.)
  sanitizeUrl: (url: string) => string;
  // Escapa caracteres HTML (para mostrar como texto)
  escapeHtml: (text: string) => string;
  // Sanitiza input de formulario con límite de longitud
  sanitizeInput: (value: string, maxLength?: number) => string;
  // Sanitiza un objeto completo
  sanitizeData: <T extends Record<string, unknown>>(data: T) => T;
  // Verifica si hay intento de XSS
  hasXssAttempt: (value: string) => boolean;
}

/**
 * Hook para sanitización XSS en componentes React
 */
export const useSanitize = (options: UseSanitizeOptions = {}): UseSanitizeReturn => {
  const {
    defaultMode = 'default',
    onXssDetected,
    maxInputLength = 1000,
  } = options;

  // Función principal de sanitización
  const sanitize = useCallback(
    (value: string, mode: SanitizeMode = defaultMode): string => {
      // Detectar intento de XSS antes de sanitizar
      if (onXssDetected && detectXssAttempt(value)) {
        onXssDetected(value);
      }

      switch (mode) {
        case 'strict':
          return sanitizeStrict(value);
        case 'markdown':
          return sanitizeMarkdown(value);
        case 'default':
        default:
          return sanitizeHtml(value);
      }
    },
    [defaultMode, onXssDetected]
  );

  // Sanitizar URL
  const sanitizeUrl = useCallback((url: string): string => {
    if (onXssDetected && detectXssAttempt(url)) {
      onXssDetected(url);
    }
    return sanitizeUrlFn(url);
  }, [onXssDetected]);

  // Escapar HTML
  const escapeHtml = useCallback((text: string): string => {
    return escapeHtmlFn(text);
  }, []);

  // Sanitizar input de formulario
  const sanitizeInput = useCallback(
    (value: string, maxLength: number = maxInputLength): string => {
      if (onXssDetected && detectXssAttempt(value)) {
        onXssDetected(value);
      }
      return sanitizeFormInput(value, maxLength);
    },
    [maxInputLength, onXssDetected]
  );

  // Sanitizar objeto de datos
  const sanitizeData = useCallback(
    <T extends Record<string, unknown>>(data: T): T => {
      return sanitizeObject(data);
    },
    []
  );

  // Verificar intento de XSS
  const hasXssAttempt = useCallback((value: string): boolean => {
    return detectXssAttempt(value);
  }, []);

  return useMemo(
    () => ({
      sanitize,
      sanitizeUrl,
      escapeHtml,
      sanitizeInput,
      sanitizeData,
      hasXssAttempt,
    }),
    [sanitize, sanitizeUrl, escapeHtml, sanitizeInput, sanitizeData, hasXssAttempt]
  );
};

export default useSanitize;
