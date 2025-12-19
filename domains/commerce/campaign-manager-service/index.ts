/**
 * Campaign Manager Service - Entry Point
 * 
 * Servicio de gestión de campañas promocionales con aplicación automática de descuentos.
 * 
 * Este servicio implementa:
 * - API REST para gestión de campañas
 * - Aplicación y remoción automática de descuentos
 * - Scheduler con cron jobs para automatización
 * - Health checks y métricas de Prometheus
 * - Integración con Product Service y Notification Service
 * 
 * Puerto: 3011
 * 
 * Requirements: 13.4
 */

import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config'
import { database } from './shared/utils/database'
import { logger } from './shared/utils/logger'

// Health Check y Métricas
import { HealthCheck } from './health-check/HealthCheck'
import { MetricsCollector } from './metrics/MetricsCollector'

// Repositorios
import { CampaignRepository } from './shared/repositories/CampaignRepository'
import { CampaignProductRepository } from './shared/repositories/CampaignProductRepository'
import { CampaignAnalyticsRepository } from './shared/repositories/CampaignAnalyticsRepository'

// Clientes externos
import { ProductServiceClient } from './shared/clients/ProductServiceClient'
import { NotificationServiceClient } from './shared/clients/NotificationServiceClient'

// Utilidades
import { CampaignValidator } from './shared/utils/validators'
import { DiscountCalculator } from './shared/utils/discount-calculator'
import { BatchProcessor } from './shared/utils/batch-processor'

// Casos de uso
import { CreateCampaign } from './create-campaign/CreateCampaign'
import { UpdateCampaign } from './update-campaign/UpdateCampaign'
import { DeleteCampaign } from './delete-campaign/DeleteCampaign'
import { GetCampaign } from './get-campaign/GetCampaign'
import { ListCampaigns } from './list-campaigns/ListCampaigns'
import { GetActiveCampaign } from './get-active-campaign/GetActiveCampaign'
import { CalculateDiscount } from './calculate-discount/CalculateDiscount'
import { ApplyCampaignDiscounts } from './apply-campaign-discounts/ApplyCampaignDiscounts'
import { RemoveCampaignDiscounts } from './remove-campaign-discounts/RemoveCampaignDiscounts'
import { GetCampaignAnalytics } from './get-campaign-analytics/GetCampaignAnalytics'
import { GenerateCampaignReport } from './generate-campaign-report/GenerateCampaignReport'
import { CheckActivateCampaigns } from './check-activate-campaigns/CheckActivateCampaigns'
import { CheckDeactivateCampaigns } from './check-deactivate-campaigns/CheckDeactivateCampaigns'

// API
import { CampaignController } from './api/CampaignController'
import { createCampaignRoutes } from './api/routes'

// Scheduler
import { createCampaignScheduler } from './cron/campaign-scheduler'

/**
 * Inicializa todas las dependencias del servicio
 * 
 * Implementa el patrón de inyección de dependencias para facilitar testing
 * y mantener bajo acoplamiento entre componentes.
 */
async function initializeDependencies() {
  logger.info('Inicializando dependencias del Campaign Manager Service')

  // Conectar a la base de datos
  await database.connect()
  logger.info('Conexión a base de datos establecida')

  // Inicializar repositorios
  const campaignRepository = new CampaignRepository()
  const campaignProductRepository = new CampaignProductRepository()
  const campaignAnalyticsRepository = new CampaignAnalyticsRepository()
  logger.info('Repositorios inicializados')

  // Inicializar clientes externos
  const productServiceClient = new ProductServiceClient(config.productServiceUrl)
  const notificationServiceClient = new NotificationServiceClient(config.notificationServiceUrl)
  logger.info('Clientes externos inicializados', {
    productServiceUrl: config.productServiceUrl,
    notificationServiceUrl: config.notificationServiceUrl
  })

  // Inicializar utilidades
  const validator = new CampaignValidator()
  const discountCalculator = new DiscountCalculator()
  const batchProcessor = new BatchProcessor()
  logger.info('Utilidades inicializadas')

  // Inicializar casos de uso
  const createCampaign = new CreateCampaign(campaignRepository, validator)
  const updateCampaign = new UpdateCampaign(campaignRepository, validator)
  const getCampaign = new GetCampaign(campaignRepository)
  const listCampaigns = new ListCampaigns(campaignRepository)
  const getActiveCampaign = new GetActiveCampaign(campaignRepository)
  const calculateDiscount = new CalculateDiscount(discountCalculator)
  const getCampaignAnalytics = new GetCampaignAnalytics(
    campaignRepository,
    campaignProductRepository,
    campaignAnalyticsRepository
  )
  const generateCampaignReport = new GenerateCampaignReport(
    campaignRepository,
    campaignProductRepository,
    campaignAnalyticsRepository
  )
  const applyCampaignDiscounts = new ApplyCampaignDiscounts(
    campaignRepository,
    campaignProductRepository,
    productServiceClient,
    discountCalculator,
    batchProcessor
  )
  const removeCampaignDiscounts = new RemoveCampaignDiscounts(
    campaignRepository,
    campaignProductRepository,
    productServiceClient,
    batchProcessor
  )
  const deleteCampaign = new DeleteCampaign(
    campaignRepository,
    campaignProductRepository,
    productServiceClient
  )
  const checkActivateCampaigns = new CheckActivateCampaigns(
    campaignRepository,
    applyCampaignDiscounts,
    notificationServiceClient
  )
  const checkDeactivateCampaigns = new CheckDeactivateCampaigns(
    campaignRepository,
    campaignProductRepository,
    removeCampaignDiscounts,
    notificationServiceClient
  )
  logger.info('Casos de uso inicializados')

  // Inicializar controlador
  const controller = new CampaignController(
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaign,
    listCampaigns,
    getActiveCampaign,
    applyCampaignDiscounts,
    removeCampaignDiscounts,
    getCampaignAnalytics
  )
  logger.info('Controlador inicializado')

  // Inicializar health check y métricas (antes del scheduler para poder pasarlo)
  const healthCheck = new HealthCheck(database.getPool(), config.productServiceUrl)
  const metricsCollector = new MetricsCollector()
  metricsCollector.setDatabase(database.getPool())
  logger.info('Health check y métricas inicializados')

  // Inicializar scheduler con métricas para Alertmanager (Requirement 16.8)
  const scheduler = createCampaignScheduler(
    checkActivateCampaigns,
    checkDeactivateCampaigns,
    {
      activationSchedule: '0 * * * *', // Cada hora
      deactivationSchedule: '0 * * * *', // Cada hora
      timezone: 'Europe/Madrid',
      runOnStart: false, // No ejecutar inmediatamente al iniciar
      metricsCollector // Pasar métricas para integración con Alertmanager
    }
  )
  logger.info('Scheduler inicializado con integración de métricas para Alertmanager')

  return {
    controller,
    scheduler,
    healthCheck,
    metricsCollector
  }
}

/**
 * Configura la aplicación Express
 * 
 * Requirement 13.4: Configurar Express app, registrar middlewares y rutas
 */
function configureApp(
  controller: CampaignController,
  healthCheck: HealthCheck,
  metricsCollector: MetricsCollector
): Application {
  const app: Application = express()

  // Middleware de seguridad y parsing
  app.use(helmet())
  
  // Configuración CORS para permitir credenciales desde el frontend
  app.use(cors({
    origin: config.frontendUrl || 'http://localhost:3020',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-ID']
  }))
  
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Logging de requests HTTP
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim(), { source: 'http' })
      }
    }
  }))

  // Endpoint raíz - información del servicio
  app.get('/', (req: Request, res: Response) => {
    res.json({
      service: 'Campaign Manager Service',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        metrics: '/metrics',
        api: '/api/campaigns'
      }
    })
  })

  /**
   * GET /health - Health check endpoint
   * 
   * Requirement 12.6: Exponer health check que verifique conexión a PostgreSQL y Product Service
   */
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const result = await healthCheck.execute()
      
      // Retornar 503 si el servicio no está saludable
      const statusCode = result.status === 'healthy' ? 200 : 503
      
      res.status(statusCode).json(result)
    } catch (error) {
      logger.error('Error al ejecutar health check', {
        operation: 'health_check',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: 'Error al ejecutar health check'
      })
    }
  })

  /**
   * GET /metrics - Prometheus metrics endpoint
   * 
   * Requirements: 12.5, 16.1, 16.2, 16.3, 16.4
   */
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await metricsCollector.getMetrics()
      res.set('Content-Type', metricsCollector.getContentType())
      res.send(metrics)
    } catch (error) {
      logger.error('Error al obtener métricas', {
        operation: 'get_metrics',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
      
      res.status(500).json({
        error: 'Error al obtener métricas'
      })
    }
  })

  // Registrar rutas de la API
  const campaignRoutes = createCampaignRoutes(controller)
  app.use('/api', campaignRoutes)
  logger.info('Rutas de API registradas en /api')

  // Error handler global
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error no manejado en la aplicación', {
      error: err.message || 'Unknown error',
      stack: err.stack,
      path: req.path,
      method: req.method
    })
    
    res.status(err.statusCode || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    })
  })

  return app
}

/**
 * Inicia el servidor
 * 
 * Requirement 13.4: Iniciar servidor en puerto 3011
 */
async function startServer() {
  try {
    logger.info('Iniciando Campaign Manager Service', {
      nodeEnv: config.nodeEnv,
      port: config.port
    })

    // Inicializar dependencias
    const { controller, scheduler, healthCheck, metricsCollector } = await initializeDependencies()

    // Configurar aplicación Express
    const app = configureApp(controller, healthCheck, metricsCollector)

    // Iniciar servidor HTTP
    const server = app.listen(config.port, () => {
      logger.info('Campaign Manager Service iniciado exitosamente', {
        port: config.port,
        environment: config.nodeEnv,
        endpoints: {
          health: `http://localhost:${config.port}/health`,
          metrics: `http://localhost:${config.port}/metrics`,
          api: `http://localhost:${config.port}/api/campaigns`
        }
      })
      
      logger.info(`Campaign Manager Service running on port ${config.port}`)
      logger.info(`Health check: http://localhost:${config.port}/health`)
      logger.info(`Metrics: http://localhost:${config.port}/metrics`)
      logger.info(`API: http://localhost:${config.port}/api/campaigns`)
    })

    // Iniciar scheduler de cron jobs
    scheduler.start()
    logger.info('Scheduler de campañas iniciado')

    // Manejo de señales de terminación
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Señal ${signal} recibida, iniciando apagado graceful`)

      // Detener scheduler
      scheduler.stop()
      logger.info('Scheduler detenido')

      // Cerrar servidor HTTP
      server.close(() => {
        logger.info('Servidor HTTP cerrado')
      })

      // Cerrar conexión a base de datos
      await database.disconnect()
      logger.info('Conexión a base de datos cerrada')

      logger.info('Apagado graceful completado')
      process.exit(0)
    }

    // Registrar handlers para señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      })
    })

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      })
      
      // En caso de excepción no capturada, hacer shutdown graceful
      gracefulShutdown('UNCAUGHT_EXCEPTION')
    })

  } catch (error) {
    logger.error('Error fatal al iniciar el servicio', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    logger.error('Error fatal al iniciar el servicio', error instanceof Error ? error : new Error(String(error)))
    process.exit(1)
  }
}

// Iniciar el servidor
startServer()

export default startServer
