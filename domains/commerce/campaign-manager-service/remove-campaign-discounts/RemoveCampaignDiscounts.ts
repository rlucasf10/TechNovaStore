/**
 * RemoveCampaignDiscounts - Caso de uso para remover descuentos de campaña
 * 
 * Este caso de uso implementa la lógica para remover descuentos de una campaña,
 * restaurando los precios originales de los productos y limpiando los campos de campaña.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.3
 */

import { logger } from '../shared/utils/logger'
import { CampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { ProductServiceClient } from '../shared/clients/ProductServiceClient'
import { BatchProcessor } from '../shared/utils/batch-processor'
import { CampaignProduct, ProductUpdate } from '../shared/types'

/**
 * Input para remover descuentos de campaña
 */
export interface RemoveDiscountsInput {
  /** ID de la campaña cuyos descuentos se removerán */
  campaignId: string
}

/**
 * Output del proceso de remoción de descuentos
 */
export interface RemoveDiscountsOutput {
  /** Número de productos restaurados */
  productsRestored: number
  
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

/**
 * Caso de uso: Remover descuentos de campaña
 * 
 * Implementa la lógica completa para remover descuentos de una campaña:
 * 1. Verificar que la campaña existe
 * 2. Obtener productos con descuento de la campaña
 * 3. Restaurar precios originales en lotes de 100
 * 4. Limpiar campos de campaña en Product Service
 * 5. Eliminar registros de campaign_products
 * 6. Desactivar la campaña (is_active = false)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.3
 */
export class RemoveCampaignDiscounts {
  constructor(
    private campaignRepository: CampaignRepository,
    private campaignProductRepository: CampaignProductRepository,
    private productServiceClient: ProductServiceClient,
    private batchProcessor: BatchProcessor
  ) {}

  /**
   * Ejecuta el caso de uso
   * 
   * @param input - Datos de entrada
   * @returns Resultado de la remoción de descuentos
   */
  async execute(input: RemoveDiscountsInput): Promise<RemoveDiscountsOutput> {
    const startTime = Date.now()

    logger.info('Iniciando remoción de descuentos de campaña', {
      campaignId: input.campaignId
    })

    try {
      // 1. Verificar que la campaña existe
      const campaign = await this.campaignRepository.findById(input.campaignId)
      if (!campaign) {
        throw new CampaignNotFoundError(input.campaignId)
      }

      // 2. Obtener productos con descuento de la campaña
      // Requirement 4.1: Obtener productos con descuento de la campaña
      const campaignProducts = await this.getProductsWithDiscount(input.campaignId)

      // Si no hay productos con descuento, solo desactivar la campaña
      // Esto NO es un error, simplemente significa que la campaña no tiene descuentos aplicados
      if (campaignProducts.length === 0) {
        logger.info('No hay productos con descuento para remover', {
          campaignId: input.campaignId
        })

        // Desactivar la campaña aunque no tenga productos
        await this.deactivateCampaign(input.campaignId)

        const processingTime = (Date.now() - startTime) / 1000

        return {
          productsRestored: 0,
          processingTime
        }
      }

      logger.info('Productos con descuento encontrados', {
        campaignId: input.campaignId,
        count: campaignProducts.length
      })

      // 3-4. Procesar en lotes: restaurar precios y limpiar campos en Product Service
      // Requirement 4.5: Procesar productos en lotes de 100
      const productsRestored = await this.processProductsInBatches(
        campaignProducts,
        input.campaignId
      )

      // 5. Eliminar registros de campaign_products
      // Requirement 4.4: Eliminar registros de campaign_products
      await this.deleteCampaignProductRecords(input.campaignId)

      // 6. Desactivar la campaña
      await this.deactivateCampaign(input.campaignId)

      const processingTime = (Date.now() - startTime) / 1000

      logger.info('Descuentos de campaña removidos exitosamente', {
        campaignId: input.campaignId,
        productsRestored,
        processingTime
      })

      return {
        productsRestored,
        processingTime
      }
    } catch (error) {
      logger.error('Error al remover descuentos de campaña', {
        campaignId: input.campaignId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * Obtiene productos con descuento de la campaña
   * 
   * Requirement 4.1: Obtener productos con descuento de la campaña
   * 
   * @param campaignId - ID de la campaña
   * @returns Lista de productos en campaña
   */
  private async getProductsWithDiscount(campaignId: string): Promise<CampaignProduct[]> {
    try {
      const campaignProducts = await this.campaignProductRepository.findByCampaignId(
        campaignId
      )

      logger.debug('Productos con descuento obtenidos', {
        campaignId,
        count: campaignProducts.length
      })

      return campaignProducts
    } catch (error) {
      logger.error('Error al obtener productos con descuento', {
        campaignId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Procesa productos en lotes para restaurar precios
   * 
   * Requirement 4.2: Restaurar precios originales
   * Requirement 4.3: Limpiar campos de campaña en Product Service
   * Requirement 4.5: Procesar en lotes de 100
   * Requirement 6.3: Actualizar producto en Product Service removiendo campos de campaña
   * 
   * @param campaignProducts - Productos con descuento
   * @param campaignId - ID de la campaña
   * @returns Número de productos restaurados
   */
  private async processProductsInBatches(
    campaignProducts: CampaignProduct[],
    campaignId: string
  ): Promise<number> {
    // Procesar en lotes de 100
    const result = await this.batchProcessor.processBatch(
      campaignProducts,
      async (batch) => {
        // Para cada lote, preparar las actualizaciones
        const productUpdates: ProductUpdate[] = []

        for (const campaignProduct of batch) {
          // Requirement 4.2: Restaurar precio original
          // Requirement 4.3: Limpiar campos de campaña
          // Requirement 6.3: Remover campos de campaña en Product Service
          productUpdates.push({
            productId: campaignProduct.productId,
            data: {
              // Restaurar el precio original del producto
              our_price: campaignProduct.originalPrice,
              inCampaign: false,
              campaignId: undefined,
              campaignPrice: undefined,
              originalPrice: undefined,
              discountPercentage: undefined
            }
          })
        }

        // Actualizar Product Service en lote
        await this.productServiceClient.updateProductsBatch(productUpdates)

        logger.debug('Lote de productos restaurados', {
          campaignId,
          batchSize: batch.length
        })

        return batch
      },
      {
        batchSize: 100,
        continueOnError: false,
        onProgress: (processed, total) => {
          logger.debug('Progreso de remoción de descuentos', {
            campaignId,
            processed,
            total,
            percentage: Math.round((processed / total) * 100)
          })
        }
      }
    )

    return result.successCount
  }

  /**
   * Elimina registros de campaign_products
   * 
   * Requirement 4.4: Eliminar registros de campaign_products asociados
   * 
   * @param campaignId - ID de la campaña
   */
  private async deleteCampaignProductRecords(campaignId: string): Promise<void> {
    try {
      const deletedCount = await this.campaignProductRepository.deleteByCampaignId(
        campaignId
      )

      logger.info('Registros de campaign_products eliminados', {
        campaignId,
        deletedCount
      })
    } catch (error) {
      logger.error('Error al eliminar registros de campaign_products', {
        campaignId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Desactiva la campaña
   * 
   * Marca la campaña como inactiva (is_active = false) y actualiza discounts_applied = false
   * 
   * @param campaignId - ID de la campaña
   */
  private async deactivateCampaign(campaignId: string): Promise<void> {
    try {
      await this.campaignRepository.update(campaignId, {
        isActive: false,
        discountsApplied: false
      })

      logger.info('Campaña desactivada', {
        campaignId
      })
    } catch (error) {
      logger.error('Error al desactivar campaña', {
        campaignId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}
