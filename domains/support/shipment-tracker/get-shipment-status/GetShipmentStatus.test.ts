/**
 * Tests para el caso de uso: Obtener estado del envío
 * Basados en la lógica original de ShipmentTracker.getShipmentStatus()
 */

import { GetShipmentStatus } from './GetShipmentStatus';
import { GetTrackingInfo } from '../get-tracking-info/GetTrackingInfo';
import { TrackingInfo } from '../shared/types/tracking';

describe('GetShipmentStatus', () => {
  let getShipmentStatus: GetShipmentStatus;
  let mockGetTrackingInfo: jest.Mocked<GetTrackingInfo>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetTrackingInfo = {
      execute: jest.fn(),
    } as any;

    getShipmentStatus = new GetShipmentStatus(mockGetTrackingInfo);
  });

  it('should return shipment status with all fields', async () => {
    const mockTrackingInfo: TrackingInfo = {
      trackingNumber: 'TRACK-123',
      provider: 'Amazon',
      status: 'in_transit',
      estimatedDeliveryDate: new Date('2024-12-31'),
      actualDeliveryDate: undefined,
      events: [],
      lastUpdated: new Date('2024-12-20'),
    };

    mockGetTrackingInfo.execute.mockResolvedValue(mockTrackingInfo);

    const result = await getShipmentStatus.execute('ORD-123');

    expect(result).toEqual({
      status: 'in_transit',
      lastUpdate: mockTrackingInfo.lastUpdated,
      estimatedDelivery: mockTrackingInfo.estimatedDeliveryDate,
    });
  });

  it('should return null when tracking info not found', async () => {
    mockGetTrackingInfo.execute.mockResolvedValue(null);

    const result = await getShipmentStatus.execute('ORD-456');

    expect(result).toBeNull();
  });

  it('should include actual delivery date when delivered', async () => {
    const mockTrackingInfo: TrackingInfo = {
      trackingNumber: 'TRACK-789',
      provider: 'Amazon',
      status: 'delivered',
      estimatedDeliveryDate: new Date('2024-12-25'),
      actualDeliveryDate: new Date('2024-12-24'),
      events: [],
      lastUpdated: new Date('2024-12-24'),
    };

    mockGetTrackingInfo.execute.mockResolvedValue(mockTrackingInfo);

    const result = await getShipmentStatus.execute('ORD-789');

    expect(result).toEqual({
      status: 'delivered',
      lastUpdate: mockTrackingInfo.lastUpdated,
      estimatedDelivery: mockTrackingInfo.estimatedDeliveryDate,
      actualDelivery: mockTrackingInfo.actualDeliveryDate,
    });
  });
});
