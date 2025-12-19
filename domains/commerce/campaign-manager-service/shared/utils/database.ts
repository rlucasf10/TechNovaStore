/**
 * Database Utility - Campaign Manager Service
 * 
 * Proporciona conexión a PostgreSQL con pool de conexiones y manejo de transacciones.
 * 
 * Características:
 * - Pool de conexiones configurado para alta concurrencia
 * - Manejo de transacciones con rollback automático en errores
 * - Logging de operaciones de base de datos
 * - Reconexión automática en caso de pérdida de conexión
 * - Health checks para monitoreo
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { logger } from './logger'

/**
 * Configuración del pool de conexiones
 */
interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  max?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

/**
 * Clase para gestionar la conexión a PostgreSQL
 */
class Database {
  private pool: Pool | null = null
  private config: DatabaseConfig

  constructor() {
    this.config = this.loadConfig()
  }

  /**
   * Carga la configuración desde variables de entorno
   * 
   * Soporta dos formatos:
   * 1. DATABASE_URL: postgresql://user:password@host:port/database
   * 2. Variables separadas: POSTGRES_HOST, POSTGRES_PORT, etc.
   */
  private loadConfig(): DatabaseConfig {
    // Intentar cargar desde DATABASE_URL primero
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL)
        return {
          host: url.hostname,
          port: parseInt(url.port || '5432', 10),
          database: url.pathname.slice(1), // Remover el '/' inicial
          user: url.username,
          password: url.password,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      } catch (error) {
        logger.warn('Failed to parse DATABASE_URL, falling back to individual variables', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Fallback a variables individuales
    const host = process.env.POSTGRES_HOST || 'localhost'
    const port = parseInt(process.env.POSTGRES_PORT || '5432', 10)
    const database = process.env.POSTGRES_DB || 'technovastore'
    const user = process.env.POSTGRES_USER || 'admin'
    const password = process.env.POSTGRES_PASSWORD

    if (!password) {
      logger.error('CRITICAL: POSTGRES_PASSWORD environment variable is not set')
      throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start.')
    }

    return {
      host,
      port,
      database,
      user,
      password,
      max: 20, // Máximo de conexiones en el pool
      idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexiones inactivas
      connectionTimeoutMillis: 10000, // Timeout para establecer conexión
    }
  }

  /**
   * Inicializa el pool de conexiones
   */
  public async connect(): Promise<void> {
    if (this.pool) {
      logger.warn('Database pool already initialized')
      return
    }

    try {
      this.pool = new Pool(this.config)

      // Configurar event listeners
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', { error: err.message })
      })

      this.pool.on('connect', () => {
        logger.debug('New client connected to database')
      })

      this.pool.on('remove', () => {
        logger.debug('Client removed from pool')
      })

      // Verificar conexión
      await this.pool.query('SELECT NOW()')
      
      logger.info('Database connection pool initialized', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        maxConnections: this.config.max,
      })
    } catch (error) {
      logger.error('Failed to initialize database connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Cierra el pool de conexiones
   */
  public async disconnect(): Promise<void> {
    if (!this.pool) {
      logger.warn('Database pool not initialized')
      return
    }

    try {
      await this.pool.end()
      this.pool = null
      logger.info('Database connection pool closed')
    } catch (error) {
      logger.error('Error closing database connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Obtiene el pool de conexiones
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.')
    }
    return this.pool
  }

  /**
   * Ejecuta una query simple
   */
  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const pool = this.getPool()
    const start = Date.now()

    try {
      const result = await pool.query<T>(text, params)
      const duration = Date.now() - start

      logger.debug('Query executed', {
        query: text,
        params,
        duration,
        rows: result.rowCount,
      })

      return result
    } catch (error) {
      logger.error('Query execution failed', {
        query: text,
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Ejecuta una transacción
   * 
   * @param callback Función que recibe un cliente y ejecuta operaciones
   * @returns Resultado de la transacción
   * 
   * @example
   * ```typescript
   * const result = await db.transaction(async (client) => {
   *   await client.query('INSERT INTO campaigns ...')
   *   await client.query('INSERT INTO campaign_products ...')
   *   return { success: true }
   * })
   * ```
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool()
    const client = await pool.connect()
    const start = Date.now()

    try {
      await client.query('BEGIN')
      logger.debug('Transaction started')

      const result = await callback(client)

      await client.query('COMMIT')
      const duration = Date.now() - start
      logger.debug('Transaction committed', { duration })

      return result
    } catch (error) {
      await client.query('ROLLBACK')
      const duration = Date.now() - start
      
      logger.error('Transaction rolled back', {
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Verifica el estado de la conexión (health check)
   */
  public async healthCheck(): Promise<{
    healthy: boolean
    message: string
    details?: any
  }> {
    try {
      const pool = this.getPool()
      const result = await pool.query('SELECT NOW() as current_time, version() as version')
      
      return {
        healthy: true,
        message: 'Database connection is healthy',
        details: {
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version,
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingConnections: pool.waitingCount,
        },
      }
    } catch (error) {
      return {
        healthy: false,
        message: 'Database connection is unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Obtiene estadísticas del pool de conexiones
   */
  public getPoolStats(): {
    totalCount: number
    idleCount: number
    waitingCount: number
  } {
    const pool = this.getPool()
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    }
  }
}

// Instancia singleton
const database = new Database()

export { database, Database, DatabaseConfig }
export type { PoolClient, QueryResult, QueryResultRow }
