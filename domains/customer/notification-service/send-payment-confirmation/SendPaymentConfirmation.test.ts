/**
 * Tests para el caso de uso: Enviar confirmación de pago
 * Extraídos de NotificationService.test.ts
 */

import { SendPaymentConfirmation, PaymentConfirmationData } from './SendPaymentConfirmation';
import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

describe('SendPaymentConfirmation', () => {
  let sendPaymentConfirmation: SendPaymentConfirmation;
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
    
    sendPaymentConfirmation = new SendPaymentConfirmation(mockEmailService, mockTemplateService);
  });

  it('should send payment confirmation email', async () => {
    const data: PaymentConfirmationData = {
      orderId: 'ORD-123',
      customerEmail: 'customer@example.com',
      paymentData: {
        amount: 99.99,
        method: 'credit_card',
        transactionId: 'TXN-123',
      },
    };

    await sendPaymentConfirmation.execute(data);

    expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
      'payment_confirmation',
      expect.objectContaining({
        orderId: data.orderId,
        amount: data.paymentData.amount,
        paymentMethod: data.paymentData.method,
      })
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
  });
});
