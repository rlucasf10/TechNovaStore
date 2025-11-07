import { NotificationService } from '../src/services/NotificationService';
import { EmailService } from '../src/services/EmailService';
import { TemplateService } from '../src/services/TemplateService';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockTemplateService: jest.Mocked<TemplateService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create mock services
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
    
    notificationService = new NotificationService(mockEmailService, mockTemplateService);
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email successfully', async () => {
      const orderId = 'ORD-123';
      const customerEmail = 'customer@example.com';
      const orderData = {
        orderNumber: 'ORD-123',
        customerName: 'John Doe',
        totalAmount: 99.99,
        items: [],
      };

      await notificationService.sendOrderConfirmation(orderId, customerEmail, orderData);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'order_confirmation',
        expect.objectContaining({
          orderId,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          totalAmount: orderData.totalAmount,
        })
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        customerEmail,
        expect.objectContaining({
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        })
      );
    });
  });

  describe('sendShipmentStatusNotification', () => {
    it('should send shipment status update successfully', async () => {
      const data = {
        orderId: 'ORD-123',
        status: 'shipped',
        trackingNumber: 'TRACK-123',
        estimatedDelivery: new Date('2024-12-31'),
        customerEmail: 'customer@example.com',
      };

      await notificationService.sendShipmentStatusNotification(data);

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

  describe('sendDelayAlert', () => {
    it('should send delay alert notification', async () => {
      const data = {
        orderId: 'ORD-123',
        originalDelivery: new Date('2024-12-25'),
        newEstimatedDelivery: new Date('2024-12-28'),
        customerEmail: 'customer@example.com',
        reason: 'Weather conditions',
      };

      await notificationService.sendDelayAlert(data);

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

  describe('sendPaymentConfirmation', () => {
    it('should send payment confirmation email', async () => {
      const orderId = 'ORD-123';
      const customerEmail = 'customer@example.com';
      const paymentData = {
        amount: 99.99,
        method: 'credit_card',
        transactionId: 'TXN-123',
      };

      await notificationService.sendPaymentConfirmation(orderId, customerEmail, paymentData);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'payment_confirmation',
        expect.objectContaining({
          orderId,
          amount: paymentData.amount,
          paymentMethod: paymentData.method,
        })
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send multiple notifications in bulk', async () => {
      const notifications = [
        {
          type: 'order_confirmation' as const,
          recipient: 'user1@example.com',
          data: { orderId: 'ORD-1', orderNumber: 'ORD-1' },
        },
        {
          type: 'order_confirmation' as const,
          recipient: 'user2@example.com',
          data: { orderId: 'ORD-2', orderNumber: 'ORD-2' },
        },
      ];

      await notificationService.sendBulkNotifications(notifications);

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in bulk notifications gracefully', async () => {
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Send failed'));

      const notifications = [
        {
          type: 'order_confirmation' as const,
          recipient: 'user1@example.com',
          data: { orderId: 'ORD-1' },
        },
      ];

      // Should not throw, uses Promise.allSettled
      await notificationService.sendBulkNotifications(notifications);

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('checkForDelays', () => {
    it('should detect and send alerts for delayed orders', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

      const orders = [
        {
          orderId: 'ORD-123',
          customerEmail: 'customer@example.com',
          estimatedDelivery: pastDate,
          currentStatus: 'in_transit',
        },
      ];

      await notificationService.checkForDelays(orders);

      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith(
        'delivery_delay',
        expect.any(Object)
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should not send alerts for delivered orders', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const orders = [
        {
          orderId: 'ORD-123',
          customerEmail: 'customer@example.com',
          estimatedDelivery: pastDate,
          currentStatus: 'delivered',
        },
      ];

      await notificationService.checkForDelays(orders);

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
  });
});
