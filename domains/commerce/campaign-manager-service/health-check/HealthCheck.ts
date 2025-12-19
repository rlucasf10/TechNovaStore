/**
 * HealthCheck - Caso de uso para verificar el estado del servicio
 * 
 * Verifica la conexión a PostgreSQL y Product Service para determinar
 * si el servicio está funcionando correctamente.
 * 
 * Requirements: 12.6
 */

import { Pool } from 'pg'
import axios from 'axios'
import { logger } from '../shared/utils/logger'

/**
 * Resultado del health check
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    productService: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
  }
}

/**
 * Caso de uso: Health Check
 * 
 * Verifica el estado de salud del servicio comprobando:
 * - Conexión a PostgreSQL
 * - Conexión a Product Service
 * 
 * Requirement 12.6: Exponer health check que verifique conexión a PostgreSQL y Product Service
 */
export class HealthCheck {
  constructor(
    private db: Pool,
    private productServiceUrl: string
  ) {}

  /**
   * Ejecuta el health check
   * 
   * @returns Resultado del health check con estado de cada componente
   */
  async execute(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    // Verificar base de datos
    const dbCheck = await this.checkDatabase()
    
    // Verificar Product Service
    const productServiceCheck = await this.checkProductService()
    
    // Determinar estado general
    const isHealthy = dbCheck.status === 'up' && productServiceCheck.status === 'up'
    
    const result: HealthCheckResult = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        productService: productServiceCheck
      }
    }
    
    const totalTime = Date.now() - startTime
    
    if (isHealthy) {
      logger.debug('Health check completado exitosamente', {
        operation: 'health_check',
        duration: totalTime,
        status: 'healthy'
      })
    } else {
      logger.warn('Health check detectó problemas', {
        operation: 'health_check',
        duration: totalTime,
        status: 'unhealthy',
        dbStatus: dbCheck.status,
        productServiceStatus: productServiceCheck.status
      })
    }
    
    return result
  }

  /**
   * Verifica la conexión a PostgreSQL
   * 
   * @returns Estado de la conexión a la base de datos
   */
  private async checkDatabase(): Promise<{
    status: 'up' | 'down'
    responseTime?: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      // Ejecutar query simple para verificar conexión
      await this.db.query('SELECT 1')
      
      const responseTime = Date.now() - startTime
      
      return {
        status: 'up',
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      logger.error('Error al verificar conexión a base de datos', {
        operation: 'health_check_database',
        error: errorMessage,
        duration: responseTime
      })
      
      return {
        status: 'down',
        responseTime,
        error: errorMessage
      }
    }
  }

  /**
   * Verifica la conexión al Product Service
   * 
   * @returns Estado de la conexión al Product Service
   */
  private async checkProductService(): Promise<{
    status: 'up' | 'down'
    responseTime?: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      // Hacer request al health endpoint del Product Service
      const response = await axios.get(`${this.productServiceUrl}/health`, {
        timeout: 5000 // 5 segundos de timeout
      })
      
      const responseTime = Date.now() - startTime
      
      // Verificar que el servicio responda con status 200
      if (response.status === 200) {
        return {
          status: 'up',
          responseTime
        }
      } else {
        return {
          status: 'down',
          responseTime,
          error: `Status code inesperado: ${response.status}`
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      logger.error('Error al verificar conexión a Product Service', {
        operation: 'health_check_product_service',
        error: errorMessage,
        duration: responseTime,
        productServiceUrl: this.productServiceUrl
      })
      
      return {
        status: 'down',
        responseTime,
        error: errorMessage
      }
    }
  }
}
