/**
 * Routes - Configuración de rutas HTTP para el Campaign Manager Service
 * 
 * Define todos los endpoints REST del servicio y los conecta con el controlador.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 9.5, 7.9, 10.8, 10.9, 10.10, 12.1
 */

import { Router } from 'express'
import { CampaignController } from './CampaignController'
import {
  authenticateJWT,
  defaultRateLimiter,
  combinedAuditLogger,
} from '../shared/middleware'

/**
 * Crea y configura el router de campañas
 * 
 * @param controller - Instancia del controlador de campañas
 * @returns Router configurado con todos los endpoints
 */
export function createCampaignRoutes(controller: CampaignController): Router {
  const router = Router()

  // Aplicar rate limiting a todas las rutas
  // Requirement 10.10: Límite de 100 requests por minuto por IP
  router.use(defaultRateLimiter)

  /**
   * POST /api/campaigns - Crear campaña
   * 
   * Requirement 7.1: Exponer endpoint POST /api/campaigns para crear campañas
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * Requirement 10.9: Registrar operaciones administrativas con usuario
   * Requirement 12.1: Registrar cada campaña creada
   * 
   * Body:
   * {
   *   name: string,
   *   slug: string,
   *   startDate: string (ISO 8601),
   *   endDate: string (ISO 8601),
   *   priority: number,
   *   discountRules: DiscountRules,
   *   frontendConfig: FrontendConfig
   * }
   * 
   * Response: 201 Created
   * {
   *   id: string,
   *   name: string,
   *   ...
   * }
   */
  router.post('/campaigns', authenticateJWT, combinedAuditLogger, (req, res) => 
    controller.create(req, res)
  )

  /**
   * GET /api/campaigns - Listar campañas
   * 
   * Requirement 7.2: Exponer endpoint GET /api/campaigns para listar todas las campañas
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * 
   * Query params:
   * - isActive: boolean (opcional)
   * - minPriority: number (opcional)
   * - limit: number (opcional)
   * - offset: number (opcional)
   * 
   * Response: 200 OK
   * {
   *   campaigns: Campaign[],
   *   total: number
   * }
   * 
   * Response: 401 Unauthorized (si no hay token válido)
   */
  router.get('/campaigns', authenticateJWT, (req, res) => controller.list(req, res))

  /**
   * GET /api/campaigns/active - Obtener campaña activa de mayor prioridad
   * 
   * Requirement 7.6: Exponer endpoint GET /api/campaigns/active para obtener campaña activa
   * Requirement 7.9: Este endpoint NO requiere autenticación (público)
   * 
   * IMPORTANTE: Esta ruta debe estar ANTES de /campaigns/:id para evitar
   * que "active" sea interpretado como un ID
   * 
   * NOTA: Este es el ÚNICO endpoint que NO requiere autenticación, ya que
   * el frontend público necesita acceder a la campaña activa para mostrarla.
   * 
   * Response: 200 OK
   * {
   *   id: string,
   *   name: string,
   *   frontendConfig: FrontendConfig,
   *   ...
   * }
   * 
   * Response: 404 Not Found (si no hay campañas activas)
   * {
   *   error: "Not Found",
   *   message: "No hay campañas activas en este momento"
   * }
   */
  router.get('/campaigns/active', (req, res) => controller.getActive(req, res))

  /**
   * GET /api/campaigns/:id - Obtener campaña específica
   * 
   * Requirement 7.3: Exponer endpoint GET /api/campaigns/:id para obtener una campaña específica
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * 
   * Params:
   * - id: string (UUID de la campaña)
   * 
   * Response: 200 OK
   * {
   *   id: string,
   *   name: string,
   *   ...
   * }
   * 
   * Response: 401 Unauthorized (si no hay token válido)
   * Response: 404 Not Found (si la campaña no existe)
   */
  router.get('/campaigns/:id', authenticateJWT, (req, res) => controller.getById(req, res))

  /**
   * PUT /api/campaigns/:id - Actualizar campaña
   * 
   * Requirement 7.4: Exponer endpoint PUT /api/campaigns/:id para actualizar una campaña
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * Requirement 10.9: Registrar operaciones administrativas con usuario
   * Requirement 12.1: Registrar cada campaña actualizada
   * 
   * Params:
   * - id: string (UUID de la campaña)
   * 
   * Body (todos los campos son opcionales):
   * {
   *   name?: string,
   *   slug?: string,
   *   startDate?: string (ISO 8601),
   *   endDate?: string (ISO 8601),
   *   priority?: number,
   *   discountRules?: DiscountRules,
   *   frontendConfig?: FrontendConfig
   * }
   * 
   * Response: 200 OK
   * {
   *   id: string,
   *   name: string,
   *   ...
   * }
   * 
   * Response: 404 Not Found (si la campaña no existe)
   * Response: 400 Bad Request (si los datos son inválidos)
   * Response: 409 Conflict (si el nombre o slug ya existe)
   */
  router.put('/campaigns/:id', authenticateJWT, combinedAuditLogger, (req, res) => 
    controller.update(req, res)
  )

  /**
   * DELETE /api/campaigns/:id - Eliminar campaña
   * 
   * Requirement 7.5: Exponer endpoint DELETE /api/campaigns/:id para eliminar una campaña
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * Requirement 10.9: Registrar operaciones administrativas con usuario
   * Requirement 12.1: Registrar cada campaña eliminada
   * 
   * Params:
   * - id: string (UUID de la campaña)
   * 
   * Response: 200 OK
   * {
   *   success: true,
   *   productsRestored?: number
   * }
   * 
   * Response: 404 Not Found (si la campaña no existe)
   * 
   * Nota: Si la campaña está activa, los descuentos se removerán automáticamente
   * antes de eliminar la campaña (Requirement 1.3)
   */
  router.delete('/campaigns/:id', authenticateJWT, combinedAuditLogger, (req, res) => 
    controller.delete(req, res)
  )

  /**
   * POST /api/campaigns/:id/apply-discounts - Aplicar descuentos manualmente
   * 
   * Requirement 7.7: Exponer endpoint POST /api/campaigns/:id/apply-discounts
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * Requirement 10.9: Registrar operaciones administrativas con usuario
   * 
   * Params:
   * - id: string (UUID de la campaña)
   * 
   * Response: 200 OK
   * {
   *   success: true,
   *   productsAffected: number,
   *   totalDiscountAmount: number,
   *   averageDiscountPercentage: number,
   *   processingTime: number
   * }
   * 
   * Response: 404 Not Found (si la campaña no existe)
   * Response: 400 Bad Request (si la campaña ya tiene descuentos aplicados)
   * 
   * Nota: Este endpoint permite aplicar descuentos manualmente sin esperar
   * a que el cron job lo haga automáticamente
   */
  router.post('/campaigns/:id/apply-discounts', authenticateJWT, combinedAuditLogger, (req, res) => 
    controller.applyDiscounts(req, res)
  )

  /**
   * POST /api/campaigns/:id/remove-discounts - Remover descuentos manualmente
   * 
   * Requirement 7.8: Exponer endpoint POST /api/campaigns/:id/remove-discounts
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * Requirement 10.8: Requerir autenticación JWT
   * Requirement 10.9: Registrar operaciones administrativas con usuario
   * 
   * Params:
   * - id: string (UUID de la campaña)
   * 
   * Response: 200 OK
   * {
   *   success: true,
   *   productsRestored: number,
   *   processingTime: number
   * }
   * 
   * Response: 404 Not Found (si la campaña no existe)
   * Response: 400 Bad Request (si la campaña no tiene descuentos aplicados)
   * 
   * Nota: Este endpoint permite remover descuentos manualmente sin esperar
   * a que el cron job lo haga automáticamente
   */
  router.post('/campaigns/:id/remove-discounts', authenticateJWT, combinedAuditLogger, (req, res) => 
    controller.removeDiscounts(req, res)
  )

  /**
   * GET /api/campaigns/:id/analytics - Obtener analytics de campaña
   * 
   * Requirement 9.5: Exponer endpoint GET /api/campaigns/:id/analytics
   * Requirement 7.9: Validar que el usuario tenga rol de administrador
   * 
   * Params:
   * - id: string (UUID de la campaña)
   * 
   * Response: 200 OK
   * {
   *   campaignId: string,
   *   campaignName: string,
   *   startDate: string,
   *   endDate: string,
   *   isActive: boolean,
   *   metrics: {
   *     productsWithDiscount: number,
   *     averageDiscountPercentage: number,
   *     unitsSold: number,
   *     revenue: number,
   *     totalViews: number,
   *     totalClicks: number,
   *     totalConversions: number,
   *     conversionRate: number,
   *     roi: number,
   *     totalDiscountGiven: number
   *   },
   *   dailyMetrics: Array<{
   *     date: string,
   *     views: number,
   *     clicks: number,
   *     conversions: number,
   *     revenue: number,
   *     conversionRate: number
   *   }>,
   *   topProducts: Array<{
   *     productId: string,
   *     unitsSold: number,
   *     revenue: number,
   *     discountPercentage: number
   *   }>
   * }
   * 
   * Response: 404 Not Found (si la campaña no existe)
   */
  router.get('/campaigns/:id/analytics', authenticateJWT, (req, res) => 
    controller.getAnalytics(req, res)
  )

  return router
}

/**
 * Resumen de endpoints:
 * 
 * POST   /api/campaigns                      - Crear campaña (Req 7.1) [AUTH + AUDIT]
 * GET    /api/campaigns                      - Listar campañas (Req 7.2) [AUTH] ✅ PROTEGIDO
 * GET    /api/campaigns/active               - Obtener campaña activa (Req 7.6) [PÚBLICO]
 * GET    /api/campaigns/:id                  - Obtener campaña (Req 7.3) [AUTH] ✅ PROTEGIDO
 * PUT    /api/campaigns/:id                  - Actualizar campaña (Req 7.4) [AUTH + AUDIT]
 * DELETE /api/campaigns/:id                  - Eliminar campaña (Req 7.5) [AUTH + AUDIT]
 * POST   /api/campaigns/:id/apply-discounts  - Aplicar descuentos (Req 7.7) [AUTH + AUDIT]
 * POST   /api/campaigns/:id/remove-discounts - Remover descuentos (Req 7.8) [AUTH + AUDIT]
 * GET    /api/campaigns/:id/analytics        - Obtener analytics (Req 9.5) [AUTH]
 * 
 * Middlewares aplicados:
 * - Rate Limiting: 100 requests/minuto por IP (Req 10.10)
 * - Autenticación JWT: Todos excepto /campaigns/active (Req 7.9, 10.8)
 * - Auditoría: Operaciones POST, PUT, DELETE (Req 10.9, 12.1)
 * 
 * Seguridad (actualizado 17-dic-2025):
 * - GET /campaigns y GET /campaigns/:id ahora requieren autenticación JWT
 * - Solo GET /campaigns/active permanece público (necesario para el frontend)
 */
