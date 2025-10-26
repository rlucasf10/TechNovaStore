import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

export const logger = createLogger('api-gateway');

// Export utility functions for structured logging
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };