/**
 * Logger estructurado para el Ticket Service
 * Utiliza Winston a través del paquete compartido @technovastore/shared-config
 */

import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

export const logger = createLogger('ticket-service');

// Exportar funciones de utilidad para logging estructurado
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };
