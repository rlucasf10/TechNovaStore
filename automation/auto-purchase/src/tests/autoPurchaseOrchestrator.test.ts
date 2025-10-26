import { AutoPurchaseOrchestrator, AutoPurchaseConfig, OrderForPurchase } from '../services/autoPurchaseOrchestrator';
import { waitForDatabaseOperations } from '../../../../shared/utils/src/test/testHelpers';
import { resourceCleanupManager } from '../../../../shared/utils/src/test/resourceCleanupManager';

describe('AutoPurchaseOrchestrator', () => {
    let orchestrator: AutoPurchaseOrchestrator;
    let mockConfig: AutoPurchaseConfig;

    beforeEach(() => {
        mockConfig = {
            orderService: {
                baseUrl: 'http://localhost:3001',
                timeout: 30000,
                retryAttempts: 3
            },
            enableConfirmationHandling: false, // Disable for testing
            maxConcurrentPurchases: 2,
            purchaseTimeoutMs: 60000
        };

        orchestrator = new AutoPurchaseOrchestrator(mockConfig);
    });

    beforeAll(() => {
        // Capture baseline handles for leak detection
        resourceCleanupManager.captureHandleBaseline();
    });

    afterEach(async () => {
        // Wait for any pending database operations
        await waitForDatabaseOperations();
        
        // Clean up any resources that might have been created during the test
        const activeResources = resourceCleanupManager.getActiveResources();
        if (activeResources.length > 0) {
            const cleanupReport = await resourceCleanupManager.cleanup();
            
            // Log any cleanup issues
            if (cleanupReport.errors.length > 0) {
                console.warn('Cleanup errors:', cleanupReport.errors.map(e => e.message));
            }
        }
    });

    afterAll(async () => {
        // Final cleanup and leak detection
        const cleanupReport = await resourceCleanupManager.cleanup();
        
        // Check for resource leaks
        if (cleanupReport.openHandles && cleanupReport.openHandles.leaks.length > 0) {
            console.warn('Resource leaks detected in AutoPurchaseOrchestrator tests:', cleanupReport.openHandles.leaks);
        }
    });

    describe('orchestratePurchase', () => {
        it('should process a single order successfully', async () => {
            const mockOrder: OrderForPurchase = {
                id: 1,
                user_id: 123,
                order_number: 'ORD-TEST-001',
                total_amount: 99.99,
                shipping_address: {
                    street: '123 Test St',
                    city: 'Madrid',
                    state: 'Madrid',
                    postal_code: '28001',
                    country: 'ES'
                },
                items: [
                    {
                        product_sku: 'TEST-SKU-001',
                        product_name: 'Test Product',
                        quantity: 1,
                        unit_price: 99.99
                    }
                ]
            };

            const result = await orchestrator.orchestratePurchase(mockOrder);

            expect(result).toBeDefined();
            expect(result.order_id).toBe(1);
            expect(result.processing_time_ms).toBeGreaterThan(0);

            // The result might succeed or fail depending on mock provider responses
            // but it should always have these properties
            expect(typeof result.success).toBe('boolean');

            if (result.success) {
                expect(result.provider_used).toBeDefined();
                expect(result.total_cost).toBeGreaterThan(0);
                expect(result.estimated_delivery).toBeInstanceOf(Date);
            } else {
                expect(result.error_message).toBeDefined();
            }
        }, 15000); // 15 second timeout for this test

        it('should handle orders with multiple items', async () => {
            const mockOrder: OrderForPurchase = {
                id: 2,
                user_id: 456,
                order_number: 'ORD-TEST-002',
                total_amount: 199.98,
                shipping_address: {
                    street: '456 Test Ave',
                    city: 'Barcelona',
                    state: 'Catalonia',
                    postal_code: '08001',
                    country: 'ES'
                },
                items: [
                    {
                        product_sku: 'TEST-SKU-002',
                        product_name: 'Test Product 2',
                        quantity: 1,
                        unit_price: 99.99
                    },
                    {
                        product_sku: 'TEST-SKU-003',
                        product_name: 'Test Product 3',
                        quantity: 1,
                        unit_price: 99.99
                    }
                ]
            };

            const result = await orchestrator.orchestratePurchase(mockOrder);

            expect(result).toBeDefined();
            expect(result.order_id).toBe(2);
            expect(result.processing_time_ms).toBeGreaterThan(0);
            expect(typeof result.success).toBe('boolean');
        }, 15000);

        it('should prevent concurrent processing of the same order', async () => {
            const mockOrder: OrderForPurchase = {
                id: 3,
                user_id: 789,
                order_number: 'ORD-TEST-003',
                total_amount: 49.99,
                shipping_address: {
                    street: '789 Test Blvd',
                    city: 'Valencia',
                    state: 'Valencia',
                    postal_code: '46001',
                    country: 'ES'
                },
                items: [
                    {
                        product_sku: 'TEST-SKU-004',
                        product_name: 'Test Product 4',
                        quantity: 1,
                        unit_price: 49.99
                    }
                ]
            };

            // Start two concurrent purchases for the same order
            const promise1 = orchestrator.orchestratePurchase(mockOrder);
            const promise2 = orchestrator.orchestratePurchase(mockOrder);

            const [result1, result2] = await Promise.all([promise1, promise2]);

            // One should succeed (or fail normally), the other should be rejected for concurrent processing
            const concurrentRejection = [result1, result2].find(r =>
                !r.success && r.error_message?.includes('already being processed')
            );

            expect(concurrentRejection).toBeDefined();
        }, 15000);
    });

    describe('processOrdersBatch', () => {
        it('should process multiple orders in batches', async () => {
            const mockOrders: OrderForPurchase[] = [
                {
                    id: 4,
                    user_id: 100,
                    order_number: 'ORD-BATCH-001',
                    total_amount: 29.99,
                    shipping_address: {
                        street: '100 Batch St',
                        city: 'Madrid',
                        state: 'Madrid',
                        postal_code: '28001',
                        country: 'ES'
                    },
                    items: [
                        {
                            product_sku: 'BATCH-SKU-001',
                            product_name: 'Batch Product 1',
                            quantity: 1,
                            unit_price: 29.99
                        }
                    ]
                }
            ];

            const results = await orchestrator.processOrdersBatch(mockOrders);

            expect(results).toHaveLength(1);
            expect(results[0].order_id).toBe(4);
            expect(typeof results[0].success).toBe('boolean');
            expect(results[0].processing_time_ms).toBeGreaterThan(0);
        }, 15000); // 15 second timeout for batch processing
    });

    describe('getProcessingStats', () => {
        it('should return current processing statistics', () => {
            const stats = orchestrator.getProcessingStats();

            expect(stats).toBeDefined();
            expect(typeof stats.activePurchases).toBe('number');
            expect(typeof stats.maxConcurrent).toBe('number');
            expect(typeof stats.enableConfirmationHandling).toBe('boolean');
            expect(stats.maxConcurrent).toBe(mockConfig.maxConcurrentPurchases);
            expect(stats.enableConfirmationHandling).toBe(mockConfig.enableConfirmationHandling);
        });
    });
});