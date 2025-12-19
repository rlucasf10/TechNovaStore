/**
 * UpdateCampaign Use Case
 * 
 * Caso de uso para actualizar una campaña promocional existente.
 * 
 * Implementa los requisitos:
 * - 1.2: Validar que las fechas sean coherentes y las reglas sean válidas
 * - 12.1: Registrar operación en logs
 */

import { ICampaignRepository } from '../shared/repositories/CampaignRepository'
import { CampaignValidator } from '../shared/utils/validators'
import { logger } from '../shared/utils/logger'
import { Campaign } from '../shared/models/Campaign'
import { DiscountRules, FrontendConfig } from '../shared/types'

/**
 * Input para el caso de uso UpdateCampaign
 */
export interface UpdateCampaignInput {
  id: string
  name?: string
  slug?: string
  startDate?: Date
  endDate?: Date
  priority?: number
  discountRules?: DiscountRules
  frontendConfig?: FrontendConfig
}

/**
 * Output del caso de uso UpdateCampaign
 */
export interface UpdateCampaignOutput {
  campaign: Campaign
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
 * Error personalizado para validación de actualización de campaña
 */
export class CampaignUpdateValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Errores de validación en actualización: ${errors.join(', ')}`)
    this.name = 'CampaignUpdateValidationError'
  }
}

/**
 * Error personalizado para nombre duplicado
 */
export class DuplicateCampaignNameError extends Error {
  constructor(name: string) {
    super(`Ya existe otra campaña con el nombre "${name}"`)
    this.name = 'DuplicateCampaignNameError'
  }
}

/**
 * Error personalizado para slug duplicado
 */
export class DuplicateCampaignSlugError extends Error {
  constructor(slug: string) {
    super(`Ya existe otra campaña con el slug "${slug}"`)
    this.name = 'DuplicateCampaignSlugError'
  }
}

/**
 * Caso de uso para actualizar una campaña existente
 * 
 * Este caso de uso encapsula toda la lógica de negocio para actualizar campañas,
 * incluyendo validaciones, verificación de existencia y persistencia.
 */
export class UpdateCampaign {
  constructor(
    private campaignRepository: ICampaignRepository,
    private validator: CampaignValidator
  ) {}

  /**
   * Ejecuta el caso de uso de actualización de campaña
   * 
   * @param input - Datos de la campaña a actualizar
   * @returns Campaña actualizada
   * @throws {CampaignNotFoundError} Si la campaña no existe
   * @throws {CampaignUpdateValidationError} Si los datos no son válidos
   * @throws {DuplicateCampaignNameError} Si el nuevo nombre ya existe
   * @throws {DuplicateCampaignSlugError} Si el nuevo slug ya existe
   */
  async execute(input: UpdateCampaignInput): Promise<UpdateCampaignOutput> {
    logger.info('Iniciando actualización de campaña', {
      operation: 'update_campaign',
      campaignId: input.id,
      fieldsToUpdate: Object.keys(input).filter(k => k !== 'id' && input[k as keyof UpdateCampaignInput] !== undefined)
    })

    try {
      // Paso 1: Verificar que la campaña existe (Requisito 1.2)
      const existingCampaign = await this.campaignRepository.findById(input.id)
      
      if (!existingCampaign) {
        logger.warn('Intento de actualizar campaña inexistente', {
          operation: 'update_campaign',
          campaignId: input.id
        })
        throw new CampaignNotFoundError(input.id)
      }

      // Paso 2: Sanitizar datos de entrada
      const sanitizedData = this.sanitizeUpdateData(input)

      // Paso 3: Validar datos de actualización (Requisito 1.2)
      const validationResult = this.validateUpdateData(
        sanitizedData,
        existingCampaign
      )
      
      if (!validationResult.isValid) {
        logger.warn('Validación de actualización de campaña fallida', {
          operation: 'update_campaign',
          campaignId: input.id,
          errors: validationResult.errors
        })
        throw new CampaignUpdateValidationError(validationResult.errors)
      }

      // Paso 4: Verificar unicidad del nombre si se está actualizando
      if (sanitizedData.name && sanitizedData.name !== existingCampaign.name) {
        const campaignWithSameName = await this.campaignRepository.findByName(sanitizedData.name)
        
        if (campaignWithSameName && campaignWithSameName.id !== input.id) {
          logger.warn('Intento de actualizar campaña con nombre duplicado', {
            operation: 'update_campaign',
            campaignId: input.id,
            newName: sanitizedData.name
          })
          throw new DuplicateCampaignNameError(sanitizedData.name)
        }
      }

      // Paso 5: Verificar unicidad del slug si se está actualizando
      if (sanitizedData.slug && sanitizedData.slug !== existingCampaign.slug) {
        const campaignWithSameSlug = await this.campaignRepository.findBySlug(sanitizedData.slug)
        
        if (campaignWithSameSlug && campaignWithSameSlug.id !== input.id) {
          logger.warn('Intento de actualizar campaña con slug duplicado', {
            operation: 'update_campaign',
            campaignId: input.id,
            newSlug: sanitizedData.slug
          })
          throw new DuplicateCampaignSlugError(sanitizedData.slug)
        }
      }

      // Paso 6: Actualizar campaña en base de datos
      const updatedCampaign = await this.campaignRepository.update(
        input.id,
        sanitizedData
      )

      // Paso 7: Registrar operación exitosa en logs (Requisito 12.1)
      logger.info('Campaña actualizada exitosamente', {
        operation: 'update_campaign',
        campaignId: updatedCampaign.id,
        campaignName: updatedCampaign.name,
        updatedFields: Object.keys(sanitizedData)
      })

      return {
        campaign: updatedCampaign
      }
    } catch (error) {
      // Si es un error conocido, re-lanzarlo
      if (
        error instanceof CampaignNotFoundError ||
        error instanceof CampaignUpdateValidationError ||
        error instanceof DuplicateCampaignNameError ||
        error instanceof DuplicateCampaignSlugError
      ) {
        throw error
      }

      // Para errores desconocidos, registrar y re-lanzar
      logger.error('Error al actualizar campaña', {
        operation: 'update_campaign',
        campaignId: input.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      throw error
    }
  }

  /**
   * Sanitiza los datos de actualización
   * 
   * @param input - Datos de entrada
   * @returns Datos sanitizados
   */
  private sanitizeUpdateData(input: UpdateCampaignInput): Partial<Campaign> {
    const sanitized: Partial<Campaign> = {}

    if (input.name !== undefined) {
      sanitized.name = this.validator.sanitizeString(input.name)
    }

    if (input.slug !== undefined) {
      sanitized.slug = this.validator.sanitizeString(input.slug)
    }

    if (input.startDate !== undefined) {
      sanitized.startDate = input.startDate
    }

    if (input.endDate !== undefined) {
      sanitized.endDate = input.endDate
    }

    if (input.priority !== undefined) {
      sanitized.priority = input.priority
    }

    if (input.discountRules !== undefined) {
      sanitized.discountRules = input.discountRules
    }

    if (input.frontendConfig !== undefined) {
      sanitized.frontendConfig = this.validator.sanitizeObject(input.frontendConfig)
    }

    return sanitized
  }

  /**
   * Valida los datos de actualización
   * 
   * @param data - Datos sanitizados a validar
   * @param existingCampaign - Campaña existente
   * @returns Resultado de la validación
   */
  private validateUpdateData(
    data: Partial<Campaign>,
    existingCampaign: Campaign
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar nombre si se está actualizando
    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string') {
        errors.push('El nombre de la campaña es requerido')
      } else if (data.name.trim().length < 3) {
        errors.push('El nombre de la campaña debe tener al menos 3 caracteres')
      } else if (data.name.length > 255) {
        errors.push('El nombre de la campaña no puede exceder 255 caracteres')
      }
    }

    // Validar slug si se está actualizando
    if (data.slug !== undefined) {
      if (!data.slug || typeof data.slug !== 'string') {
        errors.push('El slug de la campaña es requerido')
      } else if (data.slug.trim().length < 3) {
        errors.push('El slug de la campaña debe tener al menos 3 caracteres')
      } else if (data.slug.length > 255) {
        errors.push('El slug de la campaña no puede exceder 255 caracteres')
      } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
        errors.push('El slug solo puede contener letras minúsculas, números y guiones')
      }
    }

    // Validar fechas si se están actualizando (Requisito 1.2)
    const startDate = data.startDate ?? existingCampaign.startDate
    const endDate = data.endDate ?? existingCampaign.endDate

    if (startDate >= endDate) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin')
    }

    // Validar prioridad si se está actualizando
    if (data.priority !== undefined) {
      if (typeof data.priority !== 'number') {
        errors.push('La prioridad debe ser un número')
      } else if (!Number.isInteger(data.priority)) {
        errors.push('La prioridad debe ser un número entero')
      } else if (data.priority < 1) {
        errors.push('La prioridad debe ser un número positivo mayor que 0')
      }
    }

    // Validar reglas de descuento si se están actualizando (Requisito 1.2)
    if (data.discountRules !== undefined) {
      const rulesValidation = this.validator.validateDiscountRules(data.discountRules)
      if (!rulesValidation.isValid) {
        errors.push(...rulesValidation.errors)
      }
    }

    // Validar configuración de frontend si se está actualizando
    if (data.frontendConfig !== undefined) {
      const configValidation = this.validator.validateFrontendConfig(data.frontendConfig)
      if (!configValidation.isValid) {
        errors.push(...configValidation.errors)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
