// Synchronization-specific types

export interface SyncJob {
  id: string;
  provider: string;
  type: SyncJobType;
  status: SyncJobStatus;
  priority: number;
  data: any;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  error?: string;
  retry_count: number;
  max_retries: number;
}

export enum SyncJobType {
  FULL_SYNC = 'full_sync',
  PRICE_UPDATE = 'price_update',
  AVAILABILITY_CHECK = 'availability_check',
  PRODUCT_DETAILS = 'product_details'
}

export enum SyncJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface SyncConfig {
  enabled: boolean;
  schedules: {
    fullSync: string; // cron expression
    priceUpdate: string;
    availabilityCheck: string;
  };
  batchSize: number;
  maxConcurrentJobs: number;
  retryDelayMs: number;
  maxRetries: number;
}

export interface NormalizedProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  specifications: Record<string, any>;
  images: string[];
  providers: NormalizedProvider[];
  our_price: number;
  markup_percentage: number;
  is_active: boolean;
  last_synced: Date;
}

export interface NormalizedProvider {
  name: string;
  external_id: string;
  price: number;
  currency: string;
  availability: boolean;
  shipping_cost: number;
  delivery_time: number;
  last_updated: Date;
  url: string;
}

export interface ConflictResolution {
  field: string;
  strategy: ConflictStrategy;
  priority_order?: string[]; // Provider priority order
}

export enum ConflictStrategy {
  LATEST_WINS = 'latest_wins',
  PROVIDER_PRIORITY = 'provider_priority',
  LOWEST_PRICE = 'lowest_price',
  HIGHEST_AVAILABILITY = 'highest_availability',
  MANUAL_REVIEW = 'manual_review'
}

export interface SyncMetrics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  average_duration: number;
  products_processed: number;
  products_updated: number;
  products_added: number;
  errors: string[];
  last_sync: Date;
}