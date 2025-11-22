/**
 * Tests MUY COMPLETOS para el caso de uso: Obtener Estado de Pago
 */

import { GetPaymentStatus } from './GetPaymentStatus';
import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

jest.mock('../shared/clients/OrderServiceClient');

describe('GetPaymentStatus', () => {
  let getPaymentStatus: GetPaymentStatus;
  let mockOrderServiceClient: jest.Mocked<OrderServiceClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOrderServiceClient = {
      getPaymentStatus: jest.fn(),
    } as any;

    getPaymentStatus = new GetPaymentStatus(mockOrderServiceClient);
  });

  describe('Casos exitosos', () => {
    it('should return payment status for order', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });

      const result = await getPaymentStatus.execute(1);

      expect(mockOrderServiceClient.getPaymentStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        paymentStatus: 'completed',
        amount: 100.00,
      });
    });

    it('should return pending payment status', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'pending',
        amount: 100.00,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.paymentStatus).toBe('pending');
    });

    it('should return completed payment status', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.paymentStatus).toBe('completed');
    });

    it('should return failed payment status', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'failed',
        amount: 100.00,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.paymentStatus).toBe('failed');
    });

    it('should return refunded payment status', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'refunded',
        amount: 100.00,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.paymentStatus).toBe('refunded');
    });

    it('should return order amount', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 250.50,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.amount).toBe(250.50);
    });

    it('should handle zero amount', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 0,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.amount).toBe(0);
    });

    it('should handle decimal amounts', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 123.45,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.amount).toBe(123.45);
    });
  });

  describe('Manejo de errores', () => {
    it('should return null if order not found', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue(null);

      const result = await getPaymentStatus.execute(999);

      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      mockOrderServiceClient.getPaymentStatus.mockRejectedValue(new Error('Service error'));

      await expect(getPaymentStatus.execute(1)).rejects.toThrow('Service error');
    });

    it('should handle connection timeout', async () => {
      mockOrderServiceClient.getPaymentStatus.mockRejectedValue(new Error('Connection timeout'));

      await expect(getPaymentStatus.execute(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Validación de entrada', () => {
    it('should handle zero as order id', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue(null);

      const result = await getPaymentStatus.execute(0);

      expect(result).toBeNull();
    });

    it('should handle negative order id', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue(null);

      const result = await getPaymentStatus.execute(-1);

      expect(result).toBeNull();
    });

    it('should handle very large order id', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue(null);

      const result = await getPaymentStatus.execute(999999999);

      expect(result).toBeNull();
    });
  });

  describe('Estados de pago', () => {
    it('should handle processing payment status', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'processing',
        amount: 100.00,
      });

      const result = await getPaymentStatus.execute(1);

      expect(result?.paymentStatus).toBe('processing');
    });

    it('should return payment info for all valid statuses', async () => {
      const statuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];

      for (const status of statuses) {
        mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
          paymentStatus: status,
          amount: 100.00,
        });

        const result = await getPaymentStatus.execute(1);

        expect(result?.paymentStatus).toBe(status);
        expect(result?.amount).toBe(100.00);
      }
    });
  });
});
