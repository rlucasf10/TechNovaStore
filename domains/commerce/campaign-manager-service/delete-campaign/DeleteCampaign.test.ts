/**
 * Property-Based Tests para DeleteCampaign
 * 
 * Implementa tests basados en propiedades para validar el comportamiento
 * del caso de uso DeleteCampaign.
 */

import fc from 'fast-check'
import { DeleteCampaign, CampaignNotFoundError } from './DeleteCampaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { ICampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { ProductServiceClient, Product } from '../shared/clients/ProductServiceClient'
import { Campaign } from '../shared/models/Campaign'
import { CampaignProduct } from '../shared/models/CampaignProduct'
import { CreateCampaignData, CreateCampaignProductData, ProductUpdate, ProductFilters } from '../shared/types'

/**
 * Mock del repositorio de campañas
 */
class MockCampaignRepository implements ICampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async create(data: CreateCampaignData): Promise<Campaign> {
    const campaign = Campaign.create(data)
    const id = `campaign-${Date.now()}-${Math.random()}`
    const campaignWithId = Campaign.fromDatabase({
      ...campaign.toJSON(),
      id
    })
    
    this.campaigns.set(id, campaignWithId)
    return campaignWithId
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) || null
  }

  async findBySlug(slug: string): Promise<Campaign | null> {
    return Array.from(this.campaigns.values()).find(c => c.slug === slug) || null
  }

  async findByName(name: string): Promise<Campaign | null> {
    return Array.from(this.campaigns.values()).find(c => c.name === name) || null
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

  clear(): void {
    this.campaigns.clear()
  }
}

/**
 * Mock del repositorio de productos en campaña
 */
class MockCampaignProductRepository implements ICampaignProductRepository {
  private campaignProducts: Map<string, CampaignProduct> = new Map()

  async create(data: CreateCampaignProductData): Promise<CampaignProduct> {
    const id = `cp-${Date.now()}-${Math.random()}`
    const campaignProduct = CampaignProduct.fromDatabase({
      id,
      ...data,
      unitsSold: 0,
      appliedAt: new Date()
    })
    
    this.campaignProducts.set(id, campaignProduct)
    return campaignProduct
  }

  async createBatch(data: CreateCampaignProductData[]): Promise<CampaignProduct[]> {
    const results: CampaignProduct[] = []
    for (const item of data) {
      results.push(await this.create(item))
    }
    return results
  }

  async findByCampaignId(campaignId: string): Promise<CampaignProduct[]> {
    return Array.from(this.campaignProducts.values())
      .filter(cp => cp.campaignId === campaignId)
  }

  async findByProductId(productId: string): Promise<CampaignProduct[]> {
    return Array.from(this.campaignProducts.values())
      .filter(cp => cp.productId === productId)
  }

  async findByCampaignAndProduct(campaignId: string, productId: string): Promise<CampaignProduct | null> {
    return Array.from(this.campaignProducts.values())
      .find(cp => cp.campaignId === campaignId && cp.productId === productId) || null
  }

  async deleteByCampaignId(campaignId: string): Promise<number> {
    const toDelete = Array.from(this.campaignProducts.entries())
      .filter(([_, cp]) => cp.campaignId === campaignId)
    
    toDelete.forEach(([id, _]) => this.campaignProducts.delete(id))
    return toDelete.length
  }

  async countByCampaignId(campaignId: string): Promise<number> {
    return Array.from(this.campaignProducts.values())
      .filter(cp => cp.campaignId === campaignId)
      .length
  }

  async updateUnitsSold(id: string, unitsSold: number): Promise<CampaignProduct> {
    const cp = this.campaignProducts.get(id)
    if (!cp) {
      throw new Error('CampaignProduct not found')
    }
    const updated = CampaignProduct.fromDatabase({ ...cp.toJSON(), unitsSold })
    this.campaignProducts.set(id, updated)
    return updated
  }

  clear(): void {
    this.campaignProducts.clear()
  }
}

/**
 * Mock del cliente de Product Service
 */
class MockProductServiceClient extends ProductServiceClient {
  private products: Map<string, Product> = new Map()
  public updatesBatch: ProductUpdate[] = []

  constructor() {
    super('http://localhost:3001')
  }

  override async getProduct(productId: string): Promise<Product | null> {
    return this.products.get(productId) || null
  }

  override async getProducts(filters?: ProductFilters): Promise<Product[]> {
    return Array.from(this.products.values())
  }

  override async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.category === category)
  }

  override async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const product = this.products.get(productId)
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Mapear campos de camelCase a snake_case para el mock
    // Convertir undefined a null para simular el comportamiento real del Product Service
    const mappedData: Partial<Product> = { ...data }
    
    // Mapear campos específicos de campaña
    if ('inCampaign' in data) {
      mappedData.in_campaign = data.inCampaign as boolean
      delete (mappedData as Record<string, unknown>).inCampaign
    }
    if ('campaignId' in data) {
      // Convertir undefined a null usando cast para el mock
      (mappedData as Record<string, unknown>).campaign_id = data.campaignId === undefined ? null : data.campaignId
      delete (mappedData as Record<string, unknown>).campaignId
    }
    if ('campaignPrice' in data) {
      // Convertir undefined a null usando cast para el mock
      (mappedData as Record<string, unknown>).campaign_price = data.campaignPrice === undefined ? null : data.campaignPrice
      delete (mappedData as Record<string, unknown>).campaignPrice
    }
    if ('originalPrice' in data) {
      // Convertir undefined a null usando cast para el mock
      (mappedData as Record<string, unknown>).original_price = data.originalPrice === undefined ? null : data.originalPrice
      delete (mappedData as Record<string, unknown>).originalPrice
    }
    if ('discountPercentage' in data) {
      // Convertir undefined a null usando cast para el mock
      (mappedData as Record<string, unknown>).discount_percentage = data.discountPercentage === undefined ? null : data.discountPercentage
      delete (mappedData as Record<string, unknown>).discountPercentage
    }
    if ('ourPrice' in data) {
      mappedData.our_price = data.ourPrice as number
      delete (mappedData as Record<string, unknown>).ourPrice
    }
    
    const updated = { ...product, ...mappedData } as Product
    this.products.set(productId, updated)
    return updated
  }

  override async updateProductsBatch(updates: ProductUpdate[]): Promise<void> {
    this.updatesBatch.push(...updates)
    for (const update of updates) {
      await this.updateProduct(update.productId, update.data as Partial<Product>)
    }
  }

  override async healthCheck(): Promise<boolean> {
    return true
  }

  // Métodos auxiliares para testing
  addProduct(product: Product): void {
    this.products.set(product.id, product)
  }

  clear(): void {
    this.products.clear()
    this.updatesBatch = []
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

/**
 * Genera reglas de descuento válidas
 */
const discountRulesArbitrary = () => {
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

/**
 * Genera configuración de frontend válida
 */
const frontendConfigArbitrary = () => {
  return fc.record({
    promoBanner: fc.record({
      messages: fc.array(
        fc.record({
          icon: fc.string({ minLength: 1, maxLength: 5 }),
          text: fc.string({ minLength: 5, maxLength: 100 })
        }),
        { minLength: 1, maxLength: 5 }
      )
    }),
    hero: fc.record({
      title: fc.string({ minLength: 5, maxLength: 100 }),
      subtitle: fc.string({ minLength: 5, maxLength: 200 }),
      ctaText: fc.string({ minLength: 3, maxLength: 50 })
    }),
    dealsSection: fc.record({
      title: fc.string({ minLength: 5, maxLength: 100 }),
      subtitle: fc.string({ minLength: 5, maxLength: 200 }),
      badge: fc.string({ minLength: 3, maxLength: 30 })
    })
  })
}

/**
 * Genera fechas válidas para una campaña
 */
const validCampaignDatesArbitrary = () => {
  const now = new Date()
  const minStart = new Date(now.getTime() + 60000)
  const maxStart = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

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
    name: fc.string({ minLength: 3, maxLength: 100 }),
    slug: fc.string({ minLength: 3, maxLength: 100 })
      .map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
    dates: validCampaignDatesArbitrary(),
    priority: fc.integer({ min: 1, max: 1000 }),
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
 * Genera datos de producto en campaña
 */
const campaignProductDataArbitrary = (campaignId: string) => {
  return fc.record({
    productId: fc.string({ minLength: 5, maxLength: 20 }),
    originalPrice: fc.float({ min: 10, max: 10000, noNaN: true }),
    discountPercentage: fc.integer({ min: 1, max: 99 })
  }).map(data => {
    const discountAmount = data.originalPrice * (data.discountPercentage / 100)
    const campaignPrice = data.originalPrice - discountAmount
    
    return {
      campaignId,
      productId: data.productId,
      originalPrice: data.originalPrice,
      campaignPrice,
      discountPercentage: data.discountPercentage,
      discountAmount
    }
  })
}

/**
 * Tests de Propiedades
 */
describe('DeleteCampaign - Property-Based Tests', () => {
  let campaignRepository: MockCampaignRepository
  let campaignProductRepository: MockCampaignProductRepository
  let productServiceClient: MockProductServiceClient
  let deleteCampaign: DeleteCampaign

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    campaignProductRepository = new MockCampaignProductRepository()
    productServiceClient = new MockProductServiceClient()
    deleteCampaign = new DeleteCampaign(
      campaignRepository,
      campaignProductRepository,
      productServiceClient
    )
  })

  afterEach(() => {
    campaignRepository.clear()
    campaignProductRepository.clear()
    productServiceClient.clear()
  })

  /**
   * Feature: campaign-manager-service, Property 3: Active Campaign Cleanup
   * Validates: Requirements 1.3
   * 
   * Para cualquier campaña activa con descuentos aplicados, al eliminarla,
   * todos los productos deben tener sus descuentos removidos antes de que
   * la campaña sea eliminada de la base de datos.
   */
  it('Property 3: should remove all discounts before deleting an active campaign', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
        async (campaignData, productIds) => {
          // Limpiar repositorios
          campaignRepository.clear()
          campaignProductRepository.clear()
          productServiceClient.clear()

          // Crear campaña
          const campaign = await campaignRepository.create(campaignData)
          
          // Marcar campaña como activa con descuentos aplicados
          await campaignRepository.update(campaign.id, {
            isActive: true,
            discountsApplied: true
          })

          // Crear productos con descuentos aplicados
          const uniqueProductIds = Array.from(new Set(productIds))
          const campaignProducts: CreateCampaignProductData[] = []
          
          for (const productId of uniqueProductIds) {
            const originalPrice = 100 + Math.random() * 900
            const discountPercentage = 10 + Math.floor(Math.random() * 40)
            const discountAmount = originalPrice * (discountPercentage / 100)
            const campaignPrice = originalPrice - discountAmount

            // Agregar producto al Product Service
            productServiceClient.addProduct({
              id: productId,
              sku: `SKU-${productId}`,
              name: `Product ${productId}`,
              description: 'Test product',
              category: 'test',
              subcategory: 'test',
              brand: 'test',
              specifications: {},
              images: [],
              providers: [],
              our_price: campaignPrice,
              markup_percentage: 20,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
              in_campaign: true,
              campaign_id: campaign.id,
              campaign_price: campaignPrice,
              original_price: originalPrice,
              discount_percentage: discountPercentage
            })

            // Crear registro en campaign_products
            await campaignProductRepository.create({
              campaignId: campaign.id,
              productId,
              originalPrice,
              campaignPrice,
              discountPercentage,
              discountAmount
            })

            campaignProducts.push({
              campaignId: campaign.id,
              productId,
              originalPrice,
              campaignPrice,
              discountPercentage,
              discountAmount
            })
          }

          // Verificar que hay productos con descuento antes de eliminar
          const productsBeforeDelete = await campaignProductRepository.findByCampaignId(campaign.id)
          expect(productsBeforeDelete.length).toBe(uniqueProductIds.length)

          // Ejecutar eliminación
          const result = await deleteCampaign.execute({ id: campaign.id })

          // Verificar que la operación fue exitosa
          expect(result.success).toBe(true)
          expect(result.productsRestored).toBe(uniqueProductIds.length)

          // Verificar que la campaña fue eliminada
          const deletedCampaign = await campaignRepository.findById(campaign.id)
          expect(deletedCampaign).toBeNull()

          // Verificar que todos los registros de campaign_products fueron eliminados
          const productsAfterDelete = await campaignProductRepository.findByCampaignId(campaign.id)
          expect(productsAfterDelete.length).toBe(0)

          // Verificar que todos los productos fueron actualizados en el Product Service
          // para remover los campos de campaña
          expect(productServiceClient.updatesBatch.length).toBeGreaterThan(0)
          
          for (const productId of uniqueProductIds) {
            const product = await productServiceClient.getProduct(productId)
            expect(product).toBeDefined()
            expect(product).not.toBeNull()
            
            if (product) {
              expect(product.in_campaign).toBe(false)
              expect(product.campaign_id).toBeNull()
              expect(product.campaign_price).toBeNull()
              expect(product.original_price).toBeNull()
              expect(product.discount_percentage).toBeNull()
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test complementario: Verificar que campañas inactivas sin descuentos
   * se eliminan directamente sin intentar remover descuentos
   */
  it('Property 3 (complemento): should delete inactive campaigns without discount removal', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        async (campaignData) => {
          // Limpiar repositorios
          campaignRepository.clear()
          campaignProductRepository.clear()
          productServiceClient.clear()

          // Crear campaña inactiva sin descuentos
          const campaign = await campaignRepository.create(campaignData)
          
          // Verificar que la campaña no está activa ni tiene descuentos aplicados
          expect(campaign.isActive).toBe(false)
          expect(campaign.discountsApplied).toBe(false)

          // Ejecutar eliminación
          const result = await deleteCampaign.execute({ id: campaign.id })

          // Verificar que la operación fue exitosa
          expect(result.success).toBe(true)
          expect(result.productsRestored).toBeUndefined()

          // Verificar que la campaña fue eliminada
          const deletedCampaign = await campaignRepository.findById(campaign.id)
          expect(deletedCampaign).toBeNull()

          // Verificar que no se hicieron actualizaciones al Product Service
          expect(productServiceClient.updatesBatch.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test complementario: Verificar que intentar eliminar una campaña
   * inexistente lanza el error apropiado
   */
  it('Property 3 (complemento): should throw CampaignNotFoundError for non-existent campaigns', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        async (nonExistentId) => {
          // Limpiar repositorios
          campaignRepository.clear()

          // Intentar eliminar campaña inexistente
          await expect(
            deleteCampaign.execute({ id: nonExistentId })
          ).rejects.toThrow(CampaignNotFoundError)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Test complementario: Verificar que los precios originales se restauran correctamente
   * (round-trip property)
   */
  it('Property 3 (complemento): should restore original prices correctly (round-trip)', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCampaignDataArbitrary(),
        fc.array(
          fc.record({
            productId: fc.string({ minLength: 5, maxLength: 20 }),
            originalPrice: fc.float({ min: 10, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (campaignData, products) => {
          // Limpiar repositorios
          campaignRepository.clear()
          campaignProductRepository.clear()
          productServiceClient.clear()

          // Crear campaña activa
          const campaign = await campaignRepository.create(campaignData)
          await campaignRepository.update(campaign.id, {
            isActive: true,
            discountsApplied: true
          })

          // Guardar precios originales
          const originalPrices = new Map<string, number>()
          const uniqueProducts = Array.from(
            new Map(products.map(p => [p.productId, p])).values()
          )

          for (const product of uniqueProducts) {
            originalPrices.set(product.productId, product.originalPrice)

            const discountPercentage = 20
            const discountAmount = product.originalPrice * 0.2
            const campaignPrice = product.originalPrice - discountAmount

            // Agregar producto con descuento
            productServiceClient.addProduct({
              id: product.productId,
              sku: `SKU-${product.productId}`,
              name: `Product ${product.productId}`,
              description: 'Test product',
              category: 'test',
              subcategory: 'test',
              brand: 'test',
              specifications: {},
              images: [],
              providers: [],
              our_price: campaignPrice,
              markup_percentage: 20,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
              in_campaign: true,
              campaign_id: campaign.id,
              campaign_price: campaignPrice,
              original_price: product.originalPrice,
              discount_percentage: discountPercentage
            })

            // Crear registro en campaign_products
            await campaignProductRepository.create({
              campaignId: campaign.id,
              productId: product.productId,
              originalPrice: product.originalPrice,
              campaignPrice,
              discountPercentage,
              discountAmount
            })
          }

          // Eliminar campaña (debe restaurar precios)
          await deleteCampaign.execute({ id: campaign.id })

          // Verificar que los precios se restauraron correctamente
          for (const product of uniqueProducts) {
            const restoredProduct = await productServiceClient.getProduct(product.productId)
            const originalPrice = originalPrices.get(product.productId)!
            
            expect(restoredProduct).not.toBeNull()
            
            if (restoredProduct) {
              expect(restoredProduct.our_price).toBe(originalPrice)
              expect(restoredProduct.in_campaign).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
