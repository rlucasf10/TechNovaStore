/**
 * Property-Based Tests para CheckDeactivateCampaigns
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso CheckDeactivateCampaigns.
 */

import fc from 'fast-check'
import { CheckDeactivateCampaigns, CheckDeactivateOutput } from './CheckDeactivateCampaigns'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { RemoveCampaignDiscounts, RemoveDiscountsOutput } from '../remove-campaign-discounts/RemoveCampaignDiscounts'
import { NotificationServiceClient } from '../shared/clients/NotificationServiceClient'
import { Campaign, CampaignProduct, CampaignReport, FrontendConfig } from '../shared/types'

/**
 * Mocks para las dependencias
 */
class MockCampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async findPendingDeactivation(now: Date): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(c => c.isActive && c.endDate <= now)
      .sort((a, b) => b.priority - a.priority)
  }

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaigns.get(id)
    if (!campaign) throw new Error('Campaign not found')
    
    const updated = { ...campaign, ...data, updatedAt: new Date() }
    this.campaigns.set(id, updated)
    return updated
  }

  setCampaign(campaign: Campaign): void {
    this.campaigns.set(campaign.id, campaign)
  }

  setCampaigns(campaigns: Campaign[]): void {
    campaigns.forEach(c => this.setCampaign(c))
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id)
  }

  clear(): void {
    this.campaigns.clear()
  }
}

class MockCampaignProductRepository {
  private campaignProducts: Map<string, CampaignProduct[]> = new Map()

  async findByCampaignId(campaignId: string): Promise<CampaignProduct[]> {
    return this.campaignProducts.get(campaignId) || []
  }

  setCampaignProducts(campaignId: string, products: CampaignProduct[]): void {
    this.campaignProducts.set(campaignId, products)
  }

  clear(): void {
    this.campaignProducts.clear()
  }
}

class MockRemoveCampaignDiscounts {
  private shouldFail: boolean = false

  async execute(input: { campaignId: string }): Promise<RemoveDiscountsOutput> {
    if (this.shouldFail) {
      throw new Error('Simulated failure')
    }

    return {
      productsRestored: 10,
      processingTime: 1.5
    }
  }

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail
  }

  clear(): void {
    this.shouldFail = false
  }
}

class MockNotificationServiceClient {
  private deactivationNotifications: Array<{ campaignId: string; campaignName: string }> = []
  private errorNotifications: Array<{ campaignId: string; error: string }> = []

  async sendCampaignDeactivated(
    campaign: Campaign,
    report: CampaignReport
  ): Promise<void> {
    this.deactivationNotifications.push({
      campaignId: campaign.id,
      campaignName: campaign.name
    })
  }

  async sendCampaignError(
    campaign: Campaign,
    error: Error,
    operation: string
  ): Promise<void> {
    this.errorNotifications.push({
      campaignId: campaign.id,
      error: error.message
    })
  }

  getDeactivationNotifications(): Array<{ campaignId: string; campaignName: string }> {
    return this.deactivationNotifications
  }

  getErrorNotifications(): Array<{ campaignId: string; error: string }> {
    return this.errorNotifications
  }

  clear(): void {
    this.deactivationNotifications = []
    this.errorNotifications = []
  }
}

/**
 * Generadores (Arbitraries) para fast-check
 */

const frontendConfigArbitrary = (): fc.Arbitrary<FrontendConfig> => {
  return fc.record({
    promoBanner: fc.record({
      messages: fc.array(
        fc.record({
          icon: fc.constantFrom('🔥', '⚡', '🎉', '💥'),
          text: fc.string({ minLength: 10, maxLength: 50 })
        }),
        { minLength: 1, maxLength: 3 }
      )
    }),
    hero: fc.record({
      title: fc.string({ minLength: 10, maxLength: 50 }),
      subtitle: fc.string({ minLength: 10, maxLength: 100 }),
      ctaText: fc.string({ minLength: 5, maxLength: 20 })
    }),
    dealsSection: fc.record({
      title: fc.string({ minLength: 10, maxLength: 50 }),
      subtitle: fc.string({ minLength: 10, maxLength: 100 }),
      badge: fc.string({ minLength: 5, maxLength: 20 })
    })
  })
}

/**
 * Genera una campaña pendiente de desactivación
 * (end_date <= now, is_active = true)
 */
const pendingDeactivationCampaignArbitrary = (now: Date): fc.Arbitrary<Campaign> => {
  const pastStartDate = new Date(now.getTime() - 172800000) // -2 días
  const pastEndDate = new Date(now.getTime() - 86400000) // -1 día (ya terminó)
  
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    slug: fc.string({ minLength: 5, maxLength: 50 }),
    startDate: fc.constant(pastStartDate),
    endDate: fc.constant(pastEndDate), // En el pasado (debe desactivarse)
    priority: fc.integer({ min: 1, max: 100 }),
    isActive: fc.constant(true), // Activa (debe desactivarse)
    discountRules: fc.record({
      global: fc.record({
        type: fc.constant('percentage' as const),
        value: fc.integer({ min: 10, max: 50 })
      })
    }),
    frontendConfig: frontendConfigArbitrary(),
    discountsApplied: fc.constant(true),
    appliedAt: fc.constant(pastStartDate),
    deactivatedAt: fc.constant(undefined),
    createdAt: fc.constant(pastStartDate),
    updatedAt: fc.constant(pastStartDate)
  })
}

/**
 * Genera una campaña que NO debe desactivarse
 */
const nonPendingDeactivationCampaignArbitrary = (now: Date): fc.Arbitrary<Campaign> => {
  const pastDate = new Date(now.getTime() - 86400000)
  const futureDate = new Date(now.getTime() + 86400000) // +1 día
  
  return fc.oneof(
    // Campaña ya desactivada
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      slug: fc.string({ minLength: 5, maxLength: 50 }),
      startDate: fc.constant(pastDate),
      endDate: fc.constant(pastDate),
      priority: fc.integer({ min: 1, max: 100 }),
      isActive: fc.constant(false), // Ya desactivada
      discountRules: fc.record({
        global: fc.record({
          type: fc.constant('percentage' as const),
          value: fc.integer({ min: 10, max: 50 })
        })
      }),
      frontendConfig: frontendConfigArbitrary(),
      discountsApplied: fc.constant(true),
      appliedAt: fc.constant(pastDate),
      deactivatedAt: fc.constant(pastDate),
      createdAt: fc.constant(pastDate),
      updatedAt: fc.constant(pastDate)
    }),
    // Campaña que aún no termina
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      slug: fc.string({ minLength: 5, maxLength: 50 }),
      startDate: fc.constant(pastDate),
      endDate: fc.constant(futureDate), // Aún no termina
      priority: fc.integer({ min: 1, max: 100 }),
      isActive: fc.constant(true),
      discountRules: fc.record({
        global: fc.record({
          type: fc.constant('percentage' as const),
          value: fc.integer({ min: 10, max: 50 })
        })
      }),
      frontendConfig: frontendConfigArbitrary(),
      discountsApplied: fc.constant(true),
      appliedAt: fc.constant(pastDate),
      deactivatedAt: fc.constant(undefined),
      createdAt: fc.constant(pastDate),
      updatedAt: fc.constant(pastDate)
    })
  )
}

/**
 * Genera productos de campaña para testing
 */
const campaignProductArbitrary = (campaignId: string): fc.Arbitrary<CampaignProduct> => {
  return fc.record({
    id: fc.uuid(),
    campaignId: fc.constant(campaignId),
    productId: fc.uuid(),
    originalPrice: fc.float({ min: 100, max: 2000, noNaN: true }),
    campaignPrice: fc.float({ min: 50, max: 1500, noNaN: true }),
    discountPercentage: fc.integer({ min: 10, max: 50 }),
    discountAmount: fc.float({ min: 10, max: 500, noNaN: true }),
    unitsSold: fc.integer({ min: 0, max: 100 }),
    appliedAt: fc.constant(new Date())
  })
}

/**
 * Tests de Propiedades
 */
describe('CheckDeactivateCampaigns - Property-Based Tests', () => {
  let checkDeactivateCampaigns: CheckDeactivateCampaigns
  let mockCampaignRepo: MockCampaignRepository
  let mockCampaignProductRepo: MockCampaignProductRepository
  let mockRemoveDiscounts: MockRemoveCampaignDiscounts
  let mockNotificationClient: MockNotificationServiceClient

  beforeEach(() => {
    mockCampaignRepo = new MockCampaignRepository()
    mockCampaignProductRepo = new MockCampaignProductRepository()
    mockRemoveDiscounts = new MockRemoveCampaignDiscounts()
    mockNotificationClient = new MockNotificationServiceClient()

    checkDeactivateCampaigns = new CheckDeactivateCampaigns(
      mockCampaignRepo as any,
      mockCampaignProductRepo as any,
      mockRemoveDiscounts as any,
      mockNotificationClient as any
    )
  })

  afterEach(() => {
    mockCampaignRepo.clear()
    mockCampaignProductRepo.clear()
    mockRemoveDiscounts.clear()
    mockNotificationClient.clear()
  })

  // Helper para limpiar mocks al inicio de cada iteración
  const clearMocks = () => {
    mockCampaignRepo.clear()
    mockCampaignProductRepo.clear()
    mockRemoveDiscounts.clear()
    mockNotificationClient.clear()
  }

  /**
   * Feature: campaign-manager-service, Property 23: Campaign Deactivation Detection
   * Validates: Requirements 5.4
   * 
   * Para cualquier campaña cuya fecha de fin ha pasado y está activa,
   * el sistema debe detectarla y desactivarla automáticamente.
   */
  describe('Property 23: Campaign Deactivation Detection', () => {
    it('should detect and deactivate all campaigns with end_date <= now and is_active = true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingDeactivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 10 }),
          async (pendingCampaigns) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaigns(pendingCampaigns)
            
            // Agregar productos de campaña para cada campaña
            for (const campaign of pendingCampaigns) {
              const products = await fc.sample(
                campaignProductArbitrary(campaign.id),
                { numRuns: 5 }
              )
              mockCampaignProductRepo.setCampaignProducts(campaign.id, products)
            }

            // Act
            const result = await checkDeactivateCampaigns.execute()

            // Assert
            // Todas las campañas pendientes deben ser detectadas
            expect(result.campaignsDetected).toBe(pendingCampaigns.length)
            
            // Todas deben desactivarse exitosamente (sin fallos simulados)
            expect(result.campaignsDeactivated).toBe(pendingCampaigns.length)
            expect(result.campaignsFailed).toBe(0)
            
            // Cada campaña debe tener un detalle de éxito
            expect(result.details.length).toBe(pendingCampaigns.length)
            result.details.forEach(detail => {
              expect(detail.success).toBe(true)
              expect(detail.productsRestored).toBeGreaterThan(0)
              expect(detail.report).toBeDefined()
            })

            // Verificar que se enviaron notificaciones de desactivación
            const notifications = mockNotificationClient.getDeactivationNotifications()
            expect(notifications.length).toBe(pendingCampaigns.length)
            
            // Cada campaña debe tener su notificación
            pendingCampaigns.forEach(campaign => {
              const notification = notifications.find(n => n.campaignId === campaign.id)
              expect(notification).toBeDefined()
              expect(notification?.campaignName).toBe(campaign.name)
            })

            // Verificar que las campañas fueron marcadas como inactivas
            pendingCampaigns.forEach(campaign => {
              const updated = mockCampaignRepo.getCampaign(campaign.id)
              expect(updated?.isActive).toBe(false)
              expect(updated?.deactivatedAt).toBeDefined()
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should NOT detect campaigns that are already inactive or not yet ended', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(nonPendingDeactivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 10 }),
          async (nonPendingCampaigns) => {
            // Arrange
            mockCampaignRepo.setCampaigns(nonPendingCampaigns)

            // Act
            const result = await checkDeactivateCampaigns.execute()

            // Assert
            // No debe detectar ninguna campaña
            expect(result.campaignsDetected).toBe(0)
            expect(result.campaignsDeactivated).toBe(0)
            expect(result.campaignsFailed).toBe(0)
            expect(result.details.length).toBe(0)

            // No debe enviar notificaciones
            const notifications = mockNotificationClient.getDeactivationNotifications()
            expect(notifications.length).toBe(0)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should detect only pending campaigns when mixed with non-pending ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingDeactivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 5 }),
          fc.array(nonPendingDeactivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 5 }),
          async (pendingCampaigns, nonPendingCampaigns) => {
            // Arrange
            const allCampaigns = [...pendingCampaigns, ...nonPendingCampaigns]
            mockCampaignRepo.setCampaigns(allCampaigns)
            
            // Agregar productos solo para campañas pendientes
            for (const campaign of pendingCampaigns) {
              const products = await fc.sample(
                campaignProductArbitrary(campaign.id),
                { numRuns: 5 }
              )
              mockCampaignProductRepo.setCampaignProducts(campaign.id, products)
            }

            // Act
            const result = await checkDeactivateCampaigns.execute()

            // Assert
            // Solo debe detectar las campañas pendientes
            expect(result.campaignsDetected).toBe(pendingCampaigns.length)
            expect(result.campaignsDeactivated).toBe(pendingCampaigns.length)
            
            // Verificar que solo se desactivaron las campañas pendientes
            result.details.forEach(detail => {
              const isPending = pendingCampaigns.some(c => c.id === detail.campaignId)
              expect(isPending).toBe(true)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should deactivate campaigns in priority order (highest first)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingDeactivationCampaignArbitrary(new Date()), { minLength: 2, maxLength: 10 }),
          async (campaigns) => {
            // Arrange - Asignar prioridades únicas
            const campaignsWithPriorities = campaigns.map((c, index) => ({
              ...c,
              priority: (index + 1) * 10 // 10, 20, 30, ...
            }))
            
            mockCampaignRepo.setCampaigns(campaignsWithPriorities)
            
            // Agregar productos para cada campaña
            for (const campaign of campaignsWithPriorities) {
              const products = await fc.sample(
                campaignProductArbitrary(campaign.id),
                { numRuns: 5 }
              )
              mockCampaignProductRepo.setCampaignProducts(campaign.id, products)
            }

            // Act
            const result = await checkDeactivateCampaigns.execute()

            // Assert
            // Verificar que se procesaron en orden de prioridad descendente
            const sortedByPriority = [...campaignsWithPriorities].sort((a, b) => b.priority - a.priority)
            
            // Los detalles deben estar en el mismo orden que se procesaron
            for (let i = 0; i < result.details.length; i++) {
              const detail = result.details[i]
              const expectedCampaign = sortedByPriority[i]
              expect(detail.campaignId).toBe(expectedCampaign.id)
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should generate report with correct metrics for each campaign', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingDeactivationCampaignArbitrary(new Date()),
          fc.array(campaignProductArbitrary('temp'), { minLength: 1, maxLength: 20 }),
          async (campaign, productsTemplate) => {
            // Arrange
            const products = productsTemplate.map(p => ({ ...p, campaignId: campaign.id }))
            mockCampaignRepo.setCampaign(campaign)
            mockCampaignProductRepo.setCampaignProducts(campaign.id, products)

            // Act
            const result = await checkDeactivateCampaigns.execute()

            // Assert
            expect(result.details.length).toBe(1)
            const detail = result.details[0]
            
            expect(detail.success).toBe(true)
            expect(detail.report).toBeDefined()
            
            if (detail.report) {
              // Verificar métricas del reporte
              expect(detail.report.metrics.productsWithDiscount).toBe(products.length)
              expect(detail.report.metrics.totalConversions).toBe(
                products.reduce((sum, p) => sum + p.unitsSold, 0)
              )
              expect(detail.report.metrics.totalRevenue).toBeGreaterThanOrEqual(0)
              expect(detail.report.topProducts.length).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 30 }
      )
    })
  })
})
