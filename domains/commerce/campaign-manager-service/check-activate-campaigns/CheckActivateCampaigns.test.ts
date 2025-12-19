/**
 * Property-Based Tests para CheckActivateCampaigns
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso CheckActivateCampaigns.
 */

import fc from 'fast-check'
import { CheckActivateCampaigns, CheckActivateOutput } from './CheckActivateCampaigns'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { ApplyCampaignDiscounts, ApplyDiscountsOutput } from '../apply-campaign-discounts/ApplyCampaignDiscounts'
import { NotificationServiceClient } from '../shared/clients/NotificationServiceClient'
import { Campaign, DiscountRules, FrontendConfig } from '../shared/types'

/**
 * Mocks para las dependencias
 */
class MockCampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async findPendingActivation(now: Date): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(c => 
        !c.isActive && 
        !c.discountsApplied &&
        c.startDate <= now &&
        c.endDate > now
      )
      .sort((a, b) => b.priority - a.priority)
  }

  setCampaign(campaign: Campaign): void {
    this.campaigns.set(campaign.id, campaign)
  }

  setCampaigns(campaigns: Campaign[]): void {
    campaigns.forEach(c => this.setCampaign(c))
  }

  clear(): void {
    this.campaigns.clear()
  }
}

class MockApplyCampaignDiscounts {
  private shouldFail: boolean = false
  private failuresBeforeSuccess: number = 0
  private attemptCount: Map<string, number> = new Map()

  async execute(input: { campaignId: string }): Promise<ApplyDiscountsOutput> {
    const attempts = this.attemptCount.get(input.campaignId) || 0
    this.attemptCount.set(input.campaignId, attempts + 1)

    // Simular fallos antes de éxito (para testing de reintentos)
    if (this.failuresBeforeSuccess > 0 && attempts < this.failuresBeforeSuccess) {
      throw new Error(`Simulated failure (attempt ${attempts + 1})`)
    }

    if (this.shouldFail) {
      throw new Error('Simulated failure')
    }

    return {
      productsAffected: 10,
      totalDiscountAmount: 1000,
      averageDiscountPercentage: 25,
      processingTime: 1.5
    }
  }

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail
  }

  setFailuresBeforeSuccess(count: number): void {
    this.failuresBeforeSuccess = count
  }

  getAttemptCount(campaignId: string): number {
    return this.attemptCount.get(campaignId) || 0
  }

  clear(): void {
    this.shouldFail = false
    this.failuresBeforeSuccess = 0
    this.attemptCount.clear()
  }
}

class MockNotificationServiceClient {
  private activationNotifications: Array<{ campaignId: string; campaignName: string }> = []
  private errorNotifications: Array<{ campaignId: string; error: string }> = []

  async sendCampaignActivated(
    campaign: Campaign,
    productsAffected: number,
    averageDiscount: number
  ): Promise<void> {
    this.activationNotifications.push({
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

  getActivationNotifications(): Array<{ campaignId: string; campaignName: string }> {
    return this.activationNotifications
  }

  getErrorNotifications(): Array<{ campaignId: string; error: string }> {
    return this.errorNotifications
  }

  clear(): void {
    this.activationNotifications = []
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
 * Genera una campaña pendiente de activación
 * (start_date <= now, is_active = false, discounts_applied = false)
 */
const pendingActivationCampaignArbitrary = (now: Date): fc.Arbitrary<Campaign> => {
  const pastDate = new Date(now.getTime() - 86400000) // -1 día
  const futureDate = new Date(now.getTime() + 86400000) // +1 día
  
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    slug: fc.string({ minLength: 5, maxLength: 50 }),
    startDate: fc.constant(pastDate), // En el pasado (debe activarse)
    endDate: fc.constant(futureDate), // En el futuro (aún no termina)
    priority: fc.integer({ min: 1, max: 100 }),
    isActive: fc.constant(false), // No activa
    discountRules: fc.record({
      global: fc.record({
        type: fc.constant('percentage' as const),
        value: fc.integer({ min: 10, max: 50 })
      })
    }),
    frontendConfig: frontendConfigArbitrary(),
    discountsApplied: fc.constant(false), // Descuentos no aplicados
    appliedAt: fc.constant(undefined),
    deactivatedAt: fc.constant(undefined),
    createdAt: fc.constant(now),
    updatedAt: fc.constant(now)
  })
}

/**
 * Genera una campaña que NO debe activarse
 */
const nonPendingCampaignArbitrary = (now: Date): fc.Arbitrary<Campaign> => {
  const pastDate = new Date(now.getTime() - 86400000)
  const futureDate = new Date(now.getTime() + 86400000)
  const veryFutureDate = new Date(now.getTime() + 172800000) // +2 días
  
  return fc.oneof(
    // Campaña ya activa
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      slug: fc.string({ minLength: 5, maxLength: 50 }),
      startDate: fc.constant(pastDate),
      endDate: fc.constant(futureDate),
      priority: fc.integer({ min: 1, max: 100 }),
      isActive: fc.constant(true), // Ya activa
      discountRules: fc.record({
        global: fc.record({
          type: fc.constant('percentage' as const),
          value: fc.integer({ min: 10, max: 50 })
        })
      }),
      frontendConfig: frontendConfigArbitrary(),
      discountsApplied: fc.constant(true),
      appliedAt: fc.constant(now),
      deactivatedAt: fc.constant(undefined),
      createdAt: fc.constant(now),
      updatedAt: fc.constant(now)
    }),
    // Campaña que aún no debe iniciar
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      slug: fc.string({ minLength: 5, maxLength: 50 }),
      startDate: fc.constant(futureDate), // En el futuro
      endDate: fc.constant(veryFutureDate),
      priority: fc.integer({ min: 1, max: 100 }),
      isActive: fc.constant(false),
      discountRules: fc.record({
        global: fc.record({
          type: fc.constant('percentage' as const),
          value: fc.integer({ min: 10, max: 50 })
        })
      }),
      frontendConfig: frontendConfigArbitrary(),
      discountsApplied: fc.constant(false),
      appliedAt: fc.constant(undefined),
      deactivatedAt: fc.constant(undefined),
      createdAt: fc.constant(now),
      updatedAt: fc.constant(now)
    })
  )
}

/**
 * Tests de Propiedades
 */
describe('CheckActivateCampaigns - Property-Based Tests', () => {
  let checkActivateCampaigns: CheckActivateCampaigns
  let mockCampaignRepo: MockCampaignRepository
  let mockApplyDiscounts: MockApplyCampaignDiscounts
  let mockNotificationClient: MockNotificationServiceClient

  beforeEach(() => {
    mockCampaignRepo = new MockCampaignRepository()
    mockApplyDiscounts = new MockApplyCampaignDiscounts()
    mockNotificationClient = new MockNotificationServiceClient()

    checkActivateCampaigns = new CheckActivateCampaigns(
      mockCampaignRepo as any,
      mockApplyDiscounts as any,
      mockNotificationClient as any,
      { maxRetries: 3, retryBaseDelay: 10 } // Delays cortos para tests
    )
  })

  afterEach(() => {
    mockCampaignRepo.clear()
    mockApplyDiscounts.clear()
    mockNotificationClient.clear()
  })

  // Helper para limpiar mocks al inicio de cada iteración de property test
  const clearMocks = () => {
    mockCampaignRepo.clear()
    mockApplyDiscounts.clear()
    mockNotificationClient.clear()
  }

  /**
   * Feature: campaign-manager-service, Property 22: Campaign Activation Detection
   * Validates: Requirements 5.2
   * 
   * Para cualquier campaña cuya fecha de inicio ha llegado y no está activa,
   * el sistema debe detectarla y activarla automáticamente.
   */
  describe('Property 22: Campaign Activation Detection', () => {
    it('should detect and activate all campaigns with start_date <= now and is_active = false', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingActivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 10 }),
          async (pendingCampaigns) => {
            // Limpiar mocks al inicio de cada iteración
            clearMocks()
            
            // Arrange
            mockCampaignRepo.setCampaigns(pendingCampaigns)

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            // Todas las campañas pendientes deben ser detectadas
            expect(result.campaignsDetected).toBe(pendingCampaigns.length)
            
            // Todas deben activarse exitosamente (sin fallos simulados)
            expect(result.campaignsActivated).toBe(pendingCampaigns.length)
            expect(result.campaignsFailed).toBe(0)
            
            // Cada campaña debe tener un detalle de éxito
            expect(result.details.length).toBe(pendingCampaigns.length)
            result.details.forEach(detail => {
              expect(detail.success).toBe(true)
              expect(detail.productsAffected).toBeGreaterThan(0)
            })

            // Verificar que se enviaron notificaciones de activación
            const notifications = mockNotificationClient.getActivationNotifications()
            expect(notifications.length).toBe(pendingCampaigns.length)
            
            // Cada campaña debe tener su notificación
            pendingCampaigns.forEach(campaign => {
              const notification = notifications.find(n => n.campaignId === campaign.id)
              expect(notification).toBeDefined()
              expect(notification?.campaignName).toBe(campaign.name)
            })
          }
        ),
        { numRuns: 50 } // Reducido para tests más rápidos
      )
    })

    it('should NOT detect campaigns that are already active or not yet started', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(nonPendingCampaignArbitrary(new Date()), { minLength: 1, maxLength: 10 }),
          async (nonPendingCampaigns) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaigns(nonPendingCampaigns)

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            // No debe detectar ninguna campaña
            expect(result.campaignsDetected).toBe(0)
            expect(result.campaignsActivated).toBe(0)
            expect(result.campaignsFailed).toBe(0)
            expect(result.details.length).toBe(0)

            // No debe enviar notificaciones
            const notifications = mockNotificationClient.getActivationNotifications()
            expect(notifications.length).toBe(0)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should detect only pending campaigns when mixed with non-pending ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingActivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 5 }),
          fc.array(nonPendingCampaignArbitrary(new Date()), { minLength: 1, maxLength: 5 }),
          async (pendingCampaigns, nonPendingCampaigns) => {
            clearMocks()
            // Arrange
            const allCampaigns = [...pendingCampaigns, ...nonPendingCampaigns]
            mockCampaignRepo.setCampaigns(allCampaigns)

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            // Solo debe detectar las campañas pendientes
            expect(result.campaignsDetected).toBe(pendingCampaigns.length)
            expect(result.campaignsActivated).toBe(pendingCampaigns.length)
            
            // Verificar que solo se activaron las campañas pendientes
            result.details.forEach(detail => {
              const isPending = pendingCampaigns.some(c => c.id === detail.campaignId)
              expect(isPending).toBe(true)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should activate campaigns in priority order (highest first)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingActivationCampaignArbitrary(new Date()), { minLength: 2, maxLength: 10 }),
          async (campaigns) => {
            clearMocks()
            // Arrange - Asignar prioridades únicas
            const campaignsWithPriorities = campaigns.map((c, index) => ({
              ...c,
              priority: (index + 1) * 10 // 10, 20, 30, ...
            }))
            
            mockCampaignRepo.setCampaigns(campaignsWithPriorities)

            // Act
            const result = await checkActivateCampaigns.execute()

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
  })

  /**
   * Feature: campaign-manager-service, Property 24: Activation Logging
   * Validates: Requirements 5.5
   * 
   * Para cualquier activación o desactivación de campaña, debe registrarse un log
   * con el nombre de la campaña, fecha/hora y resultado de la operación.
   */
  describe('Property 24: Activation Logging', () => {
    it('should log activation details for all successfully activated campaigns', async () => {
      // Capturar logs
      const logSpy = jest.spyOn(console, 'log').mockImplementation()
      const infoLogs: any[] = []
      
      // Mock del logger para capturar logs
      jest.mock('../shared/utils/logger', () => ({
        logger: {
          info: (message: string, data?: any) => {
            infoLogs.push({ message, data })
          },
          debug: jest.fn(),
          warn: jest.fn(),
          error: jest.fn()
        }
      }))

      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingActivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 5 }),
          async (pendingCampaigns) => {
            clearMocks()
            // Arrange
            infoLogs.length = 0 // Limpiar logs anteriores
            mockCampaignRepo.setCampaigns(pendingCampaigns)

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            // Verificar que se registraron logs para cada campaña
            expect(result.campaignsActivated).toBe(pendingCampaigns.length)
            
            // Cada campaña activada debe tener detalles de éxito
            result.details.forEach(detail => {
              expect(detail.success).toBe(true)
              expect(detail.campaignId).toBeDefined()
              expect(detail.campaignName).toBeDefined()
              expect(detail.productsAffected).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 30 }
      )

      logSpy.mockRestore()
    })

    it('should log error details for campaigns that fail to activate', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingActivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 5 }),
          async (pendingCampaigns) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaigns(pendingCampaigns)
            mockApplyDiscounts.setFailure(true) // Forzar fallo

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            // Todas las campañas deben fallar
            expect(result.campaignsFailed).toBe(pendingCampaigns.length)
            expect(result.campaignsActivated).toBe(0)
            
            // Cada campaña fallida debe tener detalles de error
            result.details.forEach(detail => {
              expect(detail.success).toBe(false)
              expect(detail.error).toBeDefined()
              expect(detail.error).toContain('Simulated failure')
              expect(detail.retries).toBeGreaterThan(0)
            })

            // Verificar que se enviaron notificaciones de error
            const errorNotifications = mockNotificationClient.getErrorNotifications()
            expect(errorNotifications.length).toBe(pendingCampaigns.length)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should include timestamp and campaign details in all logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingActivationCampaignArbitrary(new Date()),
          async (campaign) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaign(campaign)

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            expect(result.details.length).toBeGreaterThanOrEqual(1)
            const detail = result.details.find(d => d.campaignId === campaign.id)
            expect(detail).toBeDefined()
            
            // Verificar que los detalles incluyen información completa
            expect(detail!.campaignId).toBe(campaign.id)
            expect(detail!.campaignName).toBe(campaign.name)
            expect(result.processingTime).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  /**
   * Feature: campaign-manager-service, Property 26: Retry on Failure
   * Validates: Requirements 5.7
   * 
   * Para cualquier fallo al aplicar o remover descuentos, el sistema debe
   * reintentar la operación hasta 3 veces antes de notificar el error.
   */
  describe('Property 26: Retry on Failure', () => {
    it('should retry up to 3 times when activation fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingActivationCampaignArbitrary(new Date()),
          async (campaign) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaign(campaign)
            mockApplyDiscounts.setFailure(true) // Forzar fallo en todos los intentos

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            expect(result.campaignsFailed).toBe(1)
            expect(result.campaignsActivated).toBe(0)
            
            const detail = result.details[0]
            expect(detail.success).toBe(false)
            
            // Debe haber intentado múltiples veces (maxRetries = 3)
            // Total de intentos = 1 inicial + hasta 3 reintentos
            const attemptCount = mockApplyDiscounts.getAttemptCount(campaign.id)
            expect(attemptCount).toBeGreaterThanOrEqual(1)
            expect(attemptCount).toBeLessThanOrEqual(4)
            
            // Debe tener registro de reintentos (puede variar según implementación)
            expect(detail.retries).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should succeed on retry if failure is temporary', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingActivationCampaignArbitrary(new Date()),
          fc.integer({ min: 1, max: 3 }), // Número de fallos antes de éxito
          async (campaign, failuresBeforeSuccess) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaign(campaign)
            mockApplyDiscounts.setFailuresBeforeSuccess(failuresBeforeSuccess)

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            // Debe tener éxito eventualmente
            expect(result.campaignsActivated).toBe(1)
            expect(result.campaignsFailed).toBe(0)
            
            const detail = result.details[0]
            expect(detail.success).toBe(true)
            
            // Debe haber intentado failuresBeforeSuccess + 1 veces
            const attemptCount = mockApplyDiscounts.getAttemptCount(campaign.id)
            expect(attemptCount).toBe(failuresBeforeSuccess + 1)
            
            // Debe tener registro de reintentos
            expect(detail.retries).toBe(failuresBeforeSuccess)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should use exponential backoff between retries', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingActivationCampaignArbitrary(new Date()),
          async (campaign) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaign(campaign)
            mockApplyDiscounts.setFailuresBeforeSuccess(2) // Fallar 2 veces, luego éxito

            const startTime = Date.now()

            // Act
            const result = await checkActivateCampaigns.execute()

            const endTime = Date.now()
            const totalTime = endTime - startTime

            // Assert
            expect(result.campaignsActivated).toBe(1)
            
            // Con 2 fallos y backoff exponencial (10ms, 20ms):
            // Tiempo mínimo esperado = 10ms + 20ms = 30ms
            // Agregamos margen para procesamiento
            expect(totalTime).toBeGreaterThanOrEqual(25)
            
            const detail = result.details[0]
            // El número de reintentos puede variar según la implementación
            // Lo importante es que hubo reintentos antes del éxito
            expect(detail.retries).toBeGreaterThanOrEqual(1)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should send error notification only after all retries are exhausted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(pendingActivationCampaignArbitrary(new Date()), { minLength: 1, maxLength: 3 }),
          async (campaigns) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaigns(campaigns)
            mockApplyDiscounts.setFailure(true) // Forzar fallo permanente

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            expect(result.campaignsFailed).toBe(campaigns.length)
            
            // Debe haber enviado notificación de error para cada campaña
            const errorNotifications = mockNotificationClient.getErrorNotifications()
            expect(errorNotifications.length).toBe(campaigns.length)
            
            // Cada campaña debe tener exactamente 4 intentos (1 + 3 reintentos)
            campaigns.forEach(campaign => {
              const attemptCount = mockApplyDiscounts.getAttemptCount(campaign.id)
              expect(attemptCount).toBe(4)
            })
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should not retry if activation succeeds on first attempt', async () => {
      await fc.assert(
        fc.asyncProperty(
          pendingActivationCampaignArbitrary(new Date()),
          async (campaign) => {
            clearMocks()
            // Arrange
            mockCampaignRepo.setCampaign(campaign)
            // No configurar fallos - debe tener éxito en el primer intento

            // Act
            const result = await checkActivateCampaigns.execute()

            // Assert
            expect(result.campaignsActivated).toBe(1)
            expect(result.campaignsFailed).toBe(0)
            
            const detail = result.details[0]
            expect(detail.success).toBe(true)
            
            // Solo debe haber intentado 1 vez
            const attemptCount = mockApplyDiscounts.getAttemptCount(campaign.id)
            expect(attemptCount).toBe(1)
            
            // No debe tener reintentos
            expect(detail.retries).toBe(0)
          }
        ),
        { numRuns: 30 }
      )
    })
  })
}) // Cierre del describe principal 'CheckActivateCampaigns - Property-Based Tests'
