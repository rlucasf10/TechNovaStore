/**
 * Tests para el caso de uso: Enviar confirmación de pedido
 * Basados en los tests originales de NotificationService
 */

import { SendOrderConfirmation, OrderConfirmationData } from './SendOrderConfirmation';
import { EmailService } from '../shared/email/EmailService';
import { TemplateService } from '../shared/templates/TemplateService';

describe('SendOrderConfirmation', () => {
  let sendOrderConfirmation: SendOrderConfirmation;
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
        subject: 'Confirmación de pedido #ORD-123 - TechNovaStore',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      }),
    } as any;
    
    sendOrderConfirmation = new SendOrderConfirmation(mockEmailService, mockTemplateService);
  });

  describe('Casos exitosos', () => {
    it('should send order confirmation email successfully', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-123',
        customerEmail: 'customer@example.com',
        orderData: {
          orderNumber: 'ORD-123',
          customerName: 'John Doe',
          totalAmount: 99.99,
          items: [],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          orderId: data.orderId,
          orderNumber: data.orderData.orderNumber,
          customerName: data.orderData.customerName,
          totalAmount: data.orderData.totalAmount,
        })
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        data.customerEmail,
        expect.objectContaining({
          subject: expect.stringContaining('ORD-123'),
          html: '<p>Test HTML</p>',
        })
      );
    });

    it('should handle order with multiple items', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-456',
        customerEmail: 'jane@example.com',
        orderData: {
          orderNumber: 'ORD-456',
          customerName: 'Jane Smith',
          totalAmount: 299.99,
          items: [
            { id: 1, name: 'Product 1', price: 99.99 },
            { id: 2, name: 'Product 2', price: 200.00 },
          ],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ name: 'Product 1' }),
            expect.objectContaining({ name: 'Product 2' }),
          ]),
        })
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should handle order with empty items array', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-789',
        customerEmail: 'bob@example.com',
        orderData: {
          orderNumber: 'ORD-789',
          customerName: 'Bob Johnson',
          totalAmount: 49.99,
          items: [],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should handle customer without name', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-999',
        customerEmail: 'anonymous@example.com',
        orderData: {
          orderNumber: 'ORD-999',
          customerName: '',
          totalAmount: 19.99,
          items: [],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should handle large order amounts', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-111',
        customerEmail: 'test@example.com',
        orderData: {
          orderNumber: 'ORD-111',
          customerName: 'Test User',
          totalAmount: 9999.99,
          items: [],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          totalAmount: 9999.99,
        })
      );
    });

    it('should handle small order amounts', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-222',
        customerEmail: 'test@example.com',
        orderData: {
          orderNumber: 'ORD-222',
          customerName: 'Test User',
          totalAmount: 0.99,
          items: [],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          totalAmount: 0.99,
        })
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if email service fails', async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error('SMTP connection failed'));

      const data: OrderConfirmationData = {
        orderId: 'ORD-ERROR',
        customerEmail: 'error@example.com',
        orderData: {
          orderNumber: 'ORD-ERROR',
          customerName: 'Error User',
          totalAmount: 99.99,
          items: [],
        },
      };

      await expect(sendOrderConfirmation.execute(data)).rejects.toThrow('SMTP connection failed');
    });

    it('should throw error if template service fails', async () => {
      mockTemplateService.getTemplate.mockImplementation(() => {
        throw new Error('Template not found');
      });

      const data: OrderConfirmationData = {
        orderId: 'ORD-TEMPLATE-ERROR',
        customerEmail: 'test@example.com',
        orderData: {
          orderNumber: 'ORD-TEMPLATE-ERROR',
          customerName: 'Test User',
          totalAmount: 99.99,
          items: [],
        },
      };

      await expect(sendOrderConfirmation.execute(data)).rejects.toThrow('Template not found');
    });

    it('should propagate network errors', async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error('Network timeout'));

      const data: OrderConfirmationData = {
        orderId: 'ORD-TIMEOUT',
        customerEmail: 'timeout@example.com',
        orderData: {
          orderNumber: 'ORD-TIMEOUT',
          customerName: 'Timeout User',
          totalAmount: 99.99,
          items: [],
        },
      };

      await expect(sendOrderConfirmation.execute(data)).rejects.toThrow('Network timeout');
    });

    it('should propagate authentication errors', async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error('Authentication failed'));

      const data: OrderConfirmationData = {
        orderId: 'ORD-AUTH',
        customerEmail: 'auth@example.com',
        orderData: {
          orderNumber: 'ORD-AUTH',
          customerName: 'Auth User',
          totalAmount: 99.99,
          items: [],
        },
      };

      await expect(sendOrderConfirmation.execute(data)).rejects.toThrow('Authentication failed');
    });
  });

  describe('Template generation', () => {
    it('should generate template with correct notification type', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-TEMPLATE',
        customerEmail: 'template@example.com',
        orderData: {
          orderNumber: 'ORD-TEMPLATE',
          customerName: 'Template User',
          totalAmount: 99.99,
          items: [],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.any(Object)
      );
    });

    it('should pass all required data to template', async () => {
      const data: OrderConfirmationData = {
        orderId: 'ORD-DATA',
        customerEmail: 'data@example.com',
        orderData: {
          orderNumber: 'ORD-DATA',
          customerName: 'Data User',
          totalAmount: 149.99,
          items: [{ id: 1, name: 'Item 1' }],
        },
      };

      await sendOrderConfirmation.execute(data);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          orderId: 'ORD-DATA',
          orderNumber: 'ORD-DATA',
          customerName: 'Data User',
          totalAmount: 149.99,
          items: expect.any(Array),
        })
      );
    });
  });
});
