/**
 * Middleware de Rate Limiting
 * 
 * Implementa límite de requests por IP para proteger el servicio de abuso.
 * 
 * Requirement: 10.10
 */

import { Request, Response, NextFunction } from 'express'

/**
 * Estructura para almacenar información de rate limiting por IP
 */
interface RateLimitInfo {
  count: number
  resetTime: number
}

/**
 * Mapa de IPs a información de rate limiting
 */
const rateLimitMap = new Map<string, RateLimitInfo>()

/**
 * Configuración de rate limiting
 */
interface RateLimitConfig {
  windowMs: number // Ventana de tiempo en milisegundos
  maxRequests: number // Máximo de requests por ventana
  message?: string // Mensaje personalizado
  statusCode?: number // Código de estado HTTP
}

/**
 * Obtiene la IP del cliente del request
 * 
 * @param req - Request de Express
 * @returns IP del cliente
 */
function getClientIp(req: Request): string {
  // Intentar obtener IP de headers de proxy (X-Forwarded-For, X-Real-IP)
  const forwardedFor = req.headers['x-forwarded-for']
  if (forwardedFor) {
    // X-Forwarded-For puede contener múltiples IPs separadas por coma
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
    return ips.split(',')[0].trim()
  }

  const realIp = req.headers['x-real-ip']
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp
  }

  // Fallback a IP de socket
  return req.socket.remoteAddress || 'unknown'
}

/**
 * Limpia entradas expiradas del mapa de rate limiting
 * 
 * Esta función se ejecuta periódicamente para evitar que el mapa crezca indefinidamente.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [ip, info] of rateLimitMap.entries()) {
    if (now > info.resetTime) {
      keysToDelete.push(ip)
    }
  }

  for (const key of keysToDelete) {
    rateLimitMap.delete(key)
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)

/**
 * Crea un middleware de rate limiting
 * 
 * Requirement 10.10: Implementar límite de 100 requests por minuto por IP
 * 
 * @param config - Configuración del rate limiter
 * @returns Middleware de Express
 * 
 * @example
 * ```typescript
 * // Limitar a 100 requests por minuto
 * const limiter = createRateLimiter({
 *   windowMs: 60 * 1000, // 1 minuto
 *   maxRequests: 100
 * })
 * 
 * app.use('/api', limiter)
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Demasiadas solicitudes desde esta IP, por favor intente más tarde',
    statusCode = 429
  } = config

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req)
    const now = Date.now()

    // Obtener o crear información de rate limiting para esta IP
    let rateLimitInfo = rateLimitMap.get(ip)

    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      // Primera request o ventana expirada, crear nueva entrada
      rateLimitInfo = {
        count: 1,
        resetTime: now + windowMs
      }
      rateLimitMap.set(ip, rateLimitInfo)

      // Agregar headers de rate limiting
      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString())
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString())

      next()
      return
    }

    // Incrementar contador
    rateLimitInfo.count++

    // Verificar si se excedió el límite
    if (rateLimitInfo.count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000)

      res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString())
      res.setHeader('Retry-After', retryAfter.toString())

      res.status(statusCode).json({
        error: 'Too Many Requests',
        message,
        retryAfter
      })
      return
    }

    // Agregar headers de rate limiting
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', (maxRequests - rateLimitInfo.count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString())

    next()
  }
}

/**
 * Rate limiter predeterminado para el Campaign Manager Service
 * 
 * Requirement 10.10: Límite de 100 requests por minuto por IP
 */
export const defaultRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100,
  message: 'Demasiadas solicitudes desde esta IP. Límite: 100 requests por minuto'
})

/**
 * Rate limiter más estricto para operaciones sensibles
 * 
 * Útil para endpoints que modifican datos (POST, PUT, DELETE)
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30,
  message: 'Demasiadas solicitudes de modificación desde esta IP. Límite: 30 requests por minuto'
})

/**
 * Resetea el rate limiting para una IP específica
 * 
 * Útil para testing o para resetear manualmente el límite de una IP.
 * 
 * @param ip - IP a resetear
 */
export function resetRateLimitForIp(ip: string): void {
  rateLimitMap.delete(ip)
}

/**
 * Resetea todo el rate limiting
 * 
 * Útil para testing.
 */
export function resetAllRateLimits(): void {
  rateLimitMap.clear()
}

/**
 * Obtiene información de rate limiting para una IP
 * 
 * Útil para debugging y monitoring.
 * 
 * @param ip - IP a consultar
 * @returns Información de rate limiting o undefined si no existe
 */
export function getRateLimitInfo(ip: string): RateLimitInfo | undefined {
  return rateLimitMap.get(ip)
}
