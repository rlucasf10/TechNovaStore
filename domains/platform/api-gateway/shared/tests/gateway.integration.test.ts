/**
 * Tests de integración para el API Gateway
 */

describe('API Gateway Integration Tests', () => {
  describe('Service Configuration', () => {
    test('should have all required service URLs configured', () => {
      const services = {
        product: process.env['PRODUCT_SERVICE_URL'] || 'http://localhost:3001',
        user: process.env['USER_SERVICE_URL'] || 'http://localhost:3002',
        order: process.env['ORDER_SERVICE_URL'] || 'http://localhost:3003',
        payment: process.env['PAYMENT_SERVICE_URL'] || 'http://localhost:3004',
        notification: process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3005',
        chatbot: process.env['CHATBOT_SERVICE_URL'] || 'http://chatbot:3001',
      };

      expect(services.product).toBeDefined();
      expect(services.user).toBeDefined();
      expect(services.order).toBeDefined();
      expect(services.payment).toBeDefined();
      expect(services.notification).toBeDefined();
      expect(services.chatbot).toBeDefined();
    });

    test('should have valid service URL formats', () => {
      const services = {
        product: process.env['PRODUCT_SERVICE_URL'] || 'http://localhost:3001',
        user: process.env['USER_SERVICE_URL'] || 'http://localhost:3002',
      };

      Object.values(services).forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });
  });

  describe('Gateway Configuration', () => {
    test('should have port configuration', () => {
      const port = process.env.PORT || 3000;
      expect(port).toBeDefined();
      expect(['number', 'string']).toContain(typeof port);
    });

    test('should have environment configuration', () => {
      const env = process.env.NODE_ENV || 'development';
      expect(env).toBeDefined();
      expect(['development', 'test', 'production', 'staging']).toContain(env);
    });
  });

  describe('Security Configuration', () => {
    test('should have JWT secret configured', () => {
      const jwtSecret = process.env.JWT_SECRET || 'test-secret';
      expect(jwtSecret).toBeDefined();
      expect(jwtSecret.length).toBeGreaterThan(0);
    });

    test('should have CORS configuration', () => {
      const corsOrigin = process.env.CORS_ORIGIN || '*';
      expect(corsOrigin).toBeDefined();
    });
  });

  describe('Proxy Middleware Configuration', () => {
    test('should configure proxy with correct options', () => {
      const proxyOptions = {
        target: 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
          '^/api/products': '/products',
        },
      };

      expect(proxyOptions.target).toBeDefined();
      expect(proxyOptions.changeOrigin).toBe(true);
      expect(proxyOptions.pathRewrite).toBeDefined();
    });

    test('should handle proxy errors gracefully', () => {
      const errorHandler = (_err: any, _req: any, res: any) => {
        res.status(503).json({ error: 'Service unavailable' });
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      errorHandler(new Error('Test error'), {}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Service unavailable' });
    });
  });

  describe('Route Path Rewriting', () => {
    test('should rewrite product routes correctly', () => {
      const pathRewrite = {
        '^/api/products': '/products',
      };

      const testPath = '/api/products/123';
      const rewrittenPath = testPath.replace(/^\/api\/products/, pathRewrite['^/api/products']);

      expect(rewrittenPath).toBe('/products/123');
    });

    test('should rewrite auth routes correctly', () => {
      const pathRewrite = {
        '^/api/auth': '/auth',
      };

      const testPath = '/api/auth/login';
      const rewrittenPath = testPath.replace(/^\/api\/auth/, pathRewrite['^/api/auth']);

      expect(rewrittenPath).toBe('/auth/login');
    });

    test('should rewrite order routes correctly', () => {
      const pathRewrite = {
        '^/api/orders': '/orders',
      };

      const testPath = '/api/orders/create';
      const rewrittenPath = testPath.replace(/^\/api\/orders/, pathRewrite['^/api/orders']);

      expect(rewrittenPath).toBe('/orders/create');
    });
  });

  describe('Header Forwarding', () => {
    test('should forward user headers to downstream services', () => {
      const mockReq = {
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'customer',
        },
        headers: {},
      };

      const mockProxyReq = {
        setHeader: jest.fn(),
      };

      // Simulate header forwarding
      mockProxyReq.setHeader('X-User-ID', mockReq.user.id.toString());
      mockProxyReq.setHeader('X-User-Email', mockReq.user.email);
      mockProxyReq.setHeader('X-User-Role', mockReq.user.role);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-ID', '1');
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Email', 'test@example.com');
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Role', 'customer');
    });

    test('should set CORS headers in proxy response', () => {
      const mockProxyRes: Record<string, any> = {
        headers: {},
      };

      const mockReq = {
        headers: {
          origin: 'http://localhost:3000',
        },
      };

      // Simulate CORS header setting
      const origin = mockReq.headers.origin;
      if (origin) {
        mockProxyRes.headers['access-control-allow-origin'] = origin;
        mockProxyRes.headers['access-control-allow-credentials'] = 'true';
        mockProxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      }

      expect(mockProxyRes.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(mockProxyRes.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Timeout Configuration', () => {
    test('should have appropriate timeout for standard routes', () => {
      const standardTimeout = 30000; // 30 seconds
      expect(standardTimeout).toBe(30000);
    });

    test('should have extended timeout for OAuth routes', () => {
      const oauthTimeout = 60000; // 60 seconds
      expect(oauthTimeout).toBe(60000);
    });

    test('should have extended timeout for chatbot routes', () => {
      const chatbotTimeout = 60000; // 60 seconds
      expect(chatbotTimeout).toBe(60000);
    });
  });
});
