/**
 * Tests for Server Cleanup Manager
 */

import { TestServerManager, testServerManager } from '../serverCleanup';
import { resourceCleanupManager } from '../resourceCleanupManager';
import { createServer, Server } from 'http';

describe('TestServerManager', () => {
  let manager: TestServerManager;
  let testApp: any;

  beforeEach(() => {
    manager = new TestServerManager();
    
    // Create a simple test app
    testApp = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Test server response');
    });
  });

  afterEach(async () => {
    // Clean up any servers that might still be running
    await manager.stopAllServers();
    await resourceCleanupManager.cleanup();
  });

  describe('startServer', () => {
    it('should start a server and register it for cleanup', async () => {
      const serverInstance = await manager.startServer('test-server', testApp);
      
      expect(serverInstance).toBeDefined();
      expect(serverInstance.name).toBe('test-server');
      expect(serverInstance.port).toBeGreaterThan(0);
      expect(serverInstance.server).toBeDefined();
      expect(serverInstance.startedAt).toBeGreaterThan(0);
      
      // Verify server is registered
      expect(manager.isServerRunning('test-server')).toBe(true);
      expect(manager.getServerPort('test-server')).toBe(serverInstance.port);
    });

    it('should throw error when starting server with duplicate name', async () => {
      await manager.startServer('duplicate-server', testApp);
      
      await expect(
        manager.startServer('duplicate-server', testApp)
      ).rejects.toThrow("Server with name 'duplicate-server' is already running");
    });

    it('should start server on specific port when provided', async () => {
      const targetPort = 9999;
      const serverInstance = await manager.startServer('port-test', testApp, targetPort);
      
      expect(serverInstance.port).toBe(targetPort);
    });
  });

  describe('stopServer', () => {
    it('should stop a running server gracefully', async () => {
      const serverInstance = await manager.startServer('stop-test', testApp);
      const port = serverInstance.port;
      
      expect(manager.isServerRunning('stop-test')).toBe(true);
      
      await manager.stopServer('stop-test');
      
      expect(manager.isServerRunning('stop-test')).toBe(false);
      expect(manager.getServer('stop-test')).toBeUndefined();
    });

    it('should handle stopping non-existent server gracefully', async () => {
      // Should not throw error
      await expect(manager.stopServer('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('stopAllServers', () => {
    it('should stop multiple servers', async () => {
      await manager.startServer('server1', testApp);
      await manager.startServer('server2', testApp);
      await manager.startServer('server3', testApp);
      
      expect(manager.getRunningServers()).toHaveLength(3);
      
      await manager.stopAllServers();
      
      expect(manager.getRunningServers()).toHaveLength(0);
    });
  });

  describe('getRunningServers', () => {
    it('should return list of running servers', async () => {
      expect(manager.getRunningServers()).toHaveLength(0);
      
      await manager.startServer('server1', testApp);
      await manager.startServer('server2', testApp);
      
      const runningServers = manager.getRunningServers();
      expect(runningServers).toHaveLength(2);
      expect(runningServers.map(s => s.name)).toContain('server1');
      expect(runningServers.map(s => s.name)).toContain('server2');
    });
  });

  describe('configuration', () => {
    it('should allow updating configuration', () => {
      const newConfig = {
        gracefulTimeout: 3000,
        forceTimeout: 8000
      };
      
      manager.updateConfig(newConfig);
      
      // Configuration is private, but we can test it indirectly
      expect(() => manager.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('resource cleanup integration', () => {
    it('should register servers with resource cleanup manager', async () => {
      const initialResources = resourceCleanupManager.getActiveResources();
      const initialCount = initialResources.length;
      
      await manager.startServer('cleanup-test', testApp);
      
      const resourcesAfterStart = resourceCleanupManager.getActiveResources();
      expect(resourcesAfterStart.length).toBe(initialCount + 1);
      
      const serverResource = resourcesAfterStart.find(r => r.id === 'server-cleanup-test');
      expect(serverResource).toBeDefined();
      expect(serverResource?.type).toBe('server');
      expect(serverResource?.priority).toBe(2);
    });
  });
});

describe('Global testServerManager', () => {
  afterEach(async () => {
    await testServerManager.stopAllServers();
  });

  it('should be available as singleton', () => {
    expect(testServerManager).toBeDefined();
    expect(testServerManager).toBeInstanceOf(TestServerManager);
  });

  it('should work with convenience functions', async () => {
    const { createTestServer, stopTestServer } = await import('../serverCleanup');
    
    const testApp = createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });
    
    const serverInstance = await createTestServer('convenience-test', testApp);
    expect(serverInstance).toBeDefined();
    expect(testServerManager.isServerRunning('convenience-test')).toBe(true);
    
    await stopTestServer('convenience-test');
    expect(testServerManager.isServerRunning('convenience-test')).toBe(false);
  });
});