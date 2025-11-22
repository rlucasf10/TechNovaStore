/**
 * Tests para el caso de uso: Enviar cancelación de pedido
 * Basados en la lógica del NotificationService original
 */

import { SendOrderCancellation, OrderCancellationData } from './SendOrderCancellation';
import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

describe('SendOrderCancellation', () => {
  let sendOrderCancellation: SendOrderCancellation;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockTemplateService: jest.Mocked<TemplateService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
      verifyConnection: jest.fn().mockResolvedValue(true),
    } as any;
    
    mockTemplateService = {
      getTemplate: jest.fn().mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      }),
    } as any;
    
    sendOrderCancellation = new SendOrderCancellation(mockEmailService, mockTemplateService);
  });

  it('should send order cancellation notification', async () => {
    const data: OrderCancellationData = {
      orderId: 'ORD-123',
      customerEmail: 'customer@example.com',
      reason: 'Customer request',
    };

    await sendOrderCancellation.execute(data);

    expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
      'order_cancelled',
      expect.objectContaining({
        orderId: data.orderId,
        reason: data.reason,
      })
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
  });

  it('should send order cancellation without reason', async () => {
    const data: OrderCancellationData = {
      orderId: 'ORD-456',
      customerEmail: 'customer@example.com',
    };

    await sendOrderCancellation.execute(data);

    expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
      'order_cancelled',
      expect.objectContaining({
        orderId: data.orderId,
      })
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
  });
});
