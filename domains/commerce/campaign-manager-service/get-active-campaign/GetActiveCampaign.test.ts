/**
 * Tests para GetActiveCampaign
 * 
 * Verifica que el caso de uso obtiene correctamente la campaña activa
 * de mayor prioridad.
 */

import { GetActiveCampaign } from './GetActiveCampaign'
import { Campaign } from '../shared/models/Campaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { DiscountRules, FrontendConfig } from '../shared/types'

// Helper para crear campañas de prueba (definido globalmente para uso en property-based tests)
const createTestCampaign = (
  id: string,
  name: string,
  priority: number,
  isActive: boolean = true
): Campaign => {
  const discountRules: DiscountRules = {
    global: { type: 'percentage', value: 20 }
  }

  const frontendConfig: FrontendConfig = {
    promoBanner: {
      messages: [{ icon: '🔥', text: 'Test Campaign' }]
    },
    hero: {
      title: 'Test Hero',
      subtitle: 'Test Subtitle',
      ctaText: 'Ver Ofertas'
    },
    dealsSection: {
      title: 'Test Deals',
      subtitle: 'Test Subtitle',
      badge: 'TEST'
    }
  }

  return Campaign.fromDatabase({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    priority,
    isActive,
    discountRules,
    frontendConfig,
    discountsApplied: true,
    appliedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

// Mock del repositorio
const mockCampaignRepository: jest.Mocked<ICampaignRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByName: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
  findPendingActivation: jest.fn(),
  findPendingDeactivation: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}

describe('GetActiveCampaign', () => {
  let getActiveCampaign: GetActiveCampaign

  beforeEach(() => {
    jest.clearAllMocks()
    getActiveCampaign = new GetActiveCampaign(mockCampaignRepository)
  })

  describe('execute', () => {
    it('debe retornar la campaña activa de mayor prioridad cuando hay una sola campaña activa', async () => {
      // Arrange
      const campaign = createTestCampaign('1', 'Black Friday', 100)
      mockCampaignRepository.findActive.mockResolvedValue([campaign])

      // Act
      const result = await getActiveCampaign.execute()

      // Assert
      expect(result.campaign).not.toBeNull()
      expect(result.campaign?.id).toBe('1')
      expect(result.campaign?.name).toBe('Black Friday')
      expect(result.campaign?.priority).toBe(100)
      expect(mockCampaignRepository.findActive).toHaveBeenCalledTimes(1)
    })

    it('debe retornar la campaña de mayor prioridad cuando hay múltiples campañas activas', async () => {
      // Arrange
      const campaign1 = createTestCampaign('1', 'Campaign Low Priority', 10)
      const campaign2 = createTestCampaign('2', 'Campaign High Priority', 100)
      const campaign3 = createTestCampaign('3', 'Campaign Medium Priority', 50)

      // El repositorio ya las ordena por prioridad descendente
      mockCampaignRepository.findActive.mockResolvedValue([
        campaign2, // priority 100
        campaign3, // priority 50
        campaign1  // priority 10
      ])

      // Act
      const result = await getActiveCampaign.execute()

      // Assert
      expect(result.campaign).not.toBeNull()
      expect(result.campaign?.id).toBe('2')
      expect(result.campaign?.name).toBe('Campaign High Priority')
      expect(result.campaign?.priority).toBe(100)
    })

    it('debe retornar null cuando no hay campañas activas', async () => {
      // Arrange
      mockCampaignRepository.findActive.mockResolvedValue([])

      // Act
      const result = await getActiveCampaign.execute()

      // Assert
      expect(result.campaign).toBeNull()
      expect(mockCampaignRepository.findActive).toHaveBeenCalledTimes(1)
    })

    it('debe incluir el frontendConfig en la campaña retornada', async () => {
      // Arrange
      const campaign = createTestCampaign('1', 'Test Campaign', 100)
      mockCampaignRepository.findActive.mockResolvedValue([campaign])

      // Act
      const result = await getActiveCampaign.execute()

      // Assert
      expect(result.campaign).not.toBeNull()
      expect(result.campaign?.frontendConfig).toBeDefined()
      expect(result.campaign?.frontendConfig.promoBanner).toBeDefined()
      expect(result.campaign?.frontendConfig.hero).toBeDefined()
      expect(result.campaign?.frontendConfig.dealsSection).toBeDefined()
    })

    it('debe retornar la primera campaña cuando múltiples campañas tienen la misma prioridad', async () => {
      // Arrange
      const campaign1 = createTestCampaign('1', 'Campaign A', 100)
      const campaign2 = createTestCampaign('2', 'Campaign B', 100)
      const campaign3 = createTestCampaign('3', 'Campaign C', 100)

      // Todas tienen la misma prioridad, el repositorio las ordena
      mockCampaignRepository.findActive.mockResolvedValue([
        campaign1,
        campaign2,
        campaign3
      ])

      // Act
      const result = await getActiveCampaign.execute()

      // Assert
      expect(result.campaign).not.toBeNull()
      expect(result.campaign?.id).toBe('1')
      expect(result.campaign?.name).toBe('Campaign A')
    })

    it('debe manejar correctamente campañas con diferentes configuraciones de frontend', async () => {
      // Arrange
      const customFrontendConfig: FrontendConfig = {
        promoBanner: {
          messages: [
            { icon: '🎉', text: 'Special Offer' },
            { icon: '🔥', text: 'Limited Time' }
          ],
          backgroundColor: '#FF0000'
        },
        hero: {
          title: 'Custom Hero Title',
          subtitle: 'Custom Subtitle',
          ctaText: 'Shop Now',
          backgroundImage: 'https://example.com/image.jpg',
          badge: 'NEW'
        },
        dealsSection: {
          title: 'Custom Deals',
          subtitle: 'Custom Deals Subtitle',
          badge: 'SALE',
          backgroundColor: '#00FF00'
        },
        categories: ['laptops', 'phones']
      }

      const campaign = Campaign.fromDatabase({
        id: '1',
        name: 'Custom Campaign',
        slug: 'custom-campaign',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        priority: 100,
        isActive: true,
        discountRules: { global: { type: 'percentage', value: 30 } },
        frontendConfig: customFrontendConfig,
        discountsApplied: true,
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockCampaignRepository.findActive.mockResolvedValue([campaign])

      // Act
      const result = await getActiveCampaign.execute()

      // Assert
      expect(result.campaign).not.toBeNull()
      expect(result.campaign?.frontendConfig).toEqual(customFrontendConfig)
      expect(result.campaign?.frontendConfig.promoBanner.backgroundColor).toBe('#FF0000')
      expect(result.campaign?.frontendConfig.hero.badge).toBe('NEW')
      expect(result.campaign?.frontendConfig.categories).toEqual(['laptops', 'phones'])
    })

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      const error = new Error('Database connection error')
      mockCampaignRepository.findActive.mockRejectedValue(error)

      // Act & Assert
      await expect(getActiveCampaign.execute()).rejects.toThrow('Database connection error')
    })
  })
})


/**
 * Property-Based Tests
 * 
 * Estos tests verifican propiedades universales que deben cumplirse
 * para cualquier conjunto de campañas activas.
 */

import fc from 'fast-check'

describe('Property-Based Tests', () => {
  // Crear instancia local para los property-based tests
  let localGetActiveCampaign: GetActiveCampaign

  beforeEach(() => {
    jest.clearAllMocks()
    localGetActiveCampaign = new GetActiveCampaign(mockCampaignRepository)
  })

  /**
   * Feature: campaign-manager-service, Property 4: Priority-Based Campaign Selection
   * Validates: Requirements 1.4
   * 
   * Para cualquier conjunto de campañas activas simultáneamente, al consultar la campaña activa,
   * siempre debe retornarse la campaña con la prioridad más alta.
   */
  it('Property 4: debe retornar siempre la campaña con mayor prioridad', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generar un array de campañas con diferentes prioridades
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            priority: fc.integer({ min: 1, max: 1000 })
          }),
          { minLength: 1, maxLength: 20 } // Al menos 1 campaña, máximo 20
        ),
        async (campaignData) => {
          // Arrange: Crear campañas con las prioridades generadas
          const campaigns = campaignData.map(data => 
            createTestCampaign(data.id, data.name, data.priority, true)
          )

          // Ordenar por prioridad descendente (como lo hace el repositorio)
          const sortedCampaigns = [...campaigns].sort((a, b) => b.priority - a.priority)
          
          mockCampaignRepository.findActive.mockResolvedValue(sortedCampaigns)

          // Act
          const result = await localGetActiveCampaign.execute()

          // Assert: La campaña retornada debe ser la de mayor prioridad
          const maxPriority = Math.max(...campaigns.map(c => c.priority))
          expect(result.campaign).not.toBeNull()
          expect(result.campaign?.priority).toBe(maxPriority)
          
          // Verificar que es una de las campañas con la prioridad máxima
          const campaignsWithMaxPriority = campaigns.filter(c => c.priority === maxPriority)
          const returnedCampaignIds = campaignsWithMaxPriority.map(c => c.id)
          expect(returnedCampaignIds).toContain(result.campaign?.id)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4 (variante): Con múltiples campañas de la misma prioridad máxima,
   * debe retornar una de ellas (la primera en el orden del repositorio)
   */
  it('Property 4 (variante): con múltiples campañas de igual prioridad máxima, debe retornar la primera', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generar prioridad máxima y número de campañas con esa prioridad
        fc.record({
          maxPriority: fc.integer({ min: 50, max: 1000 }),
          numMaxPriority: fc.integer({ min: 2, max: 5 }),
          numLowerPriority: fc.integer({ min: 0, max: 10 })
        }),
        async ({ maxPriority, numMaxPriority, numLowerPriority }) => {
          // Arrange: Crear campañas con prioridad máxima
          const maxPriorityCampaigns = Array.from({ length: numMaxPriority }, (_, i) =>
            createTestCampaign(`max-${i}`, `Max Priority ${i}`, maxPriority, true)
          )

          // Crear campañas con prioridad menor
          const lowerPriorityCampaigns = Array.from({ length: numLowerPriority }, (_, i) =>
            createTestCampaign(`lower-${i}`, `Lower Priority ${i}`, maxPriority - 10 - i, true)
          )

          // Combinar y ordenar (campañas de max prioridad primero)
          const allCampaigns = [...maxPriorityCampaigns, ...lowerPriorityCampaigns]
          const sortedCampaigns = allCampaigns.sort((a, b) => b.priority - a.priority)

          mockCampaignRepository.findActive.mockResolvedValue(sortedCampaigns)

          // Act
          const result = await localGetActiveCampaign.execute()

          // Assert: Debe retornar una campaña con la prioridad máxima
          expect(result.campaign).not.toBeNull()
          expect(result.campaign?.priority).toBe(maxPriority)
          
          // Debe ser la primera en el array ordenado (primera con max prioridad)
          expect(result.campaign?.id).toBe(sortedCampaigns[0].id)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4 (caso vacío): Sin campañas activas, debe retornar null
   */
  it('Property 4 (caso vacío): sin campañas activas debe retornar null', async () => {
    // Arrange
    mockCampaignRepository.findActive.mockResolvedValue([])

    // Act
    const result = await localGetActiveCampaign.execute()

    // Assert
    expect(result.campaign).toBeNull()
  })

  /**
   * Property 4 (invariante): El frontendConfig siempre debe estar presente
   * en la campaña retornada
   */
  it('Property 4 (invariante): la campaña retornada siempre debe incluir frontendConfig', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generar campañas con diferentes configuraciones
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            priority: fc.integer({ min: 1, max: 1000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (campaignData) => {
          // Arrange
          const campaigns = campaignData.map(data => 
            createTestCampaign(data.id, data.name, data.priority, true)
          )

          const sortedCampaigns = [...campaigns].sort((a, b) => b.priority - a.priority)
          mockCampaignRepository.findActive.mockResolvedValue(sortedCampaigns)

          // Act
          const result = await localGetActiveCampaign.execute()

          // Assert: Si hay campaña, debe tener frontendConfig
          if (result.campaign) {
            expect(result.campaign.frontendConfig).toBeDefined()
            expect(result.campaign.frontendConfig.promoBanner).toBeDefined()
            expect(result.campaign.frontendConfig.hero).toBeDefined()
            expect(result.campaign.frontendConfig.dealsSection).toBeDefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4 (monotonía): Si agregamos una campaña con mayor prioridad,
   * esa debe ser la retornada
   */
  it('Property 4 (monotonía): agregar campaña con mayor prioridad cambia el resultado', async () => {
    // Crear instancia local para este test
    const localGetActiveCampaign = new GetActiveCampaign(mockCampaignRepository)
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          existingCampaigns: fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              priority: fc.integer({ min: 1, max: 500 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          newCampaignPriorityBoost: fc.integer({ min: 501, max: 1000 })
        }),
        async ({ existingCampaigns, newCampaignPriorityBoost }) => {
          // Arrange: Crear campañas existentes
          const campaigns = existingCampaigns.map(data => 
            createTestCampaign(data.id, data.name, data.priority, true)
          )

          // Obtener prioridad máxima actual
          const currentMaxPriority = Math.max(...campaigns.map(c => c.priority))

          // Crear nueva campaña con prioridad mayor
          const newCampaign = createTestCampaign(
            'new-campaign',
            'New High Priority Campaign',
            newCampaignPriorityBoost,
            true
          )

          // Primera ejecución: sin la nueva campaña
          const sortedCampaigns1 = [...campaigns].sort((a, b) => b.priority - a.priority)
          mockCampaignRepository.findActive.mockResolvedValue(sortedCampaigns1)
          const result1 = await localGetActiveCampaign.execute()

          // Segunda ejecución: con la nueva campaña
          const allCampaigns = [...campaigns, newCampaign]
          const sortedCampaigns2 = allCampaigns.sort((a, b) => b.priority - a.priority)
          mockCampaignRepository.findActive.mockResolvedValue(sortedCampaigns2)
          const result2 = await localGetActiveCampaign.execute()

          // Assert: La primera debe tener la prioridad original
          expect(result1.campaign?.priority).toBe(currentMaxPriority)

          // La segunda debe tener la nueva prioridad mayor
          expect(result2.campaign?.priority).toBe(newCampaignPriorityBoost)
          expect(result2.campaign?.id).toBe('new-campaign')
        }
      ),
      { numRuns: 50 }
    )
  })
})
