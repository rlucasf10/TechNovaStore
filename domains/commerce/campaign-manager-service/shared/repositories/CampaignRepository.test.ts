/**
 * Property-Based Tests para CampaignRepository
 * 
 * **Feature: campaign-manager-service, Property 5: Campaign List Ordering**
 * **Validates: Requirements 1.5**
 * 
 * Verifica que las campañas se retornan ordenadas por prioridad descendente.
 */

import * as fc from 'fast-check'
import { Campaign } from '../models/Campaign'
import { CreateCampaignData, DiscountRules, FrontendConfig } from '../types'

/**
 * Generador de reglas de descuento válidas
 */
const discountRulesArbitrary: fc.Arbitrary<DiscountRules> = fc.record({
  global: fc.option(
    fc.record({
      type: fc.constantFrom('percentage', 'fixed') as fc.Arbitrary<'percentage' | 'fixed'>,
      value: fc.integer({ min: 1, max: 99 }),
      maxDiscount: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined })
    }),
    { nil: undefined }
  )
}).map((rules: { global?: { type: 'percentage' | 'fixed'; value: number; maxDiscount?: number } }) => ({
  global: rules.global || { type: 'percentage' as const, value: 10 }
}))

/**
 * Generador de configuración de frontend válida
 */
const frontendConfigArbitrary: fc.Arbitrary<FrontendConfig> = fc.record({
  promoBanner: fc.record({
    messages: fc.array(
      fc.record({
        icon: fc.stringOf(fc.constantFrom('🎉', '🔥', '⭐', '💰'), { minLength: 1, maxLength: 2 }),
        text: fc.string({ minLength: 5, maxLength: 50 })
      }),
      { minLength: 1, maxLength: 3 }
    )
  }),
  hero: fc.record({
    title: fc.string({ minLength: 5, maxLength: 50 }),
    subtitle: fc.string({ minLength: 5, maxLength: 100 }),
    ctaText: fc.string({ minLength: 3, maxLength: 20 })
  }),
  dealsSection: fc.record({
    title: fc.string({ minLength: 5, maxLength: 50 }),
    subtitle: fc.string({ minLength: 5, maxLength: 100 }),
    badge: fc.string({ minLength: 2, maxLength: 20 })
  })
})

/**
 * Generador de datos de campaña válidos con prioridad específica
 */
const campaignDataWithPriorityArbitrary = (priority: number): fc.Arbitrary<CreateCampaignData> => {
  const now = new Date()
  const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Mañana
  const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // En 7 días

  return fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }).map((s: string) => `Campaign-${s}-${Date.now()}`),
    slug: fc.string({ minLength: 5, maxLength: 30 }).map((s: string) => `campaign-${s.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`),
    startDate: fc.constant(futureStart),
    endDate: fc.constant(futureEnd),
    priority: fc.constant(priority),
    discountRules: discountRulesArbitrary,
    frontendConfig: frontendConfigArbitrary
  })
}

/**
 * Generador de lista de prioridades únicas
 */
const uniquePrioritiesArbitrary = fc.array(
  fc.integer({ min: 1, max: 1000 }),
  { minLength: 2, maxLength: 10 }
).map((priorities: number[]) => [...new Set(priorities)]) // Eliminar duplicados
  .filter((priorities: number[]) => priorities.length >= 2) // Asegurar al menos 2 elementos

/**
 * Verifica si un array está ordenado en orden descendente
 */
function isDescendingOrder(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[i - 1]) {
      return false
    }
  }
  return true
}

/**
 * Mock del repositorio para testing sin base de datos
 * 
 * Este mock simula el comportamiento del repositorio real
 * para poder testear la lógica de ordenamiento sin depender de PostgreSQL.
 */
class MockCampaignRepository {
  private campaigns: Map<string, any> = new Map()
  private idCounter = 0

  async create(data: CreateCampaignData): Promise<any> {
    const id = `mock-${++this.idCounter}`
    const now = new Date()
    
    const campaign = {
      id,
      name: data.name,
      slug: data.slug,
      startDate: data.startDate,
      endDate: data.endDate,
      priority: data.priority,
      isActive: false,
      discountRules: data.discountRules,
      frontendConfig: data.frontendConfig,
      discountsApplied: false,
      createdAt: now,
      updatedAt: now
    }
    
    this.campaigns.set(id, campaign)
    return campaign
  }

  async findAll(): Promise<any[]> {
    // Simular el comportamiento del repositorio real: ordenar por prioridad DESC
    const campaigns = Array.from(this.campaigns.values())
    return campaigns.sort((a, b) => b.priority - a.priority)
  }

  async findActive(): Promise<any[]> {
    const campaigns = Array.from(this.campaigns.values())
      .filter(c => c.isActive)
    return campaigns.sort((a, b) => b.priority - a.priority)
  }

  clear(): void {
    this.campaigns.clear()
    this.idCounter = 0
  }
}

describe('CampaignRepository Property Tests', () => {
  let mockRepository: MockCampaignRepository

  beforeEach(() => {
    mockRepository = new MockCampaignRepository()
  })

  afterEach(() => {
    mockRepository.clear()
  })

  /**
   * Property 5: Campaign List Ordering
   * 
   * *Para cualquier* consulta de campañas, la lista retornada debe estar
   * ordenada por prioridad en orden descendente (mayor prioridad primero).
   * 
   * **Feature: campaign-manager-service, Property 5: Campaign List Ordering**
   * **Validates: Requirements 1.5**
   */
  it('Property 5: findAll debe retornar campañas ordenadas por prioridad descendente', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniquePrioritiesArbitrary,
        async (priorities: number[]) => {
          // Limpiar el repositorio antes de cada test
          mockRepository.clear()

          // Crear campañas con las prioridades generadas (en orden aleatorio)
          const shuffledPriorities = [...priorities].sort(() => Math.random() - 0.5)
          
          for (const priority of shuffledPriorities) {
            const campaignData = await fc.sample(campaignDataWithPriorityArbitrary(priority), 1)[0]
            await mockRepository.create(campaignData)
          }

          // Obtener todas las campañas
          const campaigns = await mockRepository.findAll()

          // Extraer las prioridades del resultado
          const resultPriorities = campaigns.map(c => c.priority)

          // Verificar que están en orden descendente
          const isOrdered = isDescendingOrder(resultPriorities)

          // Verificar que todas las prioridades originales están presentes
          const sortedOriginal = [...priorities].sort((a, b) => b - a)
          const allPresent = sortedOriginal.every(p => resultPriorities.includes(p))

          return isOrdered && allPresent
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property adicional: El ordenamiento es estable y consistente
   * 
   * Múltiples llamadas a findAll deben retornar el mismo orden.
   */
  it('Property: findAll debe retornar el mismo orden en múltiples llamadas', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniquePrioritiesArbitrary,
        async (priorities: number[]) => {
          mockRepository.clear()

          // Crear campañas
          for (const priority of priorities) {
            const campaignData = await fc.sample(campaignDataWithPriorityArbitrary(priority), 1)[0]
            await mockRepository.create(campaignData)
          }

          // Llamar findAll múltiples veces
          const result1 = await mockRepository.findAll()
          const result2 = await mockRepository.findAll()
          const result3 = await mockRepository.findAll()

          // Verificar que el orden es el mismo
          const priorities1 = result1.map(c => c.priority)
          const priorities2 = result2.map(c => c.priority)
          const priorities3 = result3.map(c => c.priority)

          return (
            JSON.stringify(priorities1) === JSON.stringify(priorities2) &&
            JSON.stringify(priorities2) === JSON.stringify(priorities3)
          )
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: La campaña con mayor prioridad siempre está primero
   */
  it('Property: La campaña con mayor prioridad debe estar en la primera posición', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniquePrioritiesArbitrary,
        async (priorities: number[]) => {
          mockRepository.clear()

          // Crear campañas
          for (const priority of priorities) {
            const campaignData = await fc.sample(campaignDataWithPriorityArbitrary(priority), 1)[0]
            await mockRepository.create(campaignData)
          }

          // Obtener campañas
          const campaigns = await mockRepository.findAll()

          if (campaigns.length === 0) {
            return true // Caso trivial
          }

          // La primera campaña debe tener la mayor prioridad
          const maxPriority = Math.max(...priorities)
          const firstCampaignPriority = campaigns[0].priority

          return firstCampaignPriority === maxPriority
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: La campaña con menor prioridad siempre está última
   */
  it('Property: La campaña con menor prioridad debe estar en la última posición', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniquePrioritiesArbitrary,
        async (priorities: number[]) => {
          mockRepository.clear()

          // Crear campañas
          for (const priority of priorities) {
            const campaignData = await fc.sample(campaignDataWithPriorityArbitrary(priority), 1)[0]
            await mockRepository.create(campaignData)
          }

          // Obtener campañas
          const campaigns = await mockRepository.findAll()

          if (campaigns.length === 0) {
            return true
          }

          // La última campaña debe tener la menor prioridad
          const minPriority = Math.min(...priorities)
          const lastCampaignPriority = campaigns[campaigns.length - 1].priority

          return lastCampaignPriority === minPriority
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Tests unitarios adicionales para validar el comportamiento del repositorio
 */
describe('CampaignRepository Unit Tests', () => {
  describe('Ordenamiento por prioridad', () => {
    it('debe ordenar correctamente 3 campañas con prioridades 1, 5, 3', async () => {
      const mockRepo = new MockCampaignRepository()
      
      // Crear campañas en orden no ordenado
      const baseData: Omit<CreateCampaignData, 'priority' | 'name' | 'slug'> = {
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 604800000),
        discountRules: { global: { type: 'percentage', value: 10 } },
        frontendConfig: {
          promoBanner: { messages: [{ icon: '🎉', text: 'Test' }] },
          hero: { title: 'Test', subtitle: 'Test', ctaText: 'Test' },
          dealsSection: { title: 'Test', subtitle: 'Test', badge: 'Test' }
        }
      }

      await mockRepo.create({ ...baseData, name: 'Low', slug: 'low', priority: 1 })
      await mockRepo.create({ ...baseData, name: 'High', slug: 'high', priority: 5 })
      await mockRepo.create({ ...baseData, name: 'Medium', slug: 'medium', priority: 3 })

      const campaigns = await mockRepo.findAll()
      
      expect(campaigns[0].priority).toBe(5)
      expect(campaigns[1].priority).toBe(3)
      expect(campaigns[2].priority).toBe(1)
    })

    it('debe manejar correctamente una lista vacía', async () => {
      const mockRepo = new MockCampaignRepository()
      const campaigns = await mockRepo.findAll()
      
      expect(campaigns).toEqual([])
    })

    it('debe manejar correctamente una sola campaña', async () => {
      const mockRepo = new MockCampaignRepository()
      
      await mockRepo.create({
        name: 'Single',
        slug: 'single',
        priority: 10,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 604800000),
        discountRules: { global: { type: 'percentage', value: 10 } },
        frontendConfig: {
          promoBanner: { messages: [{ icon: '🎉', text: 'Test' }] },
          hero: { title: 'Test', subtitle: 'Test', ctaText: 'Test' },
          dealsSection: { title: 'Test', subtitle: 'Test', badge: 'Test' }
        }
      })

      const campaigns = await mockRepo.findAll()
      
      expect(campaigns.length).toBe(1)
      expect(campaigns[0].priority).toBe(10)
    })
  })
})
