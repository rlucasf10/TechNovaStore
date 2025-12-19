/**
 * safeJsonParse - Utilidad para parsear JSON de forma segura
 * 
 * Proporciona parsing seguro de JSON con manejo de errores y logging.
 * Previene crashes de la aplicación cuando se recibe JSON inválido de fuentes externas.
 */

import logger from './logger';

/**
 * Parsea JSON de forma segura con manejo de errores
 * 
 * Esta función envuelve JSON.parse() en un try-catch para prevenir crashes
 * cuando se recibe JSON inválido de fuentes externas (APIs, streams, etc.).
 * 
 * @template T - Tipo del objeto esperado después del parsing
 * @param jsonString - String JSON a parsear
 * @param defaultValue - Valor por defecto a retornar si el parsing falla
 * @param context - Contexto para logging (ej: 'OllamaAdapter.parseStreamLine')
 * @returns Objeto parseado del tipo T, o el valor por defecto si falla
 * 
 * @example
 * ```typescript
 * // Parsear respuesta de API con valor por defecto
 * const data = safeJsonParse<ApiResponse>(
 *   responseString,
 *   { success: false, data: null },
 *   'ApiClient.parseResponse'
 * );
 * 
 * // Parsear línea de stream con valor por defecto
 * const chunk = safeJsonParse<OllamaResponse>(
 *   line,
 *   { done: true, message: { role: 'assistant', content: '' } },
 *   'OllamaAdapter.parseStreamLine'
 * );
 * ```
 */
export function safeJsonParse<T>(
  jsonString: string,
  defaultValue: T,
  context: string
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    // Loggear el error con contexto para debugging
    logger.error(`JSON parse error in ${context}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      jsonPreview: jsonString.substring(0, 100), // Solo primeros 100 caracteres
      jsonLength: jsonString.length,
      context
    });
    
    // Retornar valor por defecto seguro
    return defaultValue;
  }
}
