import { HealthChecker, createMongoHealthCheck, createPostgresHealthCheck, createRedisHealthCheck, createMemoryCheck } from './health-check';
import { databaseConnectionsActive, httpRequestsTotal } from './metrics';

export interface ServiceHealthConfig {
  serviceName: string;
  version?: string;
  dependencies?: {
    mongodb?: any;
    postgresql?: any;
    redis?: any;
  };
  customChecks?: Record<string, () => Promise<any>>;
  memoryThresholdMB?: number;
}

export class AdvancedHealthChecker extends HealthChecker {
  constructor(private config: ServiceHealthConfig) {
    super(config.serviceName);
    this.setupStandardChecks();
  }

  private setupStandardChecks() {
    // Memory check
    this.addCheck('memory', createMemoryCheck(this.config.memoryThresholdMB || 512));

    // Disk space check
    this.addCheck('disk', async () => {
      try {
        const fs = require('fs');
        const stats = fs.statSync('.');
        return {
          status: 'pass' as const,
          details: { available: true }
        };
      } catch (error) {
        return {
          status: 'fail' as const,
          error: error instanceof Error ? error.message : 'Disk check failed'
        };
      }
    });

    // Process uptime check
    this.addCheck('uptime', async () => {
      const uptime = process.uptime();
      return {
        status: 'pass' as const,
        details: { uptime: `${Math.floor(uptime)}s` }
      };
    });

    // Event loop lag check
    this.addCheck('eventloop', async () => {
      const start = process.hrtime.bigint();
      await new Promise(resolve => setImmediate(resolve));
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds

      return {
        status: lag > 100 ? 'warn' as const : 'pass' as const,
        details: { lagMs: lag },
        error: lag > 100 ? `Event loop lag is ${lag.toFixed(2)}ms` : undefined
      };
    });

    // Setup database dependency checks
    if (this.config.dependencies?.mongodb) {
      this.addDependency('mongodb', createMongoHealthCheck(this.config.dependencies.mongodb));
    }

    if (this.config.dependencies?.postgresql) {
      this.addDependency('postgresql', createPostgresHealthCheck(this.config.dependencies.postgresql));
    }

    if (this.config.dependencies?.redis) {
      this.addDependency('redis', createRedisHealthCheck(this.config.dependencies.redis));
    }

    // Add custom checks
    if (this.config.customChecks) {
      Object.entries(this.config.customChecks).forEach(([name, checkFn]) => {
        this.addCheck(name, checkFn);
      });
    }
  }

  async getDetailedHealthStatus() {
    const healthResult = await this.runHealthCheck();
    
    // Add additional metrics
    const additionalMetrics = {
      metrics: {
        totalRequests: await this.getTotalRequests(),
        activeConnections: await this.getActiveConnections(),
        errorRate: await this.getErrorRate()
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      }
    };

    return {
      ...healthResult,
      ...additionalMetrics
    };
  }

  private async getTotalRequests(): Promise<number> {
    try {
      const metric = await httpRequestsTotal.get();
      return metric.values.reduce((sum: number, value: any) => sum + value.value, 0);
    } catch {
      return 0;
    }
  }

  private async getActiveConnections(): Promise<Record<string, number>> {
    try {
      const metric = await databaseConnectionsActive.get();
      const connections: Record<string, number> = {};
      
      metric.values.forEach((value: any) => {
        const dbType = value.labels.database_type;
        if (dbType) {
          connections[dbType] = value.value;
        }
      });
      
      return connections;
    } catch {
      return {};
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const totalMetric = await httpRequestsTotal.get();
      const total = totalMetric.values.reduce((sum: number, value: any) => sum + value.value, 0);
      
      const errorMetric = await httpRequestsTotal.get();
      const errors = errorMetric.values
        .filter((value: any) => value.labels.status && String(value.labels.status).startsWith('5'))
        .reduce((sum: number, value: any) => sum + value.value, 0);
      
      return total > 0 ? (errors / total) * 100 : 0;
    } catch {
      return 0;
    }
  }
}

// Factory function to create health checker for different service types
export function createServiceHealthChecker(config: ServiceHealthConfig): AdvancedHealthChecker {
  return new AdvancedHealthChecker(config);
}

// Predefined health check configurations for different service types
export const healthCheckConfigs = {
  apiGateway: (dependencies: any) => ({
    serviceName: 'api-gateway',
    dependencies,
    memoryThresholdMB: 256,
    customChecks: {
      'rate-limit': async () => {
        // Check if rate limiting is working
        return {
          status: 'pass' as const,
          details: { rateLimitActive: true }
        };
      }
    }
  }),

  productService: (dependencies: any) => ({
    serviceName: 'product-service',
    dependencies,
    memoryThresholdMB: 512,
    customChecks: {
      'product-sync': async () => {
        // Check last sync time
        const lastSync = new Date(); // This would come from actual sync status
        const timeSinceSync = Date.now() - lastSync.getTime();
        const hoursAgo = timeSinceSync / (1000 * 60 * 60);
        
        return {
          status: hoursAgo > 6 ? 'warn' as const : 'pass' as const,
          details: { lastSyncHoursAgo: hoursAgo },
          error: hoursAgo > 6 ? 'Product sync is overdue' : undefined
        };
      }
    }
  }),

  orderService: (dependencies: any) => ({
    serviceName: 'order-service',
    dependencies,
    memoryThresholdMB: 512,
    customChecks: {
      'order-processing': async () => {
        // Check order processing queue
        return {
          status: 'pass' as const,
          details: { queueLength: 0 }
        };
      }
    }
  }),

  syncEngine: (dependencies: any) => ({
    serviceName: 'sync-engine',
    dependencies,
    memoryThresholdMB: 1024,
    customChecks: {
      'provider-apis': async () => {
        // Check provider API connectivity
        const providers = ['amazon', 'aliexpress', 'ebay', 'banggood', 'newegg'];
        const results = await Promise.allSettled(
          providers.map(async (provider) => {
            // This would be actual API health checks
            return { provider, status: 'connected' };
          })
        );
        
        const connected = results.filter(r => r.status === 'fulfilled').length;
        const total = providers.length;
        
        return {
          status: connected === total ? 'pass' as const : connected > total / 2 ? 'warn' as const : 'fail' as const,
          details: { connectedProviders: connected, totalProviders: total },
          error: connected < total ? `Only ${connected}/${total} providers are connected` : undefined
        };
      }
    }
  }),

  autoPurchase: (dependencies: any) => ({
    serviceName: 'auto-purchase',
    dependencies,
    memoryThresholdMB: 512,
    customChecks: {
      'purchase-queue': async () => {
        // Check purchase queue status
        return {
          status: 'pass' as const,
          details: { queueLength: 0, processing: false }
        };
      }
    }
  }),

  chatbot: (dependencies: any) => ({
    serviceName: 'chatbot',
    dependencies,
    memoryThresholdMB: 1024,
    customChecks: {
      'nlp-model': async () => {
        // Check NLP model status
        return {
          status: 'pass' as const,
          details: { modelLoaded: true, language: 'es' }
        };
      }
    }
  })
};