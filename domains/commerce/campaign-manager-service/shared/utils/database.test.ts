/**
 * Tests para Database Utility
 * 
 * Verifica:
 * - Conexión al pool de PostgreSQL
 * - Ejecución de queries
 * - Manejo de transacciones
 * - Health checks
 */

import { database } from './database'

describe('Database Utility', () => {
  beforeAll(async () => {
    // Conectar a la base de datos antes de los tests
    await database.connect()
  })

  afterAll(async () => {
    // Cerrar conexión después de los tests
    await database.disconnect()
  })

  describe('Connection', () => {
    it('should connect to PostgreSQL successfully', async () => {
      const pool = database.getPool()
      expect(pool).toBeDefined()
      expect(pool.totalCount).toBeGreaterThanOrEqual(0)
    })

    it('should execute a simple query', async () => {
      const result = await database.query('SELECT NOW() as current_time')
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].current_time).toBeDefined()
    })

    it('should execute a query with parameters', async () => {
      const result = await database.query(
        'SELECT $1::text as message',
        ['Hello, World!']
      )
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].message).toBe('Hello, World!')
    })
  })

  describe('Transactions', () => {
    it('should commit a successful transaction', async () => {
      const result = await database.transaction(async (client) => {
        await client.query('SELECT 1')
        return { success: true }
      })

      expect(result.success).toBe(true)
    })

    it('should rollback a failed transaction', async () => {
      await expect(
        database.transaction(async (client) => {
          await client.query('SELECT 1')
          throw new Error('Simulated error')
        })
      ).rejects.toThrow('Simulated error')
    })

    it('should handle multiple operations in a transaction', async () => {
      const result = await database.transaction(async (client) => {
        const result1 = await client.query('SELECT 1 as num')
        const result2 = await client.query('SELECT 2 as num')
        return {
          first: result1.rows[0].num,
          second: result2.rows[0].num,
        }
      })

      expect(result.first).toBe(1)
      expect(result.second).toBe(2)
    })
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await database.healthCheck()
      expect(health.healthy).toBe(true)
      expect(health.message).toBe('Database connection is healthy')
      expect(health.details).toBeDefined()
      expect(health.details?.currentTime).toBeDefined()
      expect(health.details?.version).toBeDefined()
    })

    it('should return pool statistics', () => {
      const stats = database.getPoolStats()
      expect(stats).toHaveProperty('totalCount')
      expect(stats).toHaveProperty('idleCount')
      expect(stats).toHaveProperty('waitingCount')
      expect(typeof stats.totalCount).toBe('number')
      expect(typeof stats.idleCount).toBe('number')
      expect(typeof stats.waitingCount).toBe('number')
    })
  })

  describe('Error Handling', () => {
    it('should throw error for invalid query', async () => {
      await expect(
        database.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow()
    })

    it('should throw error when pool is not initialized', () => {
      const newDb = new (database.constructor as any)()
      expect(() => newDb.getPool()).toThrow(
        'Database pool not initialized. Call connect() first.'
      )
    })
  })

  describe('Table Existence', () => {
    it('should verify campaigns table exists', async () => {
      const result = await database.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campaigns'
        ) as exists
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should verify campaign_products table exists', async () => {
      const result = await database.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campaign_products'
        ) as exists
      `)
      expect(result.rows[0].exists).toBe(true)
    })

    it('should verify campaign_analytics table exists', async () => {
      const result = await database.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'campaign_analytics'
        ) as exists
      `)
      expect(result.rows[0].exists).toBe(true)
    })
  })

  describe('Table Structure', () => {
    it('should verify campaigns table has correct columns', async () => {
      const result = await database.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns'
        ORDER BY ordinal_position
      `)

      const columns = result.rows.map(row => row.column_name)
      expect(columns).toContain('id')
      expect(columns).toContain('name')
      expect(columns).toContain('slug')
      expect(columns).toContain('start_date')
      expect(columns).toContain('end_date')
      expect(columns).toContain('priority')
      expect(columns).toContain('is_active')
      expect(columns).toContain('discount_rules')
      expect(columns).toContain('frontend_config')
      expect(columns).toContain('discounts_applied')
      expect(columns).toContain('created_at')
      expect(columns).toContain('updated_at')
    })

    it('should verify campaign_products table has correct columns', async () => {
      const result = await database.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'campaign_products'
        ORDER BY ordinal_position
      `)

      const columns = result.rows.map(row => row.column_name)
      expect(columns).toContain('id')
      expect(columns).toContain('campaign_id')
      expect(columns).toContain('product_id')
      expect(columns).toContain('original_price')
      expect(columns).toContain('campaign_price')
      expect(columns).toContain('discount_percentage')
      expect(columns).toContain('discount_amount')
      expect(columns).toContain('units_sold')
      expect(columns).toContain('applied_at')
    })

    it('should verify campaign_analytics table has correct columns', async () => {
      const result = await database.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'campaign_analytics'
        ORDER BY ordinal_position
      `)

      const columns = result.rows.map(row => row.column_name)
      expect(columns).toContain('id')
      expect(columns).toContain('campaign_id')
      expect(columns).toContain('date')
      expect(columns).toContain('views')
      expect(columns).toContain('clicks')
      expect(columns).toContain('conversions')
      expect(columns).toContain('revenue')
    })
  })

  describe('Indexes', () => {
    it('should verify campaigns table has required indexes', async () => {
      const result = await database.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'campaigns'
      `)

      const indexes = result.rows.map(row => row.indexname)
      expect(indexes).toContain('idx_campaigns_start_date')
      expect(indexes).toContain('idx_campaigns_end_date')
      expect(indexes).toContain('idx_campaigns_is_active')
      expect(indexes).toContain('idx_campaigns_priority')
      expect(indexes).toContain('idx_campaigns_slug')
    })

    it('should verify campaign_products table has required indexes', async () => {
      const result = await database.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'campaign_products'
      `)

      const indexes = result.rows.map(row => row.indexname)
      expect(indexes).toContain('idx_campaign_products_campaign_id')
      expect(indexes).toContain('idx_campaign_products_product_id')
      expect(indexes).toContain('idx_campaign_products_applied_at')
    })

    it('should verify campaign_analytics table has required indexes', async () => {
      const result = await database.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'campaign_analytics'
      `)

      const indexes = result.rows.map(row => row.indexname)
      expect(indexes).toContain('idx_campaign_analytics_campaign_id')
      expect(indexes).toContain('idx_campaign_analytics_date')
      expect(indexes).toContain('idx_campaign_analytics_campaign_date')
    })
  })

  describe('Foreign Keys', () => {
    it('should verify campaign_products has foreign key to campaigns', async () => {
      const result = await database.query(`
        SELECT constraint_name, table_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'campaign_products'
        AND constraint_type = 'FOREIGN KEY'
      `)

      expect(result.rows.length).toBeGreaterThan(0)
      const fkNames = result.rows.map(row => row.constraint_name)
      expect(fkNames).toContain('fk_campaign_products_campaign')
    })

    it('should verify campaign_analytics has foreign key to campaigns', async () => {
      const result = await database.query(`
        SELECT constraint_name, table_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'campaign_analytics'
        AND constraint_type = 'FOREIGN KEY'
      `)

      expect(result.rows.length).toBeGreaterThan(0)
      const fkNames = result.rows.map(row => row.constraint_name)
      expect(fkNames).toContain('fk_campaign_analytics_campaign')
    })
  })
})
