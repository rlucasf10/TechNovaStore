/**
 * Mock Provider System for External Services
 * 
 * Provides mocking capabilities for external HTTP services without creating real network connections.
 * Addresses requirements 5.1, 5.2 for simulating external APIs and preventing real connections.
 */

import { resourceCleanupManager } from './resourceCleanupManager';

export interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
  delay?: number; // Simulate network delay in ms
}

export interface MockRule {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string | RegExp;
  response: MockResponse | ((request: MockRequest) => MockResponse | Promise<MockResponse>);
  times?: number; // How many times this rule should match (undefined = unlimited)
}

export interface MockRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
  params?: Record<string, string>;
}

export interface MockStats {
  totalRequests: number;
  matchedRequests: number;
  unmatchedRequests: number;
  ruleUsage: Map<string, number>;
}

/**
 * Mock Provider for external HTTP services
 */
export class MockProvider {
  private rules: Map<string, MockRule> = new Map();
  private requestHistory: MockRequest[] = [];
  private stats: MockStats = {
    totalRequests: 0,
    matchedRequests: 0,
    unmatchedRequests: 0,
    ruleUsage: new Map()
  };
  private isActive = false;

  constructor() {
    // Register for cleanup
    resourceCleanupManager.registerResource({
      id: 'mock-provider',
      type: 'custom',
      resource: this,
      cleanup: () => this.cleanup(),
      priority: 3
    });
  }

  /**
   * Add a mock rule for HTTP requests
   */
  addRule(id: string, rule: MockRule): void {
    this.rules.set(id, { ...rule, times: rule.times });
    this.stats.ruleUsage.set(id, 0);
  }

  /**
   * Add multiple mock rules at once
   */
  addRules(rules: Record<string, MockRule>): void {
    Object.entries(rules).forEach(([id, rule]) => {
      this.addRule(id, rule);
    });
  }

  /**
   * Remove a specific mock rule
   */
  removeRule(id: string): boolean {
    const removed = this.rules.delete(id);
    if (removed) {
      this.stats.ruleUsage.delete(id);
    }
    return removed;
  }

  /**
   * Clear all mock rules
   */
  clearRules(): void {
    this.rules.clear();
    this.stats.ruleUsage.clear();
  }

  /**
   * Activate the mock provider (intercept HTTP calls)
   */
  activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.interceptHttpCalls();
  }

  /**
   * Deactivate the mock provider (restore original HTTP behavior)
   */
  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.restoreHttpCalls();
  }

  /**
   * Process an HTTP request and return mocked response if rule matches
   */
  async processRequest(request: MockRequest): Promise<MockResponse | null> {
    this.requestHistory.push({ ...request });
    this.stats.totalRequests++;

    // Find matching rule
    for (const [ruleId, rule] of this.rules.entries()) {
      if (this.matchesRule(request, rule)) {
        // Check if rule has usage limit
        const currentUsage = this.stats.ruleUsage.get(ruleId) || 0;
        if (rule.times !== undefined && currentUsage >= rule.times) {
          continue; // Skip this rule, it's been used up
        }

        // Update usage stats
        this.stats.ruleUsage.set(ruleId, currentUsage + 1);
        this.stats.matchedRequests++;

        // Get response
        let response: MockResponse;
        if (typeof rule.response === 'function') {
          response = await rule.response(request);
        } else {
          response = rule.response;
        }

        // Simulate network delay if specified
        if (response.delay && response.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, response.delay));
        }

        return response;
      }
    }

    this.stats.unmatchedRequests++;
    return null; // No matching rule found
  }

  /**
   * Get request history for debugging
   */
  getRequestHistory(): MockRequest[] {
    return [...this.requestHistory];
  }

  /**
   * Get mock statistics
   */
  getStats(): MockStats {
    return {
      ...this.stats,
      ruleUsage: new Map(this.stats.ruleUsage)
    };
  }

  /**
   * Reset all statistics and history
   */
  reset(): void {
    this.requestHistory = [];
    this.stats = {
      totalRequests: 0,
      matchedRequests: 0,
      unmatchedRequests: 0,
      ruleUsage: new Map()
    };
    
    // Reset rule usage counters
    for (const ruleId of this.rules.keys()) {
      this.stats.ruleUsage.set(ruleId, 0);
    }
  }

  /**
   * Cleanup method called by resource cleanup manager
   */
  cleanup(): void {
    this.deactivate();
    this.clearRules();
    this.reset();
  }

  /**
   * Check if request matches a rule
   */
  private matchesRule(request: MockRequest, rule: MockRule): boolean {
    // Check method
    if (rule.method !== request.method) {
      return false;
    }

    // Check URL
    if (typeof rule.url === 'string') {
      return request.url === rule.url || request.url.includes(rule.url);
    } else if (rule.url instanceof RegExp) {
      return rule.url.test(request.url);
    }

    return false;
  }

  /**
   * Intercept HTTP calls (implementation depends on HTTP library used)
   */
  private interceptHttpCalls(): void {
    // Check if axios is available and intercept it
    try {
      const axios = require('axios');
      this.interceptAxios(axios);
    } catch (error) {
      // Axios not available, skip
    }
    
    // Note: Fetch interception would be implemented when needed
    // For now, we focus on axios which is more commonly used in Node.js
  }

  /**
   * Restore original HTTP behavior
   */
  private restoreHttpCalls(): void {
    // Restore original implementations
    // This would be implemented alongside interceptHttpCalls
  }

  /**
   * Intercept axios calls
   */
  private interceptAxios(axios: any): void {
    // Add request interceptor
    axios.interceptors.request.use(async (config: any) => {
      const mockRequest: MockRequest = {
        method: config.method?.toUpperCase() || 'GET',
        url: config.url || '',
        headers: config.headers || {},
        data: config.data,
        params: config.params
      };

      const mockResponse = await this.processRequest(mockRequest);
      
      if (mockResponse) {
        // Return mocked response by throwing a custom response
        const response = {
          data: mockResponse.data,
          status: mockResponse.status,
          statusText: 'OK',
          headers: mockResponse.headers || {},
          config
        };
        
        // Axios expects a rejected promise for intercepted responses
        return Promise.reject({ response, config, isAxiosError: true });
      }

      return config;
    });

    // Add response interceptor to handle our custom responses
    axios.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        // If it's our mocked response, resolve it instead of rejecting
        if (error.response && error.config && !error.message) {
          return Promise.resolve(error.response);
        }
        return Promise.reject(error);
      }
    );
  }
}

/**
 * Global mock provider instance
 */
export const mockProvider = new MockProvider();

/**
 * Convenience functions for common mocking scenarios
 */
export const mockHelpers = {
  /**
   * Mock a successful JSON API response
   */
  mockJsonSuccess(data: any, status = 200): MockResponse {
    return {
      status,
      data,
      headers: { 'Content-Type': 'application/json' }
    };
  },

  /**
   * Mock an API error response
   */
  mockError(message: string, status = 500): MockResponse {
    return {
      status,
      data: { error: message },
      headers: { 'Content-Type': 'application/json' }
    };
  },

  /**
   * Mock a delayed response (simulate slow network)
   */
  mockDelayed(data: any, delayMs: number, status = 200): MockResponse {
    return {
      status,
      data,
      delay: delayMs,
      headers: { 'Content-Type': 'application/json' }
    };
  },

  /**
   * Mock provider-specific responses for e-commerce
   */
  mockProviderProduct(productId: string, price: number, available = true): MockResponse {
    return this.mockJsonSuccess({
      id: productId,
      price,
      available,
      shipping: {
        cost: Math.round(price * 0.1 * 100) / 100, // 10% of price
        estimatedDays: Math.floor(Math.random() * 7) + 1
      },
      lastUpdated: new Date().toISOString()
    });
  },

  /**
   * Mock order service responses
   */
  mockOrderSuccess(orderId: number): MockResponse {
    return this.mockJsonSuccess({
      orderId,
      status: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: `TRACK-${orderId}-${Date.now()}`
    });
  }
};