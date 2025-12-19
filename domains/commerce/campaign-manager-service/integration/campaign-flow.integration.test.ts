/**
 * Integration Test - Flujo Completo de Campaña
 * 
 * Este test de integración valida el flujo completo de una campaña:
 * Crear campaña → Activar → Aplicar descuentos → Desactivar → Restaurar precios
 * 
 * Requirements: 1.1, 3.1, 4.1
 */

import { CreateCampaign, CreateCampaignInput, CampaignValidationError, DuplicateCampaignNameError } from '../create-campaign/CreateCampaign'
import { ApplyCampaignDiscounts, ApplyDiscountsInput, ApplyDiscountsOutput, CampaignNotFoundError as ApplyCampaignNotFoundError, CampaignAlreadyAppliedError, NoEligibleProductsError } from '../apply-campaign-discounts/ApplyCampaignDiscounts'
import { RemoveCampaignDiscounts, RemoveDiscountsInput, RemoveDiscountsOutput, CampaignNotFoundError as RemoveCampaignNotFoundError } from '../remove-campaign-discounts/RemoveCampaignDiscounts'
import { DeleteCampaign, DeleteCampaignInput, DeleteCampaignOutput, CampaignNotFoundError as DeleteCampaignNotFoundError } from '../delete-campaign/DeleteCampaign'
import { CheckActivateCampaigns, CheckActivateOutput } from '../check-activate-campaigns/CheckActivateCampaigns'
import { CheckDeactivateCampaigns, CheckDeactivateOutput } from '../check-deactivate-campaigns/CheckDeactivateCampaigns'
import { CampaignValidator } from '../shared/utils/validators'
import { DiscountCalculator } from '../shared/utils/discount-calculator'
import { BatchProcessor } from '../shared/utils/batch-processor'
import { Campaign, CampaignProduct, DiscountRules, FrontendConfig, CreateCampaignData } from '../shared/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Mock del CampaignRepository
 */
class MockCampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async create(data: CreateCampaignData): Promise<Campaign> {
    const campaign: Campaign = {
      id: uuidv4(),
      ...data,
      isActive: false,
      discountsApplied: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.campaigns.set(campaign.id, campaign)
    return campaign
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) || null
  }

  async findByName(name: string): Promise<Campaign | null> {
    for (const campaign of this.campaigns.values()) {
      if (campaign.name === name) return campaign
    }
    return null
  }

  async findBySlug(slug: string): Promise<Campaign | null> {
    for (const campaign of this.campaigns.values()) {
      if (campaign.slug === slug) return campaign
    }
    return null
  }

  async findAll(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
  }

  async findActive(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.isActive)
  }

  async findPendingActivation(now: Date): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      c => c.startDate <= now && !c.isActive && !c.discountsApplied
    )
  }

  async findPendingDeactivation(now: Date): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      c => c.endDate <= now && c.isActive
    )
  }

  async update(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    const campaign = this.campaigns.get(id)
    if (!campaign) return null
    
    const updated = { ...campaign, ...data, updatedAt: new Date() }
    this.campaigns.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.campaigns.delete(id)
  }

  // Método auxiliar para tests
  clear(): void {
    this.campaigns.clear()
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id)
  }
}

/**
 * Mock del CampaignProductRepository
 */
class MockCampaignProductRepository {
  private products: Map<string, CampaignProduct> = new Map()

  async create(data: Omit<CampaignProduct, 'id' | 'unitsSold' | 'appliedAt'>): Promise<CampaignProduct> {
    const product: CampaignProduct = {
      id: uuidv4(),
      ...data,
      unitsSold: 0,
      appliedAt: new Date()
    }
    this.products.set(product.id, product)
    return product
  }

  async createBatch(dataArray: Array<Omit<CampaignProduct, 'id' | 'unitsSold' | 'appliedAt'>>): Promise<CampaignProduct[]> {
    const results: CampaignProduct[] = []
    for (const data of dataArray) {
      const product = await this.create(data)
      results.push(product)
    }
    return results
  }

  async findByCampaignId(campaignId: string): Promise<CampaignProduct[]> {
    return Array.from(this.products.values()).filter(p => p.campaignId === campaignId)
  }

  async findByProductId(productId: string): Promise<CampaignProduct | null> {
    for (const product of this.products.values()) {
      if (product.productId === productId) return product
    }
    return null
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    let count = 0
    for (const [id, product] of this.products.entries()) {
      if (product.campaignId === campaignId) {
        this.products.delete(id)
        count++
      }
    }
    return count
  }

  async countByCampaignId(campaignId: string): Promise<number> {
    return (await this.findByCampaignId(campaignId)).length
  }

  // Método auxiliar para tests
  clear(): void {
    this.products.clear()
  }

  getAll(): CampaignProduct[] {
    return Array.from(this.products.values())
  }
}


/**
 * Mock del ProductServiceClient
 */
class MockProductServiceClient {
  private products: Map<string, any> = new Map()

  constructor() {
    // Inicializar con productos de prueba
    this.initializeProducts()
  }

  private initializeProducts(): void {
    const categories = ['portatiles', 'componentes', 'perifericos', 'monitores']
    
    for (let i = 1; i <= 20; i++) {
      const product = {
        id: `product-${i}`,
        name: `Producto ${i}`,
        category: categories[i % categories.length],
        our_price: 100 + (i * 50),
        isActive: true,
        inCampaign: false,
        campaignId: undefined,
        campaignPrice: undefined,
        originalPrice: undefined,
        discountPercentage: undefined
      }
      this.products.set(product.id, product)
    }
  }

  async getProduct(id: string): Promise<any | null> {
    return this.products.get(id) || null
  }

  async getProducts(filters?: { isActive?: boolean }): Promise<any[]> {
    let products = Array.from(this.products.values())
    if (filters?.isActive !== undefined) {
      products = products.filter(p => p.isActive === filters.isActive)
    }
    return products
  }

  async getProductsByCategory(category: string): Promise<any[]> {
    return Array.from(this.products.values()).filter(p => p.category === category)
  }

  async updateProduct(id: string, data: any): Promise<any | null> {
    const product = this.products.get(id)
    if (!product) return null
    
    const updated = { ...product, ...data }
    this.products.set(id, updated)
    return updated
  }

  async updateProductsBatch(updates: Array<{ productId: string; data: any }>): Promise<void> {
    for (const update of updates) {
      await this.updateProduct(update.productId, update.data)
    }
  }

  // Métodos auxiliares para tests
  clear(): void {
    this.products.clear()
    this.initializeProducts()
  }

  getProductState(id: string): any {
    return this.products.get(id)
  }

  getAllProducts(): any[] {
    return Array.from(this.products.values())
  }
}

/**
 * Mock del NotificationServiceClient
 */
class MockNotificationServiceClient {
  public notifications: Array<{ type: string; data: any }> = []

  async sendCampaignActivated(campaign: Campaign, productsAffected: number, averageDiscount: number): Promise<void> {
    this.notifications.push({
      type: 'campaign_activated',
      data: { campaignId: campaign.id, campaignName: campaign.name, productsAffected, averageDiscount }
    })
  }

  async sendCampaignDeactivated(campaign: Campaign, report: any): Promise<void> {
    this.notifications.push({
      type: 'campaign_deactivated',
      data: { campaignId: campaign.id, campaignName: campaign.name, report }
    })
  }

  async sendCampaignError(campaign: Campaign, error: Error, operation: string): Promise<void> {
    this.notifications.push({
      type: 'campaign_error',
      data: { campaignId: campaign.id, campaignName: campaign.name, error: error.message, operation }
    })
  }

  // Método auxiliar para tests
  clear(): void {
    this.notifications = []
  }
}


/**
 * Datos de prueba para campañas
 */
const createTestCampaignInput = (overrides: Partial<CreateCampaignInput> = {}): CreateCampaignInput => {
  const now = new Date()
  const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Mañana
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // En 7 días

  return {
    name: `Campaña Test ${Date.now()}`,
    slug: `campana-test-${Date.now()}`,
    startDate,
    endDate,
    priority: 10,
    discountRules: {
      global: { type: 'percentage', value: 20 }
    },
    frontendConfig: {
      promoBanner: {
        messages: [{ icon: '🔥', text: 'Ofertas especiales' }]
      },
      hero: {
        title: 'Gran Campaña',
        subtitle: 'Descuentos increíbles',
        ctaText: 'Ver ofertas'
      },
      dealsSection: {
        title: 'Ofertas',
        subtitle: 'Los mejores precios',
        badge: 'HOT'
      }
    },
    ...overrides
  }
}

describe('Campaign Flow Integration Tests', () => {
  let campaignRepository: MockCampaignRepository
  let campaignProductRepository: MockCampaignProductRepository
  let productServiceClient: MockProductServiceClient
  let notificationClient: MockNotificationServiceClient
  let validator: CampaignValidator
  let discountCalculator: DiscountCalculator
  let batchProcessor: BatchProcessor

  // Casos de uso
  let createCampaign: CreateCampaign
  let applyCampaignDiscounts: ApplyCampaignDiscounts
  let removeCampaignDiscounts: RemoveCampaignDiscounts
  let deleteCampaign: DeleteCampaign
  let checkActivateCampaigns: CheckActivateCampaigns
  let checkDeactivateCampaigns: CheckDeactivateCampaigns

  beforeEach(() => {
    // Inicializar mocks
    campaignRepository = new MockCampaignRepository()
    campaignProductRepository = new MockCampaignProductRepository()
    productServiceClient = new MockProductServiceClient()
    notificationClient = new MockNotificationServiceClient()
    validator = new CampaignValidator()
    discountCalculator = new DiscountCalculator()
    batchProcessor = new BatchProcessor()

    // Inicializar casos de uso
    createCampaign = new CreateCampaign(
      campaignRepository as any,
      validator
    )

    applyCampaignDiscounts = new ApplyCampaignDiscounts(
      campaignRepository as any,
      campaignProductRepository as any,
      productServiceClient as any,
      discountCalculator,
      batchProcessor
    )

    removeCampaignDiscounts = new RemoveCampaignDiscounts(
      campaignRepository as any,
      campaignProductRepository as any,
      productServiceClient as any,
      batchProcessor
    )

    deleteCampaign = new DeleteCampaign(
      campaignRepository as any,
      campaignProductRepository as any,
      productServiceClient as any
    )

    checkActivateCampaigns = new CheckActivateCampaigns(
      campaignRepository as any,
      applyCampaignDiscounts,
      notificationClient as any,
      { maxRetries: 1, retryBaseDelay: 10 }
    )

    checkDeactivateCampaigns = new CheckDeactivateCampaigns(
      campaignRepository as any,
      campaignProductRepository as any,
      removeCampaignDiscounts,
      notificationClient as any
    )
  })

  afterEach(() => {
    // Limpiar estado
    campaignRepository.clear()
    campaignProductRepository.clear()
    productServiceClient.clear()
    notificationClient.clear()
  })


  /**
   * Test del flujo completo de campaña
   * 
   * Requirement 1.1: Crear campaña
   * Requirement 3.1: Aplicar descuentos
   * Requirement 4.1: Remover descuentos
   */
  describe('Flujo completo: Crear → Activar → Aplicar descuentos → Desactivar → Restaurar precios', () => {
    it('should complete the full campaign lifecycle successfully', async () => {
      // PASO 1: Crear campaña
      const input = createTestCampaignInput()
      const createResult = await createCampaign.execute(input)

      expect(createResult.id).toBeDefined()
      expect(createResult.campaign.name).toBe(input.name)
      expect(createResult.campaign.isActive).toBe(false)
      expect(createResult.campaign.discountsApplied).toBe(false)

      const campaignId = createResult.id

      // Verificar que la campaña se guardó correctamente
      const savedCampaign = campaignRepository.getCampaign(campaignId)
      expect(savedCampaign).toBeDefined()
      expect(savedCampaign?.name).toBe(input.name)

      // PASO 2: Aplicar descuentos (simula activación)
      const applyResult = await applyCampaignDiscounts.execute({ campaignId })

      expect(applyResult.productsAffected).toBeGreaterThan(0)
      expect(applyResult.totalDiscountAmount).toBeGreaterThan(0)
      expect(applyResult.averageDiscountPercentage).toBe(20) // 20% global

      // Verificar que los productos tienen descuento aplicado
      const productsInCampaign = campaignProductRepository.getAll()
      expect(productsInCampaign.length).toBe(applyResult.productsAffected)

      // Verificar que los productos en el Product Service tienen los campos de campaña
      const productState = productServiceClient.getProductState('product-1')
      expect(productState.inCampaign).toBe(true)
      expect(productState.campaignId).toBe(campaignId)
      expect(productState.discountPercentage).toBe(20)

      // Verificar que la campaña está activa
      const activeCampaign = campaignRepository.getCampaign(campaignId)
      expect(activeCampaign?.isActive).toBe(true)
      expect(activeCampaign?.discountsApplied).toBe(true)

      // PASO 3: Remover descuentos (simula desactivación)
      const removeResult = await removeCampaignDiscounts.execute({ campaignId })

      expect(removeResult.productsRestored).toBe(applyResult.productsAffected)

      // Verificar que los productos ya no tienen descuento
      const productsAfterRemoval = campaignProductRepository.getAll()
      expect(productsAfterRemoval.length).toBe(0)

      // Verificar que los productos en el Product Service tienen los campos limpiados
      const productStateAfter = productServiceClient.getProductState('product-1')
      expect(productStateAfter.inCampaign).toBe(false)
      expect(productStateAfter.campaignId).toBeUndefined()

      // Verificar que la campaña está desactivada
      const deactivatedCampaign = campaignRepository.getCampaign(campaignId)
      expect(deactivatedCampaign?.isActive).toBe(false)
      expect(deactivatedCampaign?.discountsApplied).toBe(false)
    })

    it('should preserve original prices after round-trip (apply → remove)', async () => {
      // Guardar precios originales
      const originalPrices = new Map<string, number>()
      const allProducts = productServiceClient.getAllProducts()
      allProducts.forEach(p => originalPrices.set(p.id, p.our_price))

      // Crear y aplicar campaña
      const input = createTestCampaignInput({
        discountRules: { global: { type: 'percentage', value: 30 } }
      })
      const createResult = await createCampaign.execute(input)
      await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que los precios cambiaron
      const productDuringCampaign = productServiceClient.getProductState('product-1')
      expect(productDuringCampaign.campaignPrice).toBeLessThan(originalPrices.get('product-1')!)

      // Remover descuentos
      await removeCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que los precios originales se restauraron
      const allProductsAfter = productServiceClient.getAllProducts()
      allProductsAfter.forEach(p => {
        // El precio original debe haberse restaurado
        expect(p.our_price).toBe(originalPrices.get(p.id))
      })
    })
  })


  /**
   * Tests de activación automática
   */
  describe('Activación automática de campañas', () => {
    it('should automatically activate campaigns when start date is reached', async () => {
      // Crear campaña con fecha de inicio en el pasado
      const pastDate = new Date(Date.now() - 60 * 60 * 1000) // Hace 1 hora
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // En 7 días

      const input = createTestCampaignInput({
        startDate: pastDate,
        endDate: futureDate
      })
      const createResult = await createCampaign.execute(input)

      // Verificar que la campaña no está activa inicialmente
      expect(createResult.campaign.isActive).toBe(false)

      // Ejecutar verificación de activación
      const checkResult = await checkActivateCampaigns.execute()

      expect(checkResult.campaignsDetected).toBe(1)
      expect(checkResult.campaignsActivated).toBe(1)
      expect(checkResult.campaignsFailed).toBe(0)
      expect(checkResult.details[0].success).toBe(true)
      expect(checkResult.details[0].productsAffected).toBeGreaterThan(0)

      // Verificar que se envió notificación
      expect(notificationClient.notifications.length).toBe(1)
      expect(notificationClient.notifications[0].type).toBe('campaign_activated')
    })

    it('should not activate campaigns with future start date', async () => {
      // Crear campaña con fecha de inicio en el futuro
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
      const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // En 7 días

      const input = createTestCampaignInput({
        startDate: futureStart,
        endDate: futureEnd
      })
      await createCampaign.execute(input)

      // Ejecutar verificación de activación
      const checkResult = await checkActivateCampaigns.execute()

      expect(checkResult.campaignsDetected).toBe(0)
      expect(checkResult.campaignsActivated).toBe(0)
    })
  })

  /**
   * Tests de desactivación automática
   */
  describe('Desactivación automática de campañas', () => {
    it('should automatically deactivate campaigns when end date is reached', async () => {
      // Crear y activar campaña
      const pastStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Hace 2 días
      const pastEnd = new Date(Date.now() - 60 * 60 * 1000) // Hace 1 hora

      const input = createTestCampaignInput({
        startDate: pastStart,
        endDate: pastEnd
      })
      const createResult = await createCampaign.execute(input)

      // Activar manualmente la campaña
      await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que la campaña está activa
      const activeCampaign = campaignRepository.getCampaign(createResult.id)
      expect(activeCampaign?.isActive).toBe(true)

      // Ejecutar verificación de desactivación
      const checkResult = await checkDeactivateCampaigns.execute()

      expect(checkResult.campaignsDetected).toBe(1)
      expect(checkResult.campaignsDeactivated).toBe(1)
      expect(checkResult.campaignsFailed).toBe(0)
      expect(checkResult.details[0].success).toBe(true)
      expect(checkResult.details[0].productsRestored).toBeGreaterThan(0)

      // Verificar que se envió notificación
      expect(notificationClient.notifications.some(n => n.type === 'campaign_deactivated')).toBe(true)

      // Verificar que la campaña está desactivada
      const deactivatedCampaign = campaignRepository.getCampaign(createResult.id)
      expect(deactivatedCampaign?.isActive).toBe(false)
    })

    it('should not deactivate campaigns with future end date', async () => {
      // Crear y activar campaña con fecha de fin en el futuro
      const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000) // Ayer
      const futureEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // En 7 días

      const input = createTestCampaignInput({
        startDate: pastStart,
        endDate: futureEnd
      })
      const createResult = await createCampaign.execute(input)
      await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Ejecutar verificación de desactivación
      const checkResult = await checkDeactivateCampaigns.execute()

      expect(checkResult.campaignsDetected).toBe(0)
      expect(checkResult.campaignsDeactivated).toBe(0)

      // Verificar que la campaña sigue activa
      const campaign = campaignRepository.getCampaign(createResult.id)
      expect(campaign?.isActive).toBe(true)
    })
  })


  /**
   * Tests de eliminación de campaña
   */
  describe('Eliminación de campaña', () => {
    it('should delete inactive campaign without removing discounts', async () => {
      // Crear campaña sin activar
      const input = createTestCampaignInput()
      const createResult = await createCampaign.execute(input)

      // Eliminar campaña
      const deleteResult = await deleteCampaign.execute({ id: createResult.id })

      expect(deleteResult.success).toBe(true)
      expect(deleteResult.productsRestored).toBeUndefined()

      // Verificar que la campaña fue eliminada
      const campaign = campaignRepository.getCampaign(createResult.id)
      expect(campaign).toBeUndefined()
    })

    it('should remove discounts before deleting active campaign', async () => {
      // Crear y activar campaña
      const input = createTestCampaignInput()
      const createResult = await createCampaign.execute(input)
      const applyResult = await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que hay productos con descuento
      expect(campaignProductRepository.getAll().length).toBeGreaterThan(0)

      // Eliminar campaña activa
      const deleteResult = await deleteCampaign.execute({ id: createResult.id })

      expect(deleteResult.success).toBe(true)
      expect(deleteResult.productsRestored).toBe(applyResult.productsAffected)

      // Verificar que la campaña fue eliminada
      const campaign = campaignRepository.getCampaign(createResult.id)
      expect(campaign).toBeUndefined()

      // Verificar que los productos fueron restaurados
      expect(campaignProductRepository.getAll().length).toBe(0)

      // Verificar que los productos en el Product Service tienen los campos limpiados
      const productState = productServiceClient.getProductState('product-1')
      expect(productState.inCampaign).toBe(false)
    })

    it('should throw error when deleting non-existent campaign', async () => {
      await expect(
        deleteCampaign.execute({ id: 'non-existent-id' })
      ).rejects.toThrow(DeleteCampaignNotFoundError)
    })
  })

  /**
   * Tests de validación de campaña
   */
  describe('Validación de campaña', () => {
    it('should reject campaign with end date before start date', async () => {
      const now = new Date()
      const input = createTestCampaignInput({
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // En 7 días
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Mañana (antes de start)
      })

      await expect(createCampaign.execute(input)).rejects.toThrow(CampaignValidationError)
    })

    it('should reject duplicate campaign name', async () => {
      const input = createTestCampaignInput({ name: 'Campaña Única' })
      await createCampaign.execute(input)

      // Intentar crear otra campaña con el mismo nombre
      const duplicateInput = createTestCampaignInput({ 
        name: 'Campaña Única',
        slug: 'campana-unica-2'
      })

      await expect(createCampaign.execute(duplicateInput)).rejects.toThrow(DuplicateCampaignNameError)
    })
  })

  /**
   * Tests de manejo de errores
   */
  describe('Manejo de errores', () => {
    it('should throw error when applying discounts to non-existent campaign', async () => {
      await expect(
        applyCampaignDiscounts.execute({ campaignId: 'non-existent-id' })
      ).rejects.toThrow(ApplyCampaignNotFoundError)
    })

    it('should throw error when applying discounts to already applied campaign', async () => {
      // Crear y aplicar campaña
      const input = createTestCampaignInput()
      const createResult = await createCampaign.execute(input)
      await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Intentar aplicar descuentos de nuevo
      await expect(
        applyCampaignDiscounts.execute({ campaignId: createResult.id })
      ).rejects.toThrow(CampaignAlreadyAppliedError)
    })

    it('should throw error when removing discounts from non-existent campaign', async () => {
      await expect(
        removeCampaignDiscounts.execute({ campaignId: 'non-existent-id' })
      ).rejects.toThrow(RemoveCampaignNotFoundError)
    })
  })


  /**
   * Tests de prioridad de campañas
   */
  describe('Prioridad de campañas', () => {
    it('should respect campaign priority when multiple campaigns exist', async () => {
      // Crear campaña de baja prioridad
      const lowPriorityInput = createTestCampaignInput({
        name: 'Campaña Baja Prioridad',
        slug: 'campana-baja-prioridad',
        priority: 5,
        discountRules: { global: { type: 'percentage', value: 10 } }
      })
      const lowPriorityCampaign = await createCampaign.execute(lowPriorityInput)
      await applyCampaignDiscounts.execute({ campaignId: lowPriorityCampaign.id })

      // Crear campaña de alta prioridad
      const highPriorityInput = createTestCampaignInput({
        name: 'Campaña Alta Prioridad',
        slug: 'campana-alta-prioridad',
        priority: 20,
        discountRules: { global: { type: 'percentage', value: 30 } }
      })
      const highPriorityCampaign = await createCampaign.execute(highPriorityInput)

      // Aplicar descuentos de la campaña de alta prioridad
      // Los productos ya en la campaña de baja prioridad deberían ser excluidos
      const applyResult = await applyCampaignDiscounts.execute({ campaignId: highPriorityCampaign.id })

      // Verificar que ambas campañas están activas
      const lowPriority = campaignRepository.getCampaign(lowPriorityCampaign.id)
      const highPriority = campaignRepository.getCampaign(highPriorityCampaign.id)
      
      expect(lowPriority?.isActive).toBe(true)
      expect(highPriority?.isActive).toBe(true)
    })
  })

  /**
   * Tests de métricas y estadísticas
   */
  describe('Métricas y estadísticas', () => {
    it('should calculate correct discount statistics', async () => {
      // Crear campaña con descuento del 25%
      const input = createTestCampaignInput({
        discountRules: { global: { type: 'percentage', value: 25 } }
      })
      const createResult = await createCampaign.execute(input)
      const applyResult = await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar estadísticas
      expect(applyResult.averageDiscountPercentage).toBe(25)
      expect(applyResult.totalDiscountAmount).toBeGreaterThan(0)
      expect(applyResult.processingTime).toBeGreaterThan(0)

      // Verificar que el descuento total es correcto
      const productsInCampaign = campaignProductRepository.getAll()
      const calculatedTotal = productsInCampaign.reduce((sum, p) => sum + p.discountAmount, 0)
      expect(Math.abs(applyResult.totalDiscountAmount - calculatedTotal)).toBeLessThan(0.01)
    })

    it('should track products affected correctly', async () => {
      // Crear campaña
      const input = createTestCampaignInput()
      const createResult = await createCampaign.execute(input)
      const applyResult = await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que el número de productos afectados coincide
      const productsInCampaign = campaignProductRepository.getAll()
      expect(productsInCampaign.length).toBe(applyResult.productsAffected)

      // Verificar que cada producto tiene los campos correctos
      productsInCampaign.forEach(p => {
        expect(p.campaignId).toBe(createResult.id)
        expect(p.originalPrice).toBeGreaterThan(0)
        expect(p.campaignPrice).toBeLessThan(p.originalPrice)
        expect(p.discountPercentage).toBe(20)
        expect(p.discountAmount).toBeGreaterThan(0)
      })
    })
  })

  /**
   * Tests de procesamiento por lotes
   */
  describe('Procesamiento por lotes', () => {
    it('should process products in batches without errors', async () => {
      // Crear campaña
      const input = createTestCampaignInput()
      const createResult = await createCampaign.execute(input)

      // Aplicar descuentos (debería procesar en lotes de 100)
      const applyResult = await applyCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que todos los productos fueron procesados
      expect(applyResult.productsAffected).toBe(20) // 20 productos de prueba

      // Remover descuentos (también debería procesar en lotes)
      const removeResult = await removeCampaignDiscounts.execute({ campaignId: createResult.id })

      // Verificar que todos los productos fueron restaurados
      expect(removeResult.productsRestored).toBe(20)
    })
  })
})
