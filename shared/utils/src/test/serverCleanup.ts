import { Server } from 'http';
import { AddressInfo } from 'net';
import { resourceCleanupManager } from './resourceCleanupManager';
import { CleanupErrorType, CleanupError } from './types';

/**
 * Interface for server instance tracking
 */
export interface ServerInstance {
  server: Server;
  port: number;
  startedAt: number;
  name: string;
  app?: any;
}

/**
 * Configuration for server cleanup behavior
 */
export interface ServerCleanupConfig {
  gracefulTimeout: number;
  forceTimeout: number;
  portCheckRetries: number;
  portCheckDelay: number;
}

/**
 * Test Server Manager
 * Manages the lifecycle of test servers with automatic cleanup
 */
export class TestServerManager {
  private servers: Map<string, ServerInstance> = new Map();
  private config: ServerCleanupConfig;

  constructor(config?: Partial<ServerCleanupConfig>) {
    this.config = {
      gracefulTimeout: 5000,
      forceTimeout: 10000,
      portCheckRetries: 5,
      portCheckDelay: 100,
      ...config
    };
  }

  /**
   * Start a server and register it for automatic cleanup
   */
  async startServer(name: string, app: any, port?: number): Promise<ServerInstance> {
    if (this.servers.has(name)) {
      throw new Error(`Server with name '${name}' is already running`);
    }

    // Find available port if not specified
    const targetPort = port || await this.findAvailablePort();
    
    return new Promise<ServerInstance>((resolve, reject) => {
      const server = app.listen(targetPort, (error?: Error) => {
        if (error) {
          reject(new CleanupError(
            CleanupErrorType.RESOURCE_BUSY,
            `server-${name}`,
            'server',
            `Failed to start server on port ${targetPort}: ${error.message}`,
            error
          ));
          return;
        }

        const address = server.address() as AddressInfo;
        const actualPort = address?.port || targetPort;

        const serverInstance: ServerInstance = {
          server,
          port: actualPort,
          startedAt: Date.now(),
          name,
          app
        };

        this.servers.set(name, serverInstance);

        // Register for automatic cleanup
        resourceCleanupManager.registerResource({
          id: `server-${name}`,
          type: 'server',
          resource: server,
          cleanup: () => this.stopServer(name),
          priority: 2, // High priority for servers
          timeout: this.config.gracefulTimeout,
          metadata: {
            port: actualPort,
            name,
            startedAt: serverInstance.startedAt
          }
        });

        resolve(serverInstance);
      });

      // Handle server errors
      server.on('error', (error: Error) => {
        if (error.message.includes('EADDRINUSE')) {
          reject(new CleanupError(
            CleanupErrorType.RESOURCE_BUSY,
            `server-${name}`,
            'server',
            `Port ${targetPort} is already in use`,
            error
          ));
        } else {
          reject(new CleanupError(
            CleanupErrorType.UNKNOWN,
            `server-${name}`,
            'server',
            `Server error: ${error.message}`,
            error
          ));
        }
      });
    });
  }

  /**
   * Stop a specific server gracefully
   */
  async stopServer(name: string): Promise<void> {
    const serverInstance = this.servers.get(name);
    if (!serverInstance) {
      return; // Already stopped or never existed
    }

    const { server, port } = serverInstance;

    try {
      await this.gracefulShutdown(server, name);
      this.servers.delete(name);
      
      // Verify port is released
      await this.verifyPortReleased(port);
    } catch (error) {
      // If graceful shutdown fails, force close
      try {
        await this.forceShutdown(server, name);
        this.servers.delete(name);
        
        // Force port release if still occupied
        await this.forcePortRelease(port);
      } catch (forceError) {
        throw new CleanupError(
          CleanupErrorType.TIMEOUT,
          `server-${name}`,
          'server',
          `Failed to stop server on port ${port} even with force`,
          forceError as Error
        );
      }
    }
  }

  /**
   * Stop all registered servers
   */
  async stopAllServers(): Promise<void> {
    const stopPromises = Array.from(this.servers.keys()).map(name => 
      this.stopServer(name).catch(error => {
        console.warn(`Failed to stop server ${name}:`, error);
        return error;
      })
    );

    await Promise.allSettled(stopPromises);
  }

  /**
   * Get information about running servers
   */
  getRunningServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get server by name
   */
  getServer(name: string): ServerInstance | undefined {
    return this.servers.get(name);
  }

  /**
   * Check if a server is running
   */
  isServerRunning(name: string): boolean {
    return this.servers.has(name);
  }

  /**
   * Get the port of a running server
   */
  getServerPort(name: string): number | undefined {
    return this.servers.get(name)?.port;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ServerCleanupConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Graceful server shutdown with timeout
   */
  private async gracefulShutdown(server: Server, name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Graceful shutdown timeout for server ${name} after ${this.config.gracefulTimeout}ms`));
      }, this.config.gracefulTimeout);

      server.close((error) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Force server shutdown
   */
  private async forceShutdown(server: Server, name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Force shutdown timeout for server ${name} after ${this.config.forceTimeout}ms`));
      }, this.config.forceTimeout);

      // Destroy all connections
      server.closeAllConnections?.();
      
      // Force close
      server.close((error) => {
        clearTimeout(timeout);
        if (error && !error.message.includes('Server is not running')) {
          reject(error);
        } else {
          resolve();
        }
      });

      // If closeAllConnections is not available, use destroy method
      if (typeof server.closeAllConnections !== 'function') {
        (server as any).destroy?.();
      }
    });
  }

  /**
   * Find an available port starting from 3000
   */
  private async findAvailablePort(startPort = 3000): Promise<number> {
    const net = await import('net');
    
    for (let port = startPort; port < startPort + 100; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    
    throw new Error(`No available ports found in range ${startPort}-${startPort + 99}`);
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    const net = await import('net');
    
    return new Promise<boolean>((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Verify that a port has been released
   */
  private async verifyPortReleased(port: number): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.config.portCheckRetries) {
      if (await this.isPortAvailable(port)) {
        return; // Port is available
      }
      
      attempts++;
      await this.delay(this.config.portCheckDelay);
    }
    
    throw new Error(`Port ${port} is still occupied after ${this.config.portCheckRetries} attempts`);
  }

  /**
   * Force release a port by killing processes using it
   */
  private async forcePortRelease(port: number): Promise<void> {
    try {
      // On Windows, use netstat and taskkill
      if (process.platform === 'win32') {
        const { execSync } = await import('child_process');
        
        try {
          // Find process using the port
          const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
          const lines = netstatOutput.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            
            if (pid && !isNaN(Number(pid))) {
              try {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              } catch (killError) {
                // Process might already be dead
              }
            }
          }
        } catch (netstatError) {
          // No processes found using the port
        }
      } else {
        // On Unix-like systems, use lsof and kill
        const { execSync } = await import('child_process');
        
        try {
          const lsofOutput = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
          const pids = lsofOutput.trim().split('\n').filter(pid => pid.trim());
          
          for (const pid of pids) {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            } catch (killError) {
              // Process might already be dead
            }
          }
        } catch (lsofError) {
          // No processes found using the port
        }
      }
      
      // Wait a bit for the port to be released
      await this.delay(200);
      
      // Verify port is now available
      if (!await this.isPortAvailable(port)) {
        throw new Error(`Port ${port} could not be forcefully released`);
      }
    } catch (error) {
      throw new CleanupError(
        CleanupErrorType.RESOURCE_BUSY,
        `port-${port}`,
        'server',
        `Failed to force release port ${port}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global singleton instance
export const testServerManager = new TestServerManager();

/**
 * Convenience function to start a server with automatic cleanup
 */
export async function createTestServer(name: string, app: any, port?: number): Promise<ServerInstance> {
  return testServerManager.startServer(name, app, port);
}

/**
 * Convenience function to stop a specific server
 */
export async function stopTestServer(name: string): Promise<void> {
  return testServerManager.stopServer(name);
}

/**
 * Convenience function to stop all test servers
 */
export async function stopAllTestServers(): Promise<void> {
  return testServerManager.stopAllServers();
}