/**
 * GetCampaign - Caso de uso para obtener una campaña por ID
 * 
 * Obtiene los detalles completos de una campaña específica.
 * 
 * Requirements: 7.3
 */

import { Campaign } from '../shared/models/Campaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { logger } from '../shared/utils/logger'

/**
 * Input para obtener una campaña
 */
export interface GetCampaignInput {
  campaignId: string
}

/**
 * Output del caso de uso
 */
export interface GetCampaignOutput {
  campaign: Campaign
}

/**
 * Error cuando la campaña no se encuentra
 */
export class CampaignNotFoundError extends Error {
  constructor(campaignId: string) {
    super(`Campaña con ID ${campaignId} no encontrada`)
    this.name = 'CampaignNotFoundError'
  }
}

/**
 * Caso de uso: Obtener campaña por ID
 * 
 * Requirement 7.3: Exponer endpoint GET /api/campaigns/:id para obtener una campaña específica
 */
export class GetCampaign {
  constructor(private campaignRepository: ICampaignRepository) {}

  /**
   * Ejecuta el caso de uso
   * 
   * @param input - Datos de entrada con el ID de la campaña
   * @returns Campaña encontrada
   * @throws CampaignNotFoundError si la campaña no existe
   */
  async execute(input: GetCampaignInput): Promise<GetCampaignOutput> {
    const { campaignId } = input

    logger.info('Obteniendo campaña', { campaignId })

    // Buscar campaña por ID
    const campaign = await this.campaignRepository.findById(campaignId)

    if (!campaign) {
      logger.warn('Campaña no encontrada', { campaignId })
      throw new CampaignNotFoundError(campaignId)
    }

    logger.info('Campaña obtenida exitosamente', {
      campaignId,
      name: campaign.name,
      isActive: campaign.isActive
    })

    return { campaign }
  }
}
