/**
 * Middleware Index
 * 
 * Exporta todos los middlewares de seguridad del Campaign Manager Service.
 */

export {
  authenticateJWT,
  optionalAuthenticateJWT,
  JwtPayload,
  AuthenticatedRequest,
} from './auth'

export {
  createRateLimiter,
  defaultRateLimiter,
  strictRateLimiter,
  resetRateLimitForIp,
  resetAllRateLimits,
  getRateLimitInfo,
} from './rate-limiter'

export {
  auditLogger,
  campaignAuditLogger,
  combinedAuditLogger,
} from './audit-logger'
