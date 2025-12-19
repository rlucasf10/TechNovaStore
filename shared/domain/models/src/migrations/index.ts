import { QueryInterface } from 'sequelize';
import { createLogger } from '@technovastore/shared-config';

const logger = createLogger('migration-runner');

// Migration interface
export interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

// Export all migrations
export * from './001-create-users-table';
export * from './002-create-orders-table';
export * from './003-create-order-items-table';
export * from './004-create-invoices-table';
export * from './005-create-tickets-table';

// Migration runner
export class MigrationRunner {
  private queryInterface: QueryInterface;

  constructor(queryInterface: QueryInterface) {
    this.queryInterface = queryInterface;
  }

  async runMigrations(migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      try {
        await migration.up(this.queryInterface);
        logger.info('Migration completed successfully', { 
          migration: migration.constructor.name 
        });
      } catch (error) {
        logger.error('Migration failed', { 
          migration: migration.constructor.name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    }
  }

  async rollbackMigrations(migrations: Migration[]): Promise<void> {
    // Run migrations in reverse order for rollback
    const reversedMigrations = [...migrations].reverse();
    
    for (const migration of reversedMigrations) {
      try {
        await migration.down(this.queryInterface);
        logger.info('Rollback completed successfully', { 
          migration: migration.constructor.name 
        });
      } catch (error) {
        logger.error('Rollback failed', { 
          migration: migration.constructor.name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    }
  }
}