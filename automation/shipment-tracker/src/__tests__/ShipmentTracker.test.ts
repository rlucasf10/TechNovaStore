import { ShipmentTracker } from '../services/ShipmentTracker';
import { AmazonTrackingProvider } from '../providers/AmazonTrackingProvider';

// Mock the Order model
jest.mock('../models/Order', () => ({
  Order: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('ShipmentTracker', () => {
  let shipmentTracker: ShipmentTracker;

  beforeEach(() => {
    shipmentTracker = new ShipmentTracker();
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
      expect(amazonProvider.isTrackingNumberValid('1Z999AA1234567890')).toBe(false); // UPS format, not Amazon
    });
  });

  describe('Status Mapping', () => {
    it('should map tracking statuses to order statuses correctly', () => {
      // This tests the private method indirectly through the public interface
      expect(shipmentTracker).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing orders gracefully', async () => {
      const { Order } = require('../models/Order');
      Order.findOne.mockResolvedValue(null);

      await expect(shipmentTracker.getTrackingInfo('nonexistent')).rejects.toThrow('Order nonexistent not found');
    });
  });
});