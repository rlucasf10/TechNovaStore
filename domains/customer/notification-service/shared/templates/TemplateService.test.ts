import { TemplateService } from './TemplateService';

describe('TemplateService', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    templateService = new TemplateService();
  });

  describe('getTemplate', () => {
    it('should return order confirmation template', () => {
      const data = {
        orderNumber: 'ORD-123',
        customerName: 'John Doe',
        totalAmount: 99.99,
        items: [],
      };

      const template = templateService.getTemplate('order_confirmation', data);

      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template).toHaveProperty('text');
      expect(template.subject).toContain('ORD-123');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('99.99');
    });

    it('should return shipment status template', () => {
      const data = {
        orderId: 'ORD-123',
        status: 'shipped',
        trackingNumber: 'TRACK-123',
        estimatedDelivery: new Date('2024-12-31'),
      };

      const template = templateService.getTemplate('shipment_status_update', data);

      expect(template.subject).toContain('ORD-123');
      expect(template.html).toContain('TRACK-123');
      expect(template.html).toContain('shipped');
    });

    it('should return delivery delay template', () => {
      const data = {
        orderId: 'ORD-123',
        originalDelivery: new Date('2024-12-25'),
        newEstimatedDelivery: new Date('2024-12-28'),
        reason: 'Weather conditions',
      };

      const template = templateService.getTemplate('delivery_delay', data);

      expect(template.subject).toContain('Retraso');
      expect(template.html).toContain('ORD-123');
      expect(template.html).toContain('Weather conditions');
    });

    it('should return payment confirmation template', () => {
      const data = {
        orderId: 'ORD-123',
        amount: 99.99,
        paymentMethod: 'credit_card',
        transactionId: 'TXN-123',
      };

      const template = templateService.getTemplate('payment_confirmation', data);

      expect(template.subject).toContain('Pago confirmado');
      expect(template.html).toContain('99.99');
      expect(template.html).toContain('credit_card');
    });

    it('should return order cancelled template', () => {
      const data = {
        orderId: 'ORD-123',
        reason: 'Customer request',
      };

      const template = templateService.getTemplate('order_cancelled', data);

      expect(template.subject).toContain('cancelado');
      expect(template.html).toContain('ORD-123');
      expect(template.html).toContain('Customer request');
    });

    it('should return invoice generated template', () => {
      const data = {
        orderId: 'ORD-123',
        invoiceNumber: 'INV-123',
        totalAmount: 99.99,
        pdfUrl: 'https://example.com/invoice.pdf',
      };

      const template = templateService.getTemplate('invoice_generated', data);

      expect(template.subject).toContain('Factura');
      expect(template.html).toContain('INV-123');
      expect(template.html).toContain('99.99');
    });

    it('should throw error for unknown template type', () => {
      expect(() => {
        templateService.getTemplate('unknown_type' as any, {});
      }).toThrow('Template not found');
    });
  });

  describe('template content validation', () => {
    it('should include TechNovaStore branding in all templates', () => {
      const types: Array<'order_confirmation' | 'shipment_status_update' | 'delivery_delay' | 'payment_confirmation' | 'order_cancelled' | 'invoice_generated'> = [
        'order_confirmation',
        'shipment_status_update',
        'delivery_delay',
        'payment_confirmation',
        'order_cancelled',
        'invoice_generated',
      ];

      types.forEach(type => {
        const template = templateService.getTemplate(type, { orderId: 'TEST' });
        expect(template.html).toContain('TechNovaStore');
      });
    });

    it('should include proper HTML structure in all templates', () => {
      const template = templateService.getTemplate('order_confirmation', {
        orderNumber: 'ORD-123',
        customerName: 'Test',
        totalAmount: 100,
      });

      expect(template.html).toContain('<!DOCTYPE html>');
      expect(template.html).toContain('<html>');
      expect(template.html).toContain('</html>');
      expect(template.html).toContain('<body>');
      expect(template.html).toContain('</body>');
    });
  });
});
