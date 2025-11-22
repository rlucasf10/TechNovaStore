/**
 * Tests para el caso de uso: Verificar retrasos en entregas
 * Extraídos de NotificationService.test.ts
 */

import { CheckDeliveryDelays, OrderForDelayCheck } from './CheckDeliveryDelays';
import { SendDelayAlert } from '../send-delay-alert/SendDelayAlert';

describe('CheckDeliveryDelays', () => {
  let checkDeliveryDelays: CheckDeliveryDelays;
  let mockSendDelayAlert: jest.Mocked<SendDelayAlert>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSendDelayAlert = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;
    
    checkDeliveryDelays = new CheckDeliveryDelays(mockSendDelayAlert);
  });

  it('should detect and send alerts for delayed orders', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

    const orders: OrderForDelayCheck[] = [
      {
        orderId: 'ORD-123',
        customerEmail: 'customer@example.com',
        estimatedDelivery: pastDate,
        currentStatus: 'in_transit',
      },
    ];

    await checkDeliveryDelays.execute(orders);

    expect(mockSendDelayAlert.execute).toHaveBeenCalled();
    expect(mockSendDelayAlert.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ORD-123',
        customerEmail: 'customer@example.com',
      })
    );
  });

  it('should not send alerts for delivered orders', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const orders: OrderForDelayCheck[] = [
      {
        orderId: 'ORD-123',
        customerEmail: 'customer@example.com',
        estimatedDelivery: pastDate,
        currentStatus: 'delivered',
      },
    ];

    await checkDeliveryDelays.execute(orders);

    expect(mockSendDelayAlert.execute).not.toHaveBeenCalled();
  });

  it('should not send alerts for cancelled orders', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const orders: OrderForDelayCheck[] = [
      {
        orderId: 'ORD-456',
        customerEmail: 'customer@example.com',
        estimatedDelivery: pastDate,
        currentStatus: 'cancelled',
      },
    ];

    await checkDeliveryDelays.execute(orders);

    expect(mockSendDelayAlert.execute).not.toHaveBeenCalled();
  });
});
