/**
 * Tests para Middleware de Rate Limiting
 */

import { Request, Response, NextFunction } from 'express'
import {
  createRateLimiter,
  defaultRateLimiter,
  strictRateLimiter,
  resetRateLimitForIp,
  resetAllRateLimits,
  getRateLimitInfo
} from './rate-limiter'

describe('Middleware de Rate Limiting', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    // Resetear rate limits antes de cada test
    resetAllRateLimits()

    mockRequest = {
      socket: {
        remoteAddress: '192.168.1.100'
      } as any,
      headers: {}
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis()
    }

    nextFunction = jest.fn()
  })

  describe('createRateLimiter', () => {
    it('debe permitir requests dentro del límite', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      })

      // Primera request
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5')
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '4')
    })

    it('debe bloquear requests que excedan el límite', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 3
      })

      // Hacer 3 requests (dentro del límite)
      for (let i = 0; i < 3; i++) {
        limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      }

      expect(nextFunction).toHaveBeenCalledTimes(3)

      // Resetear mocks
      jest.clearAllMocks()

      // Cuarta request (excede el límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(429)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests'
        })
      )
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('debe decrementar el contador de requests restantes', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      })

      // Primera request
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '4')

      jest.clearAllMocks()

      // Segunda request
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '3')

      jest.clearAllMocks()

      // Tercera request
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '2')
    })

    it('debe agregar header Retry-After cuando se excede el límite', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      })

      // Hacer 2 requests
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      jest.clearAllMocks()

      // Tercera request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(String)
      )
    })

    it('debe usar mensaje personalizado', () => {
      const customMessage = 'Límite personalizado excedido'
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage
      })

      // Primera request
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      jest.clearAllMocks()

      // Segunda request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage
        })
      )
    })

    it('debe usar código de estado personalizado', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        statusCode: 503
      })

      // Primera request
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      jest.clearAllMocks()

      // Segunda request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(503)
    })

    it('debe resetear el contador después de la ventana de tiempo', () => {
      jest.useFakeTimers()

      const limiter = createRateLimiter({
        windowMs: 1000, // 1 segundo
        maxRequests: 2
      })

      // Hacer 2 requests
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalledTimes(2)

      jest.clearAllMocks()

      // Tercera request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)

      jest.clearAllMocks()

      // Avanzar tiempo más allá de la ventana
      jest.advanceTimersByTime(1100)

      // Nueva request después de reset
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('debe manejar diferentes IPs independientemente', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      })

      // Request desde IP 1
      const request1 = {
        ...mockRequest,
        socket: { remoteAddress: '192.168.1.1' } as any
      }

      // Request desde IP 2
      const request2 = {
        ...mockRequest,
        socket: { remoteAddress: '192.168.1.2' } as any
      }

      // Hacer 2 requests desde IP 1
      limiter(request1 as Request, mockResponse as Response, nextFunction)
      limiter(request1 as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalledTimes(2)

      jest.clearAllMocks()

      // Tercera request desde IP 1 (excede límite)
      limiter(request1 as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)

      jest.clearAllMocks()

      // Request desde IP 2 (debe permitirse)
      limiter(request2 as Request, mockResponse as Response, nextFunction)
      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('debe obtener IP de header X-Forwarded-For', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      })

      mockRequest.headers = {
        'x-forwarded-for': '10.0.0.1, 10.0.0.2'
      }

      // Hacer 2 requests
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalledTimes(2)

      jest.clearAllMocks()

      // Tercera request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)
    })

    it('debe obtener IP de header X-Real-IP', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      })

      mockRequest.headers = {
        'x-real-ip': '172.16.0.1'
      }

      // Hacer 2 requests
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalledTimes(2)

      jest.clearAllMocks()

      // Tercera request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)
    })
  })

  describe('defaultRateLimiter', () => {
    it('debe permitir hasta 100 requests por minuto', () => {
      // Hacer 100 requests
      for (let i = 0; i < 100; i++) {
        defaultRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction)
      }

      expect(nextFunction).toHaveBeenCalledTimes(100)

      jest.clearAllMocks()

      // Request 101 (excede límite)
      defaultRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)
    })
  })

  describe('strictRateLimiter', () => {
    it('debe permitir hasta 30 requests por minuto', () => {
      // Hacer 30 requests
      for (let i = 0; i < 30; i++) {
        strictRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction)
      }

      expect(nextFunction).toHaveBeenCalledTimes(30)

      jest.clearAllMocks()

      // Request 31 (excede límite)
      strictRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)
    })
  })

  describe('resetRateLimitForIp', () => {
    it('debe resetear el límite para una IP específica', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2
      })

      const ip = '192.168.1.100'

      // Hacer 2 requests
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      jest.clearAllMocks()

      // Tercera request (excede límite)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(mockResponse.status).toHaveBeenCalledWith(429)

      // Resetear límite para esta IP
      resetRateLimitForIp(ip)

      jest.clearAllMocks()

      // Nueva request después de reset
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })
  })

  describe('getRateLimitInfo', () => {
    it('debe retornar información de rate limiting para una IP', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5
      })

      const ip = '192.168.1.100'

      // Hacer algunas requests
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)
      limiter(mockRequest as Request, mockResponse as Response, nextFunction)

      const info = getRateLimitInfo(ip)

      expect(info).toBeDefined()
      expect(info?.count).toBe(2)
      expect(info?.resetTime).toBeGreaterThan(Date.now())
    })

    it('debe retornar undefined para IP sin rate limiting', () => {
      const info = getRateLimitInfo('192.168.1.200')
      expect(info).toBeUndefined()
    })
  })
})
