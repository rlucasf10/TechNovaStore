import { QueryInterface } from 'sequelize';

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
        console.log(`Migration ${migration.constructor.name} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.constructor.name} failed:`, error);
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
        console.log(`Rollback ${migration.constructor.name} completed successfully`);
      } catch (error) {
        console.error(`Rollback ${migration.constructor.name} failed:`, error);
        throw error;
      }
    }
  }
}