import { Page } from '@playwright/test';
import { mockApiResponses } from '../fixtures/test-data';

/**
 * API mocking utilities for E2E tests
 */
export class MockApi {
  constructor(private page: Page) {}

  /**
   * Mock all API endpoints with default responses
   */
  async mockAllEndpoints() {
    await this.mockProducts();
    await this.mockCategories();
    await this.mockCart();
    await this.mockOrders();
    await this.mockChat();
    await this.mockUser();
  }

  /**
   * Mock product-related endpoints
   */
  async mockProducts() {
    // List products
    await this.page.route('**/api/products', route => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search');
      const category = url.searchParams.get('category');
      
      let response;
      if (search) {
        response = mockApiResponses.products.search(search);
      } else if (category) {
        response = mockApiResponses.products.byCategory(category);
      } else {
        response = mockApiResponses.products.list;
      }
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });

    // Get product by ID
    await this.page.route('**/api/products/*', route => {
      const url = route.request().url();
      const productId = url.split('/').pop();
      const product = mockApiResponses.products.byId(productId || '');
      
      if (product) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(product)
        });
      } else {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Product not found' })
        });
      }
    });
  }

  /**
   * Mock category endpoints
   */
  async mockCategories() {
    await this.page.route('**/api/categories', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.categories.list)
      });
    });
  }

  /**
   * Mock cart endpoints
   */
  async mockCart() {
    // Get cart
    await this.page.route('**/api/cart', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.cart.get)
        });
      }
    });

    // Add to cart
    await this.page.route('**/api/cart/add', route => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        const response = mockApiResponses.cart.add(
          postData.productId, 
          postData.quantity
        );
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      }
    });

    // Update cart item
    await this.page.route('**/api/cart/update/*', route => {
      if (route.request().method() === 'PUT') {
        const url = route.request().url();
        const itemId = url.split('/').pop();
        const postData = route.request().postDataJSON();
        const response = mockApiResponses.cart.update(
          itemId || '', 
          postData.quantity
        );
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      }
    });

    // Remove from cart
    await this.page.route('**/api/cart/remove/*', route => {
      if (route.request().method() === 'DELETE') {
        const url = route.request().url();
        const itemId = url.split('/').pop();
        const response = mockApiResponses.cart.remove(itemId || '');
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      }
    });
  }

  /**
   * Mock order endpoints
   */
  async mockOrders() {
    // Create order
    await this.page.route('**/api/orders', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.orders.create)
        });
      } else if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.orders.list)
        });
      }
    });

    // Get order by ID
    await this.page.route('**/api/orders/*', route => {
      const url = route.request().url();
      const orderId = url.split('/').pop();
      
      if (orderId && !orderId.includes('tracking')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.orders.get(orderId))
        });
      }
    });

    // Order tracking
    await this.page.route('**/api/orders/*/tracking', route => {
      const order = mockApiResponses.orders.create;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(order.tracking)
      });
    });
  }

  /**
   * Mock chat endpoints
   */
  async mockChat() {
    await this.page.route('**/api/chat/send', route => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        const response = mockApiResponses.chat.send(postData.message);
        
        // Simulate realistic response time
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response)
          });
        }, 500);
      }
    });
  }

  /**
   * Mock user endpoints
   */
  async mockUser() {
    await this.page.route('**/api/user/profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.orders.create.userId)
      });
    });

    await this.page.route('**/api/auth/login', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: 'user-123',
              email: 'test@technovastore.com',
              firstName: 'Juan',
              lastName: 'Pérez'
            }
          })
        });
      }
    });
  }

  /**
   * Mock error responses for testing error handling
   */
  async mockErrorResponses() {
    await this.page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: 'Something went wrong'
        })
      });
    });
  }

  /**
   * Mock slow responses for testing loading states
   */
  async mockSlowResponses(delay: number = 2000) {
    await this.page.route('**/api/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }, delay);
    });
  }

  /**
   * Mock specific endpoint with custom response
   */
  async mockEndpoint(pattern: string, response: any, options?: {
    status?: number;
    delay?: number;
    method?: string;
  }) {
    const { status = 200, delay = 0, method } = options || {};
    
    await this.page.route(pattern, route => {
      if (method && route.request().method() !== method) {
        route.continue();
        return;
      }
      
      const fulfill = () => {
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      };
      
      if (delay > 0) {
        setTimeout(fulfill, delay);
      } else {
        fulfill();
      }
    });
  }

  /**
   * Clear all mocked routes
   */
  async clearMocks() {
    await this.page.unrouteAll();
  }
}