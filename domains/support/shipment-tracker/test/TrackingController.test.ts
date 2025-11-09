import { Request, Response } from 'express';
import { TrackingController } from '../src/controllers/TrackingController';
import { ShipmentTracker } from '../src/services/ShipmentTracker';
import { TrackingInfo } from '../src/types/tracking';

// Mock ShipmentTracker
jest.mock('../src/services/ShipmentTracker');

describe('TrackingController', () => {
  let controller: TrackingController;
  let mockShipmentTracker: jest.Mocked<ShipmentTracker>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockShipmentTracker = {
      getTrackingInfo: jest.fn(),
      updateTrackingInfo: jest.fn(),
      getShipmentStatus: jest.fn(),
      getEstimatedDelivery: jest.fn(),
      updateAllActiveShipments: jest.fn(),
    } as any;

    controller = new TrackingController(mockShipmentTracker);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  describe('getTrackingInfo', () => {
    it('should return tracking info for valid order', async () => {
      const mockTrackingInfo: TrackingInfo = {
        trackingNumber: 'TBA123456789',
        provider: 'Amazon',
        status: 'in_transit',
        events: [],
        lastUpdated: new Date()
      };

      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getTrackingInfo.mockResolvedValue(mockTrackingInfo);

      await controller.getTrackingInfo(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentTracker.getTrackingInfo).toHaveBeenCalledWith('ORD-2024-001');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockTrackingInfo
      });
    });

    it('should return 400 if order number is missing', async () => {
      mockRequest.params = {};

      await controller.getTrackingInfo(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Order number is required'
      });
    });

    it('should return 404 if tracking info not found', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getTrackingInfo.mockResolvedValue(null);

      await controller.getTrackingInfo(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No tracking information found for this order'
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getTrackingInfo.mockRejectedValue(new Error('Database error'));

      await controller.getTrackingInfo(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('updateTracking', () => {
    it('should update tracking info successfully', async () => {
      const mockUpdate = {
        orderId: 'order-123',
        trackingNumber: 'TBA123456789',
        provider: 'Amazon',
        status: 'in_transit' as const,
        events: []
      };

      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.updateTrackingInfo.mockResolvedValue(mockUpdate);

      await controller.updateTracking(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentTracker.updateTrackingInfo).toHaveBeenCalledWith('ORD-2024-001');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUpdate,
        message: 'Tracking information updated successfully'
      });
    });

    it('should return 400 if order number is missing', async () => {
      mockRequest.params = {};

      await controller.updateTracking(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Order number is required'
      });
    });

    it('should return 404 if no tracking info to update', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.updateTrackingInfo.mockResolvedValue(null);

      await controller.updateTracking(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No tracking information found for this order'
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.updateTrackingInfo.mockRejectedValue(new Error('Update failed'));

      await controller.updateTracking(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Update failed'
      });
    });
  });

  describe('getShipmentStatus', () => {
    it('should return shipment status successfully', async () => {
      const mockStatus = {
        status: 'in_transit' as const,
        lastUpdate: new Date(),
        estimatedDelivery: new Date('2024-12-25')
      };

      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getShipmentStatus.mockResolvedValue(mockStatus);

      await controller.getShipmentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentTracker.getShipmentStatus).toHaveBeenCalledWith('ORD-2024-001');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockStatus
      });
    });

    it('should return 400 if order number is missing', async () => {
      mockRequest.params = {};

      await controller.getShipmentStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 if status not found', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getShipmentStatus.mockResolvedValue(null);

      await controller.getShipmentStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('getEstimatedDelivery', () => {
    it('should return delivery estimate successfully', async () => {
      const mockEstimate = {
        estimatedDate: new Date('2024-12-25'),
        confidence: 'high' as const,
        businessDays: 5,
        factors: ['Standard shipping']
      };

      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getEstimatedDelivery.mockResolvedValue(mockEstimate);

      await controller.getEstimatedDelivery(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentTracker.getEstimatedDelivery).toHaveBeenCalledWith('ORD-2024-001');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockEstimate
      });
    });

    it('should return 400 if order number is missing', async () => {
      mockRequest.params = {};

      await controller.getEstimatedDelivery(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 if estimate not available', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getEstimatedDelivery.mockResolvedValue(null);

      await controller.getEstimatedDelivery(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No delivery estimate available for this order'
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { orderNumber: 'ORD-2024-001' };
      mockShipmentTracker.getEstimatedDelivery.mockRejectedValue(new Error('Service error'));

      await controller.getEstimatedDelivery(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
