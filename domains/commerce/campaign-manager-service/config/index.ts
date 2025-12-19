/**
 * Configuración del Campaign Manager Service
 * 
 * Carga y valida las variables de entorno requeridas para el servicio.
 */

import { logger } from '../shared/utils/logger'

interface Config {
  port: number
  databaseUrl: string
  productServiceUrl: string
  notificationServiceUrl: string
  jwtSecret: string
  nodeEnv: string
  frontendUrl: string
}

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'DATABASE_URL',
  'PRODUCT_SERVICE_URL',
  'JWT_SECRET'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variable de entorno requerida no encontrada: ${envVar}`)
  }
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3011', 10),
  databaseUrl: process.env.DATABASE_URL!,
  productServiceUrl: process.env.PRODUCT_SERVICE_URL!,
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
  jwtSecret: process.env.JWT_SECRET!,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3020'
}

// Log de configuración (sin mostrar secretos)
logger.info('Configuración del Campaign Manager Service', {
  port: config.port,
  environment: config.nodeEnv,
  frontendUrl: config.frontendUrl,
  productServiceUrl: config.productServiceUrl,
  notificationServiceUrl: config.notificationServiceUrl,
  databaseHost: config.databaseUrl.split('@')[1] || 'configurado'
})
