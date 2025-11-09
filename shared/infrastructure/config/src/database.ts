import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { createClient, RedisClientType } from 'redis';
import { config } from './environment';

// MongoDB Connection
export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private connection: typeof mongoose | null = null;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    try {
      if (this.connection) {
        return this.connection;
      }

      console.log('Connecting to MongoDB...');
      
      this.connection = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      
      // Event listeners for connection monitoring
      mongoose.connection.on('connected', () => {
        console.log('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (error: Error) => {
        console.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        console.log('MongoDB disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnection(): typeof mongoose | null {
    return this.connection;
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

// PostgreSQL Connection
export class PostgreSQLConnection {
  private static instance: PostgreSQLConnection;
  private sequelize: Sequelize | null = null;

  private constructor() {}

  public static getInstance(): PostgreSQLConnection {
    if (!PostgreSQLConnection.instance) {
      PostgreSQLConnection.instance = new PostgreSQLConnection();
    }
    return PostgreSQLConnection.instance;
  }

  public async connect(): Promise<Sequelize> {
    try {
      if (this.sequelize) {
        return this.sequelize;
      }

      console.log('Connecting to PostgreSQL...');

      this.sequelize = new Sequelize({
        host: config.postgresql.host,
        port: config.postgresql.port,
        database: config.postgresql.database,
        username: config.postgresql.username,
        password: config.postgresql.password,
        dialect: 'postgres',
        pool: config.postgresql.pool,
        dialectOptions: config.postgresql.dialectOptions,
        logging: config.nodeEnv === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
      });

      // Test the connection
      await this.sequelize.authenticate();
      console.log('PostgreSQL connected successfully');

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.sequelize;
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        this.sequelize = null;
        console.log('PostgreSQL disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting from PostgreSQL:', error);
      throw error;
    }
  }

  public getConnection(): Sequelize | null {
    return this.sequelize;
  }

  public async isConnected(): Promise<boolean> {
    try {
      if (!this.sequelize) return false;
      await this.sequelize.authenticate();
      return true;
    } catch {
      return false;
    }
  }
}

// Redis Connection
export class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType | null = null;

  private constructor() {}

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<RedisClientType> {
    try {
      if (this.client && this.client.isOpen) {
        return this.client;
      }

      console.log('Connecting to Redis...');

      const redisOptions: any = {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        database: config.redis.db,
      };

      if (config.redis.password) {
        redisOptions.password = config.redis.password;
      }

      this.client = createClient(redisOptions);

      // Event listeners
      this.client.on('connect', () => {
        console.log('Redis client connected');
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      this.client.on('error', (error: Error) => {
        console.error('Redis client error:', error);
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
      });

      await this.client.connect();

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client && this.client.isOpen) {
        await this.client.quit();
        this.client = null;
        console.log('Redis disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public isConnected(): boolean {
    return this.client?.isOpen || false;
  }
}

// Database Manager - Centralized database management
export class DatabaseManager {
  private static instance: DatabaseManager;
  private mongoConnection: MongoDBConnection;
  private postgresConnection: PostgreSQLConnection;
  private redisConnection: RedisConnection;

  private constructor() {
    this.mongoConnection = MongoDBConnection.getInstance();
    this.postgresConnection = PostgreSQLConnection.getInstance();
    this.redisConnection = RedisConnection.getInstance();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connectAll(): Promise<void> {
    try {
      console.log('Initializing all database connections...');
      
      await Promise.all([
        this.mongoConnection.connect(),
        this.postgresConnection.connect(),
        this.redisConnection.connect(),
      ]);

      console.log('All database connections established successfully');
    } catch (error) {
      console.error('Failed to establish database connections:', error);
      throw error;
    }
  }

  public async disconnectAll(): Promise<void> {
    try {
      console.log('Closing all database connections...');
      
      await Promise.all([
        this.mongoConnection.disconnect(),
        this.postgresConnection.disconnect(),
        this.redisConnection.disconnect(),
      ]);

      console.log('All database connections closed successfully');
    } catch (error) {
      console.error('Error closing database connections:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<{
    mongodb: boolean;
    postgresql: boolean;
    redis: boolean;
  }> {
    return {
      mongodb: this.mongoConnection.isConnected(),
      postgresql: await this.postgresConnection.isConnected(),
      redis: this.redisConnection.isConnected(),
    };
  }

  public getMongoConnection(): typeof mongoose | null {
    return this.mongoConnection.getConnection();
  }

  public getPostgresConnection(): Sequelize | null {
    return this.postgresConnection.getConnection();
  }

  public getRedisClient(): RedisClientType | null {
    return this.redisConnection.getClient();
  }
}

// Export singleton instances
export const mongoConnection = MongoDBConnection.getInstance();
export const postgresConnection = PostgreSQLConnection.getInstance();
export const redisConnection = RedisConnection.getInstance();
export const databaseManager = DatabaseManager.getInstance();