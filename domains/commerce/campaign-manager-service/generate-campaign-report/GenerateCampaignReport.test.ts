/**
 * Tests para GenerateCampaignReport
 * 
 * Verifica que el caso de uso genere correctamente reportes finales
 * de campañas con todas las métricas y resumen ejecutivo.
 */

import { GenerateCampaignReport } from './GenerateCampaignReport'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { CampaignAnalyticsRepository } from '../shared/repositories/CampaignAnalyticsRepository'
import { Campaign } from '../shared/models/Campaign'
import { CampaignProduct } from '../shared/models/CampaignProduct'
import { CampaignAnalytics } from '../shared/models/CampaignAnalytics'

describe('GenerateCampaignReport', () => {
  let generateCampaignReport: GenerateCampaignReport
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

    generateCampaignReport = new GenerateCampaignReport(
      mockCampaignRepository,
      mockCampaignProductRepository,
      mockCampaignAnalyticsRepository
    )
  })

  describe('execute', () => {
    it('debe generar reporte completo de una campaña', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Black Friday 2025',
        slug: 'black-friday-2025',
        startDate: new Date('2025-11-20'),
        endDate: new Date('2025-12-02'),
        priority: 100,
        isActive: false,
        discountRules: { global: { type: 'percentage', value: 20 } },
        frontendConfig: {} as any,
        discountsApplied: true,
        appliedAt: new Date(),
        deactivatedAt: new Date(),
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
        })
      ]

      // Para ROI = 150%: (revenue - discount) / discount * 100 = 150
      // Si discount = 20000 y revenue = 50000: (50000-20000)/20000*100 = 150%
      // Ajustar mockProducts para que el descuento total sea 20000
      const mockProductsWithDiscount = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 1000,
          campaignPrice: 750,
          discountPercentage: 25,
          discountAmount: 250,
          unitsSold: 80, // 80 * 250 = 20000 descuento total
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue(mockProductStats)
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue(mockAggregatedMetrics)
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue(mockDailyAnalytics)
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProductsWithDiscount)

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      expect(result.report).toBeDefined()
      expect(result.report.campaign.id).toBe(campaignId)
      expect(result.report.campaign.name).toBe('Black Friday 2025')
      
      // Requirement 4.6 & 9.6: Reporte con todas las métricas
      expect(result.report.metrics.productsWithDiscount).toBe(150)
      expect(result.report.metrics.averageDiscountPercentage).toBe(25)
      expect(result.report.metrics.totalRevenue).toBe(50000)
      expect(result.report.metrics.conversionRate).toBe(16.67)
      expect(result.report.metrics.roi).toBe(150)
      
      expect(result.report.topProducts).toBeDefined()
      expect(result.report.dailyMetrics).toHaveLength(1)
      
      expect(result.executiveSummary).toBeDefined()
      expect(result.executiveSummary).toContain('Black Friday 2025')
      expect(result.executiveSummary).toContain('REPORTE EJECUTIVO')
      
      expect(result.generatedAt).toBeInstanceOf(Date)
    })

    it('debe incluir resumen ejecutivo con todas las secciones', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
        priority: 1,
        isActive: false,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Para ROI = 100%: (revenue - discount) / discount * 100 = 100
      // Si discount = 2500 y revenue = 5000: (5000-2500)/2500*100 = 100%
      const mockProducts = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 100,
          campaignPrice: 50,
          discountPercentage: 50,
          discountAmount: 50,
          unitsSold: 50, // 50 * 50 = 2500 descuento total
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 10,
        totalUnitsSold: 50,
        totalRevenue: 5000,
        averageDiscount: 50
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 50,
        totalViews: 1000,
        totalClicks: 200,
        totalConversions: 50,
        totalRevenue: 5000,
        conversionRate: 25,
        roi: 100
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      const summary = result.executiveSummary
      
      // Verificar secciones del reporte
      expect(summary).toContain('REPORTE EJECUTIVO')
      expect(summary).toContain('PERÍODO DE LA CAMPAÑA')
      expect(summary).toContain('RESUMEN DE PRODUCTOS')
      expect(summary).toContain('MÉTRICAS DE ENGAGEMENT')
      expect(summary).toContain('MÉTRICAS DE VENTAS')
      expect(summary).toContain('RETORNO DE INVERSIÓN (ROI)')
      expect(summary).toContain('PRODUCTOS MÁS VENDIDOS')
      expect(summary).toContain('CONCLUSIÓN')
      
      // Verificar valores
      expect(summary).toContain('Test Campaign')
      expect(summary).toContain('Productos con descuento: 10')
      expect(summary).toContain('Unidades vendidas: 50')
      expect(summary).toContain('ROI: 100.00%')
    })

    it('debe interpretar ROI excelente correctamente', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'High ROI Campaign',
        slug: 'high-roi',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: false,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Para ROI > 200%, necesitamos: (revenue - discount) / discount * 100 > 200
      // Si discount = 1000, revenue debe ser > 3000 para ROI > 200%
      // Con revenue = 4000 y discount = 1000: (4000-1000)/1000*100 = 300%
      const mockProducts = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 100,
          campaignPrice: 90,
          discountPercentage: 10,
          discountAmount: 10,
          unitsSold: 100, // 100 * 10 = 1000 descuento total
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 10,
        totalUnitsSold: 100,
        totalRevenue: 4000,
        averageDiscount: 10
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 10,
        totalViews: 1000,
        totalClicks: 200,
        totalConversions: 100,
        totalRevenue: 4000, // ROI = (4000-1000)/1000*100 = 300%
        conversionRate: 50,
        roi: 300
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      expect(result.executiveSummary).toContain('Excelente')
      expect(result.executiveSummary).toContain('triple')
    })

    it('debe interpretar ROI negativo correctamente', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Low ROI Campaign',
        slug: 'low-roi',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: false,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Para ROI negativo: (revenue - discount) / discount * 100 < 0
      // Si discount = 2000 y revenue = 1000: (1000-2000)/2000*100 = -50%
      const mockProducts = [
        CampaignProduct.fromDatabase({
          id: '1',
          campaignId,
          productId: 'prod-1',
          originalPrice: 200,
          campaignPrice: 100,
          discountPercentage: 50,
          discountAmount: 100,
          unitsSold: 20, // 20 * 100 = 2000 descuento total
          appliedAt: new Date()
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 10,
        totalUnitsSold: 20,
        totalRevenue: 1000,
        averageDiscount: 50
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 50,
        totalViews: 1000,
        totalClicks: 100,
        totalConversions: 20,
        totalRevenue: 1000, // ROI = (1000-2000)/2000*100 = -50%
        conversionRate: 10,
        roi: -50
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      expect(result.executiveSummary).toContain('Negativo')
      expect(result.executiveSummary).toContain('superaron los ingresos')
    })

    it('debe manejar campaña sin ventas', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'No Sales Campaign',
        slug: 'no-sales',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: false,
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
        averageDiscount: 20
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 20,
        totalViews: 100,
        totalClicks: 10,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      expect(result.report.metrics.totalRevenue).toBe(0)
      expect(result.report.metrics.conversionRate).toBe(0)
      expect(result.executiveSummary).toContain('No se registraron ventas')
      expect(result.executiveSummary).toContain('No se registraron conversiones')
    })

    it('debe incluir top 5 productos en el resumen', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: false,
        discountRules: {},
        frontendConfig: {} as any,
        discountsApplied: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Crear 10 productos
      const mockProducts = Array.from({ length: 10 }, (_, i) =>
        CampaignProduct.fromDatabase({
          id: `${i + 1}`,
          campaignId,
          productId: `prod-${i + 1}`,
          originalPrice: 100,
          campaignPrice: 80,
          discountPercentage: 20,
          discountAmount: 20,
          unitsSold: 10 - i, // Descendente
          appliedAt: new Date()
        })
      )

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 10,
        totalUnitsSold: 55,
        totalRevenue: 4400,
        averageDiscount: 20
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 20,
        totalViews: 1000,
        totalClicks: 200,
        totalConversions: 55,
        totalRevenue: 4400,
        conversionRate: 27.5,
        roi: 100
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      const summary = result.executiveSummary
      
      // Debe incluir solo top 5
      expect(summary).toContain('1. Producto prod-1')
      expect(summary).toContain('2. Producto prod-2')
      expect(summary).toContain('3. Producto prod-3')
      expect(summary).toContain('4. Producto prod-4')
      expect(summary).toContain('5. Producto prod-5')
      
      // No debe incluir el 6to
      expect(summary).not.toContain('6. Producto prod-6')
    })

    it('debe calcular duración de campaña correctamente', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const startDate = new Date('2025-11-01')
      const endDate = new Date('2025-11-30') // 29 días
      
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate,
        endDate,
        priority: 1,
        isActive: false,
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
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        conversionRate: 0,
        roi: 0
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      expect(result.executiveSummary).toContain('Duración: 29 días')
    })

    it('debe lanzar error si la campaña no existe', async () => {
      // Arrange
      const campaignId = 'non-existent'
      mockCampaignRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        generateCampaignReport.execute({ campaignId })
      ).rejects.toThrow(`Campaña con ID ${campaignId} no encontrada`)
    })

    it('debe incluir métricas diarias en el reporte', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const mockCampaign = Campaign.fromDatabase({
        id: campaignId,
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(),
        priority: 1,
        isActive: false,
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
          clicks: 200,
          conversions: 50,
          revenue: 5000
        }),
        CampaignAnalytics.fromDatabase({
          id: '2',
          campaignId,
          date: new Date('2025-11-21'),
          views: 1500,
          clicks: 300,
          conversions: 75,
          revenue: 7500
        })
      ]

      mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
      mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
        totalProducts: 10,
        totalUnitsSold: 125,
        totalRevenue: 12500,
        averageDiscount: 20
      })
      mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
        productsWithDiscount: 10,
        averageDiscountPercentage: 20,
        totalViews: 2500,
        totalClicks: 500,
        totalConversions: 125,
        totalRevenue: 12500,
        conversionRate: 25,
        roi: 100
      })
      mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue(mockDailyAnalytics)
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

      // Act
      const result = await generateCampaignReport.execute({ campaignId })

      // Assert
      expect(result.report.dailyMetrics).toHaveLength(2)
      expect(result.report.dailyMetrics[0].views).toBe(1000)
      expect(result.report.dailyMetrics[0].conversions).toBe(50)
      expect(result.report.dailyMetrics[1].views).toBe(1500)
      expect(result.report.dailyMetrics[1].conversions).toBe(75)
    })
  })
})


/**
 * Property-Based Tests para GenerateCampaignReport
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para cualquier conjunto de datos válidos.
 */

import fc from 'fast-check'

describe('Property-Based Tests', () => {
  let generateCampaignReport: GenerateCampaignReport
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

    generateCampaignReport = new GenerateCampaignReport(
      mockCampaignRepository,
      mockCampaignProductRepository,
      mockCampaignAnalyticsRepository
    )
  })

  /**
   * Feature: campaign-manager-service, Property 21: Campaign Report Generation
   * Validates: Requirements 4.6
   * 
   * Para cualquier campaña finalizada, debe generarse un reporte con todas
   * las métricas antes de remover los descuentos.
   */
  it('Property 21: campaign report should be generated with all metrics', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generador de campaña
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 50 }),
          slug: fc.string({ minLength: 3, maxLength: 50 }),
          startDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-06-30') }),
          endDate: fc.date({ min: new Date('2025-07-01'), max: new Date('2025-12-31') }),
          priority: fc.integer({ min: 1, max: 100 }),
          isActive: fc.boolean(),
          discountRules: fc.constant({}),
          frontendConfig: fc.constant({} as any),
          discountsApplied: fc.boolean(),
          createdAt: fc.date(),
          updatedAt: fc.date()
        }),
        // Generador de métricas
        fc.record({
          productsWithDiscount: fc.integer({ min: 1, max: 1000 }),
          averageDiscountPercentage: fc.float({ min: 1, max: 99, noNaN: true }),
          unitsSold: fc.integer({ min: 0, max: 10000 }),
          revenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
          totalViews: fc.integer({ min: 0, max: 1000000 }),
          totalClicks: fc.integer({ min: 0, max: 500000 }),
          totalConversions: fc.integer({ min: 0, max: 100000 }),
          conversionRate: fc.float({ min: 0, max: 100, noNaN: true }),
          roi: fc.float({ min: -100, max: 1000, noNaN: true }),
          totalDiscountGiven: fc.float({ min: 0, max: 500000, noNaN: true })
        }),
        async (campaignData, metricsData) => {
          // Arrange
          const campaignId = campaignData.id
          const mockCampaign = Campaign.fromDatabase(campaignData)

          // Asegurar coherencia: clicks <= views, conversions <= clicks
          const validMetrics = {
            ...metricsData,
            totalClicks: Math.min(metricsData.totalClicks, metricsData.totalViews),
            totalConversions: Math.min(
              metricsData.totalConversions,
              Math.min(metricsData.totalClicks, metricsData.totalViews)
            )
          }

          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: validMetrics.productsWithDiscount,
            totalUnitsSold: validMetrics.unitsSold,
            totalRevenue: validMetrics.revenue,
            averageDiscount: validMetrics.averageDiscountPercentage
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount: validMetrics.productsWithDiscount,
            averageDiscountPercentage: validMetrics.averageDiscountPercentage,
            totalViews: validMetrics.totalViews,
            totalClicks: validMetrics.totalClicks,
            totalConversions: validMetrics.totalConversions,
            totalRevenue: validMetrics.revenue,
            conversionRate: validMetrics.conversionRate,
            roi: validMetrics.roi
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

          // Act
          const result = await generateCampaignReport.execute({ campaignId })

          // Assert - Requirement 4.6: Reporte debe contener todas las métricas
          expect(result.report).toBeDefined()
          expect(result.report.campaign).toBeDefined()
          expect(result.report.metrics).toBeDefined()
          expect(result.report.topProducts).toBeDefined()
          expect(result.report.dailyMetrics).toBeDefined()

          // Verificar que las métricas están presentes
          expect(result.report.metrics.productsWithDiscount).toBe(validMetrics.productsWithDiscount)
          expect(result.report.metrics.averageDiscountPercentage).toBeCloseTo(validMetrics.averageDiscountPercentage, 2)
          expect(result.report.metrics.totalRevenue).toBeCloseTo(validMetrics.revenue, 2)
          expect(result.report.metrics.conversionRate).toBeCloseTo(validMetrics.conversionRate, 2)
          // ROI se calcula internamente basado en productos, verificar que es un número válido
          expect(typeof result.report.metrics.roi).toBe('number')
          expect(Number.isFinite(result.report.metrics.roi)).toBe(true)

          // Verificar que el resumen ejecutivo existe y contiene información clave
          expect(result.executiveSummary).toBeDefined()
          expect(result.executiveSummary).toContain(campaignData.name)
          expect(result.executiveSummary).toContain('REPORTE EJECUTIVO')
          expect(result.executiveSummary).toContain('MÉTRICAS')
          expect(result.executiveSummary).toContain('ROI')

          // Verificar que tiene fecha de generación
          expect(result.generatedAt).toBeInstanceOf(Date)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Executive summary completeness
   * 
   * Para cualquier campaña, el resumen ejecutivo debe contener todas
   * las secciones requeridas.
   */
  it('Property: executive summary should contain all required sections', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 3, maxLength: 50 }),
          slug: fc.string({ minLength: 3, maxLength: 50 }),
          startDate: fc.date(),
          endDate: fc.date(),
          priority: fc.integer({ min: 1, max: 100 }),
          isActive: fc.boolean(),
          discountRules: fc.constant({}),
          frontendConfig: fc.constant({} as any),
          discountsApplied: fc.boolean(),
          createdAt: fc.date(),
          updatedAt: fc.date()
        }),
        async (campaignData) => {
          // Arrange
          const mockCampaign = Campaign.fromDatabase(campaignData)

          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: 10,
            totalUnitsSold: 100,
            totalRevenue: 10000,
            averageDiscount: 20
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount: 10,
            averageDiscountPercentage: 20,
            totalViews: 1000,
            totalClicks: 200,
            totalConversions: 50,
            totalRevenue: 10000,
            conversionRate: 25,
            roi: 100
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

          // Act
          const result = await generateCampaignReport.execute({ campaignId: campaignData.id })

          // Assert - Todas las secciones deben estar presentes
          const summary = result.executiveSummary
          const requiredSections = [
            'REPORTE EJECUTIVO',
            'PERÍODO DE LA CAMPAÑA',
            'RESUMEN DE PRODUCTOS',
            'MÉTRICAS DE ENGAGEMENT',
            'MÉTRICAS DE VENTAS',
            'RETORNO DE INVERSIÓN',
            'PRODUCTOS MÁS VENDIDOS',
            'CONCLUSIÓN'
          ]

          requiredSections.forEach(section => {
            expect(summary).toContain(section)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Report consistency
   * 
   * Para cualquier campaña, los datos en el reporte deben ser consistentes
   * con los datos de entrada.
   */
  it('Property: report data should be consistent with input data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // campaignId
        fc.string({ minLength: 3, maxLength: 50 }), // campaignName
        fc.integer({ min: 1, max: 1000 }), // productsWithDiscount
        fc.float({ min: 0, max: 1000000, noNaN: true }), // revenue
        async (campaignId, campaignName, productsWithDiscount, revenue) => {
          // Arrange
          const mockCampaign = Campaign.fromDatabase({
            id: campaignId,
            name: campaignName,
            slug: 'test',
            startDate: new Date(),
            endDate: new Date(),
            priority: 1,
            isActive: false,
            discountRules: {},
            frontendConfig: {} as any,
            discountsApplied: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: productsWithDiscount,
            totalUnitsSold: 100,
            totalRevenue: revenue,
            averageDiscount: 20
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount,
            averageDiscountPercentage: 20,
            totalViews: 1000,
            totalClicks: 200,
            totalConversions: 50,
            totalRevenue: revenue,
            conversionRate: 25,
            roi: 100
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

          // Act
          const result = await generateCampaignReport.execute({ campaignId })

          // Assert - Los datos del reporte deben coincidir con los de entrada
          expect(result.report.campaign.id).toBe(campaignId)
          expect(result.report.campaign.name).toBe(campaignName)
          expect(result.report.metrics.productsWithDiscount).toBe(productsWithDiscount)
          expect(result.report.metrics.totalRevenue).toBeCloseTo(revenue, 2)

          // El resumen debe contener el nombre de la campaña
          expect(result.executiveSummary).toContain(campaignName)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: ROI interpretation consistency
   * 
   * Para cualquier ROI calculado, la interpretación debe ser consistente con el valor.
   * Nota: El ROI se calcula internamente basado en (revenue - totalDiscount) / totalDiscount * 100
   */
  it('Property: ROI interpretation should match calculated ROI value', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generar valores que produzcan diferentes rangos de ROI
        fc.record({
          revenue: fc.integer({ min: 100, max: 100000 }),
          discountPerUnit: fc.integer({ min: 10, max: 500 }),
          unitsSold: fc.integer({ min: 1, max: 100 })
        }),
        async ({ revenue, discountPerUnit, unitsSold }) => {
          // Arrange
          const campaignId = 'test-campaign'
          const totalDiscount = discountPerUnit * unitsSold
          // ROI calculado = (revenue - totalDiscount) / totalDiscount * 100
          const expectedRoi = totalDiscount > 0 ? ((revenue - totalDiscount) / totalDiscount) * 100 : 0
          
          const mockCampaign = Campaign.fromDatabase({
            id: campaignId,
            name: 'Test Campaign',
            slug: 'test',
            startDate: new Date(),
            endDate: new Date(),
            priority: 1,
            isActive: false,
            discountRules: {},
            frontendConfig: {} as any,
            discountsApplied: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          // Crear productos que generen el descuento total esperado
          const mockProducts = [
            CampaignProduct.fromDatabase({
              id: '1',
              campaignId,
              productId: 'prod-1',
              originalPrice: 1000,
              campaignPrice: 1000 - discountPerUnit,
              discountPercentage: Math.round((discountPerUnit / 1000) * 100),
              discountAmount: discountPerUnit,
              unitsSold: unitsSold,
              appliedAt: new Date()
            })
          ]

          mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
          mockCampaignProductRepository.getStatsByCampaignId.mockResolvedValue({
            totalProducts: 1,
            totalUnitsSold: unitsSold,
            totalRevenue: revenue,
            averageDiscount: Math.round((discountPerUnit / 1000) * 100)
          })
          mockCampaignAnalyticsRepository.getAggregatedMetrics.mockResolvedValue({
            productsWithDiscount: 1,
            averageDiscountPercentage: Math.round((discountPerUnit / 1000) * 100),
            totalViews: 1000,
            totalClicks: 200,
            totalConversions: unitsSold,
            totalRevenue: revenue,
            conversionRate: 25,
            roi: expectedRoi
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue(mockProducts)

          // Act
          const result = await generateCampaignReport.execute({ campaignId })

          // Assert - La interpretación debe ser consistente con el ROI calculado
          const summary = result.executiveSummary
          const calculatedRoi = result.report.metrics.roi

          // Verificar que la interpretación es consistente con el ROI calculado
          // Nota: El ROI se calcula internamente, así que verificamos la consistencia
          if (calculatedRoi > 200) {
            expect(summary).toContain('Excelente')
          } else if (calculatedRoi > 100) {
            expect(summary).toContain('Muy bueno')
          } else if (calculatedRoi > 50) {
            expect(summary).toContain('Bueno')
          } else if (calculatedRoi > 0.01) { // Usar umbral pequeño para evitar problemas de precisión
            expect(summary).toContain('Moderado')
          } else if (calculatedRoi >= -0.01 && calculatedRoi <= 0.01) { // Cerca de cero
            expect(summary).toContain('equilibrio')
          } else {
            expect(summary).toContain('Negativo')
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Generated date is recent
   * 
   * Para cualquier reporte generado, la fecha de generación debe ser reciente
   * (dentro de los últimos 5 segundos).
   */
  it('Property: generated date should be recent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // campaignId
        async (campaignId) => {
          // Arrange
          const beforeGeneration = new Date()
          
          const mockCampaign = Campaign.fromDatabase({
            id: campaignId,
            name: 'Test',
            slug: 'test',
            startDate: new Date(),
            endDate: new Date(),
            priority: 1,
            isActive: false,
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
            totalViews: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            conversionRate: 0,
            roi: 0
          })
          mockCampaignAnalyticsRepository.findByCampaignId.mockResolvedValue([])
          mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

          // Act
          const result = await generateCampaignReport.execute({ campaignId })
          const afterGeneration = new Date()

          // Assert - La fecha de generación debe estar entre antes y después
          expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime())
          expect(result.generatedAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })
})
