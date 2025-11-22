/**
 * Tests para el caso de uso: Actualizar información de seguimiento
 * Basados en la lógica original de ShipmentTracker.updateTrackingInfo()
 */

import { UpdateTrackingInfo } from './UpdateTrackingInfo';
import { Order } from '../shared/models/Order';
import { TrackingProvider } from '../shared/types/tracking';
import { NotificationService } from '../shared/clients/NotificationService';

jest.mock('../shared/models/Order');
jest.mock('../shared/clients/NotificationService');

describe('UpdateTrackingInfo', () => {
  let updateTrackingInfo: UpdateTrackingInfo;
  let mockProviders: Map<string, jest.Mocked<TrackingProvider>>;
  let mockProvider: jest.Mocked<TrackingProvider>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProvider = {
      name: 'Amazon',
      getTrackingInfo: jest.fn(),
      isTrackingNumberValid: jest.fn().mockReturnValue(true),
      getEstimatedDelivery: jest.fn(),
    } as any;

    mockProviders = new Map();
    mockProviders.set('Amazon', mockProvider);

    mockNotificationService = {
      sendShipmentUpdate: jest.fn(),
      sendDelayNotification: jest.fn(),
    } as any;

    updateTrackingInfo = new UpdateTrackingInfo(mockProviders, mockNotificationService);
  });

  it('should update tracking info and save order', async () => {
    const mockOrder = {
      id: 123,
      orderNumber: 'ORD-123',
      trackingNumber: 'TRACK-123',
      providerName: 'Amazon',
      status: 'processing',
      estimatedDelivery: null,
      updateStatus: jest.fn(),
      save: jest.fn(),
    } as any;

    const mockTrackingInfo = {
      trackingNumber: 'TRACK-123',
      provider: 'Amazon',
      status: 'in_transit' as const,
      estimatedDeliveryDate: new Date('2024-12-31'),
      events: [],
      lastUpdated: new Date(),
    };

    (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);
    mockProvider.getTrackingInfo.mockResolvedValue({
      success: true,
      trackingInfo: mockTrackingInfo,
    });

    const result = await updateTrackingInfo.execute('ORD-123');

    expect(result).toBeDefined();
    expect(mockOrder.save).toHaveBeenCalled();
    expect(mockOrder.updateStatus).toHaveBeenCalledWith('shipped');
  });

  it('should return null for order without tracking numbers', async () => {
    const mockOrder = {
      id: 456,
      orderNumber: 'ORD-456',
      trackingNumber: null,
      status: 'processing',
    } as any;

    (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

    const result = await updateTrackingInfo.execute('ORD-456');

    expect(result).toBeNull();
  });
});
