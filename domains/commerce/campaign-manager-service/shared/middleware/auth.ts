/**
 * Middleware de Autenticación JWT
 * 
 * Valida tokens JWT en endpoints administrativos del Campaign Manager Service.
 * 
 * Requirements: 7.9, 10.8
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../../config'
import { logger } from '../utils/logger'

/**
 * Payload del token JWT
 */
export interface JwtPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Request extendido con información del usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

/**
 * Middleware de autenticación JWT
 * 
 * Valida el token JWT en el header Authorization y verifica que el usuario
 * tenga rol de administrador.
 * 
 * Requirement 7.9: Validar que el usuario tenga rol de administrador para
 * todos los endpoints excepto GET /api/campaigns/active
 * 
 * Requirement 10.8: Requerir autenticación JWT para todos los endpoints administrativos
 * 
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de autenticación no proporcionado'
      })
      return
    }

    // Verificar formato "Bearer <token>"
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Formato de token inválido. Use: Bearer <token>'
      })
      return
    }

    const token = parts[1]

    // Verificar y decodificar token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload

    // Verificar que el usuario tenga rol de administrador
    if (decoded.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Se requiere rol de administrador para esta operación'
      })
      return
    }

    // Agregar información del usuario al request
    req.user = decoded

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expirado'
      })
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido'
      })
      return
    }

    // Error inesperado
    logger.error('Error en autenticación JWT', { error: error instanceof Error ? error.message : error, ip: req.ip })
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al validar token de autenticación'
    })
  }
}

/**
 * Middleware opcional de autenticación JWT
 * 
 * Similar a authenticateJWT pero no retorna error si no hay token.
 * Útil para endpoints que pueden funcionar con o sin autenticación.
 * 
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 */
export function optionalAuthenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      // No hay token, continuar sin autenticación
      next()
      return
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Token mal formado, continuar sin autenticación
      next()
      return
    }

    const token = parts[1]

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
      req.user = decoded
    } catch {
      // Token inválido o expirado, continuar sin autenticación
    }

    next()
  } catch (error) {
    // Error inesperado, continuar sin autenticación
    logger.error('Error en autenticación JWT opcional', { error: error instanceof Error ? error.message : error })
    next()
  }
}
