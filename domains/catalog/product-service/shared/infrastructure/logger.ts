import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';
import type { Logger } from 'winston';

// Instancia del logger para el servicio de productos
export const logger: Logger = createLogger('product-service');

// Export utility functions for structured logging
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };