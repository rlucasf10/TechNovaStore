import { Sequelize } from 'sequelize';

/**
 * Global setup que se ejecuta una sola vez antes de todos los tests
 * Crea la base de datos de test si no existe y la limpia
 */
export default async function globalSetup() {
  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.DB_HOST = process.env.DB_HOST || 'postgresql';
  process.env.DB_NAME = process.env.DB_NAME || 'technovastore_test';
  process.env.DB_USER = process.env.DB_USER || 'admin';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'password';
  process.env.DB_PORT = process.env.DB_PORT || '5432';

  // Primero conectar a la base de datos postgres para crear la base de datos de test
  const adminSequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Conectar a la base de datos por defecto
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
  });

  try {
    await adminSequelize.authenticate();
    console.log('Global setup: Connected to postgres database.');

    // Crear la base de datos de test si no existe
    await adminSequelize.query(`
      SELECT 'CREATE DATABASE ${process.env.DB_NAME}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${process.env.DB_NAME}')\\gexec
    `).catch(async () => {
      // Si el comando anterior falla, intentar crear directamente
      try {
        await adminSequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`Global setup: Created database ${process.env.DB_NAME}.`);
      } catch (err: any) {
        if (err.original?.code !== '42P04') { // Ignorar error si la base de datos ya existe
          throw err;
        }
        console.log(`Global setup: Database ${process.env.DB_NAME} already exists.`);
      }
    });

    await adminSequelize.close();

    // Ahora conectar a la base de datos de test para limpiarla
    const testSequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false,
    });

    await testSequelize.authenticate();
    console.log('Global setup: Connected to test database.');

    // Eliminar todos los tipos ENUM existentes
    await testSequelize.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typname LIKE 'enum_%') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('Global setup: Dropped all ENUM types.');

    // Eliminar todas las tablas
    await testSequelize.drop({ cascade: true });
    console.log('Global setup: Dropped all tables.');

    await testSequelize.close();
    console.log('Global setup: Database cleaned successfully.');
  } catch (error) {
    console.error('Global setup: Error cleaning database:', error);
    try {
      await adminSequelize.close();
    } catch (e) {
      // Ignorar errores al cerrar
    }
    throw error;
  }
}
