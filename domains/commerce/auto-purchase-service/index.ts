/**
 * Entry Point del Auto-Purchase Service
 * 
 * Inicializa todos los casos de uso, configura el servidor Express
 * y arranca el sistema de auto-compra.
 * 
 * REFACTORIZADO A SCREAMING ARCHITECTURE
 */

import express from 'express';
import { logger } from './shared/utils/logger';
import { TEST_CONFIG } from './shared/config/test';

// Casos de Uso
import { ExecutePurchase } from './execute-purchase/ExecutePurchase';
import { SelectProvider } from './select-provider/SelectProvider';
import { PlaceOrder } from './place-order/PlaceOrder';
import { HandleConfirmation } from './handle-confirmation/HandleConfirmation';
import { CalculateCost } from './calculate-cost/CalculateCost';
import { OrchestratePurchase, AutoPurchaseConfig } from './orchestrate-purchase/OrchestratePurchase';
import { ProcessOrdersBatch } from './process-orders-batch/ProcessOrdersBatch';
import { GetPurchaseStatus } from './get-purchase-status/GetPurchaseStatus';
import { CancelPurchase } from './cancel-purchase/CancelPurchase';

// Shared Infrastructure
import { ProviderAvailabilityChecker } from './shared/utils/ProviderAvailabilityChecker';
import { OrderServiceClient } from './shared/clients/OrderServiceClient';
import { MockOrderServiceClient } from './shared/clients/MockOrderServiceClient';

// API Layer
import { AutoPurchaseController } from './api/AutoPurchaseController';
import { createRoutes } from './api/routes';

const app = express();
const port = process.env.PORT || 3005;

app.use(express.json());

// Default configuration
const defaultConfig: AutoPurchaseConfig = {
  orderService: {
    baseUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.ORDER_SERVICE_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.ORDER_SERVICE_RETRY_ATTEMPTS || '3'),
    apiKey: process.env.ORDER_SERVICE_API_KEY
  },
  enableConfirmationHandling: TEST_CONFIG.DISABLE_ORDER_SERVICE 
    ? false 
    : process.env.ENABLE_CONFIRMATION_HANDLING !== 'false',
  maxConcurrentPurchases: parseInt(process.env.MAX_CONCURRENT_PURCHASES || '5'),
  purchaseTimeoutMs: TEST_CONFIG.PURCHASE_TIMEOUT_MS || parseInt(process.env.PURCHASE_TIMEOUT_MS || '300000')
};

// Initialize shared infrastructure
const availabilityChecker = new ProviderAvailabilityChecker();
const costCalculator = new CalculateCost();
const orderServiceClient = TEST_CONFIG.DISABLE_ORDER_SERVICE
  ? new MockOrderServiceClient()
  : new OrderServiceClient(defaultConfig.orderService);

// Initialize use cases
const placeOrder = new PlaceOrder();
const selectProvider = new SelectProvider(costCalculator, availabilityChecker);
const handleConfirmation = new HandleConfirmation();
const executePurchase = new ExecutePurchase(selectProvider, placeOrder);
const orchestratePurchase = new OrchestratePurchase(
  defaultConfig,
  executePurchase,
  handleConfirmation,
  orderServiceClient
);
const processOrdersBatch = new ProcessOrdersBatch(
  defaultConfig.maxConcurrentPurchases,
  orchestratePurchase
);

// Initialize controller
const controller = new AutoPurchaseController(
  orchestratePurchase,
  selectProvider,
  processOrdersBatch,
  orderServiceClient,
  defaultConfig.maxConcurrentPurchases,
  defaultConfig.enableConfirmationHandling
);

// Setup routes
const routes = createRoutes(controller);
app.use('/', routes);

/**
 * Main function to start the auto-purchase system
 */
async function startAutoPurchaseSystem(): Promise<void> {
  try {
    logger.info('Starting TechNovaStore Auto-Purchase System', {
      config: {
        orderServiceUrl: defaultConfig.orderService.baseUrl,
        enableConfirmationHandling: defaultConfig.enableConfirmationHandling,
        maxConcurrentPurchases: defaultConfig.maxConcurrentPurchases
      }
    });

    // Health check
    const healthCheck = await orderServiceClient.healthCheck();
    if (!healthCheck.success) {
      logger.warn('Order Service health check failed, but continuing with service startup', {
        error: healthCheck.error
      });
    } else {
      logger.info('Order Service health check passed');
    }

    // Start the Express server
    app.listen(port, () => {
      logger.info(`Auto Purchase Service running on port ${port}`);
    });

    // Start the processing loop
    // TODO: Implementar startProcessingLoop como caso de uso separado
    // await orchestrator.startProcessingLoop(60000);

  } catch (error) {
    logger.error('Failed to start Auto-Purchase System', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Export use cases and infrastructure for testing
export {
  // Use Cases
  ExecutePurchase,
  SelectProvider,
  PlaceOrder,
  HandleConfirmation,
  CalculateCost,
  OrchestratePurchase,
  ProcessOrdersBatch,
  GetPurchaseStatus,
  CancelPurchase,
  
  // Infrastructure
  OrderServiceClient,
  ProviderAvailabilityChecker,
  
  // Instances
  executePurchase,
  selectProvider,
  placeOrder,
  handleConfirmation,
  costCalculator,
  orchestratePurchase,
  processOrdersBatch,
  orderServiceClient,
  
  // Function
  startAutoPurchaseSystem
};

// Export types
export * from './shared/types/provider';
export * from './execute-purchase/ExecutePurchase';
export * from './place-order/PlaceOrder';
export * from './handle-confirmation/HandleConfirmation';
export * from './orchestrate-purchase/OrchestratePurchase';

// Start the system if this file is run directly
if (require.main === module) {
  startAutoPurchaseSystem().catch(error => {
    logger.error('Unhandled error in Auto-Purchase System', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  });
}
