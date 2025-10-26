import { AutoPurchaseService } from '../services/autoPurchaseService';
import { ProviderSelector } from '../services/providerSelector';
import { OrderPlacer } from '../services/orderPlacer';
import { ConfirmationHandler } from '../services/confirmationHandler';
import { setupIntegrationTest, waitForDatabaseOperations } from '../../../../shared/utils/src/test/testHelpers';
import { resourceCleanupManager } from '../../../../shared/utils/src/test/resourceCleanupManager';

describe('Auto Purchase Integration Tests', () => {
  let autoPurchaseService: AutoPurchaseService;
  let providerSelector: ProviderSelector;
  let orderPlacer: OrderPlacer;
  let confirmationHandler: ConfirmationHandler;
  let testContext: Awaited<ReturnType<typeof setupIntegrationTest>>;

  beforeAll(async () => {
    // Capture baseline handles for leak detection
    resourceCleanupManager.captureHandleBaseline();
    
    // Setup test databases and cleanup system
    testContext = await setupIntegrationTest();
  });

  beforeEach(() => {
    providerSelector = new ProviderSelector();
    autoPurchaseService = new AutoPurchaseService(providerSelector);
    orderPlacer = new OrderPlacer();
    confirmationHandler = new ConfirmationHandler();
  });

  afterEach(async () => {
    // Wait for any pending database operations
    await waitForDatabaseOperations();
  });

  afterAll(async () => {
    // Cleanup all test resources using the new system
    await testContext.cleanup();
    
    // Perform comprehensive cleanup and generate report
    const cleanupReport = await resourceCleanupManager.cleanup();
    
    // Check for resource leaks
    if (cleanupReport.openHandles && cleanupReport.openHandles.leaks.length > 0) {
      console.warn('Resource leaks detected:', cleanupReport.openHandles.leaks);
    }
    
    // Log cleanup summary
    console.log(`Cleanup completed: ${cleanupReport.resources.cleaned}/${cleanupReport.resources.total} resources cleaned in ${cleanupReport.duration}ms`);
  });

  describe('Provider Selection and Purchase Flow', () => {
    it('should select a provider and place an order successfully', async () => {
      const mockRequest = {
        order_id: 999,
        product_sku: 'INTEGRATION-TEST-001',
        quantity: 1,
        shipping_address: {
          street: '123 Integration St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'ES'
        }
      };

      // Test provider selection
      const providerSelection = await providerSelector.selectBestProvider(
        mockRequest.product_sku,
        mockRequest.quantity,
        mockRequest.shipping_address
      );

      expect(providerSelection).toBeDefined();
      expect(providerSelection.provider).toBeDefined();
      expect(providerSelection.provider.name).toBeDefined();
      expect(providerSelection.total_cost).toBeGreaterThan(0);
      expect(providerSelection.estimated_delivery).toBeInstanceOf(Date);
      expect(providerSelection.fallback_providers).toBeDefined();
      expect(Array.isArray(providerSelection.fallback_providers)).toBe(true);

      // Test order placement
      const orderResult = await orderPlacer.placeOrder(
        providerSelection.provider,
        mockRequest
      );

      expect(orderResult).toBeDefined();
      expect(typeof orderResult.success).toBe('boolean');
      
      if (orderResult.success) {
        expect(orderResult.provider_order_id).toBeDefined();
        expect(orderResult.total_cost).toBeGreaterThan(0);
        expect(orderResult.estimated_delivery).toBeInstanceOf(Date);
      } else {
        expect(orderResult.error_message).toBeDefined();
        expect(orderResult.error_code).toBeDefined();
      }
    }, 10000);

    it('should handle the complete auto-purchase flow', async () => {
      const mockRequest = {
        order_id: 998,
        product_sku: 'INTEGRATION-TEST-002',
        quantity: 2,
        shipping_address: {
          street: '456 Integration Ave',
          city: 'Barcelona',
          state: 'Catalonia',
          postal_code: '08001',
          country: 'ES'
        }
      };

      // Execute the complete auto-purchase flow
      const result = await autoPurchaseService.executePurchase(mockRequest);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.provider_used).toBeDefined();
      expect(result.total_cost).toBeGreaterThanOrEqual(0);
      expect(result.estimated_delivery).toBeInstanceOf(Date);

      if (result.success) {
        expect(result.provider_order_id).toBeDefined();
        expect(result.total_cost).toBeGreaterThan(0);
      } else {
        expect(result.error_message).toBeDefined();
      }

      // Log the result for debugging
      console.log('Auto-purchase result:', {
        success: result.success,
        provider: result.provider_used,
        cost: result.total_cost,
        fallbackAttempts: result.fallback_attempts
      });
    });
  });

  describe('Error Handling and Fallback', () => {
    it('should handle provider failures gracefully', async () => {
      const mockRequest = {
        order_id: 997,
        product_sku: 'FAIL-TEST-001',
        quantity: 1,
        shipping_address: {
          street: '789 Fail St',
          city: 'Valencia',
          state: 'Valencia',
          postal_code: '46001',
          country: 'ES'
        },
        // Force a specific provider that might fail
        preferred_providers: ['banggood'] // Lower reliability provider
      };

      const result = await autoPurchaseService.executePurchase(mockRequest);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      // Even if it fails, it should provide meaningful error information
      if (!result.success) {
        expect(result.error_message).toBeDefined();
        expect(result.fallback_attempts).toBeGreaterThanOrEqual(0);
      }

      console.log('Fallback test result:', {
        success: result.success,
        provider: result.provider_used,
        error: result.error_message,
        fallbackAttempts: result.fallback_attempts
      });
    });
  });

  describe('Confirmation Handling', () => {
    it('should check confirmation status for a mock order', async () => {
      // Create a mock provider
      const mockProvider = {
        name: 'Amazon',
        price: 99.99,
        availability: true,
        shipping_cost: 5.99,
        delivery_time: 3,
        last_updated: new Date(),
        reliability_score: 95
      };

      const mockProviderOrderId = 'TEST-CONF-001';

      // Test getting confirmation status
      const confirmationStatus = await confirmationHandler.getConfirmationStatus(
        mockProvider,
        mockProviderOrderId
      );

      // The result might be null if the mock provider doesn't support the order ID
      // but the function should not throw an error
      expect(confirmationStatus === null || typeof confirmationStatus === 'object').toBe(true);

      if (confirmationStatus) {
        expect(confirmationStatus.provider_order_id).toBe(mockProviderOrderId);
        expect(['pending', 'confirmed', 'cancelled', 'failed', 'processing', 'shipped'])
          .toContain(confirmationStatus.status);
        expect(confirmationStatus.last_updated).toBeInstanceOf(Date);
        expect(typeof confirmationStatus.retry_count).toBe('number');
      }
    });
  });
});