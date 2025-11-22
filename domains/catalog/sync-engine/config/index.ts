/**
 * Configuración del Sync Engine
 */

import { SyncConfig } from '../shared/types/sync';
import { DynamicPricingConfig } from '../shared/types/pricing';

export const syncConfig: SyncConfig = {
  enabled: process.env.SYNC_ENABLED !== 'false',
  schedules: {
    fullSync: process.env.FULL_SYNC_SCHEDULE || '0 2 * * *', // Diario a las 2 AM
    priceUpdate: process.env.PRICE_UPDATE_SCHEDULE || '0 */2 * * *', // Cada 2 horas
    availabilityCheck: process.env.AVAILABILITY_CHECK_SCHEDULE || '0 */6 * * *' // Cada 6 horas
  },
  batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '50'),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5'),
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '5000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3')
};

export const dynamicPricingConfig: DynamicPricingConfig = {
  enabled: process.env.DYNAMIC_PRICING_ENABLED !== 'false',
  update_frequency_minutes: parseInt(process.env.PRICING_UPDATE_FREQUENCY || '30'),
  price_change_threshold: parseFloat(process.env.PRICE_CHANGE_THRESHOLD || '0.02'), // 2%
  max_price_increase_percentage: parseFloat(process.env.MAX_PRICE_INCREASE || '0.15'), // 15%
  max_price_decrease_percentage: parseFloat(process.env.MAX_PRICE_DECREASE || '0.20'), // 20%
  competitor_weight: parseFloat(process.env.COMPETITOR_WEIGHT || '0.7'),
  demand_weight: parseFloat(process.env.DEMAND_WEIGHT || '0.2'),
  inventory_weight: parseFloat(process.env.INVENTORY_WEIGHT || '0.1')
};
