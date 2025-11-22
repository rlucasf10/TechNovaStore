/**
 * Tests MUY COMPLETOS para el caso de uso: Procesar Pago
 */

import { ProcessPayment, PaymentRequest } from './ProcessPayment';
import { logger } from '../shared/utils/logger';
import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

jest.mock('../shared/utils/logger');
jest.mock('../shared/clients/OrderServiceClient');

describe('ProcessPayment', () => {
  let processPayment: ProcessPayment;
  let mockOrderServiceClient: jest.Mocked<OrderServiceClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOrderServiceClient = {
      updatePaymentStatus: jest.fn(),
    } as any;

    processPayment = new ProcessPayment(mockOrderServiceClient);

    // Mock Math.random para tests predecibles
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Casos exitosos', () => {
    it('should process credit card payment successfully', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe('completed');
      expect(result.transactionId).toBeDefined();
      expect(mockOrderServiceClient.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        'completed',
        expect.any(String)
      );
    });

    it('should process PayPal payment successfully', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'paypal',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('PP-');
    });

    it('should process bank transfer as pending', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'bank_transfer',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe('pending');
      expect(result.transactionId).toContain('BT-');
    });

    it('should process cash on delivery', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'cash_on_delivery',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe('pending');
      expect(result.transactionId).toContain('COD-');
    });

    it('should notify order service on successful payment', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      await processPayment.execute(paymentRequest);

      expect(mockOrderServiceClient.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        'completed',
        expect.any(String)
      );
    });

    it('should log payment processing', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      await processPayment.execute(paymentRequest);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing payment'),
        expect.any(Object)
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should handle payment failure', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.paymentStatus).toBe('failed');
      expect(mockOrderServiceClient.updatePaymentStatus).toHaveBeenCalledWith(1, 'failed');
      
      randomSpy.mockRestore();
    });

    it('should handle unsupported payment method', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'unsupported_method',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('UNSUPPORTED_METHOD');
    });

    it('should handle system errors', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockRejectedValue(new Error('Service unavailable'));

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SYSTEM_ERROR');
    });

    it('should log payment failure', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      await processPayment.execute(paymentRequest);

      expect(logger.error).toHaveBeenCalled();
      
      randomSpy.mockRestore();
    });
  });

  describe('Validación de entrada', () => {
    it('should handle different currencies', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 100.00,
        currency: 'USD',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result.success).toBe(true);
    });

    it('should handle zero amount', async () => {
      const paymentRequest: PaymentRequest = {
        orderId: 1,
        amount: 0,
        currency: 'EUR',
        paymentMethod: 'credit_card',
        customerInfo: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        billingAddress: {
          street: '123 Main St',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
        },
      };

      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processPayment.execute(paymentRequest);

      expect(result).toBeDefined();
    });
  });
});
