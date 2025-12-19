/**
 * ListCampaigns - Caso de uso para listar campañas
 * 
 * Lista todas las campañas con filtros opcionales y ordenamiento.
 * Por defecto, las campañas se ordenan por prioridad descendente.
 * 
 * Requirements: 1.5, 7.2
 */

import { Campaign } from '../shared/models/Campaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignFilters } from '../shared/types'
import { logger } from '../shared/utils/logger'

/**
 * Input para listar campañas
 */
export interface ListCampaignsInput {
  filters?: CampaignFilters
}

/**
 * Output del caso de uso
 */
export interface ListCampaignsOutput {
  campaigns: Campaign[]
  total: number
}

/**
 * Caso de uso: Listar campañas
 * 
 * Requirement 1.5: Retornar campañas ordenadas por prioridad descendente
 * Requirement 7.2: Exponer endpoint GET /api/campaigns para listar todas las campañas
 */
export class ListCampaigns {
  constructor(private campaignRepository: ICampaignRepository) {}

  /**
   * Ejecuta el caso de uso
   * 
   * @param input - Filtros opcionales para la consulta
   * @returns Lista de campañas que cumplen los filtros
   */
  async execute(input: ListCampaignsInput = {}): Promise<ListCampaignsOutput> {
    const { filters } = input

    logger.info('Listando campañas', { filters })

    // Obtener campañas con filtros
    // Por defecto se ordenan por prioridad descendente (Requirement 1.5)
    const campaigns = await this.campaignRepository.findAll(filters)

    logger.info('Campañas listadas exitosamente', {
      count: campaigns.length,
      filters
    })

    return {
      campaigns,
      total: campaigns.length
    }
  }
}
