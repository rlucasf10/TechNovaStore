/**
 * Tests para Middleware de Logging de Auditoría
 */

import { Request, Response, NextFunction } from 'express'
import { auditLogger, campaignAuditLogger, combinedAuditLogger } from './audit-logger'
import { logger } from '../utils/logger'

// Definir AuthenticatedRequest localmente
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

// Mock del logger
jest.mock('../utils/logger', () => ({
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe('Middleware de Logging de Auditoría', () => {
  let mockRequest: AuthenticatedRequest
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  // Función helper para crear un mock request con path modificable
  const createMockRequest = (overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest => {
    return {
      method: 'POST',
      path: '/api/campaigns',
      socket: {
        remoteAddress: '192.168.1.100'
      } as any,
      headers: {
        'user-agent': 'Mozilla/5.0'
      },
      params: {},
      query: {},
      body: {},
      ...overrides
    } as AuthenticatedRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockRequest = createMockRequest()

    mockResponse = {
      statusCode: 200,
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    nextFunction = jest.fn()
  })

  describe('auditLogger', () => {
    it('debe registrar operaciones POST', () => {
      mockRequest.method = 'POST'
      mockRequest.user = {
        userId: '123',
        email: 'admin@test.com',
        role: 'admin'
      }

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()

      // Simular respuesta
      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ id: 'campaign-123', name: 'Test Campaign' })

      expect(logger.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('POST /api/campaigns'),
        expect.objectContaining({
          type: 'audit',
          operation: 'create_campaign',
          userId: '123',
          userEmail: 'admin@test.com',
          userRole: 'admin',
          method: 'POST',
          path: '/api/campaigns'
        })
      )
    })

    it('debe registrar operaciones PUT', () => {
      mockRequest = createMockRequest({
        method: 'PUT',
        path: '/api/campaigns/123',
        user: {
          userId: '456',
          email: 'admin2@test.com',
          role: 'admin'
        }
      })

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ id: '123', name: 'Updated Campaign' })

      expect(logger.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('PUT /api/campaigns/123'),
        expect.objectContaining({
          type: 'audit',
          operation: 'update_campaign',
          userId: '456',
          method: 'PUT'
        })
      )
    })

    it('debe registrar operaciones DELETE', () => {
      mockRequest = createMockRequest({
        method: 'DELETE',
        path: '/api/campaigns/123',
        user: {
          userId: '789',
          email: 'admin3@test.com',
          role: 'admin'
        }
      })

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true })

      expect(logger.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('DELETE /api/campaigns/123'),
        expect.objectContaining({
          type: 'audit',
          operation: 'delete_campaign',
          userId: '789',
          method: 'DELETE'
        })
      )
    })

    it('NO debe registrar operaciones GET', () => {
      mockRequest = createMockRequest({
        method: 'GET',
        path: '/api/campaigns'
      })

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(logger.log).not.toHaveBeenCalled()
    })

    it('debe registrar operaciones sin usuario autenticado', () => {
      mockRequest.method = 'POST'
      mockRequest.user = undefined

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ error: 'Unauthorized' })

      // Cuando no hay usuario autenticado, los campos de usuario no se incluyen en el log
      expect(logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          type: 'audit'
        })
      )
    })

    it('debe registrar errores con nivel warn', () => {
      mockRequest.method = 'POST'
      mockResponse.statusCode = 400

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ error: 'Bad Request', message: 'Invalid data' })

      expect(logger.log).toHaveBeenCalledWith(
        'warn',
        expect.any(String),
        expect.objectContaining({
          type: 'audit',
          statusCode: 400,
          error: 'Invalid data'
        })
      )
    })

    it('debe incluir tiempo de respuesta', () => {
      mockRequest.method = 'POST'

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true })

      expect(logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          responseTime: expect.any(Number)
        })
      )
    })

    it('debe sanitizar campos sensibles del body', () => {
      mockRequest.method = 'POST'
      mockRequest.body = {
        name: 'Test Campaign',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key123'
      }

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true })

      expect(logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          body: {
            name: 'Test Campaign',
            password: '***REDACTED***',
            token: '***REDACTED***',
            apiKey: '***REDACTED***'
          }
        })
      )
    })

    it('debe obtener IP de header X-Forwarded-For', () => {
      mockRequest.method = 'POST'
      mockRequest.headers = {
        'x-forwarded-for': '10.0.0.1, 10.0.0.2'
      }

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true })

      expect(logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          ip: '10.0.0.1'
        })
      )
    })

    it('debe registrar operación de aplicar descuentos', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns/123/apply-discounts'
      })

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true, productsAffected: 100 })

      expect(logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          operation: 'apply_discounts'
        })
      )
    })

    it('debe registrar operación de remover descuentos', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns/123/remove-discounts'
      })

      auditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true, productsRestored: 100 })

      expect(logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          operation: 'remove_discounts'
        })
      )
    })
  })

  describe('campaignAuditLogger', () => {
    it('debe registrar información adicional de campaña creada', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns',
        user: {
          userId: '123',
          email: 'admin@test.com',
          role: 'admin'
        }
      })

      campaignAuditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ id: 'campaign-123', name: 'Black Friday' })

      expect(logger.info).toHaveBeenCalledWith(
        'Operación de campaña completada',
        expect.objectContaining({
          type: 'campaign_operation',
          operation: 'create_campaign',
          campaignId: 'campaign-123',
          campaignName: 'Black Friday',
          userId: '123',
          userEmail: 'admin@test.com'
        })
      )
    })

    it('debe registrar productos afectados al aplicar descuentos', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns/123/apply-discounts',
        user: {
          userId: '456',
          email: 'admin@test.com',
          role: 'admin'
        }
      })

      campaignAuditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true, productsAffected: 250 })

      expect(logger.info).toHaveBeenCalledWith(
        'Operación de campaña completada',
        expect.objectContaining({
          productsAffected: 250
        })
      )
    })

    it('debe registrar productos restaurados al remover descuentos', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns/123/remove-discounts'
      })

      campaignAuditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ success: true, productsRestored: 250 })

      expect(logger.info).toHaveBeenCalledWith(
        'Operación de campaña completada',
        expect.objectContaining({
          productsRestored: 250
        })
      )
    })

    it('NO debe registrar para paths que no son de campaña', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/other'
      })

      campaignAuditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      expect(nextFunction).toHaveBeenCalled()
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('NO debe registrar para respuestas de error', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns'
      })
      mockResponse.statusCode = 400

      campaignAuditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ error: 'Bad Request' })

      expect(logger.info).not.toHaveBeenCalled()
    })
  })

  describe('combinedAuditLogger', () => {
    it('debe aplicar ambos middlewares de auditoría', () => {
      mockRequest = createMockRequest({
        method: 'POST',
        path: '/api/campaigns',
        user: {
          userId: '123',
          email: 'admin@test.com',
          role: 'admin'
        }
      })

      combinedAuditLogger(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      )

      const jsonFn = mockResponse.json as jest.Mock
      jsonFn({ id: 'campaign-123', name: 'Test Campaign' })

      // Debe registrar auditoría general
      expect(logger.log).toHaveBeenCalled()

      // Debe registrar auditoría específica de campaña
      expect(logger.info).toHaveBeenCalled()
    })
  })
})
