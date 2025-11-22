/**
 * Tests para el caso de uso: Enviar alerta de retraso
 * Extraídos de NotificationService.test.ts
 */

import { SendDelayAlert } from './SendDelayAlert';
import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { DelayAlertData } from '../shared/types/index';

describe('SendDelayAlert', () => {
  let sendDelayAlert: SendDelayAlert;
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
    
    sendDelayAlert = new SendDelayAlert(mockEmailService, mockTemplateService);
  });

  it('should send delay alert notification', async () => {
    const data: DelayAlertData = {
      orderId: 'ORD-123',
      originalDelivery: new Date('2024-12-25'),
      newEstimatedDelivery: new Date('2024-12-28'),
      customerEmail: 'customer@example.com',
      reason: 'Weather conditions',
    };

    await sendDelayAlert.execute(data);

    expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
      'delivery_delay',
      expect.objectContaining({
        orderId: data.orderId,
        originalDelivery: data.originalDelivery,
        newEstimatedDelivery: data.newEstimatedDelivery,
        reason: data.reason,
      })
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
  });
});
