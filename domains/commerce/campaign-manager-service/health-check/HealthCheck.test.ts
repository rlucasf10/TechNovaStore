/**
 * Tests para HealthCheck
 * 
 * Verifica que el health check funcione correctamente y detecte problemas
 * en la base de datos y servicios externos.
 */

import { HealthCheck } from './HealthCheck'
import { Pool } from 'pg'
import axios from 'axios'

// Mock de axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('HealthCheck', () => {
  let healthCheck: HealthCheck
  let mockDb: { query: jest.Mock; connect: jest.Mock; end: jest.Mock; on: jest.Mock }
  const productServiceUrl = 'http://product-service:3001'

  beforeEach(() => {
    // Mock de la base de datos
    mockDb = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn()
    }

    healthCheck = new HealthCheck(mockDb as unknown as Pool, productServiceUrl)

    // Limpiar mocks
    jest.clearAllMocks()
  })

  describe('execute - Sistema saludable', () => {
    it('debe retornar healthy cuando todos los servicios están disponibles', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.status).toBe('healthy')
      expect(result.checks.database.status).toBe('up')
      expect(result.checks.productService.status).toBe('up')
      expect(result.timestamp).toBeDefined()
      expect(result.uptime).toBeGreaterThan(0)
    })

    it('debe incluir tiempos de respuesta cuando los servicios están disponibles', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.checks.database.responseTime).toBeDefined()
      expect(result.checks.database.responseTime).toBeGreaterThanOrEqual(0)
      expect(result.checks.productService.responseTime).toBeDefined()
      expect(result.checks.productService.responseTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('execute - Base de datos no disponible', () => {
    it('debe retornar unhealthy cuando la base de datos no está disponible', async () => {
      // Arrange
      mockDb.query.mockRejectedValue(new Error('Connection refused'))
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('down')
      expect(result.checks.database.error).toBe('Connection refused')
      expect(result.checks.productService.status).toBe('up')
    })

    it('debe incluir tiempo de respuesta incluso cuando falla', async () => {
      // Arrange
      mockDb.query.mockRejectedValue(new Error('Timeout'))
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.checks.database.responseTime).toBeDefined()
      expect(result.checks.database.responseTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('execute - Product Service no disponible', () => {
    it('debe retornar unhealthy cuando Product Service no está disponible', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'))

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('up')
      expect(result.checks.productService.status).toBe('down')
      expect(result.checks.productService.error).toBe('ECONNREFUSED')
    })

    it('debe manejar status code inesperado del Product Service', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 500, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.checks.productService.status).toBe('down')
      expect(result.checks.productService.error).toContain('Status code inesperado: 500')
    })

    it('debe incluir tiempo de respuesta incluso cuando falla', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockRejectedValue(new Error('Timeout'))

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.checks.productService.responseTime).toBeDefined()
      expect(result.checks.productService.responseTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('execute - Ambos servicios no disponibles', () => {
    it('debe retornar unhealthy cuando ambos servicios fallan', async () => {
      // Arrange
      mockDb.query.mockRejectedValue(new Error('DB Error'))
      mockedAxios.get.mockRejectedValue(new Error('Service Error'))

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('down')
      expect(result.checks.productService.status).toBe('down')
      expect(result.checks.database.error).toBe('DB Error')
      expect(result.checks.productService.error).toBe('Service Error')
    })
  })

  describe('checkDatabase', () => {
    it('debe ejecutar query SELECT 1 para verificar conexión', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      await healthCheck.execute()

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith('SELECT 1')
    })
  })

  describe('checkProductService', () => {
    it('debe hacer request al endpoint /health del Product Service', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      await healthCheck.execute()

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${productServiceUrl}/health`,
        { timeout: 5000 }
      )
    })

    it('debe usar timeout de 5 segundos', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      await healthCheck.execute()

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 5000 })
      )
    })
  })

  describe('Formato de respuesta', () => {
    it('debe incluir timestamp en formato ISO', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('debe incluir uptime del proceso', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(typeof result.uptime).toBe('number')
      expect(result.uptime).toBeGreaterThan(0)
    })

    it('debe tener la estructura correcta de checks', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.checks).toHaveProperty('database')
      expect(result.checks).toHaveProperty('productService')
      expect(result.checks.database).toHaveProperty('status')
      expect(result.checks.productService).toHaveProperty('status')
    })
  })

  describe('Casos edge', () => {
    it('debe manejar errores no estándar en base de datos', async () => {
      // Arrange
      mockDb.query.mockRejectedValue('String error')
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} } as any)

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.checks.database.status).toBe('down')
      expect(result.checks.database.error).toBe('Error desconocido')
    })

    it('debe manejar errores no estándar en Product Service', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ '?column?': 1 }] } as any)
      mockedAxios.get.mockRejectedValue('String error')

      // Act
      const result = await healthCheck.execute()

      // Assert
      expect(result.checks.productService.status).toBe('down')
      expect(result.checks.productService.error).toBe('Error desconocido')
    })
  })
})
