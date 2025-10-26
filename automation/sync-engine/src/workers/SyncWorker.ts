import { SyncJob, SyncJobType, SyncJobStatus } from '../types/sync';
import { ProviderAdapter, ProviderType } from '../types/provider';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { JobQueue } from '../queue/JobQueue';
import { DataNormalizer } from '../normalizer/DataNormalizer';
import { ConflictResolver } from '../resolver/ConflictResolver';

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
      console.log(`Worker ${this.id} is already running`);
      return;
    }

    console.log(`Starting worker ${this.id}...`);
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
        console.log(`Worker ${this.id} processing job ${job.id} (${job.type})`);

        await this.processJob(job);
        
        this.jobQueue.completeJob(job.id);
        console.log(`Worker ${this.id} completed job ${job.id}`);
        
      } catch (error) {
        console.error(`Worker ${this.id} error:`, error);
        
        if (this.currentJob) {
          this.jobQueue.completeJob(this.currentJob.id, error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        this.currentJob = null;
      }
    }

    console.log(`Worker ${this.id} stopped`);
  }

  stop(): void {
    console.log(`Stopping worker ${this.id}...`);
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
      console.log(`Syncing category ${category} from ${adapter.name}...`);
      
      try {
        // Search for products in this category
        const products = await adapter.searchProducts('', {
          category,
          limit: 100 // Process in batches
        });

        console.log(`Found ${products.length} products in category ${category}`);

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
            console.error(`Error processing product ${product.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error syncing category ${category}:`, error);
      }
    }

    console.log(`Full sync completed for ${adapter.name}: ${totalProcessed} products processed`);
  }

  private async processPriceUpdate(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const batchSize = job.data.batch_size || 50;
    
    // Get products that need price updates (this would come from database)
    const productsToUpdate = await this.getProductsForPriceUpdate(adapter.name, batchSize);
    
    console.log(`Updating prices for ${productsToUpdate.length} products from ${adapter.name}`);
    
    let updatedCount = 0;
    
    for (const productInfo of productsToUpdate) {
      try {
        const currentPrice = await adapter.getPrice(productInfo.external_id);
        
        if (currentPrice !== null && currentPrice !== productInfo.current_price) {
          // Price has changed, update it
          await this.updateProductPrice(productInfo.sku, adapter.name, currentPrice);
          updatedCount++;
          console.log(`Updated price for ${productInfo.sku}: ${productInfo.current_price} -> ${currentPrice}`);
        }
      } catch (error) {
        console.error(`Error updating price for product ${productInfo.sku}:`, error);
      }
    }

    console.log(`Price update completed for ${adapter.name}: ${updatedCount} prices updated`);
  }

  private async processAvailabilityCheck(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const batchSize = job.data.batch_size || 100;
    
    // Get products that need availability checks
    const productsToCheck = await this.getProductsForAvailabilityCheck(adapter.name, batchSize);
    
    console.log(`Checking availability for ${productsToCheck.length} products from ${adapter.name}`);
    
    let updatedCount = 0;
    
    for (const productInfo of productsToCheck) {
      try {
        const isAvailable = await adapter.checkAvailability(productInfo.external_id);
        
        if (isAvailable !== productInfo.current_availability) {
          // Availability has changed, update it
          await this.updateProductAvailability(productInfo.sku, adapter.name, isAvailable);
          updatedCount++;
          console.log(`Updated availability for ${productInfo.sku}: ${productInfo.current_availability} -> ${isAvailable}`);
        }
      } catch (error) {
        console.error(`Error checking availability for product ${productInfo.sku}:`, error);
      }
    }

    console.log(`Availability check completed for ${adapter.name}: ${updatedCount} availabilities updated`);
  }

  private async processProductDetails(adapter: ProviderAdapter, job: SyncJob): Promise<void> {
    const productId = job.data.product_id;
    
    if (!productId) {
      throw new Error('Product ID is required for product details job');
    }

    console.log(`Fetching product details for ${productId} from ${adapter.name}`);
    
    const product = await adapter.getProduct(productId);
    
    if (!product) {
      throw new Error(`Product ${productId} not found on ${adapter.name}`);
    }

    // Normalize and save the product
    const normalizedProduct = await this.dataNormalizer.normalizeProduct(product, adapter.name);
    const resolvedProduct = await this.conflictResolver.resolveProduct(normalizedProduct);
    await this.saveProduct(resolvedProduct);

    console.log(`Product details updated for ${productId}`);
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
    console.log(`Saving product: ${product.sku}`);
  }

  private async getProductsForPriceUpdate(provider: string, limit: number): Promise<any[]> {
    // TODO: Implement database query to get products needing price updates
    console.log(`Getting ${limit} products for price update from ${provider}`);
    return [];
  }

  private async getProductsForAvailabilityCheck(provider: string, limit: number): Promise<any[]> {
    // TODO: Implement database query to get products needing availability checks
    console.log(`Getting ${limit} products for availability check from ${provider}`);
    return [];
  }

  private async updateProductPrice(sku: string, provider: string, newPrice: number): Promise<void> {
    // TODO: Implement database update for product price
    console.log(`Updating price for ${sku} from ${provider}: ${newPrice}`);
  }

  private async updateProductAvailability(sku: string, provider: string, availability: boolean): Promise<void> {
    // TODO: Implement database update for product availability
    console.log(`Updating availability for ${sku} from ${provider}: ${availability}`);
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