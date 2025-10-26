import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export class MigrationRunner {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get applied migrations
      const appliedResult = await client.query('SELECT version FROM schema_migrations ORDER BY version');
      const appliedMigrations = new Set(appliedResult.rows.map(row => row.version));

      // Get all migration files
      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log(`Found ${migrationFiles.length} migration files`);

      // Run pending migrations
      for (const file of migrationFiles) {
        const version = path.basename(file, '.sql');
        
        if (appliedMigrations.has(version)) {
          console.log(`Migration ${version} already applied, skipping`);
          continue;
        }

        console.log(`Running migration ${version}...`);
        
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        try {
          // Begin transaction
          await client.query('BEGIN');

          // Execute migration
          await client.query(migrationSQL);

          // Record migration as applied
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1)',
            [version]
          );

          // Commit transaction
          await client.query('COMMIT');
          
          console.log(`Migration ${version} completed successfully`);
        } catch (error) {
          // Rollback on error
          await client.query('ROLLBACK');
          console.error(`Migration ${version} failed:`, error);
          throw error;
        }
      }

      console.log('All migrations completed successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<Array<{
    version: string;
    applied: boolean;
    applied_at?: Date;
  }>> {
    const client = await this.pool.connect();

    try {
      // Ensure migrations table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get applied migrations
      const appliedResult = await client.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
      const appliedMigrations = new Map(
        appliedResult.rows.map(row => [row.version, row.applied_at])
      );

      // Get all migration files
      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return migrationFiles.map(file => {
        const version = path.basename(file, '.sql');
        const appliedAt = appliedMigrations.get(version);
        
        return {
          version,
          applied: !!appliedAt,
          applied_at: appliedAt
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Rollback last migration (use with caution)
   */
  async rollbackLastMigration(): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Get last applied migration
      const lastMigrationResult = await client.query(`
        SELECT version FROM schema_migrations 
        ORDER BY applied_at DESC 
        LIMIT 1
      `);

      if (lastMigrationResult.rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      const lastVersion = lastMigrationResult.rows[0].version;
      console.log(`Rolling back migration ${lastVersion}...`);

      // Check if rollback file exists
      const rollbackPath = path.join(__dirname, 'migrations', `${lastVersion}_rollback.sql`);
      
      if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found: ${rollbackPath}`);
      }

      const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Execute rollback
        await client.query(rollbackSQL);

        // Remove migration record
        await client.query(
          'DELETE FROM schema_migrations WHERE version = $1',
          [lastVersion]
        );

        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`Migration ${lastVersion} rolled back successfully`);
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error(`Rollback of ${lastVersion} failed:`, error);
        throw error;
      }
    } finally {
      client.release();
    }
  }
}