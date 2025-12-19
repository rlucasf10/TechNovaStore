/**
 * Property-Based Tests para UpdateCampaign
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso UpdateCampaign.
 */

import fc from 'fast-check'
import {
  UpdateCampaign,
  CampaignNotFoundError,
  CampaignUpdateValidationError,
  DuplicateCampaignNameError,
  DuplicateCampaignSlugError
} from './UpdateCampaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignValidator } from '../shared/utils/validators'
import { Campaign } from '../shared/models/Campaign'
import { CreateCampaignData, DiscountRules, FrontendConfig } from '../shared/types'

/**
 * Mock del repositorio de campañas
 */
class MockCampaignRepository implements ICampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()
  private campaignsByName: Map<string, Campaign> = new Map()
  private campaignsBySlug: Map<string, Campaign> = new Map()

  async create(data: CreateCampaignData): Promise<Campaign> {
    const campaign = Campaign.create(data)
    const id = `campaign-${Date.now()}-${Math.random()}`
    const campaignWithId = Campaign.fromDatabase({
      ...campaign.toJSON(),
      id
    })
    
    this.campaigns.set(id, campaignWithId)
    this.campaignsByName.set(data.name, campaignWithId)
    this.campaignsBySlug.set(data.slug, campaignWithId)
    
    return campaignWithId
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) || null
  }

  async findBySlug(slug: string): Promise<Campaign | null> {
    return this.campaignsBySlug.get(slug) || null
  }

  async findByName(name: string): Promise<Campaign | null> {
    return this.campaignsByName.get(name) || null
  }

  async findAll(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
  }

  async findActive(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.isActive)
  }

  async findPendingActivation(now: Date): Promise<Campaign[]> {
    return []
  }

  async findPendingDeactivation(now: Date): Promise<Campaign[]> {
    return []
  }

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaigns.get(id)
    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Actualizar índices si cambia el nombre o slug
    if (data.name && data.name !== campaign.name) {
      this.campaignsByName.delete(campaign.name)
      this.campaignsByName.set(data.name, campaign)
    }

    if (data.slug && data.slug !== campaign.slug) {
      this.campaignsBySlug.delete(campaign.slug)
      this.campaignsBySlug.set(data.slug, campaign)
    }

    const updated = Campaign.fromDatabase({ ...campaign.toJSON(), ...data })
    this.campaigns.set(id, updated)
    
    return updated
  }

  async delete(id: string): Promise<void> {
    const campaign = this.campaigns.get(id)
    if (campaign) {
      this.campaignsByName.delete(campaign.name)
      this.campaignsBySlug.delete(campaign.slug)
      this.campaigns.delete(id)
    }
  }

  clear(): void {
    this.campaigns.clear()
    this.campaignsByName.clear()
    this.campaignsBySlug.clear()
  }
}

/**
 * Generadores (Arbitraries) para fast-check
 */

const discountRuleArbitrary = () => {
  return fc.oneof(
    fc.record({
      type: fc.constant('percentage' as const),
      value: fc.integer({ min: 1, max: 99 }),
      maxDiscount: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined })
    }),
    fc.record({
      type: fc.constant('fixed' as const),
      value: fc.integer({ min: 1, max: 500 })
    })
  )
}

const discountRulesArbitrary = (): fc.Arbitrary<DiscountRules> => {
  return fc.record({
    global: fc.option(discountRuleArbitrary(), { nil: undefined }),
    categories: fc.option(
      fc.dictionary(
        fc.string({ minLength: 3, maxLength: 20 }),
        discountRuleArbitrary()
      ),
      { nil: undefined }
    ),
    products: fc.option(
      fc.dictionary(
        fc.string({ minLength: 3, maxLength: 20 }),
        discountRuleArbitrary()
      ),
      { nil: undefined }
    )
  }).filter(rules => {
    return !!(rules.global || rules.categories || rules.products)
  })
}

const frontendConfigArbitrary = (): fc.Arbitrary<FrontendConfig> => {
  // Usar valores constantes válidos para evitar problemas de validación
  return fc.constant({
    promoBanner: {
      messages: [{ icon: '🔥', text: 'Oferta especial de prueba' }]
    },
    hero: {
      title: 'Titulo de campaña',
      subtitle: 'Subtitulo de campaña',
      ctaText: 'Ver ofertas'
    },
    dealsSection: {
      title: 'Ofertas especiales',
      subtitle: 'Las mejores ofertas',
      badge: 'OFERTA'
    }
  } as FrontendConfig)
}

const validCampaignDatesArbitrary = () => {
  const now = new Date()
  const minStart = new Date(now.getTime() + 60000)
  const maxStart = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  return fc.record({
    startDate: fc.date({ min: minStart, max: maxStart }),
    endDate: fc.date({ min: minStart, max: maxStart })
  }).filter(dates => dates.startDate < dates.endDate)
}

const validCampaignDataArbitrary = () => {
  return fc.record({
    // Usar generadores más simples que garantizan datos válidos
    name: fc.stringOf(
      fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'),
      { minLength: 5, maxLength: 30 }
    ).map(s => 'Campaign ' + s),
    slug: fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'),
      { minLength: 5, maxLength: 20 }
    ).map(s => 'slug-' + s),
    dates: validCampaignDatesArbitrary(),
    priority: fc.integer({ min: 1, max: 100 }),
    discountRules: discountRulesArbitrary(),
    frontendConfig: frontendConfigArbitrary()
  }).map(data => ({
    name: data.name,
    slug: data.slug,
    startDate: data.dates.startDate,
    endDate: data.dates.endDate,
    priority: data.priority,
    discountRules: data.discountRules,
    frontendConfig: data.frontendConfig
  }))
}

/**
 * Tests de Propiedades
 */
describe('UpdateCampaign - Property-Based Tests', () => {
  let repository: MockCampaignRepository
  let validator: CampaignValidator
  let updateCampaign: UpdateCampaign

  beforeEach(() => {
    repository = new MockCampaignRepository()
    validator = new CampaignValidator()
    updateCampaign = new UpdateCampaign(repository, validator)
  })

  afterEach(() => {
    repository.clear()
  })

  /**
   * Feature: campaign-manager-service, Property 2: Campaign Update Validation
   * Validates: Requirements 1.2
   * 
   * Para cualquier actualización de campaña, si las fechas son incoherentes (inicio >= fin)
   * o las reglas son inválidas, la actualización debe ser rechazada y la campaña debe
   * permanecer sin cambios.
   */
  it('Property 2: should reject updates with invalid dates (start >= end)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        fc.date(),
        fc.date(),
        async (initialData, date1, date2) => {
          // Limpiar repositorio
          repository.clear()

          // Crear campaña inicial
          const campaign = await repository.create(initialData)
          const campaignId = campaign.id

          // Preparar actualización con fechas inválidas (start >= end)
          const startDate = date1 > date2 ? date1 : date2
          const endDate = date1 > date2 ? date2 : date1

          const updateInput = {
            id: campaignId,
            startDate,
            endDate
          }

          // La actualización debe fallar
          await expect(updateCampaign.execute(updateInput)).rejects.toThrow(CampaignUpdateValidationError)

          // Verificar que la campaña no cambió
          const unchangedCampaign = await repository.findById(campaignId)
          expect(unchangedCampaign).not.toBeNull()
          expect(unchangedCampaign!.startDate).toEqual(initialData.startDate)
          expect(unchangedCampaign!.endDate).toEqual(initialData.endDate)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test complementario: Validar que reglas de descuento inválidas son rechazadas
   */
  it('Property 2 (complemento): should reject updates with invalid discount rules', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        fc.integer({ min: -100, max: 0 }).chain(invalidPercentage => 
          fc.constant({
            global: {
              type: 'percentage' as const,
              value: invalidPercentage // Porcentaje inválido (debe ser 1-99)
            }
          })
        ),
        async (initialData, invalidRules) => {
          // Limpiar repositorio
          repository.clear()

          // Crear campaña inicial
          const campaign = await repository.create(initialData)
          const campaignId = campaign.id

          const updateInput = {
            id: campaignId,
            discountRules: invalidRules
          }

          // La actualización debe fallar
          await expect(updateCampaign.execute(updateInput)).rejects.toThrow(CampaignUpdateValidationError)

          // Verificar que las reglas no cambiaron
          const unchangedCampaign = await repository.findById(campaignId)
          expect(unchangedCampaign).not.toBeNull()
          expect(unchangedCampaign!.discountRules).toEqual(initialData.discountRules)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test complementario: Validar que actualizaciones válidas son aceptadas
   */
  it('Property 2 (complemento): should accept updates with valid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        validCampaignDataArbitrary(),
        async (initialData, updateData) => {
          // Limpiar repositorio
          repository.clear()

          // Crear campaña inicial
          const campaign = await repository.create(initialData)
          const campaignId = campaign.id

          // Preparar actualización válida con datos diferentes
          const updateInput = {
            id: campaignId,
            name: 'Updated-' + updateData.name,
            slug: 'updated-' + updateData.slug,
            startDate: updateData.startDate,
            endDate: updateData.endDate,
            priority: updateData.priority,
            discountRules: updateData.discountRules,
            frontendConfig: updateData.frontendConfig
          }

          // La actualización debe ser exitosa
          const result = await updateCampaign.execute(updateInput)

          // Verificar que la campaña se actualizó correctamente
          expect(result.campaign.id).toBe(campaignId)
          expect(result.campaign.name).toBe(updateInput.name)
          expect(result.campaign.slug).toBe(updateInput.slug)
          expect(result.campaign.startDate).toEqual(updateInput.startDate)
          expect(result.campaign.endDate).toEqual(updateInput.endDate)
          expect(result.campaign.priority).toBe(updateInput.priority)
          expect(result.campaign.discountRules).toEqual(updateInput.discountRules)
          expect(result.campaign.frontendConfig).toEqual(updateInput.frontendConfig)

          // Verificar que las fechas siguen siendo coherentes
          expect(result.campaign.startDate.getTime()).toBeLessThan(result.campaign.endDate.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que no se puede actualizar una campaña inexistente
   */
  it('should reject updates to non-existent campaigns', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        fc.string({ minLength: 3, maxLength: 100 }),
        async (nonExistentId, newName) => {
          // Limpiar repositorio
          repository.clear()

          const updateInput = {
            id: nonExistentId,
            name: newName
          }

          // La actualización debe fallar con CampaignNotFoundError
          await expect(updateCampaign.execute(updateInput)).rejects.toThrow(CampaignNotFoundError)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que no se puede actualizar con nombre duplicado
   */
  it('should reject updates that would create duplicate names', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        validCampaignDataArbitrary(),
        async (campaignData1, campaignData2) => {
          // Limpiar repositorio
          repository.clear()

          // Crear dos campañas diferentes
          const campaign1 = await repository.create({
            ...campaignData1,
            name: 'Campaign-1-' + campaignData1.name,
            slug: 'campaign-1-' + campaignData1.slug
          })

          const campaign2 = await repository.create({
            ...campaignData2,
            name: 'Campaign-2-' + campaignData2.name,
            slug: 'campaign-2-' + campaignData2.slug
          })

          // Intentar actualizar campaign2 con el nombre de campaign1
          const updateInput = {
            id: campaign2.id,
            name: campaign1.name
          }

          // La actualización debe fallar con DuplicateCampaignNameError
          await expect(updateCampaign.execute(updateInput)).rejects.toThrow(DuplicateCampaignNameError)

          // Verificar que campaign2 no cambió
          const unchangedCampaign = await repository.findById(campaign2.id)
          expect(unchangedCampaign).not.toBeNull()
          expect(unchangedCampaign!.name).toBe(campaign2.name)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que no se puede actualizar con slug duplicado
   */
  it('should reject updates that would create duplicate slugs', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        validCampaignDataArbitrary(),
        async (campaignData1, campaignData2) => {
          // Limpiar repositorio
          repository.clear()

          // Crear dos campañas diferentes
          const campaign1 = await repository.create({
            ...campaignData1,
            name: 'Campaign-1-' + campaignData1.name,
            slug: 'campaign-1-' + campaignData1.slug
          })

          const campaign2 = await repository.create({
            ...campaignData2,
            name: 'Campaign-2-' + campaignData2.name,
            slug: 'campaign-2-' + campaignData2.slug
          })

          // Intentar actualizar campaign2 con el slug de campaign1
          const updateInput = {
            id: campaign2.id,
            slug: campaign1.slug
          }

          // La actualización debe fallar con DuplicateCampaignSlugError
          await expect(updateCampaign.execute(updateInput)).rejects.toThrow(DuplicateCampaignSlugError)

          // Verificar que campaign2 no cambió
          const unchangedCampaign = await repository.findById(campaign2.id)
          expect(unchangedCampaign).not.toBeNull()
          expect(unchangedCampaign!.slug).toBe(campaign2.slug)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que se puede actualizar el mismo nombre/slug (sin cambio)
   */
  it('should allow updating a campaign with its own name and slug', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        fc.integer({ min: 1, max: 1000 }),
        async (initialData, newPriority) => {
          // Limpiar repositorio
          repository.clear()

          // Crear campaña inicial
          const campaign = await repository.create(initialData)

          // Actualizar con el mismo nombre y slug pero diferente prioridad
          const updateInput = {
            id: campaign.id,
            name: campaign.name,
            slug: campaign.slug,
            priority: newPriority
          }

          // La actualización debe ser exitosa
          const result = await updateCampaign.execute(updateInput)

          // Verificar que se actualizó correctamente
          expect(result.campaign.id).toBe(campaign.id)
          expect(result.campaign.name).toBe(campaign.name)
          expect(result.campaign.slug).toBe(campaign.slug)
          expect(result.campaign.priority).toBe(newPriority)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar actualizaciones parciales
   */
  it('should allow partial updates (only updating some fields)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        fc.integer({ min: 1, max: 1000 }),
        async (initialData, newPriority) => {
          // Limpiar repositorio
          repository.clear()

          // Crear campaña inicial
          const campaign = await repository.create(initialData)

          // Actualizar solo la prioridad
          const updateInput = {
            id: campaign.id,
            priority: newPriority
          }

          // La actualización debe ser exitosa
          const result = await updateCampaign.execute(updateInput)

          // Verificar que solo cambió la prioridad
          expect(result.campaign.id).toBe(campaign.id)
          expect(result.campaign.name).toBe(campaign.name)
          expect(result.campaign.slug).toBe(campaign.slug)
          expect(result.campaign.startDate).toEqual(campaign.startDate)
          expect(result.campaign.endDate).toEqual(campaign.endDate)
          expect(result.campaign.priority).toBe(newPriority)
          expect(result.campaign.discountRules).toEqual(campaign.discountRules)
          expect(result.campaign.frontendConfig).toEqual(campaign.frontendConfig)
        }
      ),
      { numRuns: 100 }
    )
  })
})
