/**
 * Tests para Middleware de Autenticación JWT
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateJWT, optionalAuthenticateJWT, AuthenticatedRequest } from './auth'
import { config } from '../../config'

describe('Middleware de Autenticación JWT', () => {
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {}
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    nextFunction = jest.fn()
  })

  describe('authenticateJWT', () => {
    it('debe rechazar requests sin header Authorization', () => {
      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token de autenticación no proporcionado'
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe rechazar tokens con formato inválido', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123'
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Formato de token inválido. Use: Bearer <token>'
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe rechazar tokens sin prefijo Bearer', () => {
      const token = jwt.sign(
        { userId: '123', email: 'admin@test.com', role: 'admin' },
        config.jwtSecret
      )

      mockRequest.headers = {
        authorization: token
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Formato de token inválido. Use: Bearer <token>'
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe rechazar tokens inválidos', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token inválido'
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe rechazar tokens expirados', () => {
      const expiredToken = jwt.sign(
        { userId: '123', email: 'admin@test.com', role: 'admin' },
        config.jwtSecret,
        { expiresIn: '-1h' } // Token expirado hace 1 hora
      )

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token expirado'
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe rechazar usuarios sin rol de administrador', () => {
      const token = jwt.sign(
        { userId: '123', email: 'user@test.com', role: 'user' },
        config.jwtSecret
      )

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Se requiere rol de administrador para esta operación'
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe aceptar tokens válidos de administrador', () => {
      const payload = {
        userId: '123',
        email: 'admin@test.com',
        role: 'admin'
      }
      const token = jwt.sign(payload, config.jwtSecret)

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toBeDefined()
      expect(mockRequest.user?.userId).toBe('123')
      expect(mockRequest.user?.email).toBe('admin@test.com')
      expect(mockRequest.user?.role).toBe('admin')
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('debe agregar información del usuario al request', () => {
      const payload = {
        userId: 'admin-456',
        email: 'superadmin@test.com',
        role: 'admin'
      }
      const token = jwt.sign(payload, config.jwtSecret)

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      authenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(mockRequest.user).toEqual(
        expect.objectContaining({
          userId: 'admin-456',
          email: 'superadmin@test.com',
          role: 'admin'
        })
      )
    })
  })

  describe('optionalAuthenticateJWT', () => {
    it('debe continuar sin error si no hay token', () => {
      optionalAuthenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('debe continuar sin error si el token tiene formato inválido', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123'
      }

      optionalAuthenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('debe continuar sin error si el token es inválido', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      }

      optionalAuthenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('debe agregar información del usuario si el token es válido', () => {
      const payload = {
        userId: '789',
        email: 'user@test.com',
        role: 'user'
      }
      const token = jwt.sign(payload, config.jwtSecret)

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      optionalAuthenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toEqual(
        expect.objectContaining({
          userId: '789',
          email: 'user@test.com',
          role: 'user'
        })
      )
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('debe aceptar tokens de administrador', () => {
      const payload = {
        userId: 'admin-123',
        email: 'admin@test.com',
        role: 'admin'
      }
      const token = jwt.sign(payload, config.jwtSecret)

      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }

      optionalAuthenticateJWT(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user?.role).toBe('admin')
    })
  })
})
