/**
 * Middleware de Logging de Auditoría
 * 
 * Registra todas las operaciones administrativas con información del usuario.
 * 
 * Requirements: 10.9, 12.1
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { AuthenticatedRequest } from './auth'

/**
 * Información de auditoría
 */
interface AuditInfo {
  timestamp: string
  userId?: string
  userEmail?: string
  userRole?: string
  method: string
  path: string
  ip: string
  userAgent?: string
  statusCode?: number
  responseTime?: number
  body?: any
  params?: any
  query?: any
  error?: string
}

/**
 * Obtiene la IP del cliente del request
 * 
 * @param req - Request de Express
 * @returns IP del cliente
 */
function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for']
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
    return ips.split(',')[0].trim()
  }

  const realIp = req.headers['x-real-ip']
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp
  }

  return req.socket.remoteAddress || 'unknown'
}

/**
 * Determina si una operación es administrativa
 * 
 * Las operaciones administrativas son aquellas que modifican datos:
 * - POST (crear)
 * - PUT (actualizar)
 * - DELETE (eliminar)
 * 
 * @param method - Método HTTP
 * @returns true si es operación administrativa
 */
function isAdministrativeOperation(method: string): boolean {
  return ['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())
}

/**
 * Sanitiza el body del request para logging
 * 
 * Elimina campos sensibles como passwords, tokens, etc.
 * 
 * @param body - Body del request
 * @returns Body sanitizado
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sanitized = { ...body }
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***'
    }
  }

  return sanitized
}

/**
 * Middleware de logging de auditoría
 * 
 * Requirement 10.9: Registrar operaciones administrativas con usuario
 * Requirement 12.1: Registrar cada campaña creada, actualizada o eliminada
 * 
 * Este middleware debe aplicarse DESPUÉS del middleware de autenticación
 * para tener acceso a la información del usuario.
 * 
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 * 
 * @example
 * ```typescript
 * app.use(authenticateJWT)
 * app.use(auditLogger)
 * ```
 */
export function auditLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Solo registrar operaciones administrativas
  if (!isAdministrativeOperation(req.method)) {
    next()
    return
  }

  const startTime = Date.now()

  // Información básica de auditoría
  const auditInfo: AuditInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
    params: req.params,
    query: req.query,
    body: sanitizeBody(req.body)
  }

  // Agregar información del usuario si está autenticado
  if (req.user) {
    auditInfo.userId = req.user.userId
    auditInfo.userEmail = req.user.email
    auditInfo.userRole = req.user.role
  }

  // Interceptar el response para registrar el resultado
  const originalSend = res.send
  const originalJson = res.json

  // Override res.send
  res.send = function (data: any): Response {
    auditInfo.statusCode = res.statusCode
    auditInfo.responseTime = Date.now() - startTime

    // Registrar auditoría
    logAudit(auditInfo)

    return originalSend.call(this, data)
  }

  // Override res.json
  res.json = function (data: any): Response {
    auditInfo.statusCode = res.statusCode
    auditInfo.responseTime = Date.now() - startTime

    // Si es un error, registrar el mensaje
    if (res.statusCode >= 400 && data && data.message) {
      auditInfo.error = data.message
    }

    // Registrar auditoría
    logAudit(auditInfo)

    return originalJson.call(this, data)
  }

  next()
}

/**
 * Registra la información de auditoría en el logger
 * 
 * @param auditInfo - Información de auditoría
 */
function logAudit(auditInfo: AuditInfo): void {
  const level = auditInfo.statusCode && auditInfo.statusCode >= 400 ? 'warn' : 'info'
  
  const message = `${auditInfo.method} ${auditInfo.path} - ${auditInfo.statusCode} - ${auditInfo.responseTime}ms`

  logger.log(level, message, {
    type: 'audit',
    operation: getOperationType(auditInfo.method, auditInfo.path),
    ...auditInfo
  })
}

/**
 * Determina el tipo de operación basado en el método y path
 * 
 * @param method - Método HTTP
 * @param path - Path del request
 * @returns Tipo de operación
 */
function getOperationType(method: string, path: string): string {
  const upperMethod = method.toUpperCase()

  if (path.includes('/campaigns')) {
    if (upperMethod === 'POST' && path.includes('/apply-discounts')) {
      return 'apply_discounts'
    }
    if (upperMethod === 'POST' && path.includes('/remove-discounts')) {
      return 'remove_discounts'
    }
    if (upperMethod === 'POST') {
      return 'create_campaign'
    }
    if (upperMethod === 'PUT') {
      return 'update_campaign'
    }
    if (upperMethod === 'DELETE') {
      return 'delete_campaign'
    }
  }

  return `${upperMethod.toLowerCase()}_${path.split('/').pop() || 'unknown'}`
}

/**
 * Middleware de auditoría para operaciones específicas de campaña
 * 
 * Este middleware registra información adicional específica de campañas.
 * Debe aplicarse DESPUÉS del middleware de auditoría general.
 * 
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 */
export function campaignAuditLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Solo para operaciones de campaña
  if (!req.path.includes('/campaigns')) {
    next()
    return
  }

  const startTime = Date.now()

  // Interceptar el response para registrar información adicional
  const originalJson = res.json

  res.json = function (data: any): Response {
    const responseTime = Date.now() - startTime

    // Registrar información específica de campaña
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const campaignInfo: any = {
        type: 'campaign_operation',
        operation: getOperationType(req.method, req.path),
        responseTime,
        userId: req.user?.userId,
        userEmail: req.user?.email
      }

      // Agregar información específica según la operación
      if (data) {
        if (data.id) {
          campaignInfo.campaignId = data.id
        }
        if (data.name) {
          campaignInfo.campaignName = data.name
        }
        if (data.productsAffected !== undefined) {
          campaignInfo.productsAffected = data.productsAffected
        }
        if (data.productsRestored !== undefined) {
          campaignInfo.productsRestored = data.productsRestored
        }
      }

      logger.info('Operación de campaña completada', campaignInfo)
    }

    return originalJson.call(this, data)
  }

  next()
}

/**
 * Middleware combinado de auditoría
 * 
 * Aplica tanto el logging de auditoría general como el específico de campañas.
 * 
 * @example
 * ```typescript
 * app.use(authenticateJWT)
 * app.use(combinedAuditLogger)
 * ```
 */
export function combinedAuditLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  auditLogger(req, res, () => {
    campaignAuditLogger(req, res, next)
  })
}
