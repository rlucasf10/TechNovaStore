/**
 * Tests para el caso de uso: Obtener información de seguimiento
 * Basados en la lógica original de ShipmentTracker.getTrackingInfo()
 */

import { GetTrackingInfo } from './GetTrackingInfo';
import { Order } from '../shared/models/Order';
import { TrackingProvider, TrackingInfo } from '../shared/types/tracking';

// Mock del modelo Order
jest.mock('../shared/models/Order');

describe('GetTrackingInfo', () => {
  let getTrackingInfo: GetTrackingInfo;
  let mockProviders: Map<string, jest.Mocked<TrackingProvider>>;
  let mockProvider: jest.Mocked<TrackingProvider>;

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

    getTrackingInfo = new GetTrackingInfo(mockProviders);
  });

  it('should return tracking info for valid order with tracking number', async () => {
    const mockOrder = {
      id: 123,
      orderNumber: 'ORD-123',
      trackingNumber: 'TRACK-123',
      providerName: 'Amazon',
      status: 'shipped',
    } as any;

    const mockTrackingInfo: TrackingInfo = {
      trackingNumber: 'TRACK-123',
      provider: 'Amazon',
      status: 'in_transit',
      events: [],
      lastUpdated: new Date(),
    };

    (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);
    mockProvider.getTrackingInfo.mockResolvedValue({
      success: true,
      trackingInfo: mockTrackingInfo,
    });

    const result = await getTrackingInfo.execute('ORD-123');

    expect(result).toEqual(mockTrackingInfo);
    expect(Order.findOne).toHaveBeenCalledWith({ where: { orderNumber: 'ORD-123' } });
    expect(mockProvider.getTrackingInfo).toHaveBeenCalledWith('TRACK-123');
  });

  it('should throw error when order not found', async () => {
    (Order.findOne as jest.Mock).mockResolvedValue(null);

    await expect(getTrackingInfo.execute('nonexistent')).rejects.toThrow('Order nonexistent not found');
  });

  it('should return null for order without tracking numbers', async () => {
    const mockOrder = {
      id: 456,
      orderNumber: 'ORD-456',
      trackingNumber: null,
      status: 'processing',
    } as any;

    (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);

    const result = await getTrackingInfo.execute('ORD-456');

    expect(result).toBeNull();
    expect(mockProvider.getTrackingInfo).not.toHaveBeenCalled();
  });
});
