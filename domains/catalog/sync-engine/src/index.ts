import express from 'express';
import { SyncEngineService } from './SyncEngineService';
import { SyncConfig } from './types/sync';
import { DynamicPricingConfig } from './types/pricing';
import { ProviderType } from './types/provider';

// Default configuration
const defaultSyncConfig: SyncConfig = {
  enabled: true,
  schedules: {
    fullSync: '0 2 * * *', // Daily at 2 AM
    priceUpdate: '0 */2 * * *', // Every 2 hours
    availabilityCheck: '0 */6 * * *' // Every 6 hours
  },
  batchSize: 50,
  maxConcurrentJobs: 5,
  retryDelayMs: 5000,
  maxRetries: 3
};

const defaultDynamicPricingConfig: DynamicPricingConfig = {
  enabled: true,
  update_frequency_minutes: 30,
  price_change_threshold: 0.02, // 2% minimum change
  max_price_increase_percentage: 0.15, // Max 15% increase
  max_price_decrease_percentage: 0.20, // Max 20% decrease
  competitor_weight: 0.7,
  demand_weight: 0.2,
  inventory_weight: 0.1
};

// Initialize Sync Engine Service
const syncEngine = new SyncEngineService(defaultSyncConfig, defaultDynamicPricingConfig);

// Express app for API endpoints
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await syncEngine.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  try {
    const status = syncEngine.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await syncEngine.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache stats endpoint
app.get('/cache/stats', async (req, res) => {
  try {
    const stats = await syncEngine.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Pricing alerts endpoint
app.get('/pricing/alerts', (req, res) => {
  try {
    const alerts = syncEngine.getPricingAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get pricing alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual sync triggers
app.post('/sync/full', async (req, res) => {
  try {
    const { providers } = req.body;
    await syncEngine.triggerFullSync(providers);
    res.json({ message: 'Full sync triggered successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to trigger full sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/sync/prices', async (req, res) => {
  try {
    const { providers } = req.body;
    await syncEngine.triggerPriceUpdate(providers);
    res.json({ message: 'Price update triggered successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to trigger price update',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Price comparison endpoint
app.post('/pricing/compare', async (req, res) => {
  try {
    const { sku, productName } = req.body;

    if (!sku || !productName) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'sku and productName are required'
      });
      return;
    }

    const comparison = await syncEngine.compareProductPrices(sku, productName);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to compare prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Market analysis endpoint
app.post('/pricing/analyze', async (req, res) => {
  try {
    const { sku } = req.body;

    if (!sku) {
      res.status(400).json({
        error: 'Missing required field',
        message: 'sku is required'
      });
      return;
    }

    const analysis = await syncEngine.analyzeMarket(sku);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze market',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dynamic pricing endpoint
app.post('/pricing/dynamic-update', async (req, res) => {
  try {
    const { sku, productName } = req.body;

    if (!sku || !productName) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'sku and productName are required'
      });
      return;
    }

    const result = await syncEngine.updateDynamicPrice(sku, productName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update dynamic price',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Configuration endpoints
app.put('/config/sync', (req, res) => {
  try {
    const newConfig = req.body;
    syncEngine.updateSyncConfig(newConfig);
    res.json({ message: 'Sync configuration updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update sync configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/config/pricing', (req, res) => {
  try {
    const newConfig = req.body;
    syncEngine.updateDynamicPricingConfig(newConfig);
    res.json({ message: 'Dynamic pricing configuration updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update pricing configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Providers endpoint
app.get('/providers', (req, res) => {
  try {
    const providers = syncEngine.getProviders();
    res.json(providers);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get providers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cleanup endpoint
app.post('/cleanup', async (req, res) => {
  try {
    await syncEngine.cleanup();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to run cleanup',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Control endpoints
app.post('/start', async (req, res) => {
  try {
    await syncEngine.start();
    res.json({ message: 'Sync Engine started successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start Sync Engine',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/stop', async (req, res) => {
  try {
    await syncEngine.stop();
    res.json({ message: 'Sync Engine stopped successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop Sync Engine',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/restart', async (req, res) => {
  try {
    await syncEngine.restart();
    res.json({ message: 'Sync Engine restarted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to restart Sync Engine',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start the service
const PORT = process.env.PORT || 3000;

async function startService() {
  try {
    console.log('🚀 Starting TechNovaStore Sync Engine...');

    // Start the sync engine
    await syncEngine.start();

    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🌐 Sync Engine API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Status: http://localhost:${PORT}/status`);
      console.log(`📋 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    console.error('❌ Failed to start Sync Engine service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await syncEngine.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await syncEngine.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the service if this file is run directly
if (require.main === module) {
  startService();
}

export { syncEngine, app };
export * from './types/sync';
export * from './types/provider';
export * from './types/pricing';
export { SyncEngineService } from './SyncEngineService';