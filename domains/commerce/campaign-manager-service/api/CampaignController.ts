/**
 * CampaignController - Controlador HTTP para el Campaign Manager Service
 * 
 * Maneja todas las peticiones HTTP relacionadas con campañas promocionales,
 * delegando la lógica de negocio a los casos de uso correspondientes.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10
 */

import { Request, Response } from 'express'
import { CreateCampaign } from '../create-campaign/CreateCampaign'
import { UpdateCampaign } from '../update-campaign/UpdateCampaign'
import { DeleteCampaign } from '../delete-campaign/DeleteCampaign'
import { GetCampaign } from '../get-campaign/GetCampaign'
import { ListCampaigns } from '../list-campaigns/ListCampaigns'
import { GetActiveCampaign } from '../get-active-campaign/GetActiveCampaign'
import { ApplyCampaignDiscounts } from '../apply-campaign-discounts/ApplyCampaignDiscounts'
import { RemoveCampaignDiscounts } from '../remove-campaign-discounts/RemoveCampaignDiscounts'
import { GetCampaignAnalytics } from '../get-campaign-analytics/GetCampaignAnalytics'
import { logger } from '../shared/utils/logger'
import { CampaignFilters } from '../shared/types'

/**
 * Controlador de campañas
 * 
 * Implementa todos los endpoints REST para gestión de campañas,
 * manejando errores y retornando códigos HTTP apropiados.
 */
export class CampaignController {
  constructor(
    private createCampaign: CreateCampaign,
    private updateCampaign: UpdateCampaign,
    private deleteCampaign: DeleteCampaign,
    private getCampaign: GetCampaign,
    private listCampaigns: ListCampaigns,
    private getActiveCampaign: GetActiveCampaign,
    private applyCampaignDiscounts: ApplyCampaignDiscounts,
    private removeCampaignDiscounts: RemoveCampaignDiscounts,
    private getCampaignAnalytics: GetCampaignAnalytics
  ) {}

  /**
   * POST /api/campaigns - Crear campaña
   * 
   * Requirement 7.1: Exponer endpoint POST /api/campaigns para crear campañas
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        slug,
        startDate,
        endDate,
        priority,
        discountRules,
        frontendConfig
      } = req.body

      // Validar campos requeridos
      if (!name || !slug || !startDate || !endDate || !priority || !discountRules || !frontendConfig) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Faltan campos requeridos: name, slug, startDate, endDate, priority, discountRules, frontendConfig'
        })
        return
      }

      // Convertir fechas de string a Date
      const parsedStartDate = new Date(startDate)
      const parsedEndDate = new Date(endDate)

      // Validar que las fechas sean válidas
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Las fechas proporcionadas no son válidas'
        })
        return
      }

      // Ejecutar caso de uso
      const result = await this.createCampaign.execute({
        name,
        slug,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        priority,
        discountRules,
        frontendConfig
      })

      // Retornar 201 Created con la campaña creada
      res.status(201).json(result.campaign)
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * GET /api/campaigns - Listar campañas
   * 
   * Requirement 7.2: Exponer endpoint GET /api/campaigns para listar todas las campañas
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      // Construir filtros desde query params
      const filters: CampaignFilters = {}

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true'
      }

      if (req.query.minPriority) {
        filters.minPriority = parseInt(req.query.minPriority as string, 10)
      }

      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10)
      }

      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string, 10)
      }

      // Ejecutar caso de uso
      const result = await this.listCampaigns.execute({ filters })

      // Retornar 200 OK con la lista de campañas
      res.status(200).json({
        campaigns: result.campaigns,
        total: result.total
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * GET /api/campaigns/:id - Obtener campaña específica
   * 
   * Requirement 7.3: Exponer endpoint GET /api/campaigns/:id para obtener una campaña específica
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ID de campaña requerido'
        })
        return
      }

      // Ejecutar caso de uso
      const result = await this.getCampaign.execute({ campaignId: id })

      // Retornar 200 OK con la campaña
      res.status(200).json(result.campaign)
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * PUT /api/campaigns/:id - Actualizar campaña
   * 
   * Requirement 7.4: Exponer endpoint PUT /api/campaigns/:id para actualizar una campaña
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const {
        name,
        slug,
        startDate,
        endDate,
        priority,
        discountRules,
        frontendConfig
      } = req.body

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ID de campaña requerido'
        })
        return
      }

      // Construir input con solo los campos proporcionados
      const input: any = { id }

      if (name !== undefined) input.name = name
      if (slug !== undefined) input.slug = slug
      if (priority !== undefined) input.priority = priority
      if (discountRules !== undefined) input.discountRules = discountRules
      if (frontendConfig !== undefined) input.frontendConfig = frontendConfig

      // Convertir fechas si se proporcionan
      if (startDate !== undefined) {
        const parsedStartDate = new Date(startDate)
        if (isNaN(parsedStartDate.getTime())) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'La fecha de inicio no es válida'
          })
          return
        }
        input.startDate = parsedStartDate
      }

      if (endDate !== undefined) {
        const parsedEndDate = new Date(endDate)
        if (isNaN(parsedEndDate.getTime())) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'La fecha de fin no es válida'
          })
          return
        }
        input.endDate = parsedEndDate
      }

      // Ejecutar caso de uso
      const result = await this.updateCampaign.execute(input)

      // Retornar 200 OK con la campaña actualizada
      res.status(200).json(result.campaign)
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * DELETE /api/campaigns/:id - Eliminar campaña
   * 
   * Requirement 7.5: Exponer endpoint DELETE /api/campaigns/:id para eliminar una campaña
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ID de campaña requerido'
        })
        return
      }

      // Ejecutar caso de uso
      const result = await this.deleteCampaign.execute({ id })

      // Retornar 200 OK con el resultado
      res.status(200).json(result)
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * GET /api/campaigns/active - Obtener campaña activa de mayor prioridad
   * 
   * Requirement 7.6: Exponer endpoint GET /api/campaigns/active para obtener campaña activa
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      // Ejecutar caso de uso
      const result = await this.getActiveCampaign.execute()

      // Retornar 200 OK siempre (con campaña o null)
      // Esto evita errores 404 en la consola del navegador cuando no hay campañas
      res.status(200).json(result.campaign)
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * POST /api/campaigns/:id/apply-discounts - Aplicar descuentos manualmente
   * 
   * Requirement 7.7: Exponer endpoint POST /api/campaigns/:id/apply-discounts
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async applyDiscounts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ID de campaña requerido'
        })
        return
      }

      // Ejecutar caso de uso
      const result = await this.applyCampaignDiscounts.execute({ campaignId: id })

      // Retornar 200 OK con las estadísticas
      res.status(200).json({
        success: true,
        productsAffected: result.productsAffected,
        totalDiscountAmount: result.totalDiscountAmount,
        averageDiscountPercentage: result.averageDiscountPercentage,
        processingTime: result.processingTime
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * POST /api/campaigns/:id/remove-discounts - Remover descuentos manualmente
   * 
   * Requirement 7.8: Exponer endpoint POST /api/campaigns/:id/remove-discounts
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async removeDiscounts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ID de campaña requerido'
        })
        return
      }

      // Ejecutar caso de uso
      const result = await this.removeCampaignDiscounts.execute({ campaignId: id })

      // Retornar 200 OK con las estadísticas
      res.status(200).json({
        success: true,
        productsRestored: result.productsRestored,
        processingTime: result.processingTime
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * GET /api/campaigns/:id/analytics - Obtener analytics de campaña
   * 
   * Requirement 9.5: Exponer endpoint GET /api/campaigns/:id/analytics
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * 
   * @param req - Request de Express
   * @param res - Response de Express
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ID de campaña requerido'
        })
        return
      }

      // Ejecutar caso de uso
      const result = await this.getCampaignAnalytics.execute({ campaignId: id })

      // Retornar 200 OK con las métricas
      res.status(200).json(result)
    } catch (error) {
      this.handleError(error, res)
    }
  }

  /**
   * Maneja errores y retorna códigos HTTP apropiados
   * 
   * Requirement 7.10: Retornar códigos HTTP apropiados
   * - 200: Éxito
   * - 400: Validación
   * - 401: No autorizado
   * - 404: No encontrado
   * - 409: Conflicto (nombre duplicado)
   * - 500: Error del servidor
   * 
   * @param error - Error capturado
   * @param res - Response de Express
   */
  private handleError(error: unknown, res: Response): void {
    // Log del error
    logger.error('Error en controlador de campañas', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Si es un error conocido, retornar código apropiado
    if (error instanceof Error) {
      // Errores de validación - 400 Bad Request
      if (
        error.name === 'CampaignValidationError' ||
        error.name === 'CampaignUpdateValidationError' ||
        error.name === 'InvalidDiscountRuleError'
      ) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message
        })
        return
      }

      // Errores de no encontrado - 404 Not Found
      if (error.name === 'CampaignNotFoundError') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message
        })
        return
      }

      // Errores de conflicto - 409 Conflict
      if (
        error.name === 'DuplicateCampaignNameError' ||
        error.name === 'DuplicateCampaignSlugError'
      ) {
        res.status(409).json({
          error: 'Conflict',
          message: error.message
        })
        return
      }

      // Errores de servicio externo - 503 Service Unavailable
      if (error.name === 'ProductServiceUnavailableError') {
        res.status(503).json({
          error: 'Service Unavailable',
          message: error.message
        })
        return
      }
    }

    // Error genérico - 500 Internal Server Error
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error al procesar la solicitud'
    })
  }
}
