/**
 * Tests para el caso de uso: Enviar factura generada
 * Basados en la lógica del NotificationService original
 */

import { SendInvoiceGenerated, InvoiceGeneratedData } from './SendInvoiceGenerated';
import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

describe('SendInvoiceGenerated', () => {
  let sendInvoiceGenerated: SendInvoiceGenerated;
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
    
    sendInvoiceGenerated = new SendInvoiceGenerated(mockEmailService, mockTemplateService);
  });

  it('should send invoice generated notification', async () => {
    const data: InvoiceGeneratedData = {
      orderId: 'ORD-123',
      customerEmail: 'customer@example.com',
      invoiceData: {
        invoiceNumber: 'INV-123',
        totalAmount: 99.99,
        pdfUrl: 'https://example.com/invoices/INV-123.pdf',
      },
    };

    await sendInvoiceGenerated.execute(data);

    expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
      'invoice_generated',
      expect.objectContaining({
        orderId: data.orderId,
        invoiceNumber: data.invoiceData.invoiceNumber,
        totalAmount: data.invoiceData.totalAmount,
        pdfUrl: data.invoiceData.pdfUrl,
      })
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
  });
});
