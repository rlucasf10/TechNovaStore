import express from 'express';
import { AutoPurchaseOrchestrator, AutoPurchaseConfig } from './services/autoPurchaseOrchestrator';
import { AutoPurchaseService } from './services/autoPurchaseService';
import { ProviderSelector } from './services/providerSelector';
import { OrderPlacer } from './services/orderPlacer';
import { ConfirmationHandler } from './services/confirmationHandler';
import { OrderServiceClient } from './services/orderServiceClient';
import { logger } from './utils/logger';

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
  enableConfirmationHandling: process.env.ENABLE_CONFIRMATION_HANDLING !== 'false',
  maxConcurrentPurchases: parseInt(process.env.MAX_CONCURRENT_PURCHASES || '5'),
  purchaseTimeoutMs: parseInt(process.env.PURCHASE_TIMEOUT_MS || '300000') // 5 minutes
};

// Initialize orchestrator and services
const orchestrator = new AutoPurchaseOrchestrator(defaultConfig);
const providerSelector = new ProviderSelector();
const autoPurchaseService = new AutoPurchaseService(providerSelector);
const orderPlacer = new OrderPlacer();
const confirmationHandler = new ConfirmationHandler();
const orderServiceClient = new OrderServiceClient(defaultConfig.orderService);

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = orchestrator.getProcessingStats();
  res.json({ 
    status: 'healthy', 
    service: 'auto-purchase',
    stats
  });
});

// Provider selection endpoint for testing
app.post('/select-provider', async (req, res) => {
  try {
    const { productSku, quantity, shippingAddress } = req.body;
    
    const selectedProvider = await providerSelector.selectBestProvider(
      productSku,
      quantity,
      shippingAddress
    );
    
    res.json({
      success: true,
      data: selectedProvider
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual purchase trigger endpoint for testing
app.post('/purchase', async (req, res) => {
  try {
    const order = req.body;
    
    const result = await orchestrator.orchestratePurchase(order);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing statistics
app.get('/stats', (req, res) => {
  const stats = orchestrator.getProcessingStats();
  res.json(stats);
});

// Process pending orders endpoint
app.post('/process-pending', async (req, res) => {
  try {
    const orders = await orchestrator.getOrdersForProcessing();
    const results = await orchestrator.processOrdersBatch(orders);
    
    res.json({
      success: true,
      data: {
        processedOrders: results.length,
        successfulOrders: results.filter(r => r.success).length,
        failedOrders: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Main function to start the auto-purchase system
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
    await orchestrator.startProcessingLoop(60000); // Check every minute

  } catch (error) {
    logger.error('Failed to start Auto-Purchase System', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Export services for use by other modules
export {
  AutoPurchaseOrchestrator,
  AutoPurchaseService,
  ProviderSelector,
  OrderPlacer,
  ConfirmationHandler,
  OrderServiceClient,
  orchestrator,
  autoPurchaseService,
  providerSelector,
  orderPlacer,
  confirmationHandler,
  orderServiceClient,
  startAutoPurchaseSystem
};

// Export types
export * from './types/provider';
export * from './services/autoPurchaseService';
export * from './services/orderPlacer';
export * from './services/confirmationHandler';
export * from './services/orderServiceClient';
export * from './services/autoPurchaseOrchestrator';

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