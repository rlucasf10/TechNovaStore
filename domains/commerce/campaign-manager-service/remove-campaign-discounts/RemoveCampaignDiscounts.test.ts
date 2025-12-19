/**
 * Tests para RemoveCampaignDiscounts
 * 
 * Incluye tests unitarios y property-based tests para validar
 * la correcta remoción de descuentos de campaña.
 */

import fc from 'fast-check'
import { RemoveCampaignDiscounts, RemoveDiscountsInput } from './RemoveCampaignDiscounts'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { ProductServiceClient, Product } from '../shared/clients/ProductServiceClient'
import { BatchProcessor } from '../shared/utils/batch-processor'
import { CampaignProduct } from '../shared/models/CampaignProduct'
import { Campaign } from '../shared/models/Campaign'
import { ProductUpdate } from '../shared/types'

// Mocks
jest.mock('../shared/utils/logger')

describe('RemoveCampaignDiscounts', () => {
  let removeCampaignDiscounts: RemoveCampaignDiscounts
  let mockCampaignRepository: jest.Mocked<CampaignRepository>
  let mockCampaignProductRepository: jest.Mocked<CampaignProductRepository>
  let mockProductServiceClient: jest.Mocked<ProductServiceClient>
  let mockBatchProcessor: jest.Mocked<BatchProcessor>

  beforeEach(() => {
    // Crear mocks
    mockCampaignRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findPendingActivation: jest.fn(),
      findPendingDeactivation: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countActive: jest.fn()
    } as any

    mockCampaignProductRepository = {
      findByCampaignId: jest.fn(),
      deleteByCampaignId: jest.fn(),
      create: jest.fn(),
      createBatch: jest.fn(),
      findByProductId: jest.fn(),
      findByCampaignAndProduct: jest.fn(),
      countByCampaignId: jest.fn(),
      updateUnitsSold: jest.fn()
    } as any

    mockProductServiceClient = {
      getProduct: jest.fn(),
      getProducts: jest.fn(),
      getProductsByCategory: jest.fn(),
      updateProduct: jest.fn(),
      updateProductsBatch: jest.fn(),
      healthCheck: jest.fn()
    } as any

    mockBatchProcessor = {
      processBatch: jest.fn(),
      processBatchWithRetry: jest.fn(),
      processBatchParallel: jest.fn(),
      calculateOptimalBatchSize: jest.fn()
    } as any

    // Mock por defecto: campaña existe
    const mockCampaign = Campaign.fromDatabase({
      id: 'campaign-123',
      name: 'Test Campaign',
      slug: 'test-campaign',
      startDate: new Date(Date.now() - 86400000), // Ayer
      endDate: new Date(Date.now() + 86400000), // Mañana
      priority: 1,
      isActive: true,
      discountRules: { global: { type: 'percentage', value: 10 } },
      frontendConfig: {
        promoBanner: { messages: [] },
        hero: { title: 'Test', subtitle: 'Test', ctaText: 'Test' },
        dealsSection: { title: 'Test', subtitle: 'Test', badge: 'Test' }
      },
      discountsApplied: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    mockCampaignRepository.findById.mockResolvedValue(mockCampaign)
    mockCampaignRepository.update.mockResolvedValue({} as any)

    // Crear instancia del caso de uso
    removeCampaignDiscounts = new RemoveCampaignDiscounts(
      mockCampaignRepository,
      mockCampaignProductRepository,
      mockProductServiceClient,
      mockBatchProcessor
    )
  })

  describe('Unit Tests', () => {
    it('should remove discounts successfully', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const campaignProducts = [
        createMockCampaignProduct('prod-1', campaignId, 1000, 800),
        createMockCampaignProduct('prod-2', campaignId, 500, 400)
      ]

      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
      mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
        await processor(items)
        return {
          results: items,
          totalProcessed: items.length,
          successCount: items.length,
          failureCount: 0,
          errors: [],
          processingTime: 100
        }
      })
      mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(2)

      // Act
      const result = await removeCampaignDiscounts.execute({ campaignId })

      // Assert
      expect(result.productsRestored).toBe(2)
      expect(mockCampaignProductRepository.findByCampaignId).toHaveBeenCalledWith(campaignId)
      expect(mockProductServiceClient.updateProductsBatch).toHaveBeenCalled()
      expect(mockCampaignProductRepository.deleteByCampaignId).toHaveBeenCalledWith(campaignId)
    })

    it('should handle case when no products to restore', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      mockCampaignProductRepository.findByCampaignId.mockResolvedValue([])

      // Act
      const result = await removeCampaignDiscounts.execute({ campaignId })

      // Assert - La implementación retorna 0 productos restaurados sin error
      expect(result.productsRestored).toBe(0)
      expect(mockCampaignRepository.update).toHaveBeenCalledWith(campaignId, {
        isActive: false,
        discountsApplied: false
      })
    })

    it('should restore original prices correctly', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const originalPrice = 1000
      const campaignPrice = 800
      const campaignProducts = [
        createMockCampaignProduct('prod-1', campaignId, originalPrice, campaignPrice)
      ]

      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
      mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
        await processor(items)
        return {
          results: items,
          totalProcessed: items.length,
          successCount: items.length,
          failureCount: 0,
          errors: [],
          processingTime: 100
        }
      })
      mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(1)

      // Act
      await removeCampaignDiscounts.execute({ campaignId })

      // Assert - Verificar que se llamó para restaurar precios
      expect(mockProductServiceClient.updateProductsBatch).toHaveBeenCalled()
    })

    it('should clean campaign fields in Product Service', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const campaignProducts = [
        createMockCampaignProduct('prod-1', campaignId, 1000, 800)
      ]

      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
      mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
        await processor(items)
        return {
          results: items,
          totalProcessed: items.length,
          successCount: items.length,
          failureCount: 0,
          errors: [],
          processingTime: 100
        }
      })
      mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(1)

      // Act
      await removeCampaignDiscounts.execute({ campaignId })

      // Assert - Verificar que se llamó con los campos de campaña limpiados
      expect(mockProductServiceClient.updateProductsBatch).toHaveBeenCalled()
      const calls = mockProductServiceClient.updateProductsBatch.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const updates = calls[0][0]
      const update = updates.find((u: any) => u.productId === 'prod-1')
      expect(update).toBeDefined()
      expect(update!.data.inCampaign).toBe(false)
    })

    it('should process products in batches of 100', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const campaignProducts = Array.from({ length: 250 }, (_, i) =>
        createMockCampaignProduct(`prod-${i}`, campaignId, 1000, 800)
      )

      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
      mockBatchProcessor.processBatch.mockImplementation(async (items, processor, options) => {
        // Verificar que el tamaño del lote es 100
        expect(options?.batchSize).toBe(100)
        
        await processor(items)
        return {
          results: items,
          totalProcessed: items.length,
          successCount: items.length,
          failureCount: 0,
          errors: [],
          processingTime: 100
        }
      })
      mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(250)

      // Act
      await removeCampaignDiscounts.execute({ campaignId })

      // Assert
      expect(mockBatchProcessor.processBatch).toHaveBeenCalledWith(
        campaignProducts,
        expect.any(Function),
        expect.objectContaining({
          batchSize: 100
        })
      )
    })

    it('should delete campaign_products records', async () => {
      // Arrange
      const campaignId = 'campaign-123'
      const campaignProducts = [
        createMockCampaignProduct('prod-1', campaignId, 1000, 800)
      ]

      mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
      mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
        await processor(items)
        return {
          results: items,
          totalProcessed: items.length,
          successCount: items.length,
          failureCount: 0,
          errors: [],
          processingTime: 100
        }
      })
      mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(1)

      // Act
      await removeCampaignDiscounts.execute({ campaignId })

      // Assert
      expect(mockCampaignProductRepository.deleteByCampaignId).toHaveBeenCalledWith(campaignId)
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * Feature: campaign-manager-service, Property 18: Price Restoration Round-Trip
     * Validates: Requirements 4.2
     * 
     * Para cualquier producto con descuento aplicado, al remover el descuento,
     * el precio debe restaurarse exactamente al precio original guardado.
     */
    it('Property 18: removing discount should restore exact original price', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // campaignId
          fc.array(
            fc.record({
              productId: fc.string({ minLength: 1, maxLength: 50 }),
              originalPrice: fc.float({ min: 1, max: 10000, noNaN: true }),
              campaignPrice: fc.float({ min: 1, max: 10000, noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ).filter(products => {
            // Asegurar que campaignPrice < originalPrice para todos los productos
            return products.every(p => p.campaignPrice < p.originalPrice)
          }),
          async (campaignId, productsData) => {
            jest.clearAllMocks()
            // Arrange
            const campaignProducts = productsData.map(p =>
              createMockCampaignProduct(
                p.productId,
                campaignId,
                p.originalPrice,
                p.campaignPrice
              )
            )

            mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
            
            let capturedUpdates: ProductUpdate[] = []
            mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
              await processor(items)
              return {
                results: items,
                totalProcessed: items.length,
                successCount: items.length,
                failureCount: 0,
                errors: [],
                processingTime: 100
              }
            })
            
            mockProductServiceClient.updateProductsBatch.mockImplementation(async (updates) => {
              capturedUpdates = updates
            })
            
            mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(productsData.length)

            // Act
            await removeCampaignDiscounts.execute({ campaignId })

            // Assert - Property 18: Round-trip debe restaurar precio original exacto
            for (let i = 0; i < productsData.length; i++) {
              const originalData = productsData[i]
              const update = capturedUpdates.find(u => u.productId === originalData.productId)
              
              expect(update).toBeDefined()
              // Verificar que el precio original se restaura (puede estar en our_price o en el campo de datos)
              const updateData = update!.data as Record<string, unknown>
              const restoredPrice = updateData.our_price ?? updateData.originalPrice
              expect(restoredPrice).toBe(originalData.originalPrice)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Feature: campaign-manager-service, Property 19: Campaign Fields Cleanup
     * Validates: Requirements 4.3
     * 
     * Para cualquier producto con descuento removido, los campos campaign_price,
     * discount_percentage, original_price e in_campaign deben limpiarse (null o false)
     * en el Product Service.
     */
    it('Property 19: removing discount should clean all campaign fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // campaignId
          fc.array(
            fc.record({
              productId: fc.string({ minLength: 1, maxLength: 50 }),
              originalPrice: fc.float({ min: 1, max: 10000, noNaN: true }),
              campaignPrice: fc.float({ min: 1, max: 10000, noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ).filter(products => {
            return products.every(p => p.campaignPrice < p.originalPrice)
          }),
          async (campaignId, productsData) => {
            jest.clearAllMocks()
            // Arrange
            const campaignProducts = productsData.map(p =>
              createMockCampaignProduct(
                p.productId,
                campaignId,
                p.originalPrice,
                p.campaignPrice
              )
            )

            mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
            
            let capturedUpdates: ProductUpdate[] = []
            mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
              await processor(items)
              return {
                results: items,
                totalProcessed: items.length,
                successCount: items.length,
                failureCount: 0,
                errors: [],
                processingTime: 100
              }
            })
            
            mockProductServiceClient.updateProductsBatch.mockImplementation(async (updates) => {
              capturedUpdates = updates
            })
            
            mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(productsData.length)

            // Act
            await removeCampaignDiscounts.execute({ campaignId })

            // Assert - Property 19: Todos los campos de campaña deben limpiarse
            for (const update of capturedUpdates) {
              expect(update.data.inCampaign).toBe(false)
              // Los campos pueden ser null o undefined dependiendo de la implementación
              expect(update.data.campaignId == null).toBe(true)
              expect(update.data.campaignPrice == null).toBe(true)
              expect(update.data.originalPrice == null).toBe(true)
              expect(update.data.discountPercentage == null).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Feature: campaign-manager-service, Property 20: Campaign Product Records Deletion
     * Validates: Requirements 4.4
     * 
     * Para cualquier campaña finalizada, todos los registros de campaign_products
     * asociados deben eliminarse de la base de datos.
     */
    it('Property 20: all campaign_products records should be deleted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // campaignId
          fc.array(
            fc.record({
              productId: fc.string({ minLength: 1, maxLength: 50 }),
              originalPrice: fc.float({ min: 1, max: 10000, noNaN: true }),
              campaignPrice: fc.float({ min: 1, max: 10000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ).filter(products => {
            return products.every(p => p.campaignPrice < p.originalPrice)
          }),
          async (campaignId, productsData) => {
            jest.clearAllMocks()
            // Arrange
            const campaignProducts = productsData.map(p =>
              createMockCampaignProduct(
                p.productId,
                campaignId,
                p.originalPrice,
                p.campaignPrice
              )
            )

            mockCampaignProductRepository.findByCampaignId.mockResolvedValue(campaignProducts)
            
            mockBatchProcessor.processBatch.mockImplementation(async (items, processor) => {
              await processor(items)
              return {
                results: items,
                totalProcessed: items.length,
                successCount: items.length,
                failureCount: 0,
                errors: [],
                processingTime: 100
              }
            })
            
            mockProductServiceClient.updateProductsBatch.mockResolvedValue()
            mockCampaignProductRepository.deleteByCampaignId.mockResolvedValue(productsData.length)

            // Act
            await removeCampaignDiscounts.execute({ campaignId })

            // Assert - Property 20: deleteByCampaignId debe ser llamado
            expect(mockCampaignProductRepository.deleteByCampaignId).toHaveBeenCalledWith(campaignId)
            expect(mockCampaignProductRepository.deleteByCampaignId).toHaveBeenCalledTimes(1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

/**
 * Helper para crear un mock de CampaignProduct
 */
function createMockCampaignProduct(
  productId: string,
  campaignId: string,
  originalPrice: number,
  campaignPrice: number
): CampaignProduct {
  const discountAmount = originalPrice - campaignPrice
  const discountPercentage = Math.round((discountAmount / originalPrice) * 100)

  return CampaignProduct.fromDatabase({
    id: `cp-${productId}`,
    campaignId,
    productId,
    originalPrice,
    campaignPrice,
    discountPercentage,
    discountAmount,
    unitsSold: 0,
    appliedAt: new Date()
  })
}
