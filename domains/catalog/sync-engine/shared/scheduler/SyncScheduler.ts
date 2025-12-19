import * as cron from 'node-cron';
import { SyncConfig, SyncJob, SyncJobType, SyncJobStatus } from '../types/sync';
import { ProviderType } from '../types/provider';
import { JobQueue } from '../queue/JobQueue';
import { createLogger } from '@technovastore/shared-config';

const logger = createLogger('sync-engine-scheduler');

export class SyncScheduler {
  private config: SyncConfig;
  private jobQueue: JobQueue;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor(config: SyncConfig, jobQueue: JobQueue) {
    this.config = config;
    this.jobQueue = jobQueue;
  }

  start(): void {
    if (this.isRunning) {
      logger.info('Scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      logger.info('Sync scheduler is disabled');
      return;
    }

    logger.info('Starting sync scheduler...');
    this.isRunning = true;

    // Schedule full sync
    this.scheduleTask('fullSync', this.config.schedules.fullSync, () => {
      this.scheduleFullSync();
    });

    // Schedule price updates
    this.scheduleTask('priceUpdate', this.config.schedules.priceUpdate, () => {
      this.schedulePriceUpdate();
    });

    // Schedule availability checks
    this.scheduleTask('availabilityCheck', this.config.schedules.availabilityCheck, () => {
      this.scheduleAvailabilityCheck();
    });

    logger.info('Sync scheduler started successfully');
  }

  stop(): void {
    if (!this.isRunning) {
      logger.info('Scheduler is not running');
      return;
    }

    logger.info('Stopping sync scheduler...');
    this.isRunning = false;

    // Stop all scheduled tasks
    for (const [name, task] of this.scheduledTasks) {
      task.stop();
      logger.info('Stopped scheduled task', { taskName: name });
    }

    this.scheduledTasks.clear();
    logger.info('Sync scheduler stopped');
  }

  private scheduleTask(name: string, cronExpression: string, callback: () => void): void {
    try {
      const task = cron.schedule(cronExpression, callback, {
        scheduled: false,
        timezone: 'Europe/Madrid'
      });

      task.start();
      this.scheduledTasks.set(name, task);
      logger.info('Scheduled task', { taskName: name, cronExpression });
    } catch (error) {
      logger.error('Failed to schedule task', { taskName: name, error: error instanceof Error ? error.message : error });
    }
  }

  private scheduleFullSync(): void {
    logger.info('Scheduling full sync jobs...');

    const providers = Object.values(ProviderType);

    for (const provider of providers) {
      const job: SyncJob = {
        id: this.generateJobId(),
        provider,
        type: SyncJobType.FULL_SYNC,
        status: SyncJobStatus.PENDING,
        priority: 1, // High priority for full sync
        data: {
          categories: ['computers', 'electronics', 'phones', 'tablets', 'gaming', 'accessories']
        },
        created_at: new Date(),
        retry_count: 0,
        max_retries: this.config.maxRetries
      };

      this.jobQueue.addJob(job);
    }

    logger.info('Scheduled full sync jobs', { count: providers.length });
  }

  private schedulePriceUpdate(): void {
    logger.info('Scheduling price update jobs...');

    const providers = Object.values(ProviderType);

    for (const provider of providers) {
      const job: SyncJob = {
        id: this.generateJobId(),
        provider,
        type: SyncJobType.PRICE_UPDATE,
        status: SyncJobStatus.PENDING,
        priority: 2, // Medium priority
        data: {
          batch_size: this.config.batchSize
        },
        created_at: new Date(),
        retry_count: 0,
        max_retries: this.config.maxRetries
      };

      this.jobQueue.addJob(job);
    }

    logger.info('Scheduled price update jobs', { count: providers.length });
  }

  private scheduleAvailabilityCheck(): void {
    logger.info('Scheduling availability check jobs...');

    const providers = Object.values(ProviderType);

    for (const provider of providers) {
      const job: SyncJob = {
        id: this.generateJobId(),
        provider,
        type: SyncJobType.AVAILABILITY_CHECK,
        status: SyncJobStatus.PENDING,
        priority: 3, // Lower priority
        data: {
          batch_size: this.config.batchSize * 2 // Larger batches for availability checks
        },
        created_at: new Date(),
        retry_count: 0,
        max_retries: this.config.maxRetries
      };

      this.jobQueue.addJob(job);
    }

    logger.info('Scheduled availability check jobs', { count: providers.length });
  }

  private generateJobId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isRunning) {
      logger.info('Restarting scheduler with new configuration...');
      this.stop();
      this.start();
    }
  }

  getStatus(): { isRunning: boolean; scheduledTasks: string[] } {
    return {
      isRunning: this.isRunning,
      scheduledTasks: Array.from(this.scheduledTasks.keys())
    };
  }

  // Manual trigger methods
  triggerFullSync(providers?: ProviderType[]): void {
    const targetProviders = providers || Object.values(ProviderType);

    for (const provider of targetProviders) {
      const job: SyncJob = {
        id: this.generateJobId(),
        provider,
        type: SyncJobType.FULL_SYNC,
        status: SyncJobStatus.PENDING,
        priority: 0, // Highest priority for manual triggers
        data: {
          categories: ['computers', 'electronics', 'phones', 'tablets', 'gaming', 'accessories'],
          manual: true
        },
        created_at: new Date(),
        retry_count: 0,
        max_retries: this.config.maxRetries
      };

      this.jobQueue.addJob(job);
    }

    logger.info('Manually triggered full sync', { providersCount: targetProviders.length });
  }

  triggerPriceUpdate(providers?: ProviderType[]): void {
    const targetProviders = providers || Object.values(ProviderType);

    for (const provider of targetProviders) {
      const job: SyncJob = {
        id: this.generateJobId(),
        provider,
        type: SyncJobType.PRICE_UPDATE,
        status: SyncJobStatus.PENDING,
        priority: 0, // Highest priority for manual triggers
        data: {
          batch_size: this.config.batchSize,
          manual: true
        },
        created_at: new Date(),
        retry_count: 0,
        max_retries: this.config.maxRetries
      };

      this.jobQueue.addJob(job);
    }

    logger.info('Manually triggered price update', { providersCount: targetProviders.length });
  }
}