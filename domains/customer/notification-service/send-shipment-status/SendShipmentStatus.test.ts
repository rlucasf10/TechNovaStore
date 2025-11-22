/**
 * Tests para el caso de uso: Enviar estado de envío
 * Extraídos de NotificationService.test.ts
 */

import { SendShipmentStatus } from './SendShipmentStatus';
import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';
import { ShipmentStatusData } from '../shared/types/index';

describe('SendShipmentStatus', () => {
  let sendShipmentStatus: SendShipmentStatus;
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
    
    sendShipmentStatus = new SendShipmentStatus(mockEmailService, mockTemplateService);
  });

  it('should send shipment status update successfully', async () => {
    const data: ShipmentStatusData = {
      orderId: 'ORD-123',
      status: 'shipped',
      trackingNumber: 'TRACK-123',
      estimatedDelivery: new Date('2024-12-31'),
      customerEmail: 'customer@example.com',
    };

    await sendShipmentStatus.execute(data);

    expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
      'shipment_status_update',
      expect.objectContaining({
        orderId: data.orderId,
        status: data.status,
        trackingNumber: data.trackingNumber,
      })
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
  });
});
