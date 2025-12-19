/**
 * Property-Based Tests para CreateCampaign
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso CreateCampaign.
 */

import fc from 'fast-check'
import { CreateCampaign, CampaignValidationError, DuplicateCampaignNameError } from './CreateCampaign'
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
    // Simular generación de ID
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
    const updated = Campaign.fromDatabase({ ...campaign.toJSON(), ...data })
    this.campaigns.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.campaigns.delete(id)
  }

  // Método auxiliar para limpiar el repositorio entre tests
  clear(): void {
    this.campaigns.clear()
    this.campaignsByName.clear()
    this.campaignsBySlug.clear()
  }
}

/**
 * Generadores (Arbitraries) para fast-check
 */

/**
 * Genera una regla de descuento válida
 */
const discountRuleArbitrary = () => {
  return fc.oneof(
    // Descuento porcentual
    fc.record({
      type: fc.constant('percentage' as const),
      value: fc.integer({ min: 1, max: 99 }),
      maxDiscount: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined })
    }),
    // Descuento fijo
    fc.record({
      type: fc.constant('fixed' as const),
      value: fc.integer({ min: 1, max: 500 })
    })
  )
}

/**
 * Genera reglas de descuento válidas
 * Siempre incluye una regla global para garantizar validez
 */
const discountRulesArbitrary = (): fc.Arbitrary<DiscountRules> => {
  return fc.record({
    // Siempre incluir regla global para garantizar validez
    global: discountRuleArbitrary(),
    categories: fc.option(
      fc.dictionary(
        fc.string({ minLength: 3, maxLength: 20 }),
        discountRuleArbitrary(),
        { minKeys: 1 }
      ),
      { nil: undefined }
    ),
    products: fc.option(
      fc.dictionary(
        fc.string({ minLength: 3, maxLength: 20 }),
        discountRuleArbitrary(),
        { minKeys: 1 }
      ),
      { nil: undefined }
    )
  })
}

/**
 * Genera un string alfanumérico válido (sin solo espacios)
 */
const validStringArbitrary = (minLength: number, maxLength: number) => {
  return fc.stringOf(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '),
    { minLength, maxLength }
  ).filter(s => s.trim().length >= minLength)
}

/**
 * Genera configuración de frontend válida
 */
const frontendConfigArbitrary = (): fc.Arbitrary<FrontendConfig> => {
  return fc.constant({
    promoBanner: {
      messages: [{ icon: '🔥', text: 'Oferta especial' }]
    },
    hero: {
      title: 'Titulo de prueba',
      subtitle: 'Subtitulo de prueba',
      ctaText: 'Ver ofertas'
    },
    dealsSection: {
      title: 'Ofertas',
      subtitle: 'Las mejores ofertas',
      badge: 'OFERTA'
    }
  } as FrontendConfig)
}

/**
 * Genera fechas válidas para una campaña (futuras y coherentes)
 */
const validCampaignDatesArbitrary = () => {
  const now = new Date()
  const minStart = new Date(now.getTime() + 60000) // Al menos 1 minuto en el futuro
  const maxStart = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // Máximo 1 año en el futuro

  return fc.record({
    startDate: fc.date({ min: minStart, max: maxStart }),
    endDate: fc.date({ min: minStart, max: maxStart })
  }).filter(dates => dates.startDate < dates.endDate)
}

/**
 * Genera datos de campaña válidos
 */
const validCampaignDataArbitrary = () => {
  return fc.record({
    // Usar strings alfanuméricos para evitar problemas de validación
    name: validStringArbitrary(5, 50),
    slug: fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'),
      { minLength: 5, maxLength: 30 }
    ),
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
describe('CreateCampaign - Property-Based Tests', () => {
  let repository: MockCampaignRepository
  let validator: CampaignValidator
  let createCampaign: CreateCampaign

  beforeEach(() => {
    repository = new MockCampaignRepository()
    validator = new CampaignValidator()
    createCampaign = new CreateCampaign(repository, validator)
  })

  afterEach(() => {
    repository.clear()
  })

  /**
   * Feature: campaign-manager-service, Property 34: Date Validation
   * Validates: Requirements 10.1
   * 
   * Para cualquier campaña, la fecha de inicio debe ser anterior a la fecha de fin,
   * y ambas fechas deben ser válidas.
   */
  it('Property 34: should reject campaigns where start date is not before end date', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 100 }),
        fc.string({ minLength: 3, maxLength: 100 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
        fc.date(),
        fc.date(),
        fc.integer({ min: 1, max: 1000 }),
        discountRulesArbitrary(),
        frontendConfigArbitrary(),
        async (name, slug, date1, date2, priority, discountRules, frontendConfig) => {
          // Asegurar que startDate >= endDate (fecha inválida)
          const startDate = date1 > date2 ? date1 : date2
          const endDate = date1 > date2 ? date2 : date1

          const input = {
            name,
            slug,
            startDate,
            endDate,
            priority,
            discountRules,
            frontendConfig
          }

          // La creación debe fallar con error de validación
          await expect(createCampaign.execute(input)).rejects.toThrow(CampaignValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que fechas válidas permiten crear la campaña
   */
  it('Property 34 (complemento): should accept campaigns with valid dates (start < end, both in future)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        async (campaignData) => {
          // Limpiar repositorio para evitar conflictos de nombres
          repository.clear()

          // La creación debe ser exitosa
          const result = await createCampaign.execute(campaignData)

          // Verificar que se creó correctamente
          expect(result.id).toBeDefined()
          expect(result.campaign).toBeDefined()
          // El nombre se sanitiza (trim) al crear la campaña
          expect(result.campaign.name).toBe(campaignData.name.trim())
          expect(result.campaign.startDate).toEqual(campaignData.startDate)
          expect(result.campaign.endDate).toEqual(campaignData.endDate)
          
          // Verificar que las fechas son coherentes
          expect(result.campaign.startDate.getTime()).toBeLessThan(result.campaign.endDate.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que fechas en el pasado son rechazadas
   */
  it('Property 34 (complemento): should reject campaigns with dates in the past', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 100 }),
        fc.string({ minLength: 3, maxLength: 100 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
        fc.integer({ min: 1, max: 1000 }),
        discountRulesArbitrary(),
        frontendConfigArbitrary(),
        async (name, slug, priority, discountRules, frontendConfig) => {
          const now = new Date()
          const pastDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 días atrás
          const pastDate2 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 día atrás

          const input = {
            name,
            slug,
            startDate: pastDate1,
            endDate: pastDate2,
            priority,
            discountRules,
            frontendConfig
          }

          // La creación debe fallar con error de validación
          await expect(createCampaign.execute(input)).rejects.toThrow(CampaignValidationError)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: campaign-manager-service, Property 36: Campaign Name Uniqueness
   * Validates: Requirements 10.3
   * 
   * Para cualquier campaña nueva, el nombre debe ser único en el sistema,
   * y cualquier intento de crear una campaña con nombre duplicado debe ser rechazado.
   */
  it('Property 36: should reject campaigns with duplicate names', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        validCampaignDataArbitrary(),
        async (campaignData1, campaignData2) => {
          // Limpiar repositorio para empezar limpio
          repository.clear()

          // Crear la primera campaña
          await createCampaign.execute(campaignData1)

          // Intentar crear una segunda campaña con el mismo nombre pero diferente slug
          const duplicateNameCampaign = {
            ...campaignData2,
            name: campaignData1.name, // Mismo nombre
            slug: campaignData2.slug + '-different' // Slug diferente
          }

          // La creación debe fallar con error de nombre duplicado
          await expect(createCampaign.execute(duplicateNameCampaign)).rejects.toThrow(DuplicateCampaignNameError)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test adicional: Validar que nombres diferentes permiten crear múltiples campañas
   */
  it('Property 36 (complemento): should allow campaigns with different names', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        validCampaignDataArbitrary(),
        async (campaignData1, campaignData2) => {
          // Limpiar repositorio para empezar limpio
          repository.clear()

          // Asegurar que los nombres y slugs sean diferentes
          const campaign1 = {
            ...campaignData1,
            name: 'Campaign-' + campaignData1.name,
            slug: 'campaign-1-' + campaignData1.slug
          }

          const campaign2 = {
            ...campaignData2,
            name: 'Different-' + campaignData2.name,
            slug: 'campaign-2-' + campaignData2.slug
          }

          // Ambas creaciones deben ser exitosas
          const result1 = await createCampaign.execute(campaign1)
          const result2 = await createCampaign.execute(campaign2)

          // Verificar que ambas se crearon correctamente
          expect(result1.id).toBeDefined()
          expect(result2.id).toBeDefined()
          expect(result1.id).not.toBe(result2.id)
          // Los nombres se sanitizan (trim) al crear la campaña
          expect(result1.campaign.name).toBe(campaign1.name.trim())
          expect(result2.campaign.name).toBe(campaign2.name.trim())
        }
      ),
      { numRuns: 100 }
    )
  })
})

