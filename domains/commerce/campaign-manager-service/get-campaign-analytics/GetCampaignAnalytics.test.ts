/**
 * Tests para GetCampaignAnalytics
 * 
 * Verifica que el caso de uso calcule correctamente todas las métricas
 * de rendimiento de una campaña.
 */

import { GetCampaignAnalytics } from './GetCampaignAnalytics'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { CampaignAnalyticsRepository } from '../shared/repositories/CampaignAnalyticsRepository'
import { Campaign } from '../shared/models/Campaign'
import { CampaignProduct } from '../shared/models/CampaignProduct'
import { CampaignAnalytics } from '../shared/models/CampaignAnalytics'

describe('GetCampaignAnalytics', () => {
  let getCampaignAnalytics: GetCampaignAnalytics
  let mockCampaignRepository: jest.Mocked<CampaignRepository>
  let mockCampaignProductRepository: jest.Mocked<CampaignProductRepository>
  let mockCampaignAnalyticsRepository: jest.Mocked<CampaignAnalyticsRepository>

  beforeEach(() => {
    // Crear mocks de repositorios
    mockCampaignRepository = {
      findById: jest.fn()
    } as any

    mockCampaignProductRepository = {
      findByCampaignId: jest.fn(),
      getStatsByCampaignId: jest.fn()
    } as any

    mockCampaignAnalyticsRepository = {
      findByCampaignId: jest.fn(),
      getAggregatedMetrics: jest.fn()
    } as any

    getCampaignAnalytics = new GetCampaignAnalytics(
      mockCampaignRepository,
      mockCampaignProductRepository,
      mockCampaignAnalyticsRepository
    )
  })

  describe('execute', () => {
    it('debe obtener analytics completos de una campaña', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Black Friday',
        slug: 'black-friday',
        startDate: new Date('2025-11-20'),
        endDate: new Date('2025-12-02'),
        priority: 100,
        isActive: true,
        discountRules: { global: { type: 'percentage', value: 20 } },
        frontendConfig: {} as any,
        discountsApplied: true,
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const mockProductStats = {
        totalProducts: 150,
        totalUnitsSold: 500,
        totalRevenue: 50000,
        averageDiscount: 25
      }

      const mockAggregatedMetrics = {
        productsWithDiscount: 150,
        averageDiscountPercentage: 25,
        totalViews: 10000,
        totalClicks: 3000,
        totalConversions: 500,
        totalRevenue: 50000,
        conversionRate: 16.67,
        roi: 150
      }

      const mockDailyAnalytics = [
        CampaignAnalytics.fromDatabase({
          id: '1',
          campaignId,
          date: new Date('2025-11-20'),
          views: 5000,
          clicks: 1500,
          conversions: 250,
          revenue: 25000
        }),
        CampaignAnalytics.fromDatabase({
          id: '2',
          campaignId,
          date: new Date('2025-11-21'),
          views: 5000,
          clicks: 1500,
          conversions: 250,
          revenue: 25000
        })
      ]

      const mockProducts = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 1000,
          campaignPrice: 750,
          discountPercentage: 25,
          discountAmount: 250,
          unitsSold: 100,
          appliedAt: new Date()
        }),
        CampaignProduct.fromDatabase({
          id: '2',
          campaignId,
          productId: 'prod-2',
          originalPrice: 500,
          campaignPrice: 400,
          discountPercentage: 20,
          discountAmount: 100,
          unitsSold: 50,
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue(mockProductStats)
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue(mockAggregatedMetrics)
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue(mockDailyAnalytics)
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await getCampaignAnalytics.execute({ campaignId })

      // Assert
      expect(result.campaignId).toBe(campaignId)
      expect(result.campaignName).toBe('Black Friday')
      expect(result.isActive).toBe(true)
      
      // Requirement 9.1: Productos con descuento
      expect(result.metrics.productsWithDiscount).toBe(150)
      
      // Requirement 9.2: Descuento promedio
      expect(result.metrics.averageDiscountPercentage).toBe(25)
      
      // Requirement 9.3: Unidades vendidas
      expect(result.metrics.unitsSold).toBe(500)
      
      // Requirement 9.4: Ingresos generados
      expect(result.metrics.revenue).toBe(50000)
      
      // Requirement 9.5: Tasa de conversión
      expect(result.metrics.conversionRate).toBe(16.67)
      
      // Requirement 9.5: ROI
      expect(result.metrics.roi).toBeGreaterThan(0)
      
      // Métricas diarias
      expect(result.dailyMetrics).toHaveLength(2)
      expect(result.dailyMetrics[0].views).toBe(5000)
      expect(result.dailyMetrics[0].conversions).toBe(250)
      
      // Top products
      expect(result.topProducts).toHaveLength(2)
      expect(result.topProducts[0].productId).toBe('prod-1')
      expect(result.topProducts[0].unitsSold).toBe(100)
    })

    it('debe calcular ROI correctamente', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: true,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Ingresos: 10000, Descuentos: 2000
      // ROI = (10000 - 2000) / 2000 * 100 = 400%
      const mockProducts = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 1000,
          campaignPrice: 800,
          discountPercentage: 20,
          discountAmount: 200,
          unitsSold: 10, // Descuento total: 2000
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 1,
        totalUnitsSold: 10,
        totalRevenue: 10000,
        averageDiscount: 20
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 1,
        averageDiscountPercentage: 20,
        totalViews: 100,
        totalClicks: 50,
        totalConversions: 10,
        totalRevenue: 10000,
        conversionRate: 20,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await getCampaignAnalytics.execute({ campaignId })

      // Assert
      // ROI = (10000 - 2000) / 2000 * 100 = 400%
      expect(result.metrics.roi).toBe(400)
      expect(result.metrics.totalDiscountGiven).toBe(2000)
    })

    it('debe manejar campaña sin ventas', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: true,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 10,
        totalUnitsSold: 0,
        totalRevenue: 0,
        averageDiscount: 25
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 25,
        totalViews: 100,
        totalClicks: 20,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

      // Act
      const result = await getCampaignAnalytics.execute({ campaignId })

      // Assert
      expect(result.metrics.unitsSold).toBe(0)
      expect(result.metrics.revenue).toBe(0)
      expect(result.metrics.roi).toBe(0)
      expect(result.topProducts).toHaveLength(0)
    })

    it('debe ordenar productos por unidades vendidas', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: true,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const mockProducts = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 100,
          campaignPrice: 80,
          discountPercentage: 20,
          discountAmount: 20,
          unitsSold: 50, // Menos vendido
          appliedAt: new Date()
        }),
        CampaignProduct.fromDatabase({
          id: '2',
          campaignId,
          productId: 'prod-2',
          originalPrice: 200,
          campaignPrice: 160,
          discountPercentage: 20,
          discountAmount: 40,
          unitsSold: 100, // Más vendido
          appliedAt: new Date()
        }),
        CampaignProduct.fromDatabase({
          id: '3',
          campaignId,
          productId: 'prod-3',
          originalPrice: 150,
          campaignPrice: 120,
          discountPercentage: 20,
          discountAmount: 30,
          unitsSold: 75, // Medio
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 3,
        totalUnitsSold: 225,
        totalRevenue: 0,
        averageDiscount: 20
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 3,
        averageDiscountPercentage: 20,
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await getCampaignAnalytics.execute({ campaignId })

      // Assert
      expect(result.topProducts).toHaveLength(3)
      expect(result.topProducts[0].productId).toBe('prod-2') // 100 unidades
      expect(result.topProducts[0].unitsSold).toBe(100)
      expect(result.topProducts[1].productId).toBe('prod-3') // 75 unidades
      expect(result.topProducts[1].unitsSold).toBe(75)
      expect(result.topProducts[2].productId).toBe('prod-1') // 50 unidades
      expect(result.topProducts[2].unitsSold).toBe(50)
    })

    it('debe calcular tasa de conversión diaria correctamente', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: true,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const mockDailyAnalytics = [
        CampaignAnalytics.fromDatabase({
          id: '1',
          campaignId,
          date: new Date('2025-11-20'),
          views: 1000,
          clicks: 200, // 20% CTR
          conversions: 50, // 25% conversion rate
          revenue: 5000
        }),
        CampaignAnalytics.fromDatabase({
          id: '2',
          campaignId,
          date: new Date('2025-11-21'),
          views: 2000,
          clicks: 0, // Sin clics
          conversions: 0,
          revenue: 0
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
        averageDiscount: 0
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 0,
        averageDiscountPercentage: 0,
        totalViews: 3000,
        totalClicks: 200,
        totalConversions: 50,
        totalRevenue: 5000,
        conversionRate: 25,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue(mockDailyAnalytics)
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

      // Act
      const result = await getCampaignAnalytics.execute({ campaignId })

      // Assert
      expect(result.dailyMetrics).toHaveLength(2)
      
      // Día 1: 50 conversiones / 200 clics = 25%
      expect(result.dailyMetrics[0].conversionRate).toBe(25)
      
      // Día 2: Sin clics, tasa de conversión = 0
      expect(result.dailyMetrics[1].conversionRate).toBe(0)
    })

    it('debe lanzar error si la campaña no existe', async () => {
      // Arrange
      const campaignId = 'non-existent'
      mockCampaignRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        getCampaignAnalytics.execute({ campaignId })
      ).rejects.toThrow(`Campaña con ID ${campaignId} no encontrada`)
    })

    it('debe limitar top products a 10', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: true,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Crear 15 productos con ventas
      const mockProducts = Array.from({ length: 15 }, (_, i) => 
        CampaignProduct.fromDatabase({
          id: `${i + 1}`,
          campaignId,
          productId: `prod-${i + 1}`,
          originalPrice: 100,
          campaignPrice: 80,
          discountPercentage: 20,
          discountAmount: 20,
          unitsSold: 15 - i, // Descendente: 15, 14, 13, ..., 1
          appliedAt: new Date()
        })
      )

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 15,
        totalUnitsSold: 120,
        totalRevenue: 0,
        averageDiscount: 20
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 15,
        averageDiscountPercentage: 20,
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await getCampaignAnalytics.execute({ campaignId })

      // Assert
      expect(result.topProducts).toHaveLength(10) // Máximo 10
      expect(result.topProducts[0].unitsSold).toBe(15) // Más vendido
      expect(result.topProducts[9].unitsSold).toBe(6) // Décimo más vendido
    })
  })
})


/**
 * Property-Based Tests para GetCampaignAnalytics
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para cualquier conjunto de datos válidos.
 */

import fc from 'fast-check'

describe('Property-Based Tests', () => {
  // Instancias locales para los property-based tests
  let getCampaignAnalytics: GetCampaignAnalytics
  let mockCampaignRepository: jest.Mocked<CampaignRepository>
  let mockCampaignProductRepository: jest.Mocked<CampaignProductRepository>
  let mockCampaignAnalyticsRepository: jest.Mocked<CampaignAnalyticsRepository>

  beforeEach(() => {
    // Crear mocks de repositorios
    mockCampaignRepository = {
      findById: jest.fn()
    } as any

    mockCampaignProductRepository = {
      findByCampaignId: jest.fn(),
      getStatsByCampaignId: jest.fn()
    } as any

    mockCampaignAnalyticsRepository = {
      findByCampaignId: jest.fn(),
      getAggregatedMetrics: jest.fn()
    } as any

    getCampaignAnalytics = new GetCampaignAnalytics(
      mockCampaignRepository,
      mockCampaignProductRepository,
      mockCampaignAnalyticsRepository
    )
  })

  /**
   * Feature: campaign-manager-service, Property 33: Analytics Metrics Calculation
   * Validates: Requirements 9.1, 9.2, 9.3, 9.4
   * 
   * Para cualquier campaña con productos y analytics, las métricas calculadas
   * deben ser matemáticamente correctas y consistentes.
   */
  it('Property 33: analytics metrics should be calculated correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generador de campaña
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 50 }),
          slug: fc.string({ minLength: 3, maxLength: 50 }),
          startDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          endDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
          priority: fc.integer({ min: 1, max: 100 }),
          isActive: fc.boolean(),
          discountRules: fc.constant({}),
          frontendConfig: fc.constant({} as any),
          discountsApplied: fc.boolean(),
          createdAt: fc.date(),
          updatedAt: fc.date()
        }),
        // Generador de productos
        fc.array(
          fc.record({
            id: fc.uuid(),
            productId: fc.uuid(),
            originalPrice: fc.float({ min: 10, max: 10000, noNaN: true }),
            campaignPrice: fc.float({ min: 5, max: 9999, noNaN: true }),
            discountPercentage: fc.integer({ min: 1, max: 99 }),
            discountAmount: fc.float({ min: 1, max: 5000, noNaN: true }),
            unitsSold: fc.integer({ min: 0, max: 1000 }),
            appliedAt: fc.date()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        // Generador de analytics diarios
        fc.array(
          fc.record({
            id: fc.uuid(),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
            views: fc.integer({ min: 0, max: 100000 }),
            clicks: fc.integer({ min: 0, max: 50000 }),
            conversions: fc.integer({ min: 0, max: 10000 }),
            revenue: fc.float({ min: 0, max: 1000000, noNaN: true })
          }),
          { minLength: 0, maxLength: 30 }
        ),
        async (campaignData, productsData, analyticsData) => {
          // Arrange
          const campaignId = campaignData.id

          // Asegurar que campaignPrice < originalPrice
          const validProducts = productsData.map(p => ({
            ...p,
            campaignId,
            campaignPrice: Math.min(p.campaignPrice, p.originalPrice - 1),
            discountAmount: Math.min(p.discountAmount, p.originalPrice - 1)
          }))

          // Asegurar que clicks <= views y conversions <= clicks
          const validAnalytics = analyticsData.map(a => ({
            ...a,
            campaignId,
            clicks: Math.min(a.clicks, a.views),
            conversions: Math.min(a.conversions, Math.min(a.clicks, a.views))
          }))

          const mockCampaign = Campaign.fromDatabase(campaignData)
          const mockProducts = validProducts.map(p => CampaignProduct.fromDatabase(p))
          const mockAnalytics = validAnalytics.map(a => CampaignAnalytics.fromDatabase(a))

          // Calcular valores esperados manualmente
          const expectedProductsWithDiscount = validProducts.length
          const expectedAverageDiscount = validProducts.reduce((sum, p) => sum + p.discountPercentage, 0) / validProducts.length
          const expectedUnitsSold = validProducts.reduce((sum, p) => sum + p.unitsSold, 0)
          const expectedTotalViews = validAnalytics.reduce((sum, a) => sum + a.views, 0)
          const expectedTotalClicks = validAnalytics.reduce((sum, a) => sum + a.clicks, 0)
          const expectedTotalConversions = validAnalytics.reduce((sum, a) => sum + a.conversions, 0)
          const expectedTotalRevenue = validAnalytics.reduce((sum, a) => sum + a.revenue, 0)
          const expectedConversionRate = expectedTotalClicks > 0 
            ? (expectedTotalConversions / expectedTotalClicks) * 100 
            : 0
          const expectedTotalDiscountGiven = validProducts.reduce((sum, p) => sum + (p.discountAmount * p.unitsSold), 0)
          const expectedROI = expectedTotalDiscountGiven > 0
            ? ((expectedTotalRevenue - expectedTotalDiscountGiven) / expectedTotalDiscountGiven) * 100
            : 0

          // Mock repositories
          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: expectedProductsWithDiscount,
            totalUnitsSold: expectedUnitsSold,
            totalRevenue: expectedTotalRevenue,
            averageDiscount: expectedAverageDiscount
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount: expectedProductsWithDiscount,
            averageDiscountPercentage: expectedAverageDiscount,
            totalViews: expectedTotalViews,
            totalClicks: expectedTotalClicks,
            totalConversions: expectedTotalConversions,
            totalRevenue: expectedTotalRevenue,
            conversionRate: expectedConversionRate,
            roi: expectedROI
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue(mockAnalytics)
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

          // Act
          const result = await getCampaignAnalytics.execute({ campaignId })

          // Assert - Requirement 9.1: Productos con descuento
          expect(result.metrics.productsWithDiscount).toBe(expectedProductsWithDiscount)

          // Assert - Requirement 9.2: Descuento promedio
          if (validProducts.length > 0) {
            expect(result.metrics.averageDiscountPercentage).toBeCloseTo(expectedAverageDiscount, 2)
          }

          // Assert - Requirement 9.3: Unidades vendidas
          expect(result.metrics.unitsSold).toBe(expectedUnitsSold)

          // Assert - Requirement 9.4: Ingresos
          expect(result.metrics.revenue).toBeCloseTo(expectedTotalRevenue, 2)

          // Assert - Tasa de conversión debe ser coherente
          if (expectedTotalClicks > 0) {
            expect(result.metrics.conversionRate).toBeCloseTo(expectedConversionRate, 2)
          } else {
            expect(result.metrics.conversionRate).toBe(0)
          }

          // Assert - ROI debe ser coherente
          if (expectedTotalDiscountGiven > 0) {
            expect(result.metrics.roi).toBeCloseTo(expectedROI, 2)
          }

          // Assert - Descuento total debe ser correcto
          expect(result.metrics.totalDiscountGiven).toBeCloseTo(expectedTotalDiscountGiven, 2)

          // Assert - Métricas diarias deben coincidir
          expect(result.dailyMetrics).toHaveLength(validAnalytics.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: ROI calculation correctness
   * 
   * Para cualquier campaña, el ROI debe calcularse como:
   * ROI = (Ingresos - Descuentos) / Descuentos * 100
   */
  it('Property: ROI should be calculated correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 1000, max: 100000, noNaN: true }), // revenue
        fc.float({ min: 100, max: 50000, noNaN: true }), // totalDiscountGiven
        async (revenue, totalDiscountGiven) => {
          // Arrange
          const campaignId = 'test-campaign'
          const mockCampaign = Campaign.fromDatabase({
            id: campaignId,
            name: 'Test',
            slug: 'test',
            startDate: new Date(),
            endDate: new Date(),
            priority: 1,
            isActive: true,
            discountRules: {},
            frontendConfig: {} as any,
            discountsApplied: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          const mockProduct = CampaignProduct.fromDatabase({
            id: '1',
            campaignId,
            productId: 'prod-1',
            originalPrice: 100,
            campaignPrice: 80,
            discountPercentage: 20,
            discountAmount: totalDiscountGiven,
            unitsSold: 1,
            appliedAt: new Date()
          })

          const expectedROI = ((revenue - totalDiscountGiven) / totalDiscountGiven) * 100

          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: 1,
            totalUnitsSold: 1,
            totalRevenue: revenue,
            averageDiscount: 20
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount: 1,
            averageDiscountPercentage: 20,
            totalViews: 100,
            totalClicks: 20,
            totalConversions: 1,
            totalRevenue: revenue,
            conversionRate: 5,
            roi: 0
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue([mockProduct])

          // Act
          const result = await getCampaignAnalytics.execute({ campaignId })

          // Assert
          expect(result.metrics.roi).toBeCloseTo(expectedROI, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Conversion rate bounds
   * 
   * Para cualquier campaña, la tasa de conversión debe estar entre 0 y 100%
   */
  it('Property: conversion rate should be between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10000 }), // clicks
        fc.integer({ min: 0, max: 10000 }), // conversions
        async (clicks, conversions) => {
          // Arrange
          const campaignId = 'test-campaign'
          const validConversions = Math.min(conversions, clicks) // Asegurar conversions <= clicks

          const mockCampaign = Campaign.fromDatabase({
            id: campaignId,
            name: 'Test',
            slug: 'test',
            startDate: new Date(),
            endDate: new Date(),
            priority: 1,
            isActive: true,
            discountRules: {},
            frontendConfig: {} as any,
            discountsApplied: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: 0,
            totalUnitsSold: 0,
            totalRevenue: 0,
            averageDiscount: 0
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount: 0,
            averageDiscountPercentage: 0,
            totalViews: 1000,
            totalClicks: clicks,
            totalConversions: validConversions,
            totalRevenue: 0,
            conversionRate: clicks > 0 ? (validConversions / clicks) * 100 : 0,
            roi: 0
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

          // Act
          const result = await getCampaignAnalytics.execute({ campaignId })

          // Assert
          expect(result.metrics.conversionRate).toBeGreaterThanOrEqual(0)
          expect(result.metrics.conversionRate).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 100 }
    )
  })
})
