/**
 * Configuración de conexión a PostgreSQL para Ticket Service
 * 
 * SEGURIDAD: POSTGRES_PASSWORD es OBLIGATORIO y debe configurarse en variables de entorno.
 * La aplicación fallará al iniciar si no está configurado correctamente.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../shared/utils/logger';

dotenv.config();

// ✅ SEGURIDAD: POSTGRES_PASSWORD es OBLIGATORIO - no se permite valor por defecto
const dbPassword = process.env.POSTGRES_PASSWORD;

// Validación de configuración de seguridad al cargar el módulo
if (!dbPassword) {
  logger.error('CRITICAL SECURITY ERROR: POSTGRES_PASSWORD environment variable is not set');
  logger.error('Database password is required for secure connection');
  logger.error('Please set POSTGRES_PASSWORD in your environment or .env file');
  logger.error('Example: POSTGRES_PASSWORD=your-secure-database-password');
  throw new Error('POSTGRES_PASSWORD must be configured. Application cannot start without a valid database password.');
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'technovastore',
  user: process.env.POSTGRES_USER || 'postgres',
  password: dbPassword,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Conexión establecida
pool.on('connect', () => {
  logger.info('Conexión establecida con PostgreSQL database');
});

// Error en cliente inactivo
pool.on('error', (err) => {
  logger.error('Error inesperado en cliente inactivo de PostgreSQL', { error: err.message });
  process.exit(-1);
});

export default pool;