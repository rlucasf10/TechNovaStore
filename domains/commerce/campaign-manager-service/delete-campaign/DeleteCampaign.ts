/**
 * DeleteCampaign Use Case
 * 
 * Caso de uso para eliminar una campaña promocional.
 * 
 * Implementa los requisitos:
 * - 1.3: Remover todos los descuentos aplicados antes de eliminar la campaña
 * - 12.1: Registrar operación en logs
 */

import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { ICampaignProductRepository } from '../shared/repositories/CampaignProductRepository'
import { ProductServiceClient } from '../shared/clients/ProductServiceClient'
import { logger } from '../shared/utils/logger'
import { Campaign } from '../shared/models/Campaign'

/**
 * Input para el caso de uso DeleteCampaign
 */
export interface DeleteCampaignInput {
  id: string
}

/**
 * Output del caso de uso DeleteCampaign
 */
export interface DeleteCampaignOutput {
  success: boolean
  productsRestored?: number
}

/**
 * Error personalizado para campaña no encontrada
 */
export class CampaignNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró la campaña con ID "${id}"`)
    this.name = 'CampaignNotFoundError'
  }
}

/**
 * Caso de uso para eliminar una campaña
 * 
 * Este caso de uso encapsula toda la lógica de negocio para eliminar campañas,
 * incluyendo la remoción de descuentos si la campaña está activa.
 */
export class DeleteCampaign {
  constructor(
    private campaignRepository: ICampaignRepository,
    private campaignProductRepository: ICampaignProductRepository,
    private productServiceClient: ProductServiceClient
  ) {}

  /**
   * Ejecuta el caso de uso de eliminación de campaña
   * 
   * Requirement 1.3: Si la campaña está activa, remover descuentos primero
   * Requirement 12.1: Registrar operación en logs
   * 
   * @param input - ID de la campaña a eliminar
   * @returns Resultado de la operación
   * @throws {CampaignNotFoundError} Si la campaña no existe
   */
  async execute(input: DeleteCampaignInput): Promise<DeleteCampaignOutput> {
    logger.info('Iniciando eliminación de campaña', {
      operation: 'delete_campaign',
      campaignId: input.id
    })

    try {
      // Paso 1: Verificar que la campaña existe
      const campaign = await this.campaignRepository.findById(input.id)
      
      if (!campaign) {
        logger.warn('Intento de eliminar campaña inexistente', {
          operation: 'delete_campaign',
          campaignId: input.id
        })
        throw new CampaignNotFoundError(input.id)
      }

      let productsRestored = 0

      // Paso 2: Si la campaña está activa o tiene descuentos aplicados, removerlos primero
      // Requirement 1.3: Remover todos los descuentos aplicados antes de eliminar
      if (campaign.isActive || campaign.discountsApplied) {
        logger.info('Campaña activa o con descuentos aplicados, removiendo descuentos', {
          operation: 'delete_campaign',
          campaignId: input.id,
          campaignName: campaign.name,
          isActive: campaign.isActive,
          discountsApplied: campaign.discountsApplied
        })

        productsRestored = await this.removeDiscounts(campaign)

        logger.info('Descuentos removidos exitosamente', {
          operation: 'delete_campaign',
          campaignId: input.id,
          productsRestored
        })
      }

      // Paso 3: Eliminar la campaña de la base de datos
      await this.campaignRepository.delete(input.id)

      // Paso 4: Registrar operación exitosa en logs (Requirement 12.1)
      logger.info('Campaña eliminada exitosamente', {
        operation: 'delete_campaign',
        campaignId: input.id,
        campaignName: campaign.name,
        wasActive: campaign.isActive,
        productsRestored
      })

      return {
        success: true,
        productsRestored: productsRestored > 0 ? productsRestored : undefined
      }
    } catch (error) {
      // Si es un error conocido, re-lanzarlo
      if (error instanceof CampaignNotFoundError) {
        throw error
      }

      // Para errores desconocidos, registrar y re-lanzar
      logger.error('Error al eliminar campaña', {
        operation: 'delete_campaign',
        campaignId: input.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      throw error
    }
  }

  /**
   * Remueve los descuentos de una campaña
   * 
   * Esta función implementa la lógica de remoción de descuentos inline
   * hasta que se implemente el caso de uso RemoveCampaignDiscounts.
   * 
   * @param campaign - Campaña cuyos descuentos se van a remover
   * @returns Número de productos restaurados
   */
  private async removeDiscounts(campaign: Campaign): Promise<number> {
    try {
      // Obtener todos los productos con descuento de esta campaña
      const campaignProducts = await this.campaignProductRepository.findByCampaignId(campaign.id)

      if (campaignProducts.length === 0) {
        logger.info('No hay productos con descuento para esta campaña', {
          campaignId: campaign.id
        })
        return 0
      }

      logger.info('Restaurando precios originales de productos', {
        campaignId: campaign.id,
        productsCount: campaignProducts.length
      })

      // Procesar productos en lotes de 100 (Requirement 4.5)
      const BATCH_SIZE = 100
      let totalRestored = 0

      for (let i = 0; i < campaignProducts.length; i += BATCH_SIZE) {
        const batch = campaignProducts.slice(i, i + BATCH_SIZE)
        
        // Restaurar precios en el Product Service
        const updates = batch.map(cp => ({
          productId: cp.productId,
          data: {
            // Restaurar el precio original del producto
            ourPrice: cp.originalPrice,
            inCampaign: false,
            campaignId: undefined,
            campaignPrice: undefined,
            originalPrice: undefined,
            discountPercentage: undefined
          }
        }))

        // Actualizar productos en lote
        await this.productServiceClient.updateProductsBatch(updates)

        totalRestored += batch.length

        logger.debug('Lote de productos restaurados', {
          campaignId: campaign.id,
          batchSize: batch.length,
          totalRestored
        })
      }

      // Eliminar registros de campaign_products (Requirement 4.4)
      await this.campaignProductRepository.deleteByCampaignId(campaign.id)

      // Actualizar estado de la campaña
      await this.campaignRepository.update(campaign.id, {
        isActive: false,
        discountsApplied: false,
        deactivatedAt: new Date()
      })

      return totalRestored
    } catch (error) {
      logger.error('Error al remover descuentos durante eliminación', {
        campaignId: campaign.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}
