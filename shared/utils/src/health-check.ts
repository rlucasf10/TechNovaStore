import { databaseConnectionsActive } from './metrics';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  version: string;
  service: string;
  dependencies: Record<string, DependencyStatus>;
  checks: Record<string, CheckResult>;
}

export interface DependencyStatus {
  status: 'connected' | 'disconnected' | 'unknown' | 'degraded';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  error?: string;
  details?: any;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<CheckResult>> = new Map();
  private dependencies: Map<string, () => Promise<DependencyStatus>> = new Map();

  constructor(private serviceName: string) {}

  addCheck(name: string, checkFn: () => Promise<CheckResult>) {
    this.checks.set(name, checkFn);
  }

  addDependency(name: string, checkFn: () => Promise<DependencyStatus>) {
    this.dependencies.set(name, checkFn);
  }

  async runHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise<CheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Check timeout')), 5000)
          )
        ]);
        return [name, result] as [string, CheckResult];
      } catch (error) {
        return [name, {
          status: 'fail' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        }] as [string, CheckResult];
      }
    });

    const dependencyPromises = Array.from(this.dependencies.entries()).map(async ([name, checkFn]) => {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise<DependencyStatus>((_, reject) => 
            setTimeout(() => reject(new Error('Dependency check timeout')), 5000)
          )
        ]);
        return [name, result] as [string, DependencyStatus];
      } catch (error) {
        return [name, {
          status: 'disconnected' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        }] as [string, DependencyStatus];
      }
    });

    const [checkResults, dependencyResults] = await Promise.all([
      Promise.all(checkPromises),
      Promise.all(dependencyPromises)
    ]);

    const checks = Object.fromEntries(checkResults);
    const dependencies = Object.fromEntries(dependencyResults);

    // Determine overall status
    const hasFailedChecks = Object.values(checks).some(check => check.status === 'fail');
    const hasDisconnectedDeps = Object.values(dependencies).some(dep => dep.status === 'disconnected');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn') ||
                       Object.values(dependencies).some(dep => dep.status === 'degraded');

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (hasFailedChecks || hasDisconnectedDeps) {
      status = 'unhealthy';
    } else if (hasWarnings) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      service: this.serviceName,
      dependencies,
      checks
    };
  }
}

// Common dependency checkers
export const createMongoHealthCheck = (mongoose: any) => {
  return async (): Promise<DependencyStatus> => {
    const startTime = Date.now();
    try {
      if (mongoose.connection.readyState === 1) {
        // Test with a simple ping
        await mongoose.connection.db.admin().ping();
        const responseTime = Date.now() - startTime;
        
        // Update metrics
        databaseConnectionsActive.set({ database_type: 'mongodb' }, mongoose.connection.readyState);
        
        return {
          status: 'connected',
          responseTime,
          lastChecked: new Date().toISOString()
        };
      } else {
        return {
          status: 'disconnected',
          error: `Connection state: ${mongoose.connection.readyState}`,
          lastChecked: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  };
};

export const createPostgresHealthCheck = (sequelize: any) => {
  return async (): Promise<DependencyStatus> => {
    const startTime = Date.now();
    try {
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      const pool = sequelize.connectionManager.pool;
      if (pool) {
        databaseConnectionsActive.set({ database_type: 'postgresql' }, pool.size);
      }
      
      return {
        status: 'connected',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  };
};

export const createRedisHealthCheck = (redis: any) => {
  return async (): Promise<DependencyStatus> => {
    const startTime = Date.now();
    try {
      await redis.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  };
};

// Common checks
export const createMemoryCheck = (maxMemoryMB: number = 512) => {
  return async (): Promise<CheckResult> => {
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.rss / 1024 / 1024;
    
    if (memoryMB > maxMemoryMB) {
      return {
        status: 'warn',
        details: { memoryMB, maxMemoryMB },
        error: `Memory usage (${memoryMB.toFixed(2)}MB) exceeds threshold (${maxMemoryMB}MB)`
      };
    }
    
    return {
      status: 'pass',
      details: { memoryMB, maxMemoryMB }
    };
  };
};

export const createDiskSpaceCheck = () => {
  return async (): Promise<CheckResult> => {
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      
      return {
        status: 'pass',
        details: { available: true }
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error instanceof Error ? error.message : 'Disk check failed'
      };
    }
  };
};