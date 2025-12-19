/**
 * Tests para ProductServiceClient
 * 
 * Incluye property-based tests para validar el comportamiento
 * de retry con backoff exponencial.
 */

// Mock de variables de entorno antes de importar cualquier módulo
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.PRODUCT_SERVICE_URL = 'http://localhost:3001'
process.env.JWT_SECRET = 'test-secret'
process.env.PORT = '3011'

import fc from 'fast-check'
import axios from 'axios'
import { ProductServiceClient } from './ProductServiceClient'

// Mock de axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('ProductServiceClient', () => {
  let client: ProductServiceClient
  let mockAxiosInstance: any

  beforeEach(() => {
    // Crear mock de instancia de axios
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }

    mockedAxios.create.mockReturnValue(mockAxiosInstance)

    // Crear cliente con opciones de retry rápidas para tests
    client = new ProductServiceClient('http://test-service', {
      maxRetries: 3,
      baseDelay: 10, // 10ms para tests rápidos
      maxDelay: 100
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getProduct', () => {
    it('debería retornar un producto cuando la petición es exitosa', async () => {
      const mockProduct = {
        id: '123',
        name: 'Test Product',
        our_price: 100,
        category: 'test'
      }

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockProduct })

      const result = await client.getProduct('123')

      expect(result).toEqual(mockProduct)
      // La implementación usa /products/:id (sin /api)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products/123')
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })

    it('debería retornar null cuando el producto no existe (404)', async () => {
      const error = {
        response: { status: 404 },
        isAxiosError: true
      }
      mockAxiosInstance.get.mockRejectedValueOnce(error)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const result = await client.getProduct('999')

      expect(result).toBeNull()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getProducts', () => {
    it('debería retornar lista de productos con filtros', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', category: 'laptops' },
        { id: '2', name: 'Product 2', category: 'laptops' }
      ]

      // La implementación espera { success: true, data: [...] }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { success: true, data: mockProducts } })

      const result = await client.getProducts({ category: 'laptops' })

      expect(result).toEqual(mockProducts)
      // La implementación usa /products (sin /api)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products', {
        params: { category: 'laptops' }
      })
    })

    it('debería retornar array vacío si no hay productos', async () => {
      // La implementación espera { success: true, data: [...] }
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { success: true, data: [] } })

      const result = await client.getProducts()

      expect(result).toEqual([])
    })
  })

  describe('updateProduct', () => {
    it('debería actualizar un producto correctamente', async () => {
      const mockProduct = {
        id: '123',
        name: 'Updated Product',
        in_campaign: true,
        campaign_price: 80
      }

      // La implementación espera { success: true, data: {...} }
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: { success: true, data: mockProduct } })

      const result = await client.updateProduct('123', {
        in_campaign: true,
        campaign_price: 80
      })

      expect(result).toEqual(mockProduct)
      // La implementación usa /products/:id/campaign (endpoint específico de campaña)
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        '/products/123/campaign',
        { in_campaign: true, campaign_price: 80 }
      )
    })
  })

  describe('updateProductsBatch', () => {
    it('debería actualizar múltiples productos en lotes', async () => {
      const updates = [
        { productId: '1', data: { inCampaign: true } },
        { productId: '2', data: { inCampaign: true } },
        { productId: '3', data: { inCampaign: true } }
      ]

      // La implementación espera { success: true, data: {...} }
      mockAxiosInstance.patch.mockResolvedValue({ data: { success: true, data: {} } })

      await client.updateProductsBatch(updates)

      expect(mockAxiosInstance.patch).toHaveBeenCalledTimes(3)
    })
  })

  describe('Retry con Backoff Exponencial', () => {
    /**
     * Feature: campaign-manager-service, Property 30: Exponential Backoff Retry
     * Validates: Requirements 6.5
     * 
     * Para cualquier fallo de comunicación con Product Service,
     * el sistema debe reintentar con backoff exponencial (1s, 2s, 4s, 8s, etc.).
     */
    it('Property 30: debería reintentar con backoff exponencial en fallos temporales', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }), // Número de fallos antes del éxito
          async (failuresBeforeSuccess) => {
            // Arrange
            const mockProduct = { id: '123', name: 'Test Product' }
            let attemptCount = 0
            const attemptTimestamps: number[] = []

            mockAxiosInstance.get.mockImplementation(() => {
              attemptTimestamps.push(Date.now())
              attemptCount++

              if (attemptCount <= failuresBeforeSuccess) {
                // Simular error de red temporal (503 Service Unavailable)
                const error = {
                  response: { status: 503 },
                  isAxiosError: true,
                  message: 'Service Unavailable'
                }
                mockedAxios.isAxiosError.mockReturnValue(true)
                return Promise.reject(error)
              }

              // Éxito después de los fallos
              return Promise.resolve({ data: mockProduct })
            })

            // Act
            const result = await client.getProduct('123')

            // Assert
            expect(result).toEqual(mockProduct)
            expect(attemptCount).toBe(failuresBeforeSuccess + 1)

            // Verificar que los delays aumentan exponencialmente
            if (attemptTimestamps.length > 1) {
              for (let i = 1; i < attemptTimestamps.length; i++) {
                const delay = attemptTimestamps[i] - attemptTimestamps[i - 1]
                const expectedMinDelay = 10 * Math.pow(2, i - 1) // baseDelay * 2^(attempt-1)
                
                // El delay debe ser al menos el esperado (con margen de 5ms por overhead)
                expect(delay).toBeGreaterThanOrEqual(expectedMinDelay - 5)
              }
            }

            // Limpiar para siguiente iteración
            jest.clearAllMocks()
          }
        ),
        { numRuns: 10 } // Reducido para tests más rápidos
      )
    })

    it('debería reintentar hasta maxRetries veces y luego fallar', async () => {
      // Arrange
      const error = new Error('Service Unavailable')
      Object.assign(error, {
        response: { status: 503 },
        isAxiosError: true
      })
      mockAxiosInstance.get.mockRejectedValue(error)
      mockedAxios.isAxiosError.mockReturnValue(true)

      // Act & Assert
      try {
        await client.getProduct('123')
        fail('Should have thrown an error')
      } catch (e) {
        expect(e).toBeDefined()
      }

      // Debe intentar 1 vez inicial + 3 reintentos = 4 veces total
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4)
    })

    it('NO debería reintentar en errores 4xx (excepto 429)', async () => {
      // Arrange
      const error = new Error('Bad Request')
      Object.assign(error, {
        response: { status: 400 },
        isAxiosError: true
      })
      mockAxiosInstance.get.mockRejectedValue(error)
      mockedAxios.isAxiosError.mockReturnValue(true)

      // Act & Assert
      try {
        await client.getProduct('123')
        fail('Should have thrown an error')
      } catch (e) {
        expect(e).toBeDefined()
      }

      // Solo debe intentar 1 vez (sin reintentos)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })

    it('debería reintentar en error 429 (Too Many Requests)', async () => {
      // Arrange
      let attemptCount = 0
      mockAxiosInstance.get.mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          const error = {
            response: { status: 429 },
            isAxiosError: true,
            message: 'Too Many Requests'
          }
          mockedAxios.isAxiosError.mockReturnValue(true)
          return Promise.reject(error)
        }
        return Promise.resolve({ data: { id: '123' } })
      })

      // Act
      const result = await client.getProduct('123')

      // Assert
      expect(result).toBeDefined()
      expect(attemptCount).toBe(3) // 2 fallos + 1 éxito
    })

    it('debería respetar el maxDelay en backoff exponencial', async () => {
      // Arrange
      const clientWithLowMaxDelay = new ProductServiceClient('http://test', {
        maxRetries: 5,
        baseDelay: 50,
        maxDelay: 100 // Límite bajo para testing
      })

      let attemptCount = 0
      const attemptTimestamps: number[] = []

      mockAxiosInstance.get.mockImplementation(() => {
        attemptTimestamps.push(Date.now())
        attemptCount++

        if (attemptCount <= 3) {
          const error = {
            response: { status: 503 },
            isAxiosError: true
          }
          mockedAxios.isAxiosError.mockReturnValue(true)
          return Promise.reject(error)
        }

        return Promise.resolve({ data: { id: '123' } })
      })

      // Act
      await clientWithLowMaxDelay.getProduct('123')

      // Assert
      // Verificar que ningún delay excede maxDelay
      // Usamos un margen de 50ms para tolerar variaciones del sistema
      for (let i = 1; i < attemptTimestamps.length; i++) {
        const delay = attemptTimestamps[i] - attemptTimestamps[i - 1]
        expect(delay).toBeLessThanOrEqual(150) // maxDelay + margen generoso
      }
    })
  })

  describe('healthCheck', () => {
    it('debería retornar true cuando el servicio está disponible', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { status: 'ok' } })

      const result = await client.healthCheck()

      expect(result).toBe(true)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
    })

    it('debería retornar false cuando el servicio no está disponible', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await client.healthCheck()

      expect(result).toBe(false)
    })
  })
})
