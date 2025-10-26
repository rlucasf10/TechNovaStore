#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { Pool } from 'pg';
import { MigrationRunner } from '../database/migrationRunner';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'technovastore',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
  });

  const migrationRunner = new MigrationRunner(pool);

  try {
    console.log('Starting database migrations...');
    
    // Show current status
    const status = await migrationRunner.getMigrationStatus();
    console.log('\nMigration Status:');
    status.forEach(migration => {
      const statusText = migration.applied ? 
        `✓ Applied (${migration.applied_at?.toISOString()})` : 
        '✗ Pending';
      console.log(`  ${migration.version}: ${statusText}`);
    });

    // Run migrations
    console.log('\nRunning migrations...');
    await migrationRunner.runMigrations();
    
    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'status') {
  // Show migration status only
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'technovastore',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
  });

  const migrationRunner = new MigrationRunner(pool);
  
  migrationRunner.getMigrationStatus()
    .then(status => {
      console.log('Migration Status:');
      status.forEach(migration => {
        const statusText = migration.applied ? 
          `✓ Applied (${migration.applied_at?.toISOString()})` : 
          '✗ Pending';
        console.log(`  ${migration.version}: ${statusText}`);
      });
    })
    .catch(error => {
      console.error('Error getting migration status:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
} else if (command === 'rollback') {
  // Rollback last migration
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'technovastore',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
  });

  const migrationRunner = new MigrationRunner(pool);
  
  migrationRunner.rollbackLastMigration()
    .then(() => {
      console.log('✓ Rollback completed successfully!');
    })
    .catch(error => {
      console.error('✗ Rollback failed:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
} else {
  // Run migrations (default)
  runMigrations();
}