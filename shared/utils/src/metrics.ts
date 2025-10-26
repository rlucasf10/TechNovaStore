import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// Database Metrics
export const databaseConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['database_type'],
  registers: [register]
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['database_type', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register]
});

// Business Metrics
export const ordersTotal = new Counter({
  name: 'orders_total',
  help: 'Total number of orders processed',
  labelNames: ['status'],
  registers: [register]
});

export const revenueTotal = new Counter({
  name: 'revenue_total',
  help: 'Total revenue in euros',
  registers: [register]
});

export const ordersProcessingTime = new Histogram({
  name: 'orders_processing_time_seconds',
  help: 'Time taken to process orders',
  buckets: [1, 5, 10, 30, 60, 300, 600],
  registers: [register]
});

// Sync Engine Metrics
export const syncEngineProductsSynced = new Counter({
  name: 'sync_engine_products_synced_total',
  help: 'Total number of products synced',
  labelNames: ['provider'],
  registers: [register]
});

export const syncEngineFailures = new Counter({
  name: 'sync_engine_failures_total',
  help: 'Total number of sync failures',
  labelNames: ['provider', 'error_type'],
  registers: [register]
});

export const syncEngineDuration = new Histogram({
  name: 'sync_engine_duration_seconds',
  help: 'Duration of sync operations',
  labelNames: ['provider'],
  buckets: [10, 30, 60, 300, 600, 1800],
  registers: [register]
});

// Auto Purchase Metrics
export const autoPurchaseSuccess = new Counter({
  name: 'auto_purchase_success_total',
  help: 'Total number of successful auto purchases',
  labelNames: ['provider'],
  registers: [register]
});

export const autoPurchaseFailures = new Counter({
  name: 'auto_purchase_failures_total',
  help: 'Total number of failed auto purchases',
  labelNames: ['provider', 'error_type'],
  registers: [register]
});

export const autoPurchaseDuration = new Histogram({
  name: 'auto_purchase_duration_seconds',
  help: 'Duration of auto purchase operations',
  labelNames: ['provider'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register]
});

// Chatbot Metrics
export const chatbotMessages = new Counter({
  name: 'chatbot_messages_total',
  help: 'Total number of chatbot messages',
  labelNames: ['intent', 'resolved'],
  registers: [register]
});

export const chatbotEscalations = new Counter({
  name: 'chatbot_escalations_total',
  help: 'Total number of chatbot escalations to human support',
  registers: [register]
});

export const chatbotResponseTime = new Histogram({
  name: 'chatbot_response_time_seconds',
  help: 'Chatbot response time in seconds',
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Shipment Tracking Metrics
export const shipmentUpdates = new Counter({
  name: 'shipment_updates_total',
  help: 'Total number of shipment updates',
  labelNames: ['provider', 'status'],
  registers: [register]
});

export const shipmentTrackingErrors = new Counter({
  name: 'shipment_tracking_errors_total',
  help: 'Total number of shipment tracking errors',
  labelNames: ['provider', 'error_type'],
  registers: [register]
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register]
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register]
});

// Export the register for /metrics endpoint
export { register };

// Utility function to create metrics middleware for Express
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode
      },
      duration
    );
  });
  
  next();
};

// Health check function
export const healthCheck = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  version: process.env.npm_package_version || '1.0.0'
};

export const updateHealthCheck = (additionalInfo: any = {}) => {
  return {
    ...healthCheck,
    ...additionalInfo,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
};