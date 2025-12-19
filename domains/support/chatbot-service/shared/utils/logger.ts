/**
 * Logger - Utilidad de logging para chatbot-service
 * Proporciona logging estructurado para eventos de seguridad y operaciones
 */

import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logger: any = createLogger('chatbot');

// Exportar funciones de utilidad para logging estructurado
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };

// Clase Logger con métodos adicionales específicos para chatbot
export class Logger {
  static info(message: string, meta?: any): void {
    logger.info(message, meta);
  }
  
  static error(message: string, meta?: any): void {
    logger.error(message, meta);
  }
  
  static warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }
  
  static debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }
}

// Exportar instancia del logger por defecto
export default logger;
