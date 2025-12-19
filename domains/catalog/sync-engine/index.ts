/**
 * Sync Engine - Entry Point
 * 
 * Inicializa y arranca el motor de sincronización con arquitectura Screaming
 */

import express from 'express';
import { createLogger } from '@technovastore/shared-config';
import { SyncScheduler } from './shared/scheduler/SyncScheduler';

const logger = createLogger('sync-engine');
import { JobQueue } from './shared/queue/JobQueue';
import { SyncWorker } from './shared/workers/SyncWorker';
import { DataNormalizer } from './shared/normalizer/DataNormalizer';
import { ConflictResolver } from './shared/resolver/ConflictResolver';
import { PriceComparator } from './shared/pricing/PriceComparator';
import { PriceCache } from './shared/pricing/PriceCache';
import { DynamicPricingEngine } from './shared/pricing/DynamicPricingEngine';
import { AdapterFactory } from './shared/adapters/AdapterFactory';
import { SyncConfig } from './shared/types/sync';
import { DynamicPricingConfig } from './shared/types/pricing';
import { ProviderType, ProviderConfig } from './shared/types/provider';

// Casos de uso
import { TriggerFullSync } from './trigger-full-sync/TriggerFullSync';
import { TriggerPriceUpdate } from './trigger-price-update/TriggerPriceUpdate';
import { CompareProductPrices } from './compare-product-prices/CompareProductPrices';
import { AnalyzeMarket } from './analyze-market/AnalyzeMarket';
import { UpdateDynamicPrice } from './update-dynamic-price/UpdateDynamicPrice';
import { GetSyncStatus } from './get-sync-status/GetSyncStatus';
import { GetSyncMetrics } from './get-sync-metrics/GetSyncMetrics';
import { GetCacheStats } from './get-cache-stats/GetCacheStats';
import { GetPricingAlerts } from './get-pricing-alerts/GetPricingAlerts';
import { ManageProviders } from './manage-providers/ManageProviders';
import { CleanupOldData } from './cleanup-old-data/CleanupOldData';
import { HealthCheck } from './health-check/HealthCheck';

// API
import { SyncEngineController } from './api/SyncEngineController';
import { createRoutes } from './api/routes';

// Configuración por defecto
const defaultSyncConfig: SyncConfig = {
  enabled: true,
  schedules: {
    fullSync: '0 2 * * *', // Diario a las 2 AM
    priceUpdate: '0 */2 * * *', // Cada 2 horas
    availabilityCheck: '0 */6 * * *' // Cada 6 horas
  },
  batchSize: 50,
  maxConcurrentJobs: 5,
  retryDelayMs: 5000,
  maxRetries: 3
};

const defaultDynamicPricingConfig: DynamicPricingConfig = {
  enabled: true,
  update_frequency_minutes: 30,
  price_change_threshold: 0.02, // 2% cambio mínimo
  max_price_increase_percentage: 0.15, // Máx 15% aumento
  max_price_decrease_percentage: 0.20, // Máx 20% disminución
  competitor_weight: 0.7,
  demand_weight: 0.2,
  inventory_weight: 0.1
};

// Clase principal del servicio
class SyncEngineService {
  private scheduler: SyncScheduler;
  private jobQueue: JobQueue;
  private workers: SyncWorker[] = [];
  private priceCache: PriceCache;
  private priceComparator: PriceComparator;
  private dynamicPricingEngine: DynamicPricingEngine;
  private config: SyncConfig;
  private isRunning: boolean = false;

  // Casos de uso
  private triggerFullSync: TriggerFullSync;
  private triggerPriceUpdate: TriggerPriceUpdate;
  private compareProductPrices: CompareProductPrices;
  private analyzeMarket: AnalyzeMarket;
  private updateDynamicPrice: UpdateDynamicPrice;
  private getSyncStatus: GetSyncStatus;
  private getSyncMetrics: GetSyncMetrics;
  private getCacheStats: GetCacheStats;
  private getPricingAlerts: GetPricingAlerts;
  private manageProviders: ManageProviders;
  private cleanupOldData: CleanupOldData;
  private healthCheck: HealthCheck;

  // Controlador
  private controller: SyncEngineController;

  constructor(config: SyncConfig, dynamicPricingConfig: DynamicPricingConfig) {
    this.config = config;

    // Inicializar componentes compartidos
    this.jobQueue = new JobQueue(config.maxConcurrentJobs);
    const dataNormalizer = new DataNormalizer();
    const conflictResolver = new ConflictResolver();
    this.priceCache = new PriceCache();
    this.priceComparator = new PriceComparator(this.priceCache);
    this.dynamicPricingEngine = new DynamicPricingEngine(
      this.priceComparator,
      this.priceCache,
      dynamicPricingConfig
    );

    // Inicializar scheduler
    this.scheduler = new SyncScheduler(config, this.jobQueue);

    // Inicializar workers
    this.initializeWorkers(dataNormalizer, conflictResolver);

    // Inicializar proveedores
    this.initializeProviders();

    // Inicializar casos de uso
    this.triggerFullSync = new TriggerFullSync(this.scheduler);
    this.triggerPriceUpdate = new TriggerPriceUpdate(this.scheduler);
    this.compareProductPrices = new CompareProductPrices(this.priceComparator);
    this.analyzeMarket = new AnalyzeMarket(this.priceComparator);
    this.updateDynamicPrice = new UpdateDynamicPrice(this.dynamicPricingEngine);
    this.getSyncStatus = new GetSyncStatus(
      this.isRunning,
      this.scheduler,
      this.workers,
      this.jobQueue,
      this.dynamicPricingEngine
    );
    this.getSyncMetrics = new GetSyncMetrics(this.jobQueue);
    this.getCacheStats = new GetCacheStats(this.priceCache);
    this.getPricingAlerts = new GetPricingAlerts(this.priceComparator);
    this.manageProviders = new ManageProviders();
    this.cleanupOldData = new CleanupOldData(this.jobQueue, this.priceCache);
    this.healthCheck = new HealthCheck(this.priceCache, this.workers, this.scheduler);

    // Inicializar controlador
    this.controller = new SyncEngineController(
      this.triggerFullSync,
      this.triggerPriceUpdate,
      this.compareProductPrices,
      this.analyzeMarket,
      this.updateDynamicPrice,
      this.getSyncStatus,
      this.getSyncMetrics,
      this.getCacheStats,
      this.getPricingAlerts,
      this.manageProviders,
      this.cleanupOldData,
      this.healthCheck
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info('Sync Engine is already running');
      return;
    }

    logger.info('Starting TechNovaStore Sync Engine...');
    this.isRunning = true;

    try {
      // Conectar a Redis
      await this.priceCache.connect();

      // Iniciar scheduler si está habilitado
      if (this.config.enabled) {
        this.scheduler.start();
      } else {
        logger.info('Scheduler disabled in configuration');
      }

      // Iniciar workers si está habilitado
      if (this.config.enabled) {
        await this.startWorkers();
      } else {
        logger.info('Workers disabled in configuration');
      }

      // Iniciar motor de pricing dinámico
      this.dynamicPricingEngine.start();

      logger.info('Sync Engine started successfully');
      logger.info('Configuration', { workers: this.config.maxConcurrentJobs, scheduledTasks: Object.keys(this.config.schedules).length });

    } catch (error) {
      logger.error('Failed to start Sync Engine', { error: error instanceof Error ? error.message : error });
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.info('Sync Engine is not running');
      return;
    }

    logger.info('Stopping TechNovaStore Sync Engine...');
    this.isRunning = false;

    try {
      // Detener motor de pricing dinámico
      this.dynamicPricingEngine.stop();

      // Detener scheduler
      this.scheduler.stop();

      // Detener workers
      await this.stopWorkers();

      // Desconectar de Redis
      await this.priceCache.disconnect();

      logger.info('Sync Engine stopped successfully');

    } catch (error) {
      logger.error('Error stopping Sync Engine', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async restart(): Promise<void> {
    logger.info('Restarting Sync Engine...');
    await this.stop();
    await this.start();
  }

  getController(): SyncEngineController {
    return this.controller;
  }

  private initializeWorkers(dataNormalizer: DataNormalizer, conflictResolver: ConflictResolver): void {
    for (let i = 0; i < this.config.maxConcurrentJobs; i++) {
      const worker = new SyncWorker(
        `worker-${i + 1}`,
        this.jobQueue,
        dataNormalizer,
        conflictResolver
      );
      this.workers.push(worker);
    }

    logger.info('Initialized sync workers', { count: this.workers.length });
  }

  private async startWorkers(): Promise<void> {
    // Iniciar workers en segundo plano (no esperar ya que corren indefinidamente)
    this.workers.forEach(worker => {
      worker.start().catch(error => {
        logger.error('Worker crashed', { workerId: worker.getStatus().id, error: error instanceof Error ? error.message : error });
      });
    });
    logger.info('Started sync workers', { count: this.workers.length });
  }

  private async stopWorkers(): Promise<void> {
    this.workers.forEach(worker => worker.stop());
    logger.info('Stopped sync workers', { count: this.workers.length });
  }

  private initializeProviders(): void {
    const defaultConfigs = AdapterFactory.getDefaultConfigs();

    // Inicializar proveedores con variables de entorno o configuraciones por defecto
    for (const [typeKey, config] of Object.entries(defaultConfigs)) {
      try {
        const type = typeKey as ProviderType;
        
        // En una implementación real, cargarías las API keys desde variables de entorno
        const providerConfig: ProviderConfig = {
          ...config,
          apiKey: process.env[`${type.toUpperCase()}_API_KEY`],
          apiSecret: process.env[`${type.toUpperCase()}_API_SECRET`]
        };

        AdapterFactory.createAdapter(type, providerConfig);
        logger.info('Initialized provider', { provider: config.name });
      } catch (error) {
        logger.warn('Failed to initialize provider', { provider: config.name, error: error instanceof Error ? error.message : error });
      }
    }
  }
}

// Inicializar servicio
const syncEngine = new SyncEngineService(defaultSyncConfig, defaultDynamicPricingConfig);

// Crear aplicación Express
const app = express();
app.use(express.json());

// Registrar rutas
const routes = createRoutes(syncEngine.getController());
app.use('/', routes);

// Middleware de manejo de errores
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Iniciar el servicio
const PORT = process.env.PORT || 3000;

async function startService() {
  try {
    logger.info('Starting TechNovaStore Sync Engine...');

    // Iniciar el sync engine
    await syncEngine.start();

    // Iniciar el servidor HTTP
    app.listen(PORT, () => {
      logger.info('Sync Engine API server running', { port: PORT });
      logger.info('Health check endpoint', { url: `http://localhost:${PORT}/health` });
      logger.info('Status endpoint', { url: `http://localhost:${PORT}/status` });
      logger.info('Metrics endpoint', { url: `http://localhost:${PORT}/metrics` });
    });

  } catch (error) {
    logger.error('Failed to start Sync Engine service', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

// Apagado graceful
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  try {
    await syncEngine.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  try {
    await syncEngine.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
});

// Iniciar el servicio si este archivo se ejecuta directamente
if (require.main === module) {
  startService();
}

export { syncEngine, app };
export * from './shared/types/sync';
export * from './shared/types/provider';
export * from './shared/types/pricing';
