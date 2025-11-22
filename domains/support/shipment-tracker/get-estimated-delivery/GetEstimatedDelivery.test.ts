/**
 * Tests para el caso de uso: Obtener fecha estimada de entrega
 * Basados en la lógica original de ShipmentTracker.getEstimatedDelivery()
 */

import { GetEstimatedDelivery } from './GetEstimatedDelivery';
import { Order } from '../shared/models/Order';
import { TrackingProvider, DeliveryEstimate } from '../shared/types/tracking';

jest.mock('../shared/models/Order');

describe('GetEstimatedDelivery', () => {
  let getEstimatedDelivery: GetEstimatedDelivery;
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

    getEstimatedDelivery = new GetEstimatedDelivery(mockProviders);
  });

  it('should return delivery estimate for valid order', async () => {
    const mockOrder = {
      id: 123,
      orderNumber: 'ORD-123',
      trackingNumber: 'TRACK-123',
      providerName: 'Amazon',
      shippingAddress: { city: 'Seattle', state: 'WA', postalCode: '98101', country: 'USA', street: '123 Main St' },
    } as any;

    const mockEstimate: DeliveryEstimate = {
      estimatedDate: new Date('2024-12-31'),
      confidence: 'high',
      businessDays: 5,
      factors: ['Standard shipping'],
    };

    (Order.findOne as jest.Mock).mockResolvedValue(mockOrder);
    mockProvider.getEstimatedDelivery.mockResolvedValue(mockEstimate);

    const result = await getEstimatedDelivery.execute('ORD-123');

    expect(result).toEqual(mockEstimate);
    expect(mockProvider.getEstimatedDelivery).toHaveBeenCalledWith('TRACK-123', 'Seattle', 'Seattle');
  });

  it('should throw error when order not found', async () => {
    (Order.findOne as jest.Mock).mockResolvedValue(null);

    await expect(getEstimatedDelivery.execute('nonexistent')).rejects.toThrow('Order nonexistent not found');
  });
});
