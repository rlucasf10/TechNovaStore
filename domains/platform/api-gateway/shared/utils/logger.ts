import { createLogger, logRequest, logError, logBusinessEvent, logPerformance, logSecurity } from '@technovastore/shared-config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logger: any = createLogger('api-gateway');

// Export utility functions for structured logging
export { logRequest, logError, logBusinessEvent, logPerformance, logSecurity };
