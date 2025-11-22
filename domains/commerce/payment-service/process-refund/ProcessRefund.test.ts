/**
 * Tests MUY COMPLETOS para el caso de uso: Procesar Reembolso
 */

import { ProcessRefund } from './ProcessRefund';
import { logger } from '../shared/utils/logger';
import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

jest.mock('../shared/utils/logger');
jest.mock('../shared/clients/OrderServiceClient');

describe('ProcessRefund', () => {
  let processRefund: ProcessRefund;
  let mockOrderServiceClient: jest.Mocked<OrderServiceClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOrderServiceClient = {
      getPaymentStatus: jest.fn(),
      updatePaymentStatus: jest.fn(),
    } as any;

    processRefund = new ProcessRefund(mockOrderServiceClient);
  });

  describe('Casos exitosos', () => {
    it('should process full refund', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1);

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe('refunded');
      expect(result.transactionId).toBeDefined();
      expect(mockOrderServiceClient.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        'refunded',
        expect.any(String)
      );
    });

    it('should process partial refund', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1, 50.00);

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe('refunded');
    });

    it('should notify order service', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      await processRefund.execute(1);

      expect(mockOrderServiceClient.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        'refunded',
        expect.any(String)
      );
    });

    it('should log refund processing', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      await processRefund.execute(1);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processing refund'),
        expect.any(Object)
      );
    });

    it('should log refund completion', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      await processRefund.execute(1);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Refund completed'),
        expect.any(Object)
      );
    });

    it('should generate refund transaction id', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1);

      expect(result.transactionId).toContain('REF-');
    });
  });

  describe('Manejo de errores', () => {
    it('should return error if order not found', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue(null);

      const result = await processRefund.execute(999);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ORDER_NOT_FOUND');
    });

    it('should return error if order was not paid', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'pending',
        amount: 100.00,
      });

      const result = await processRefund.execute(1);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PAYMENT_STATUS');
    });

    it('should handle service errors', async () => {
      mockOrderServiceClient.getPaymentStatus.mockRejectedValue(new Error('Service error'));

      const result = await processRefund.execute(1);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('REFUND_ERROR');
    });

    it('should log refund errors', async () => {
      mockOrderServiceClient.getPaymentStatus.mockRejectedValue(new Error('Service error'));

      await processRefund.execute(1);

      expect(logger.error).toHaveBeenCalledWith(
        'Refund processing error:',
        expect.any(Error)
      );
    });

    it('should handle update status errors', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockRejectedValue(new Error('Update failed'));

      const result = await processRefund.execute(1);

      expect(result.success).toBe(false);
    });
  });

  describe('Validación de entrada', () => {
    it('should handle zero refund amount', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1, 0);

      expect(result.success).toBe(true);
    });

    it('should handle negative refund amount', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1, -10.00);

      expect(result.success).toBe(true);
    });

    it('should handle refund amount greater than order total', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1, 200.00);

      expect(result.success).toBe(true);
    });
  });

  describe('Reglas de negocio', () => {
    it('should not refund orders with pending payment', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'pending',
        amount: 100.00,
      });

      const result = await processRefund.execute(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot refund order that was not paid');
    });

    it('should not refund orders with failed payment', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'failed',
        amount: 100.00,
      });

      const result = await processRefund.execute(1);

      expect(result.success).toBe(false);
    });

    it('should allow refunding completed payments', async () => {
      mockOrderServiceClient.getPaymentStatus.mockResolvedValue({
        paymentStatus: 'completed',
        amount: 100.00,
      });
      mockOrderServiceClient.updatePaymentStatus.mockResolvedValue(undefined);

      const result = await processRefund.execute(1);

      expect(result.success).toBe(true);
    });
  });
});
