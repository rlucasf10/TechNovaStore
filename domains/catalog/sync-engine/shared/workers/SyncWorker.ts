import { SyncJob, SyncJobType, SyncJobStatus } from '../types/sync';
import { ProviderAdapter, ProviderType } from '../types/provider';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { JobQueue } from '../queue/JobQueue';
import { DataNormalizer } from '../normalizer/DataNormalizer';
import { ConflictResolver } from '../resolver/ConflictResolver';
import { createLogger } from '@technovastore/shared-config';

const logger = createLogger('sync-engine-worker');

export class SyncWorker {
  private id: string;
  private isRunning: boolean = false;
  private jobQueue: JobQueue;
  private dataNormalizer: DataNormalizer;
  private conflictResolver: ConflictResolver;
  private currentJob: SyncJob | null = null;

  constructor(
    id: string,
    jobQueue: JobQueue,
    dataNormalizer: DataNormalizer,
    conflictResolver: ConflictResolver
  ) {
    this.id = id;
    this.jobQueue = jobQueue;
    this.dataNormalizer = dataNormalizer;
    this.conflictResolver = conflictResolver;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info('Worker is already running', { workerId: this.id });
      return;
    }

    logger.info('Starting worker', { workerId: this.id });
    this.isRunning = true;

    while (this.isRunning) {
      try {
        const job = this.jobQueue.getNextJob();
        
        if (!job) {
          // No jobs available, wait a bit
          await this.sleep(1000);
          continue;
        }

        this.currentJob = job;
        logger.info('Worker processing job', { workerId: this.id, jobId: job.id, jobType: job.type });

        await this.processJob(job);
        
        this.jobQueue.completeJob(job.id);
        logger.info('Worker completed job', { workerId: this.id, jobId: job.id });
        
      } catch (error) {
        logger.error('Worker error', { workerId: this.id, error: error instanceof Error ? error.message : error });
        
        if (this.currentJob) {
          this.jobQueue.completeJob(this.currentJob.id, error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        this.currentJob = null;
      }
    }

    logger.info('Worker stopped', { workerId: this.id });
  }

  stop(): void {
    logger.info('Stopping worker', { workerId: this.id });
    this.isRunning = false;
  }

  private async processJob(job: SyncJob): Promise<void> {
    const adapter = this.getAdapter(job.provider as ProviderType);
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${job.provider}`);
    }

    // Check adapter health
    const isHealthy = await adapter.isHealthy();
    if (!isHealthy) {
      throw new Error(`Provider ${job.provider} is not healthy`);
    }

    switch (job.type) {
      case SyncJobType.FULL_SYNC:
        await this.processFullSync(adapter, job);
        break;
      case SyncJobType.PRICE_UPDATE:
        await this.processPriceUpdate(adapter, job);
        break;
      case SyncJobType.AVAILABILITY_CHECK:
        await this.processAvailabilityCheck(adapter, job);
        break;
      case SyncJobType.PRODUCT_DETAILS:
        await this.processProductDetails(adapter, job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private async processFullSync(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const categories = job.data.categories || ['electronics'];
    let totalProcessed = 0;

    for (const category of categories) {
      logger.info('Syncing category', { category, provider: adapter.name });
      
      try {
        // Search for products in this category
        const products = await adapter.searchProducts('', {
          category,
          limit: 100 // Process in batches
        });

        logger.info('Found products in category', { category, count: products.length });

        for (const product of products) {
          try {
            // Normalize the product data
            const normalizedProduct = await this.dataNormalizer.normalizeProduct(product, adapter.name);
            
            // Resolve conflicts if product already exists
            const resolvedProduct = await this.conflictResolver.resolveProduct(normalizedProduct);
            
            // Save to database (this would be implemented in a service layer)
            await this.saveProduct(resolvedProduct);
            
            totalProcessed++;
          } catch (error) {
            logger.error('Error processing product', { productId: product.id, error: error instanceof Error ? error.message : error });
          }
        }
      } catch (error) {
        logger.error('Error syncing category', { category, error: error instanceof Error ? error.message : error });
      }
    }

    logger.info('Full sync completed', { provider: adapter.name, productsProcessed: totalProcessed });
  }

  private async processPriceUpdate(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const batchSize = job.data.batch_size || 50;
    
    // Get products that need price updates (this would come from database)
    const productsToUpdate = await this.getProductsForPriceUpdate(adapter.name, batchSize);
    
    logger.info('Updating prices for products', { count: productsToUpdate.length, provider: adapter.name });
    
    let updatedCount = 0;
    
    for (const productInfo of productsToUpdate) {
      try {
        const currentPrice = await adapter.getPrice(productInfo.external_id);
        
        if (currentPrice !== null && currentPrice !== productInfo.current_price) {
          // Price has changed, update it
          await this.updateProductPrice(productInfo.sku, adapter.name, currentPrice);
          updatedCount++;
          logger.info('Updated price for product', { sku: productInfo.sku, oldPrice: productInfo.current_price, newPrice: currentPrice });
        }
      } catch (error) {
        logger.error('Error updating price for product', { sku: productInfo.sku, error: error instanceof Error ? error.message : error });
      }
    }

    logger.info('Price update completed', { provider: adapter.name, pricesUpdated: updatedCount });
  }

  private async processAvailabilityCheck(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const batchSize = job.data.batch_size || 100;
    
    // Get products that need availability checks
    const productsToCheck = await this.getProductsForAvailabilityCheck(adapter.name, batchSize);
    
    logger.info('Checking availability for products', { count: productsToCheck.length, provider: adapter.name });
    
    let updatedCount = 0;
    
    for (const productInfo of productsToCheck) {
      try {
        const isAvailable = await adapter.checkAvailability(productInfo.external_id);
        
        if (isAvailable !== productInfo.current_availability) {
          // Availability has changed, update it
          await this.updateProductAvailability(productInfo.sku, adapter.name, isAvailable);
          updatedCount++;
          logger.info('Updated availability for product', { sku: productInfo.sku, oldAvailability: productInfo.current_availability, newAvailability: isAvailable });
        }
      } catch (error) {
        logger.error('Error checking availability for product', { sku: productInfo.sku, error: error instanceof Error ? error.message : error });
      }
    }

    logger.info('Availability check completed', { provider: adapter.name, availabilitiesUpdated: updatedCount });
  }

  private async processProductDetails(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const productId = job.data.product_id;
    
    if (!productId) {
      throw new Error('Product ID is required for product details job');
    }

    logger.info('Fetching product details', { productId, provider: adapter.name });
    
    const product = await adapter.getProduct(productId);
    
    if (!product) {
      throw new Error(`Product ${productId} not found on ${adapter.name}`);
    }

    // Normalize and save the product
    const normalizedProduct = await this.dataNormalizer.normalizeProduct(product, adapter.name);
    const resolvedProduct = await this.conflictResolver.resolveProduct(normalizedProduct);
    await this.saveProduct(resolvedProduct);

    logger.info('Product details updated', { productId });
  }

  private getAdapter(providerType: ProviderType): ProviderAdapter | undefined {
    return AdapterFactory.getAdapter(providerType);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // These methods would be implemented to interact with the database
  private async saveProduct(product: any): Promise<void> {
    // TODO: Implement database save logic
    logger.debug('Saving product', { sku: product.sku });
  }

  private async getProductsForPriceUpdate(provider: string, limit: number): Promise<any[]> {
    // TODO: Implement database query to get products needing price updates
    logger.debug('Getting products for price update', { limit, provider });
    return [];
  }

  private async getProductsForAvailabilityCheck(provider: string, limit: number): Promise<any[]> {
    // TODO: Implement database query to get products needing availability checks
    logger.debug('Getting products for availability check', { limit, provider });
    return [];
  }

  private async updateProductPrice(sku: string, provider: string, newPrice: number): Promise<void> {
    // TODO: Implement database update for product price
    logger.debug('Updating price for product', { sku, provider, newPrice });
  }

  private async updateProductAvailability(sku: string, provider: string, availability: boolean): Promise<void> {
    // TODO: Implement database update for product availability
    logger.debug('Updating availability for product', { sku, provider, availability });
  }

  getStatus(): {
    id: string;
    isRunning: boolean;
    currentJob: SyncJob | null;
  } {
    return {
      id: this.id,
      isRunning: this.isRunning,
      currentJob: this.currentJob
    };
  }
}