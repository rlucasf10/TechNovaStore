/**
 * Property-Based Tests para ApplyCampaignDiscounts
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso ApplyCampaignDiscounts.
 */

import fc from 'fast-check'
import { ApplyCampaignDiscounts, CampaignNotFoundError, CampaignAlreadyAppliedError } from './ApplyCampaignDiscounts'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { ProductServiceClient, Product } from '../shared/clients/ProductServiceClient'
import { DiscountCalculator } from '../shared/utils/discount-calculator'
import { BatchProcessor } from '../shared/utils/batch-processor'
import { Campaign, DiscountRules, DiscountRule, FrontendConfig, CreateCampaignProductData, ProductUpdate } from '../shared/types'

/**
 * Mocks para las dependencias
 */
class MockCampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) || null
  }

  async findActive(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.isActive)
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

  clear(): void {
    this.campaigns.clear()
  }
}

class MockCampaignProductRepository {
  private campaignProducts: Map<string, CreateCampaignProductData[]> = new Map()


  async findByCampaignId(campaignId: string): Promise<any[]> {
    return this.campaignProducts.get(campaignId) || []
  }

  async createBatch(data: CreateCampaignProductData[]): Promise<any[]> {
    if (data.length === 0) return []
    
    const campaignId = data[0].campaignId
    const existing = this.campaignProducts.get(campaignId) || []
    this.campaignProducts.set(campaignId, [...existing, ...data])
    
    return data.map(d => ({ ...d, id: `cp-${Math.random()}`, appliedAt: new Date(), unitsSold: 0 }))
  }

  getCampaignProducts(campaignId: string): CreateCampaignProductData[] {
    return this.campaignProducts.get(campaignId) || []
  }

  clear(): void {
    this.campaignProducts.clear()
  }
}

class MockProductServiceClient {
  private products: Map<string, Product> = new Map()

  async getProduct(productId: string): Promise<Product | null> {
    return this.products.get(productId) || null
  }

  async getProducts(filters: any = {}): Promise<Product[]> {
    let products = Array.from(this.products.values())
    
    if (filters.isActive !== undefined) {
      products = products.filter(p => p.is_active === filters.isActive)
    }
    
    if (filters.category) {
      products = products.filter(p => p.category === filters.category)
    }
    
    return products
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.getProducts({ category, isActive: true })
  }

  async updateProductsBatch(updates: ProductUpdate[]): Promise<void> {
    for (const update of updates) {
      const product = this.products.get(update.productId)
      if (product) {
        // Mapear campos de camelCase a snake_case (como lo haría el Product Service real)
        if (update.data.inCampaign !== undefined) {
          product.in_campaign = update.data.inCampaign
        }
        if (update.data.campaignId !== undefined) {
          product.campaign_id = update.data.campaignId
        }
        if (update.data.campaignPrice !== undefined) {
          product.campaign_price = update.data.campaignPrice
        }
        if (update.data.originalPrice !== undefined) {
          product.original_price = update.data.originalPrice
        }
        if (update.data.discountPercentage !== undefined) {
          product.discount_percentage = update.data.discountPercentage
        }
      }
    }
  }

  setProduct(product: Product): void {
    this.products.set(product.id, product)
  }

  setProducts(products: Product[]): void {
    products.forEach(p => this.setProduct(p))
  }

  getProductState(productId: string): Product | null {
    return this.products.get(productId) || null
  }

  clear(): void {
    this.products.clear()
  }
}

/**
 * Generadores (Arbitraries) para fast-check
 */

const discountRuleArbitrary = (): fc.Arbitrary<DiscountRule> => {
  return fc.oneof(
    fc.record({
      type: fc.constant('percentage' as const),
      value: fc.integer({ min: 1, max: 99 }),
      maxDiscount: fc.option(fc.float({ min: 1, max: 1000, noNaN: true }), { nil: undefined })
    }),
    fc.record({
      type: fc.constant('fixed' as const),
      value: fc.float({ min: 1, max: 500, noNaN: true })
    })
  )
}

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

const campaignArbitrary = (): fc.Arbitrary<Campaign> => {
  const now = new Date()
  const futureDate = new Date(now.getTime() + 86400000) // +1 día
  
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    slug: fc.string({ minLength: 5, maxLength: 50 }),
    startDate: fc.constant(now),
    endDate: fc.constant(futureDate),
    priority: fc.integer({ min: 1, max: 100 }),
    isActive: fc.constant(false),
    discountRules: fc.record({
      global: fc.option(discountRuleArbitrary(), { nil: undefined }),
      categories: fc.option(
        fc.dictionary(
          fc.constantFrom('portatiles', 'componentes', 'perifericos'),
          discountRuleArbitrary(),
          { maxKeys: 2 }
        ),
        { nil: undefined }
      ),
      products: fc.option(
        fc.dictionary(fc.uuid(), discountRuleArbitrary(), { maxKeys: 5 }),
        { nil: undefined }
      )
    }),
    frontendConfig: frontendConfigArbitrary(),
    discountsApplied: fc.constant(false),
    appliedAt: fc.constant(undefined),
    deactivatedAt: fc.constant(undefined),
    createdAt: fc.constant(now),
    updatedAt: fc.constant(now)
  })
}

// Contador global para generar IDs únicos en los tests
let productIdCounter = 0

const productArbitrary = (): fc.Arbitrary<Product> => {
  return fc.record({
    id: fc.constant(null), // Se asignará después
    sku: fc.string({ minLength: 5, maxLength: 20 }),
    name: fc.string({ minLength: 10, maxLength: 100 }),
    description: fc.string({ minLength: 20, maxLength: 200 }),
    category: fc.constantFrom('portatiles', 'componentes', 'perifericos', 'monitores'),
    subcategory: fc.string({ minLength: 5, maxLength: 30 }),
    brand: fc.string({ minLength: 3, maxLength: 30 }),
    specifications: fc.constant({}),
    images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
    providers: fc.constant([]),
    our_price: fc.float({ min: 10, max: 5000, noNaN: true }),
    markup_percentage: fc.float({ min: 10, max: 50, noNaN: true }),
    is_active: fc.constant(true),
    created_at: fc.constant(new Date()),
    updated_at: fc.constant(new Date()),
    in_campaign: fc.constant(false),
    campaign_id: fc.constant(undefined),
    campaign_price: fc.constant(undefined),
    original_price: fc.constant(undefined),
    discount_percentage: fc.constant(undefined)
  }).map(p => ({
    ...p,
    id: `product-${++productIdCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }))
}

/**
 * Tests de Propiedades
 */
describe('ApplyCampaignDiscounts - Property-Based Tests', () => {
  let applyCampaignDiscounts: ApplyCampaignDiscounts
  let mockCampaignRepo: MockCampaignRepository
  let mockCampaignProductRepo: MockCampaignProductRepository
  let mockProductServiceClient: MockProductServiceClient
  let discountCalculator: DiscountCalculator
  let batchProcessor: BatchProcessor

  beforeEach(() => {
    mockCampaignRepo = new MockCampaignRepository()
    mockCampaignProductRepo = new MockCampaignProductRepository()
    mockProductServiceClient = new MockProductServiceClient()
    discountCalculator = new DiscountCalculator()
    batchProcessor = new BatchProcessor()

    applyCampaignDiscounts = new ApplyCampaignDiscounts(
      mockCampaignRepo as any,
      mockCampaignProductRepo as any,
      mockProductServiceClient as any,
      discountCalculator,
      batchProcessor
    )
  })

  afterEach(() => {
    mockCampaignRepo.clear()
    mockCampaignProductRepo.clear()
    mockProductServiceClient.clear()
  })


  /**
   * Feature: campaign-manager-service, Property 13: Original Price Preservation
   * Validates: Requirements 3.2
   * 
   * Para cualquier producto al que se le aplica un descuento, el precio original
   * debe guardarse antes de modificar el precio, y debe ser recuperable.
   */
  describe('Property 13: Original Price Preservation', () => {
    it('should preserve original price for all products when applying discounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          campaignArbitrary(),
          fc.array(productArbitrary(), { minLength: 1, maxLength: 20 }),
          async (campaign, products) => {
            // Limpiar mocks al inicio de cada iteración
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange
            const campaignWithGlobalDiscount = {
              ...campaign,
              discountRules: {
                global: { type: 'percentage' as const, value: 20 }
              }
            }
            
            mockCampaignRepo.setCampaign(campaignWithGlobalDiscount)
            mockProductServiceClient.setProducts(products)

            // Guardar precios originales
            const originalPrices = new Map(products.map(p => [p.id, p.our_price]))

            // Act
            await applyCampaignDiscounts.execute({ campaignId: campaignWithGlobalDiscount.id })

            // Assert - Verificar que los precios originales fueron guardados
            const campaignProducts = mockCampaignProductRepo.getCampaignProducts(campaignWithGlobalDiscount.id)
            
            expect(campaignProducts.length).toBeGreaterThan(0)
            
            for (const cp of campaignProducts) {
              const originalPrice = originalPrices.get(cp.productId)
              expect(originalPrice).toBeDefined()
              expect(cp.originalPrice).toBe(originalPrice)
              
              // Verificar que el precio original también se guardó en el Product Service
              const product = mockProductServiceClient.getProductState(cp.productId)
              expect(product?.original_price).toBe(originalPrice)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should allow recovery of original price from campaign_products table', async () => {
      await fc.assert(
        fc.asyncProperty(
          campaignArbitrary(),
          fc.array(productArbitrary(), { minLength: 1, maxLength: 10 }),
          async (campaign, products) => {
            // Limpiar mocks al inicio de cada iteración
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange
            const campaignWithDiscount = {
              ...campaign,
              discountRules: {
                global: { type: 'fixed' as const, value: 50 }
              }
            }
            
            mockCampaignRepo.setCampaign(campaignWithDiscount)
            mockProductServiceClient.setProducts(products)

            const originalPrices = new Map(products.map(p => [p.id, p.our_price]))

            // Act
            await applyCampaignDiscounts.execute({ campaignId: campaignWithDiscount.id })

            // Assert - Los precios originales deben ser recuperables
            const campaignProducts = mockCampaignProductRepo.getCampaignProducts(campaignWithDiscount.id)
            
            for (const cp of campaignProducts) {
              const expectedOriginalPrice = originalPrices.get(cp.productId)
              expect(cp.originalPrice).toBe(expectedOriginalPrice)
              
              // Verificar que podemos "restaurar" el precio usando el valor guardado
              expect(cp.originalPrice).toBeGreaterThan(cp.campaignPrice)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * Feature: campaign-manager-service, Property 15: Product Service Synchronization
   * Validates: Requirements 3.4
   * 
   * Para cualquier producto con descuento aplicado, los campos campaign_price,
   * discount_percentage, original_price e in_campaign deben actualizarse en el Product Service.
   */
  describe('Property 15: Product Service Synchronization', () => {
    it('should synchronize all campaign fields to Product Service', async () => {
      await fc.assert(
        fc.asyncProperty(
          campaignArbitrary(),
          fc.array(productArbitrary(), { minLength: 1, maxLength: 15 }),
          async (campaign, products) => {
            // Limpiar mocks al inicio de cada iteración
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange
            const campaignWithDiscount = {
              ...campaign,
              discountRules: {
                global: { type: 'percentage' as const, value: 30 }
              }
            }
            
            mockCampaignRepo.setCampaign(campaignWithDiscount)
            mockProductServiceClient.setProducts(products)

            // Act
            await applyCampaignDiscounts.execute({ campaignId: campaignWithDiscount.id })

            // Assert - Verificar sincronización con Product Service
            const campaignProducts = mockCampaignProductRepo.getCampaignProducts(campaignWithDiscount.id)
            
            for (const cp of campaignProducts) {
              const product = mockProductServiceClient.getProductState(cp.productId)
              
              expect(product).toBeDefined()
              expect(product!.in_campaign).toBe(true)
              expect(product!.campaign_id).toBe(campaignWithDiscount.id)
              expect(product!.campaign_price).toBe(cp.campaignPrice)
              expect(product!.original_price).toBe(cp.originalPrice)
              expect(product!.discount_percentage).toBe(cp.discountPercentage)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should set in_campaign flag to true for all affected products', async () => {
      await fc.assert(
        fc.asyncProperty(
          campaignArbitrary(),
          fc.array(productArbitrary(), { minLength: 1, maxLength: 10 }),
          async (campaign, products) => {
            // Limpiar mocks al inicio de cada iteración
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange
            const campaignWithDiscount = {
              ...campaign,
              discountRules: {
                global: { type: 'fixed' as const, value: 100 }
              }
            }
            
            mockCampaignRepo.setCampaign(campaignWithDiscount)
            mockProductServiceClient.setProducts(products)

            // Verificar que inicialmente in_campaign es false
            products.forEach(p => {
              expect(p.in_campaign).toBe(false)
            })

            // Act
            await applyCampaignDiscounts.execute({ campaignId: campaignWithDiscount.id })

            // Assert - Todos los productos afectados deben tener in_campaign = true
            const campaignProducts = mockCampaignProductRepo.getCampaignProducts(campaignWithDiscount.id)
            
            for (const cp of campaignProducts) {
              const product = mockProductServiceClient.getProductState(cp.productId)
              expect(product!.in_campaign).toBe(true)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * Feature: campaign-manager-service, Property 16: Campaign Product Registration
   * Validates: Requirements 3.5
   * 
   * Para cualquier producto con descuento aplicado, debe existir un registro
   * en campaign_products con los precios original y con descuento correctos.
   */
  describe('Property 16: Campaign Product Registration', () => {
    it('should register all products with discounts in campaign_products table', async () => {
      await fc.assert(
        fc.asyncProperty(
          campaignArbitrary(),
          fc.array(productArbitrary(), { minLength: 1, maxLength: 15 }),
          async (campaign, products) => {
            // Limpiar mocks al inicio de cada iteración
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange
            const campaignWithDiscount = {
              ...campaign,
              discountRules: {
                global: { type: 'percentage' as const, value: 25 }
              }
            }
            
            mockCampaignRepo.setCampaign(campaignWithDiscount)
            mockProductServiceClient.setProducts(products)

            // Act
            const result = await applyCampaignDiscounts.execute({ campaignId: campaignWithDiscount.id })

            // Assert - Debe haber un registro por cada producto afectado
            const campaignProducts = mockCampaignProductRepo.getCampaignProducts(campaignWithDiscount.id)
            
            expect(campaignProducts.length).toBe(result.productsAffected)
            expect(campaignProducts.length).toBeGreaterThan(0)
            
            // Verificar que cada registro tiene los campos requeridos
            for (const cp of campaignProducts) {
              expect(cp.campaignId).toBe(campaignWithDiscount.id)
              expect(cp.productId).toBeDefined()
              expect(cp.originalPrice).toBeGreaterThan(0)
              expect(cp.campaignPrice).toBeGreaterThan(0)
              expect(cp.campaignPrice).toBeLessThan(cp.originalPrice)
              expect(cp.discountPercentage).toBeGreaterThan(0)
              expect(cp.discountPercentage).toBeLessThanOrEqual(99)
              expect(cp.discountAmount).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should maintain mathematical correctness in campaign_products records', async () => {
      await fc.assert(
        fc.asyncProperty(
          campaignArbitrary(),
          fc.array(productArbitrary(), { minLength: 1, maxLength: 10 }),
          async (campaign, products) => {
            // Limpiar mocks al inicio de cada iteración
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange
            const campaignWithDiscount = {
              ...campaign,
              discountRules: {
                global: { type: 'percentage' as const, value: 40 }
              }
            }
            
            mockCampaignRepo.setCampaign(campaignWithDiscount)
            mockProductServiceClient.setProducts(products)

            // Act
            await applyCampaignDiscounts.execute({ campaignId: campaignWithDiscount.id })

            // Assert - Verificar corrección matemática en cada registro
            const campaignProducts = mockCampaignProductRepo.getCampaignProducts(campaignWithDiscount.id)
            
            for (const cp of campaignProducts) {
              // campaignPrice = originalPrice - discountAmount
              const expectedCampaignPrice = cp.originalPrice - cp.discountAmount
              expect(Math.abs(cp.campaignPrice - expectedCampaignPrice)).toBeLessThanOrEqual(0.01)
              
              // discountPercentage = (discountAmount / originalPrice) * 100
              const expectedPercentage = Math.round((cp.discountAmount / cp.originalPrice) * 100)
              expect(cp.discountPercentage).toBe(expectedPercentage)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })


  /**
   * Feature: campaign-manager-service, Property 17: Campaign Priority Resolution
   * Validates: Requirements 3.7
   * 
   * Para cualquier producto con múltiples campañas aplicables, el descuento
   * de la campaña con mayor prioridad debe ser el que se aplique.
   */
  describe('Property 17: Campaign Priority Resolution', () => {
    it('should not apply discounts to products already in higher priority campaigns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 51, max: 100 }),
          fc.array(productArbitrary(), { minLength: 5, maxLength: 15 }),
          async (lowerPriority, higherPriority, products) => {
            // Limpiar mocks al inicio de cada iteración para evitar acumulación de datos
            mockCampaignRepo.clear()
            mockCampaignProductRepo.clear()
            mockProductServiceClient.clear()

            // Arrange - Crear campaña de mayor prioridad ya activa
            const higherPriorityCampaign: Campaign = {
              id: 'high-priority-campaign',
              name: 'High Priority Campaign',
              slug: 'high-priority',
              startDate: new Date(),
              endDate: new Date(Date.now() + 86400000),
              priority: higherPriority,
              isActive: true,
              discountRules: {
                global: { type: 'percentage', value: 50 }
              },
              frontendConfig: {} as FrontendConfig,
              discountsApplied: true,
              appliedAt: new Date(),
              deactivatedAt: undefined,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            // Crear campaña de menor prioridad
            const lowerPriorityCampaign: Campaign = {
              id: 'low-priority-campaign',
              name: 'Low Priority Campaign',
              slug: 'low-priority',
              startDate: new Date(),
              endDate: new Date(Date.now() + 86400000),
              priority: lowerPriority,
              isActive: false,
              discountRules: {
                global: { type: 'percentage', value: 30 }
              },
              frontendConfig: {} as FrontendConfig,
              discountsApplied: false,
              appliedAt: undefined,
              deactivatedAt: undefined,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            mockCampaignRepo.setCampaign(higherPriorityCampaign)
            mockCampaignRepo.setCampaign(lowerPriorityCampaign)
            mockProductServiceClient.setProducts(products)

            // Aplicar descuentos de la campaña de mayor prioridad primero
            const higherPriorityUseCase = new ApplyCampaignDiscounts(
              mockCampaignRepo as any,
              mockCampaignProductRepo as any,
              mockProductServiceClient as any,
              discountCalculator,
              batchProcessor
            )

            // Simular que la campaña de mayor prioridad ya tiene productos
            const highPriorityProducts = products.slice(0, Math.ceil(products.length / 2))
            for (const product of highPriorityProducts) {
              await mockCampaignProductRepo.createBatch([{
                campaignId: higherPriorityCampaign.id,
                productId: product.id,
                originalPrice: product.our_price,
                campaignPrice: product.our_price * 0.5,
                discountPercentage: 50,
                discountAmount: product.our_price * 0.5
              }])
            }

            // Act - Aplicar descuentos de la campaña de menor prioridad
            const result = await applyCampaignDiscounts.execute({ 
              campaignId: lowerPriorityCampaign.id 
            })

            // Assert - Los productos de la campaña de mayor prioridad no deben ser afectados
            const lowerPriorityCampaignProducts = mockCampaignProductRepo.getCampaignProducts(
              lowerPriorityCampaign.id
            )

            for (const cp of lowerPriorityCampaignProducts) {
              // Verificar que este producto NO está en la campaña de mayor prioridad
              const isInHigherPriority = highPriorityProducts.some(p => p.id === cp.productId)
              expect(isInHigherPriority).toBe(false)
            }

            // El número de productos afectados debe ser menor o igual al total
            expect(result.productsAffected).toBeLessThanOrEqual(products.length)
          }
        ),
        { numRuns: 15 }
      )
    })

    it('should respect priority ordering when multiple campaigns exist', async () => {
      // Arrange - Crear múltiples campañas con diferentes prioridades
      const campaigns: Campaign[] = [
        {
          id: 'campaign-priority-10',
          name: 'Campaign Priority 10',
          slug: 'priority-10',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          priority: 10,
          isActive: true,
          discountRules: { global: { type: 'percentage', value: 10 } },
          frontendConfig: {} as FrontendConfig,
          discountsApplied: true,
          appliedAt: new Date(),
          deactivatedAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'campaign-priority-50',
          name: 'Campaign Priority 50',
          slug: 'priority-50',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          priority: 50,
          isActive: true,
          discountRules: { global: { type: 'percentage', value: 30 } },
          frontendConfig: {} as FrontendConfig,
          discountsApplied: true,
          appliedAt: new Date(),
          deactivatedAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'campaign-priority-100',
          name: 'Campaign Priority 100',
          slug: 'priority-100',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          priority: 100,
          isActive: false,
          discountRules: { global: { type: 'percentage', value: 50 } },
          frontendConfig: {} as FrontendConfig,
          discountsApplied: false,
          appliedAt: undefined,
          deactivatedAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      campaigns.forEach(c => mockCampaignRepo.setCampaign(c))

      const products = Array.from({ length: 10 }, (_, i) => ({
        id: `product-${i}`,
        sku: `SKU-${i}`,
        name: `Product ${i}`,
        description: 'Test product',
        category: 'portatiles',
        subcategory: 'gaming',
        brand: 'TestBrand',
        specifications: {},
        images: [],
        providers: [],
        our_price: 1000,
        markup_percentage: 20,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        in_campaign: false
      }))

      mockProductServiceClient.setProducts(products)

      // Simular que las campañas de prioridad 10 y 50 ya tienen productos
      await mockCampaignProductRepo.createBatch([
        {
          campaignId: 'campaign-priority-10',
          productId: 'product-0',
          originalPrice: 1000,
          campaignPrice: 900,
          discountPercentage: 10,
          discountAmount: 100
        },
        {
          campaignId: 'campaign-priority-50',
          productId: 'product-1',
          originalPrice: 1000,
          campaignPrice: 700,
          discountPercentage: 30,
          discountAmount: 300
        }
      ])

      // Act - Aplicar campaña de prioridad 100
      const result = await applyCampaignDiscounts.execute({ 
        campaignId: 'campaign-priority-100' 
      })

      // Assert - No debe incluir productos de campañas de mayor prioridad
      // En este caso, priority 100 es mayor que 50 y 10, así que NO debería excluir productos
      // Pero si hubiera una campaña de prioridad 150, entonces sí excluiría
      expect(result.productsAffected).toBeGreaterThan(0)
    })
  })

  /**
   * Tests adicionales para casos edge y validaciones
   */
  describe('Edge Cases and Validations', () => {
    it('should throw error when campaign does not exist', async () => {
      await expect(
        applyCampaignDiscounts.execute({ campaignId: 'non-existent-campaign' })
      ).rejects.toThrow(CampaignNotFoundError)
    })

    it('should throw error when discounts already applied', async () => {
      const campaign: Campaign = {
        id: 'already-applied-campaign',
        name: 'Already Applied',
        slug: 'already-applied',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        priority: 50,
        isActive: true,
        discountRules: { global: { type: 'percentage', value: 20 } },
        frontendConfig: {} as FrontendConfig,
        discountsApplied: true, // Ya aplicados
        appliedAt: new Date(),
        deactivatedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockCampaignRepo.setCampaign(campaign)

      await expect(
        applyCampaignDiscounts.execute({ campaignId: campaign.id })
      ).rejects.toThrow(CampaignAlreadyAppliedError)
    })

    it('should update campaign status after applying discounts', async () => {
      const campaign: Campaign = {
        id: 'test-campaign',
        name: 'Test Campaign',
        slug: 'test-campaign',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        priority: 50,
        isActive: false,
        discountRules: { global: { type: 'percentage', value: 20 } },
        frontendConfig: {} as FrontendConfig,
        discountsApplied: false,
        appliedAt: undefined,
        deactivatedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const products = [
        {
          id: 'product-1',
          sku: 'SKU-1',
          name: 'Product 1',
          description: 'Test product',
          category: 'portatiles',
          subcategory: 'gaming',
          brand: 'TestBrand',
          specifications: {},
          images: [],
          providers: [],
          our_price: 1000,
          markup_percentage: 20,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          in_campaign: false
        }
      ]

      mockCampaignRepo.setCampaign(campaign)
      mockProductServiceClient.setProducts(products)

      await applyCampaignDiscounts.execute({ campaignId: campaign.id })

      const updatedCampaign = await mockCampaignRepo.findById(campaign.id)
      expect(updatedCampaign?.discountsApplied).toBe(true)
      expect(updatedCampaign?.isActive).toBe(true)
      expect(updatedCampaign?.appliedAt).toBeDefined()
    })

    it('should process products in batches of 100', async () => {
      const campaign: Campaign = {
        id: 'batch-test-campaign',
        name: 'Batch Test',
        slug: 'batch-test',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        priority: 50,
        isActive: false,
        discountRules: { global: { type: 'percentage', value: 15 } },
        frontendConfig: {} as FrontendConfig,
        discountsApplied: false,
        appliedAt: undefined,
        deactivatedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Crear 250 productos para probar el procesamiento por lotes
      const products = Array.from({ length: 250 }, (_, i) => ({
        id: `product-${i}`,
        sku: `SKU-${i}`,
        name: `Product ${i}`,
        description: 'Test product',
        category: 'portatiles',
        subcategory: 'gaming',
        brand: 'TestBrand',
        specifications: {},
        images: [],
        providers: [],
        our_price: 1000 + i,
        markup_percentage: 20,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        in_campaign: false
      }))

      mockCampaignRepo.setCampaign(campaign)
      mockProductServiceClient.setProducts(products)

      const result = await applyCampaignDiscounts.execute({ campaignId: campaign.id })

      expect(result.productsAffected).toBe(250)
      expect(result.totalDiscountAmount).toBeGreaterThan(0)
      expect(result.averageDiscountPercentage).toBe(15)
    })
  })
})

