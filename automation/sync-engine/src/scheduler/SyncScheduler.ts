import * as cron from 'node-cron';
import { SyncConfig, SyncJob, SyncJobType, SyncJobStatus } from '../types/sync';
import { ProviderType } from '../types/provider';
import { JobQueue } from '../queue/JobQueue';

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
      console.log('Scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Sync scheduler is disabled');
      return;
    }

    console.log('Starting sync scheduler...');
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

    console.log('Sync scheduler started successfully');
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping sync scheduler...');
    this.isRunning = false;

    // Stop all scheduled tasks
    for (const [name, task] of this.scheduledTasks) {
      task.stop();
      console.log(`Stopped scheduled task: ${name}`);
    }

    this.scheduledTasks.clear();
    console.log('Sync scheduler stopped');
  }

  private scheduleTask(name: string, cronExpression: string, callback: () => void): void {
    try {
      const task = cron.schedule(cronExpression, callback, {
        scheduled: false,
        timezone: 'Europe/Madrid'
      });

      task.start();
      this.scheduledTasks.set(name, task);
      console.log(`Scheduled task "${name}" with expression: ${cronExpression}`);
    } catch (error) {
      console.error(`Failed to schedule task "${name}":`, error);
    }
  }

  private scheduleFullSync(): void {
    console.log('Scheduling full sync jobs...');

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

    console.log(`Scheduled ${providers.length} full sync jobs`);
  }

  private schedulePriceUpdate(): void {
    console.log('Scheduling price update jobs...');

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

    console.log(`Scheduled ${providers.length} price update jobs`);
  }

  private scheduleAvailabilityCheck(): void {
    console.log('Scheduling availability check jobs...');

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

    console.log(`Scheduled ${providers.length} availability check jobs`);
  }

  private generateJobId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isRunning) {
      console.log('Restarting scheduler with new configuration...');
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

    console.log(`Manually triggered full sync for ${targetProviders.length} providers`);
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

    console.log(`Manually triggered price update for ${targetProviders.length} providers`);
  }
}