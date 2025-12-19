/**
 * CreateCampaign Use Case
 * 
 * Caso de uso para crear una nueva campaña promocional.
 * 
 * Implementa los requisitos:
 * - 1.1: Almacenar campaña con nombre, fechas, prioridad y reglas
 * - 1.2: Validar fechas coherentes y reglas válidas
 * - 10.1: Validar fecha de inicio anterior a fecha de fin
 * - 10.2: Validar fechas no en el pasado
 * - 10.3: Validar nombre único
 * - 10.4: Validar prioridad entero positivo
 * - 12.1: Registrar operación en logs
 */

import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignValidator } from '../shared/utils/validators'
import { logger } from '../shared/utils/logger'
import { Campaign } from '../shared/models/Campaign'
import { CreateCampaignData } from '../shared/types'

/**
 * Input para el caso de uso CreateCampaign
 */
export interface CreateCampaignInput {
  name: string
  slug: string
  startDate: Date
  endDate: Date
  priority: number
  discountRules: any
  frontendConfig: any
}

/**
 * Output del caso de uso CreateCampaign
 */
export interface CreateCampaignOutput {
  id: string
  campaign: Campaign
}

/**
 * Error personalizado para campaña duplicada
 */
export class DuplicateCampaignNameError extends Error {
  constructor(name: string) {
    super(`Ya existe una campaña con el nombre "${name}"`)
    this.name = 'DuplicateCampaignNameError'
  }
}

/**
 * Error personalizado para validación de campaña
 */
export class CampaignValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Errores de validación: ${errors.join(', ')}`)
    this.name = 'CampaignValidationError'
  }
}

/**
 * Caso de uso para crear una nueva campaña
 * 
 * Este caso de uso encapsula toda la lógica de negocio para crear campañas,
 * incluyendo validaciones, verificación de unicidad y persistencia.
 */
export class CreateCampaign {
  constructor(
    private campaignRepository: ICampaignRepository,
    private validator: CampaignValidator
  ) {}

  /**
   * Ejecuta el caso de uso de creación de campaña
   * 
   * @param input - Datos de la campaña a crear
   * @returns Campaña creada con su ID
   * @throws {CampaignValidationError} Si los datos no son válidos
   * @throws {DuplicateCampaignNameError} Si ya existe una campaña con ese nombre
   */
  async execute(input: CreateCampaignInput): Promise<CreateCampaignOutput> {
    logger.info('Iniciando creación de campaña', {
      operation: 'create_campaign',
      campaignName: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      priority: input.priority
    })

    try {
      // Paso 1: Sanitizar datos de entrada (Requisito 10.7)
      const sanitizedData = this.validator.sanitizeCampaignData(input)

      // Paso 2: Validar datos de entrada (Requisitos 10.1, 10.2, 10.4, 10.5, 10.6)
      const validationResult = this.validator.validateCampaignData(sanitizedData)
      
      if (!validationResult.isValid) {
        logger.warn('Validación de campaña fallida', {
          operation: 'create_campaign',
          campaignName: input.name,
          errors: validationResult.errors
        })
        throw new CampaignValidationError(validationResult.errors)
      }

      // Paso 3: Verificar unicidad del nombre (Requisito 10.3)
      const existingCampaignByName = await this.campaignRepository.findByName(sanitizedData.name)
      
      if (existingCampaignByName) {
        logger.warn('Intento de crear campaña con nombre duplicado', {
          operation: 'create_campaign',
          campaignName: sanitizedData.name
        })
        throw new DuplicateCampaignNameError(sanitizedData.name)
      }

      // Paso 4: Verificar unicidad del slug
      const existingCampaignBySlug = await this.campaignRepository.findBySlug(sanitizedData.slug)
      
      if (existingCampaignBySlug) {
        logger.warn('Intento de crear campaña con slug duplicado', {
          operation: 'create_campaign',
          slug: sanitizedData.slug
        })
        throw new Error(`Ya existe una campaña con el slug "${sanitizedData.slug}"`)
      }

      // Paso 5: Crear campaña en base de datos (Requisito 1.1)
      const campaign = await this.campaignRepository.create(sanitizedData)

      // Paso 6: Registrar operación exitosa en logs (Requisito 12.1)
      logger.info('Campaña creada exitosamente', {
        operation: 'create_campaign',
        campaignId: campaign.id,
        campaignName: campaign.name,
        slug: campaign.slug,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        priority: campaign.priority,
        hasGlobalDiscount: !!campaign.discountRules.global,
        hasCategoryDiscounts: !!campaign.discountRules.categories,
        hasProductDiscounts: !!campaign.discountRules.products
      })

      return {
        id: campaign.id,
        campaign
      }
    } catch (error) {
      // Si es un error conocido, re-lanzarlo
      if (error instanceof CampaignValidationError || 
          error instanceof DuplicateCampaignNameError) {
        throw error
      }

      // Para errores desconocidos, registrar y re-lanzar
      logger.error('Error al crear campaña', {
        operation: 'create_campaign',
        campaignName: input.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      throw error
    }
  }
}

