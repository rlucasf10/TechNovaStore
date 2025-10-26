import { SyncScheduler } from './scheduler/SyncScheduler';
import { JobQueue } from './queue/JobQueue';
import { SyncWorker } from './workers/SyncWorker';
import { DataNormalizer } from './normalizer/DataNormalizer';
import { ConflictResolver } from './resolver/ConflictResolver';
import { PriceComparator } from './pricing/PriceComparator';
import { PriceCache } from './pricing/PriceCache';
import { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
import { AdapterFactory } from './adapters/AdapterFactory';
import {
  SyncConfig,
  SyncMetrics,
  SyncJob
} from './types/sync';
import { DynamicPricingConfig } from './types/pricing';
import { ProviderType, ProviderConfig } from './types/provider';

export class SyncEngineService {
  private scheduler: SyncScheduler;
  private jobQueue: JobQueue;
  private workers: SyncWorker[] = [];
  private dataNormalizer: DataNormalizer;
  private conflictResolver: ConflictResolver;
  private priceComparator: PriceComparator;
  private priceCache: PriceCache;
  private dynamicPricingEngine: DynamicPricingEngine;
  private config: SyncConfig;
  private isRunning: boolean = false;

  constructor(config: SyncConfig, dynamicPricingConfig: DynamicPricingConfig) {
    this.config = config;

    // Initialize core components
    this.jobQueue = new JobQueue(config.maxConcurrentJobs);
    this.dataNormalizer = new DataNormalizer();
    this.conflictResolver = new ConflictResolver();
    this.priceCache = new PriceCache();
    this.priceComparator = new PriceComparator(this.priceCache);
    this.dynamicPricingEngine = new DynamicPricingEngine(
      this.priceComparator,
      this.priceCache,
      dynamicPricingConfig
    );

    // Initialize scheduler
    this.scheduler = new SyncScheduler(config, this.jobQueue);

    // Initialize workers
    this.initializeWorkers();

    // Initialize provider adapters
    this.initializeProviders();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Sync Engine is already running');
      return;
    }

    console.log('Starting TechNovaStore Sync Engine...');
    this.isRunning = true;

    try {
      // Connect to Redis
      await this.priceCache.connect();

      // Start scheduler only if enabled
      if (this.config.enabled) {
        this.scheduler.start();
      } else {
        console.log('Scheduler disabled in configuration');
      }

      // Start workers only if enabled
      if (this.config.enabled) {
        await this.startWorkers();
      } else {
        console.log('Workers disabled in configuration');
      }

      // Start dynamic pricing engine
      this.dynamicPricingEngine.start();

      console.log('✅ Sync Engine started successfully');
      console.log(`📊 Configuration: ${this.config.maxConcurrentJobs} workers, ${Object.keys(this.config.schedules).length} scheduled tasks`);

    } catch (error) {
      console.error('❌ Failed to start Sync Engine:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Sync Engine is not running');
      return;
    }

    console.log('Stopping TechNovaStore Sync Engine...');
    this.isRunning = false;

    try {
      // Stop dynamic pricing engine
      this.dynamicPricingEngine.stop();

      // Stop scheduler
      this.scheduler.stop();

      // Stop workers
      await this.stopWorkers();

      // Disconnect from Redis
      await this.priceCache.disconnect();

      console.log('✅ Sync Engine stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping Sync Engine:', error);
      throw error;
    }
  }

  async restart(): Promise<void> {
    console.log('Restarting Sync Engine...');
    await this.stop();
    await this.start();
  }

  // Manual sync triggers
  async triggerFullSync(providers?: ProviderType[]): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Sync Engine is not running');
    }

    console.log('Triggering manual full sync...');
    this.scheduler.triggerFullSync(providers);
  }

  async triggerPriceUpdate(providers?: ProviderType[]): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Sync Engine is not running');
    }

    console.log('Triggering manual price update...');
    this.scheduler.triggerPriceUpdate(providers);
  }

  async compareProductPrices(sku: string, productName: string) {
    return await this.priceComparator.compareProductPrices(sku, productName);
  }

  async analyzeMarket(sku: string) {
    return await this.priceComparator.analyzeMarket(sku);
  }

  async updateDynamicPrice(sku: string, productName: string) {
    return await this.dynamicPricingEngine.updateProductPrice(sku, productName);
  }

  // Status and metrics
  getStatus(): {
    isRunning: boolean;
    scheduler: any;
    workers: any[];
    jobQueue: any;
    dynamicPricing: any;
  } {
    return {
      isRunning: this.isRunning,
      scheduler: this.scheduler.getStatus(),
      workers: this.workers.map(w => w.getStatus()),
      jobQueue: this.jobQueue.getQueueStats(),
      dynamicPricing: this.dynamicPricingEngine.getStatus()
    };
  }

  async getMetrics(): Promise<SyncMetrics> {
    const queueStats = this.jobQueue.getQueueStats();
    const jobHistory = this.jobQueue.getJobHistory(100);

    const completedJobs = jobHistory.filter(j => j.status === 'completed');
    const failedJobs = jobHistory.filter(j => j.status === 'failed');

    // Calculate average duration for completed jobs
    const durations = completedJobs
      .filter(j => j.started_at && j.completed_at)
      .map(j => j.completed_at!.getTime() - j.started_at!.getTime());

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Get recent sync results
    const recentJobs = jobHistory.slice(0, 50);
    const productsProcessed = recentJobs.length; // Simplified
    const productsUpdated = completedJobs.length;
    const productsAdded = 0; // Would be calculated from actual sync results

    return {
      total_jobs: queueStats.total,
      completed_jobs: queueStats.completed,
      failed_jobs: queueStats.failed,
      average_duration: Math.round(averageDuration),
      products_processed: productsProcessed,
      products_updated: productsUpdated,
      products_added: productsAdded,
      errors: failedJobs.map(j => j.error || 'Unknown error'),
      last_sync: completedJobs.length > 0 ? completedJobs[0].completed_at! : new Date()
    };
  }

  async getCacheStats() {
    return await this.priceCache.getCacheStats();
  }

  getPricingAlerts() {
    return this.priceComparator.getAlerts();
  }

  // Configuration updates
  updateSyncConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.scheduler.updateConfig(this.config);
    this.jobQueue.updateMaxConcurrentJobs(this.config.maxConcurrentJobs);
  }

  updateDynamicPricingConfig(newConfig: Partial<DynamicPricingConfig>): void {
    this.dynamicPricingEngine.updateConfig(newConfig);
  }

  // Provider management
  addProvider(type: ProviderType, config: ProviderConfig): void {
    AdapterFactory.createAdapter(type, config);
    console.log(`Added provider: ${config.name}`);
  }

  removeProvider(type: ProviderType, name?: string): boolean {
    const removed = AdapterFactory.removeAdapter(type, name);
    if (removed) {
      console.log(`Removed provider: ${type}${name ? ` (${name})` : ''}`);
    }
    return removed;
  }

  getProviders() {
    return AdapterFactory.getAllAdapters().map(adapter => ({
      name: adapter.name,
      rateLimit: adapter.getRateLimit(),
      // Add health status check
    }));
  }

  // Private methods
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxConcurrentJobs; i++) {
      const worker = new SyncWorker(
        `worker-${i + 1}`,
        this.jobQueue,
        this.dataNormalizer,
        this.conflictResolver
      );
      this.workers.push(worker);
    }

    console.log(`Initialized ${this.workers.length} sync workers`);
  }

  private async startWorkers(): Promise<void> {
    // Start workers in background (don't await them as they run indefinitely)
    this.workers.forEach(worker => {
      worker.start().catch(error => {
        console.error(`Worker ${worker.getStatus().id} crashed:`, error);
      });
    });
    console.log(`Started ${this.workers.length} sync workers`);
  }

  private async stopWorkers(): Promise<void> {
    this.workers.forEach(worker => worker.stop());
    console.log(`Stopped ${this.workers.length} sync workers`);
  }

  private initializeProviders(): void {
    const defaultConfigs = AdapterFactory.getDefaultConfigs();

    // Initialize providers with environment variables or default configs
    for (const [typeKey, config] of Object.entries(defaultConfigs)) {
      try {
        const type = typeKey as ProviderType;
        
        // In a real implementation, you would load API keys from environment variables
        const providerConfig: ProviderConfig = {
          ...config,
          apiKey: process.env[`${type.toUpperCase()}_API_KEY`],
          apiSecret: process.env[`${type.toUpperCase()}_API_SECRET`]
        };

        AdapterFactory.createAdapter(type, providerConfig);
        console.log(`✅ Initialized provider: ${config.name}`);
      } catch (error) {
        console.warn(`⚠️  Failed to initialize provider ${config.name}:`, error);
      }
    }
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    console.log('Running cleanup tasks...');

    try {
      // Clear old completed jobs
      const clearedJobs = this.jobQueue.clearCompletedJobs(24);
      console.log(`Cleared ${clearedJobs} old completed jobs`);

      // Clear expired cache entries
      await this.priceCache.clearExpiredEntries();

      console.log('Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    message: string;
  }> {
    const components: Record<string, boolean> = {};

    try {
      // Check Redis connection
      components.redis = this.priceCache['redis']?.isOpen || false;

      // Check if workers are running
      components.workers = this.workers.every(w => w.getStatus().isRunning);

      // Check scheduler
      components.scheduler = this.scheduler.getStatus().isRunning;

      // Check providers
      const providers = AdapterFactory.getAllAdapters();
      const healthChecks = await Promise.all(
        providers.map(async (adapter) => {
          try {
            return await adapter.isHealthy();
          } catch {
            return false;
          }
        })
      );
      components.providers = healthChecks.some(healthy => healthy);

      const healthyComponents = Object.values(components).filter(Boolean).length;
      const totalComponents = Object.keys(components).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;

      if (healthyComponents === totalComponents) {
        status = 'healthy';
        message = 'All systems operational';
      } else if (healthyComponents >= totalComponents * 0.5) {
        status = 'degraded';
        message = `${healthyComponents}/${totalComponents} components healthy`;
      } else {
        status = 'unhealthy';
        message = `Only ${healthyComponents}/${totalComponents} components healthy`;
      }

      return { status, components, message };

    } catch (error) {
      return {
        status: 'unhealthy',
        components,
        message: `Health check failed: ${error}`
      };
    }
  }
}