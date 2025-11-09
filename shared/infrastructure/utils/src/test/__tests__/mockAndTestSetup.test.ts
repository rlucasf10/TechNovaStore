/**
 * Tests for Mock Provider and Test Setup System
 */

import {
  mockProvider,
  mockHelpers,
  setupUnitTest,
  setupSimpleTest,
  testUtils
} from '../index';

describe('Mock Provider System', () => {
  beforeEach(() => {
    mockProvider.reset();
  });

  afterEach(() => {
    mockProvider.deactivate();
  });

  it('should create and manage mock rules', () => {
    const rule = {
      method: 'GET' as const,
      url: 'https://api.example.com/test',
      response: mockHelpers.mockJsonSuccess({ test: true })
    };

    mockProvider.addRule('test-rule', rule);
    
    const stats = mockProvider.getStats();
    expect(stats.ruleUsage.has('test-rule')).toBe(true);
    expect(stats.ruleUsage.get('test-rule')).toBe(0);
  });

  it('should process mock requests', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'https://api.example.com/test',
      headers: {}
    };

    mockProvider.addRule('test-rule', {
      method: 'GET',
      url: 'https://api.example.com/test',
      response: mockHelpers.mockJsonSuccess({ success: true })
    });

    const response = await mockProvider.processRequest(mockRequest);
    
    expect(response).toBeTruthy();
    expect(response?.status).toBe(200);
    expect(response?.data.success).toBe(true);
  });

  it('should track request statistics', async () => {
    mockProvider.addRule('stats-rule', {
      method: 'POST',
      url: '/api/test',
      response: mockHelpers.mockJsonSuccess({ tracked: true })
    });

    await mockProvider.processRequest({
      method: 'POST',
      url: '/api/test',
      headers: {}
    });

    const stats = mockProvider.getStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.matchedRequests).toBe(1);
    expect(stats.ruleUsage.get('stats-rule')).toBe(1);
  });

  it('should handle limited-use rules', async () => {
    mockProvider.addRule('limited-rule', {
      method: 'GET',
      url: '/api/limited',
      response: mockHelpers.mockJsonSuccess({ limited: true }),
      times: 2
    });

    const request = {
      method: 'GET' as const,
      url: '/api/limited',
      headers: {}
    };

    // First two calls should match
    const response1 = await mockProvider.processRequest(request);
    const response2 = await mockProvider.processRequest(request);
    
    expect(response1).toBeTruthy();
    expect(response2).toBeTruthy();

    // Third call should not match
    const response3 = await mockProvider.processRequest(request);
    expect(response3).toBeNull();

    const stats = mockProvider.getStats();
    expect(stats.ruleUsage.get('limited-rule')).toBe(2);
  });

  it('should support dynamic responses', async () => {
    let callCount = 0;
    
    mockProvider.addRule('dynamic-rule', {
      method: 'GET',
      url: /\/api\/counter/,
      response: (request) => {
        callCount++;
        return mockHelpers.mockJsonSuccess({ 
          count: callCount,
          url: request.url 
        });
      }
    });

    const response1 = await mockProvider.processRequest({
      method: 'GET',
      url: '/api/counter/1',
      headers: {}
    });

    const response2 = await mockProvider.processRequest({
      method: 'GET',
      url: '/api/counter/2',
      headers: {}
    });

    expect(response1?.data.count).toBe(1);
    expect(response2?.data.count).toBe(2);
    expect(response1?.data.url).toBe('/api/counter/1');
    expect(response2?.data.url).toBe('/api/counter/2');
  });
});

describe('Mock Helpers', () => {
  it('should create JSON success responses', () => {
    const response = mockHelpers.mockJsonSuccess({ test: 'data' }, 201);
    
    expect(response.status).toBe(201);
    expect(response.data.test).toBe('data');
    expect(response.headers?.['Content-Type']).toBe('application/json');
  });

  it('should create error responses', () => {
    const response = mockHelpers.mockError('Test error', 400);
    
    expect(response.status).toBe(400);
    expect(response.data.error).toBe('Test error');
  });

  it('should create delayed responses', () => {
    const response = mockHelpers.mockDelayed({ delayed: true }, 1000, 202);
    
    expect(response.status).toBe(202);
    expect(response.data.delayed).toBe(true);
    expect(response.delay).toBe(1000);
  });

  it('should create provider product responses', () => {
    const response = mockHelpers.mockProviderProduct('ABC123', 99.99, true);
    
    expect(response.status).toBe(200);
    expect(response.data.id).toBe('ABC123');
    expect(response.data.price).toBe(99.99);
    expect(response.data.available).toBe(true);
    expect(response.data.shipping).toBeDefined();
    expect(response.data.shipping.cost).toBeGreaterThan(0);
  });

  it('should create order success responses', () => {
    const response = mockHelpers.mockOrderSuccess(12345);
    
    expect(response.status).toBe(200);
    expect(response.data.orderId).toBe(12345);
    expect(response.data.status).toBe('confirmed');
    expect(response.data.trackingNumber).toMatch(/^TRACK-12345-/);
  });
});

describe('Test Setup System', () => {
  describe('setupUnitTest', () => {
    const testSetup = setupUnitTest({
      mocks: {
        enabled: true,
        rules: {
          'unit-test-rule': {
            method: 'GET',
            url: 'https://api.example.com/unit',
            response: mockHelpers.mockJsonSuccess({ unit: true })
          }
        }
      }
    });

    let testContext: any;

    beforeEach(async () => {
      testContext = await testSetup.beforeEach();
    });

    afterEach(async () => {
      await testSetup.afterEach();
    });

    it('should provide test context with utilities', () => {
      expect(testContext).toBeDefined();
      expect(testContext.mockProvider).toBeDefined();
      expect(testContext.cleanup).toBeInstanceOf(Function);
      expect(testContext.reset).toBeInstanceOf(Function);
      expect(testContext.addMockRule).toBeInstanceOf(Function);
      expect(testContext.getStats).toBeInstanceOf(Function);
    });

    it('should have pre-configured mock rules', () => {
      const stats = testContext.getStats();
      expect(stats.mock.ruleUsage.has('unit-test-rule')).toBe(true);
    });
  });

  describe('setupSimpleTest', () => {
    const testSetup = setupSimpleTest();

    let testContext: any;

    beforeEach(async () => {
      testContext = await testSetup.beforeEach();
    });

    afterEach(async () => {
      await testSetup.afterEach();
    });

    it('should provide basic test context', () => {
      expect(testContext).toBeDefined();
      expect(testContext.mockProvider).toBeDefined();
    });
  });
});

describe('Test Utilities', () => {
  it('should generate test data', () => {
    const orderId = testUtils.generateTestData.orderId();
    const userId = testUtils.generateTestData.userId();
    const email = testUtils.generateTestData.email();
    const sku = testUtils.generateTestData.productSku();
    const orderNumber = testUtils.generateTestData.orderNumber();
    const trackingNumber = testUtils.generateTestData.trackingNumber();

    expect(typeof orderId).toBe('number');
    expect(orderId).toBeGreaterThan(0);
    
    expect(typeof userId).toBe('number');
    expect(userId).toBeGreaterThan(0);
    
    expect(email).toMatch(/@example\.com$/);
    expect(sku).toMatch(/^TEST-SKU-/);
    expect(orderNumber).toMatch(/^ORD-TEST-/);
    expect(trackingNumber).toMatch(/^TRACK-/);
  });

  it('should create delays', async () => {
    const startTime = Date.now();
    await testUtils.delay(50);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow some variance
  });

  it('should retry operations', async () => {
    let attempts = 0;
    
    const result = await testUtils.retry(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Not ready');
      }
      return 'success';
    }, 5, 10);

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should wait for conditions', async () => {
    let condition = false;
    
    setTimeout(() => {
      condition = true;
    }, 50);

    await testUtils.waitFor(() => condition, 1000);
    expect(condition).toBe(true);
  });

  it('should timeout when condition is not met', async () => {
    await expect(
      testUtils.waitFor(() => false, 100)
    ).rejects.toThrow('Condition not met within 100ms');
  });
});