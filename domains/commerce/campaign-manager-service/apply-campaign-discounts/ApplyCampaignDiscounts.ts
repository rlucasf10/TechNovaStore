/**
 * ApplyCampaignDiscounts - Caso de uso para aplicar descuentos de campaña
 * 
 * Este caso de uso implementa la lógica para aplicar descuentos de una campaña
 * a los productos elegibles, procesándolos en lotes y sincronizando con el Product Service.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.2
 */

import { logger } from '../shared/utils/logger'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { ProductServiceClient, Product } from '../shared/clients/ProductServiceClient'
import { DiscountCalculator } from '../shared/utils/discount-calculator'
import { BatchProcessor } from '../shared/utils/batch-processor'
import { Campaign, CreateCampaignProductData, ProductUpdate } from '../shared/types'

/**
 * Input para aplicar descuentos de campaña
 */
export interface ApplyDiscountsInput {
  /** ID de la campaña cuyos descuentos se aplicarán */
  campaignId: string
}

/**
 * Output del proceso de aplicación de descuentos
 */
export interface ApplyDiscountsOutput {
  /** Número de productos afectados */
  productsAffected: number
  
  /** Monto total de descuento aplicado */
  totalDiscountAmount: number
  
  /** Porcentaje promedio de descuento */
  averageDiscountPercentage: number
  
  /** Tiempo de procesamiento en segundos */
  processingTime: number
}

/**
 * Errores específicos del caso de uso
 */
export class CampaignNotFoundError extends Error {
  constructor(campaignId: string) {
    super(`Campaña con ID ${campaignId} no encontrada`)
    this.name = 'CampaignNotFoundError'
  }
}

export class CampaignAlreadyAppliedError extends Error {
  constructor(campaignId: string) {
    super(`Los descuentos de la campaña ${campaignId} ya fueron aplicados`)
    this.name = 'CampaignAlreadyAppliedError'
  }
}

export class NoEligibleProductsError extends Error {
  constructor() {
    super('No se encontraron productos elegibles para la campaña')
    this.name = 'NoEligibleProductsError'
  }
}

/**
 * Caso de uso: Aplicar descuentos de campaña
 * 
 * Implementa la lógica completa para aplicar descuentos de una campaña:
 * 1. Obtener y validar la campaña
 * 2. Obtener productos elegibles del Product Service
 * 3. Calcular descuentos para cada producto
 * 4. Guardar precio original antes de modificar
 * 5. Procesar en lotes de 100
 * 6. Registrar en campaign_products
 * 7. Actualizar Product Service con campos de campaña
 * 8. Manejar conflictos de prioridad entre campañas
 */
export class ApplyCampaignDiscounts {
  constructor(
    private campaignRepository: CampaignRepository,
    private campaignProductRepository: CampaignProductRepository,
    private productServiceClient: ProductServiceClient,
    private discountCalculator: DiscountCalculator,
    private batchProcessor: BatchProcessor
  ) {}

  /**
   * Ejecuta el caso de uso
   * 
   * @param input - Datos de entrada
   * @returns Resultado de la aplicación de descuentos
   */
  async execute(input: ApplyDiscountsInput): Promise<ApplyDiscountsOutput> {
    const startTime = Date.now()

    logger.info('Iniciando aplicación de descuentos de campaña', {
      campaignId: input.campaignId
    })

    try {
      // 1. Obtener campaña y validar que existe
      const campaign = await this.getCampaignAndValidate(input.campaignId)

      // 2. Obtener productos elegibles del Product Service
      const eligibleProducts = await this.getEligibleProducts(campaign)

      if (eligibleProducts.length === 0) {
        throw new NoEligibleProductsError()
      }

      logger.info('Productos elegibles encontrados', {
        campaignId: campaign.id,
        count: eligibleProducts.length
      })

      // 3. Calcular descuentos para cada producto
      const productsWithDiscounts = this.calculateDiscountsForProducts(
        eligibleProducts,
        campaign
      )

      // 4-7. Procesar en lotes: guardar precios, registrar en campaign_products, actualizar Product Service
      const result = await this.processProductsInBatches(
        productsWithDiscounts,
        campaign
      )

      // 8. Actualizar estado de la campaña
      await this.updateCampaignStatus(campaign.id)

      const processingTime = (Date.now() - startTime) / 1000

      logger.info('Descuentos de campaña aplicados exitosamente', {
        campaignId: campaign.id,
        productsAffected: result.productsAffected,
        totalDiscountAmount: result.totalDiscountAmount,
        averageDiscountPercentage: result.averageDiscountPercentage,
        processingTime
      })

      return {
        ...result,
        processingTime
      }
    } catch (error) {
      logger.error('Error al aplicar descuentos de campaña', {
        campaignId: input.campaignId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * Obtiene la campaña y valida que existe y puede aplicarse
   * 
   * Requirement 3.1: Validar que la campaña existe
   * 
   * @param campaignId - ID de la campaña
   * @returns Campaña validada
   */
  private async getCampaignAndValidate(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(campaignId)

    if (!campaign) {
      throw new CampaignNotFoundError(campaignId)
    }

    // Validar que los descuentos no hayan sido aplicados ya
    if (campaign.discountsApplied) {
      throw new CampaignAlreadyAppliedError(campaignId)
    }

    return campaign
  }

  /**
   * Obtiene productos elegibles del Product Service
   * 
   * Requirement 3.1: Obtener productos elegibles
   * Requirement 6.1: Comunicarse con Product Service mediante HTTP REST
   * 
   * @param campaign - Campaña para la cual obtener productos
   * @returns Lista de productos elegibles
   */
  private async getEligibleProducts(campaign: Campaign): Promise<Product[]> {
    const products: Product[] = []

    // Obtener productos según las reglas de descuento
    const { discountRules } = campaign

    // Si hay descuento global, obtener todos los productos activos
    if (discountRules.global) {
      const allProducts = await this.productServiceClient.getProducts({
        isActive: true
      })
      products.push(...allProducts)
    }

    // Si hay descuentos por categoría, obtener productos de esas categorías
    if (discountRules.categories) {
      for (const category of Object.keys(discountRules.categories)) {
        const categoryProducts = await this.productServiceClient.getProductsByCategory(category)
        
        // Evitar duplicados
        for (const product of categoryProducts) {
          if (!products.find(p => p.id === product.id)) {
            products.push(product)
          }
        }
      }
    }

    // Si hay descuentos por producto específico, obtener esos productos
    if (discountRules.products) {
      for (const productId of Object.keys(discountRules.products)) {
        const product = await this.productServiceClient.getProduct(productId)
        
        if (product && !products.find(p => p.id === product.id)) {
          products.push(product)
        }
      }
    }

    // Requirement 3.7: Manejar conflictos de prioridad entre campañas
    // Filtrar productos que ya están en otra campaña de mayor prioridad
    const filteredProducts = await this.filterProductsByPriority(products, campaign)

    return filteredProducts
  }

  /**
   * Filtra productos que ya están en campañas de mayor prioridad
   * 
   * Requirement 3.7: Manejar conflictos de prioridad entre campañas
   * 
   * @param products - Lista de productos a filtrar
   * @param campaign - Campaña actual
   * @returns Productos filtrados
   */
  private async filterProductsByPriority(
    products: Product[],
    campaign: Campaign
  ): Promise<Product[]> {
    // Obtener campañas activas con mayor prioridad
    const activeCampaigns = await this.campaignRepository.findActive()
    const higherPriorityCampaigns = activeCampaigns.filter(
      c => c.priority > campaign.priority && c.id !== campaign.id
    )

    if (higherPriorityCampaigns.length === 0) {
      return products
    }

    // Obtener productos que ya están en campañas de mayor prioridad
    const productsInHigherPriorityCampaigns = new Set<string>()

    for (const higherCampaign of higherPriorityCampaigns) {
      const campaignProducts = await this.campaignProductRepository.findByCampaignId(
        higherCampaign.id
      )
      
      for (const cp of campaignProducts) {
        productsInHigherPriorityCampaigns.add(cp.productId)
      }
    }

    // Filtrar productos
    const filteredProducts = products.filter(
      p => !productsInHigherPriorityCampaigns.has(p.id)
    )

    if (filteredProducts.length < products.length) {
      logger.info('Productos filtrados por prioridad de campaña', {
        campaignId: campaign.id,
        originalCount: products.length,
        filteredCount: filteredProducts.length,
        excludedCount: products.length - filteredProducts.length
      })
    }

    return filteredProducts
  }

  /**
   * Calcula descuentos para todos los productos
   * 
   * Requirement 3.3: Calcular precio con descuento y porcentaje
   * 
   * @param products - Lista de productos
   * @param campaign - Campaña con reglas de descuento
   * @returns Productos con descuentos calculados
   */
  private calculateDiscountsForProducts(
    products: Product[],
    campaign: Campaign
  ): Array<{
    product: Product
    originalPrice: number
    campaignPrice: number
    discountAmount: number
    discountPercentage: number
  }> {
    return products
      .map(product => {
        const discount = this.discountCalculator.calculateProductDiscount(
          product,
          campaign.discountRules
        )

        // Solo incluir productos con descuento aplicable
        if (discount.discountAmount > 0) {
          return {
            product,
            originalPrice: discount.originalPrice,
            campaignPrice: discount.campaignPrice,
            discountAmount: discount.discountAmount,
            discountPercentage: discount.discountPercentage
          }
        }

        return null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }

  /**
   * Procesa productos en lotes
   * 
   * Requirement 3.6: Procesar productos en lotes de 100
   * 
   * @param productsWithDiscounts - Productos con descuentos calculados
   * @param campaign - Campaña
   * @returns Resultado del procesamiento
   */
  private async processProductsInBatches(
    productsWithDiscounts: Array<{
      product: Product
      originalPrice: number
      campaignPrice: number
      discountAmount: number
      discountPercentage: number
    }>,
    campaign: Campaign
  ): Promise<{
    productsAffected: number
    totalDiscountAmount: number
    averageDiscountPercentage: number
  }> {
    let totalDiscountAmount = 0
    let totalDiscountPercentage = 0

    // Procesar en lotes de 100
    const result = await this.batchProcessor.processBatch(
      productsWithDiscounts,
      async (batch) => {
        // Para cada lote, realizar las operaciones necesarias
        const campaignProductsData: CreateCampaignProductData[] = []
        const productUpdates: ProductUpdate[] = []

        for (const item of batch) {
          // Requirement 3.2: Guardar precio original antes de modificar
          // Requirement 3.5: Registrar en campaign_products
          campaignProductsData.push({
            campaignId: campaign.id,
            productId: item.product.id,
            originalPrice: item.originalPrice,
            campaignPrice: item.campaignPrice,
            discountPercentage: item.discountPercentage,
            discountAmount: item.discountAmount
          })

          // Requirement 3.4: Actualizar Product Service con campos de campaña
          // Requirement 6.2: Actualizar producto en Product Service
          productUpdates.push({
            productId: item.product.id,
            data: {
              inCampaign: true,
              campaignId: campaign.id,
              campaignPrice: item.campaignPrice,
              originalPrice: item.originalPrice,
              discountPercentage: item.discountPercentage
            }
          })

          totalDiscountAmount += item.discountAmount
          totalDiscountPercentage += item.discountPercentage
        }

        // Registrar en campaign_products
        await this.campaignProductRepository.createBatch(campaignProductsData)

        // Actualizar Product Service
        await this.productServiceClient.updateProductsBatch(productUpdates)

        return batch
      },
      {
        batchSize: 100,
        continueOnError: false,
        onProgress: (processed, total) => {
          logger.debug('Progreso de aplicación de descuentos', {
            campaignId: campaign.id,
            processed,
            total,
            percentage: Math.round((processed / total) * 100)
          })
        }
      }
    )

    const productsAffected = result.successCount
    const averageDiscountPercentage = productsAffected > 0
      ? Math.round(totalDiscountPercentage / productsAffected)
      : 0

    return {
      productsAffected,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      averageDiscountPercentage
    }
  }

  /**
   * Actualiza el estado de la campaña después de aplicar descuentos
   * 
   * @param campaignId - ID de la campaña
   */
  private async updateCampaignStatus(campaignId: string): Promise<void> {
    await this.campaignRepository.update(campaignId, {
      discountsApplied: true,
      appliedAt: new Date(),
      isActive: true
    })

    logger.info('Estado de campaña actualizado', {
      campaignId,
      discountsApplied: true,
      isActive: true
    })
  }
}

