/**
 * GetActiveCampaign - Caso de uso para obtener la campaña activa de mayor prioridad
 * 
 * Obtiene la campaña activa con la prioridad más alta, incluyendo su configuración
 * de frontend para sincronización con la interfaz de usuario.
 * 
 * Requirements: 1.4, 7.6, 8.1
 */

import { Campaign } from '../shared/models/Campaign'
import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { logger } from '../shared/utils/logger'

/**
 * Output del caso de uso
 */
export interface GetActiveCampaignOutput {
  campaign: Campaign | null
}

/**
 * Caso de uso: Obtener campaña activa de mayor prioridad
 * 
 * Requirement 1.4: Permitir múltiples campañas activas y aplicar la de mayor prioridad
 * Requirement 7.6: Exponer endpoint GET /api/campaigns/active para obtener campaña activa
 * Requirement 8.1: Incluir frontend_config con la configuración de visualización
 */
export class GetActiveCampaign {
  constructor(private campaignRepository: ICampaignRepository) {}

  /**
   * Ejecuta el caso de uso
   * 
   * Obtiene todas las campañas activas y retorna la de mayor prioridad.
   * Si no hay campañas activas, retorna null.
   * 
   * @returns Campaña activa de mayor prioridad o null si no hay campañas activas
   */
  async execute(): Promise<GetActiveCampaignOutput> {
    logger.info('Obteniendo campaña activa de mayor prioridad')

    // Obtener todas las campañas activas ordenadas por prioridad descendente
    // El repositorio ya las ordena por prioridad (Requirement 1.4)
    const activeCampaigns = await this.campaignRepository.findActive()

    // Si no hay campañas activas, retornar null
    if (activeCampaigns.length === 0) {
      logger.info('No hay campañas activas')
      return { campaign: null }
    }

    // La primera campaña es la de mayor prioridad (ya ordenadas por el repositorio)
    const campaign = activeCampaigns[0]

    logger.info('Campaña activa obtenida exitosamente', {
      campaignId: campaign.id,
      name: campaign.name,
      priority: campaign.priority,
      hasFrontendConfig: !!campaign.frontendConfig
    })

    // El objeto Campaign ya incluye frontendConfig (Requirement 8.1)
    return { campaign }
  }
}
