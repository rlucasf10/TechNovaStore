/**
 * Logger estructurado para el servicio de seguimiento de envíos
 * Utiliza Winston a través del paquete compartido @technovastore/shared-config
 */

import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

export const logger = createLogger('shipment-tracker');

// Exportar funciones de utilidad para logging estructurado
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };
