/**
 * Tests para el caso de uso: Actualizar todos los envíos activos
 * Basados en la lógica original de ShipmentTracker.updateAllActiveShipments()
 */

import { UpdateAllActiveShipments } from './UpdateAllActiveShipments';
import { Order } from '../shared/models/Order';
import { UpdateTrackingInfo } from '../update-tracking-info/UpdateTrackingInfo';

jest.mock('../shared/models/Order');

describe('UpdateAllActiveShipments', () => {
  let updateAllActiveShipments: UpdateAllActiveShipments;
  let mockUpdateTrackingInfo: jest.Mocked<UpdateTrackingInfo>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdateTrackingInfo = {
      execute: jest.fn().mockResolvedValue(null),
    } as any;

    updateAllActiveShipments = new UpdateAllActiveShipments(mockUpdateTrackingInfo);
  });

  it('should update all active shipments', async () => {
    const mockOrders = [
      { id: '1', orderNumber: 'ORD-1', status: 'shipped' },
      { id: '2', orderNumber: 'ORD-2', status: 'processing' },
    ];

    (Order.findAll as jest.Mock).mockResolvedValue(mockOrders);

    await updateAllActiveShipments.execute();

    expect(Order.findAll).toHaveBeenCalledWith({
      where: { status: ['confirmed', 'processing', 'shipped'] }
    });
    expect(mockUpdateTrackingInfo.execute).toHaveBeenCalledTimes(2);
  });

  it('should handle empty order list', async () => {
    (Order.findAll as jest.Mock).mockResolvedValue([]);

    await updateAllActiveShipments.execute();

    expect(mockUpdateTrackingInfo.execute).not.toHaveBeenCalled();
  });
});
