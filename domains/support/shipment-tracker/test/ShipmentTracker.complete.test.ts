import { ShipmentTracker } from '../src/services/ShipmentTracker';
import { AmazonTrackingProvider } from '../src/providers/AmazonTrackingProvider';
import { TrackingInfo, ShipmentStatus } from '../src/types/tracking';

// Mock the Order model
jest.mock('../src/models/Order', () => ({
  Order: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

// Mock NotificationService
jest.mock('../src/services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendShipmentUpdate: jest.fn(),
    sendDelayNotification: jest.fn(),
  })),
}));

describe('ShipmentTracker - Complete Tests', () => {
  let shipmentTracker: ShipmentTracker;
  let mockOrder: any;

  beforeEach(() => {
    shipmentTracker = new ShipmentTracker();
    
    // Create a mock order
    mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-2024-001',
      status: 'confirmed',
      trackingNumbers: {
        Amazon: 'TBA123456789'
      },
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      shippingAddress: {
        city: 'Madrid',
        state: 'Madrid',
        country: 'Spain'
      },
      updateStatus: jest.fn(),
      save: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Provider Integration', () => {
    it('should initialize all tracking providers', () => {
      expect(shipmentTracker).toBeDefined();
    });

    it('should validate Amazon tracking numbers correctly', () => {
      const amazonProvider = new AmazonTrackingProvider();
      
      // Valid Amazon tracking numbers (10-15 alphanumeric characters)
      expect(amazonProvider.isTrackingNumberValid('TBA123456789')).toBe(true);
      expect(amazonProvider.isTrackingNumberValid('AMAZON12345')).toBe(true);
      
      // Invalid tracking numbers
      expect(amazonProvider.isTrackingNumberValid('invalid')).toBe(false);
      expect(amazonProvider.isTrackingNumberValid('123')).toBe(false);
      expect(amazonProvider.isTrackingNumberValid('1Z999AA1234567890')).toBe(false); // UPS format
    });
  });

  describe('getTrackingInfo', () => {
    it('should return tracking info for valid order', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const mockTrackingInfo: TrackingInfo = {
        trackingNumber: 'TBA123456789',
        provider: 'Amazon',
        status: 'in_transit',
        events: [
          {
            timestamp: new Date(),
            status: 'picked_up',
            location: 'Madrid',
            description: 'Package picked up'
          }
        ],
        lastUpdated: new Date()
      };

      // Mock provider response
      const mockProvider = {
        getTrackingInfo: jest.fn().mockResolvedValue({
          success: true,
          trackingInfo: mockTrackingInfo
        })
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      const result = await shipmentTracker.getTrackingInfo('ORD-2024-001');
      expect(result).toBeDefined();
    });

    it('should throw error for non-existent order', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(null);

      await expect(shipmentTracker.getTrackingInfo('nonexistent'))
        .rejects.toThrow('Order nonexistent not found');
    });

    it('should return null for order without tracking numbers', async () => {
      const { Order } = require('../src/models/Order');
      const orderWithoutTracking = { ...mockOrder, trackingNumbers: {} };
      Order.findOne.mockResolvedValue(orderWithoutTracking);

      const result = await shipmentTracker.getTrackingInfo('ORD-2024-001');
      expect(result).toBeNull();
    });
  });

  describe('updateTrackingInfo', () => {
    it('should update order status when tracking status changes', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const mockTrackingInfo: TrackingInfo = {
        trackingNumber: 'TBA123456789',
        provider: 'Amazon',
        status: 'delivered',
        actualDeliveryDate: new Date(),
        events: [],
        lastUpdated: new Date()
      };

      // Mock provider response
      const mockProvider = {
        getTrackingInfo: jest.fn().mockResolvedValue({
          success: true,
          trackingInfo: mockTrackingInfo
        })
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      const result = await shipmentTracker.updateTrackingInfo('ORD-2024-001');

      expect(result).toBeDefined();
      expect(mockOrder.updateStatus).toHaveBeenCalledWith('delivered');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should handle rate limiting gracefully', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const mockProvider = {
        getTrackingInfo: jest.fn().mockResolvedValue({
          success: false,
          rateLimited: true
        })
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      const result = await shipmentTracker.updateTrackingInfo('ORD-2024-001');
      expect(result).toBeNull();
    });

    it('should return null for order without tracking numbers', async () => {
      const { Order } = require('../src/models/Order');
      const orderWithoutTracking = { ...mockOrder, trackingNumbers: {} };
      Order.findOne.mockResolvedValue(orderWithoutTracking);

      const result = await shipmentTracker.updateTrackingInfo('ORD-2024-001');
      expect(result).toBeNull();
    });
  });

  describe('getShipmentStatus', () => {
    it('should return shipment status for valid order', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const mockTrackingInfo: TrackingInfo = {
        trackingNumber: 'TBA123456789',
        provider: 'Amazon',
        status: 'in_transit',
        estimatedDeliveryDate: new Date('2024-12-25'),
        events: [],
        lastUpdated: new Date()
      };

      const mockProvider = {
        getTrackingInfo: jest.fn().mockResolvedValue({
          success: true,
          trackingInfo: mockTrackingInfo
        })
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      const result = await shipmentTracker.getShipmentStatus('ORD-2024-001');

      expect(result).toBeDefined();
      expect(result?.status).toBe('in_transit');
      expect(result?.estimatedDelivery).toBeDefined();
    });

    it('should return null for order without tracking info', async () => {
      const { Order } = require('../src/models/Order');
      const orderWithoutTracking = { ...mockOrder, trackingNumbers: {} };
      Order.findOne.mockResolvedValue(orderWithoutTracking);

      const result = await shipmentTracker.getShipmentStatus('ORD-2024-001');
      expect(result).toBeNull();
    });
  });

  describe('getEstimatedDelivery', () => {
    it('should return delivery estimate for valid order', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const mockEstimate = {
        estimatedDate: new Date('2024-12-25'),
        confidence: 'high' as const,
        businessDays: 5,
        factors: ['Standard shipping', 'In stock']
      };

      const mockProvider = {
        getEstimatedDelivery: jest.fn().mockResolvedValue(mockEstimate)
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      const result = await shipmentTracker.getEstimatedDelivery('ORD-2024-001');

      expect(result).toBeDefined();
      expect(result?.confidence).toBe('high');
      expect(result?.businessDays).toBe(5);
    });

    it('should return null for order without tracking numbers', async () => {
      const { Order } = require('../src/models/Order');
      const orderWithoutTracking = { ...mockOrder, trackingNumbers: {} };
      Order.findOne.mockResolvedValue(orderWithoutTracking);

      const result = await shipmentTracker.getEstimatedDelivery('ORD-2024-001');
      expect(result).toBeNull();
    });
  });

  describe('updateAllActiveShipments', () => {
    it('should update all active shipments in batches', async () => {
      const { Order } = require('../src/models/Order');
      
      // Create multiple mock orders
      const mockOrders = Array.from({ length: 15 }, (_, i) => ({
        ...mockOrder,
        id: `order-${i}`,
        orderNumber: `ORD-2024-${String(i).padStart(3, '0')}`
      }));

      Order.findAll.mockResolvedValue(mockOrders);
      Order.findOne.mockImplementation((query: any) => {
        const orderNumber = query.where.orderNumber;
        return Promise.resolve(mockOrders.find(o => o.orderNumber === orderNumber));
      });

      const mockProvider = {
        getTrackingInfo: jest.fn().mockResolvedValue({
          success: true,
          trackingInfo: {
            trackingNumber: 'TBA123456789',
            provider: 'Amazon',
            status: 'in_transit',
            events: [],
            lastUpdated: new Date()
          }
        })
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      await shipmentTracker.updateAllActiveShipments();

      expect(Order.findAll).toHaveBeenCalled();
      // Should process all orders
      expect(mockProvider.getTrackingInfo).toHaveBeenCalledTimes(15);
    });

    it('should handle errors for individual orders gracefully', async () => {
      const { Order } = require('../src/models/Order');
      
      const mockOrders = [
        { ...mockOrder, orderNumber: 'ORD-VALID' },
        { ...mockOrder, orderNumber: 'ORD-ERROR', trackingNumbers: null }
      ];

      Order.findAll.mockResolvedValue(mockOrders);
      Order.findOne.mockImplementation((query: any) => {
        const orderNumber = query.where.orderNumber;
        return Promise.resolve(mockOrders.find(o => o.orderNumber === orderNumber));
      });

      // Should not throw even if one order fails
      await expect(shipmentTracker.updateAllActiveShipments()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(shipmentTracker.getTrackingInfo('ORD-2024-001'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle provider errors gracefully', async () => {
      const { Order } = require('../src/models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const mockProvider = {
        getTrackingInfo: jest.fn().mockRejectedValue(new Error('Provider API error'))
      };

      (shipmentTracker as any).providers.set('Amazon', mockProvider);

      // Should not throw, should return null
      const result = await shipmentTracker.updateTrackingInfo('ORD-2024-001');
      expect(result).toBeNull();
    });
  });

  describe('Status Mapping', () => {
    it('should map tracking statuses to order statuses correctly', () => {
      const mapStatus = (shipmentTracker as any).mapTrackingStatusToOrderStatus.bind(shipmentTracker);

      expect(mapStatus('label_created')).toBe('confirmed');
      expect(mapStatus('picked_up')).toBe('processing');
      expect(mapStatus('in_transit')).toBe('shipped');
      expect(mapStatus('out_for_delivery')).toBe('shipped');
      expect(mapStatus('delivered')).toBe('delivered');
      expect(mapStatus('exception')).toBe('processing');
      expect(mapStatus('returned')).toBe('cancelled');
      expect(mapStatus('cancelled')).toBe('cancelled');
    });
  });
});

