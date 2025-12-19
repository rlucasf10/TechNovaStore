import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

export const logger = createLogger('notification-service');

// Export utility functions for structured logging
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };
