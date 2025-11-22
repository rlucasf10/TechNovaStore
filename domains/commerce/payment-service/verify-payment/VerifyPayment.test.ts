/**
 * Tests MUY COMPLETOS para el caso de uso: Verificar Pago
 */

import { VerifyPayment } from './VerifyPayment';
import { logger } from '../shared/utils/logger';

jest.mock('../shared/utils/logger');

describe('VerifyPayment', () => {
  let verifyPayment: VerifyPayment;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Asegurar que el logger no lance errores por defecto
    (logger.info as jest.Mock).mockImplementation(() => {});
    (logger.error as jest.Mock).mockImplementation(() => {});
    verifyPayment = new VerifyPayment();
  });

  describe('Casos exitosos', () => {
    it('should verify card payment transaction', async () => {
      const transactionId = 'CARD-1234567890-abc123';

      const result = await verifyPayment.execute(transactionId);

      expect(result).not.toBeNull();
      expect(result?.verified).toBe(true);
      expect(result?.transactionId).toBe(transactionId);
      expect(result?.status).toBe('completed');
    });

    it('should verify PayPal transaction', async () => {
      const transactionId = 'PP-1234567890-xyz789';

      const result = await verifyPayment.execute(transactionId);

      expect(result).not.toBeNull();
      expect(result?.verified).toBe(true);
      expect(result?.status).toBe('completed');
    });

    it('should verify bank transfer as pending', async () => {
      const transactionId = 'BT-1234567890-def456';

      const result = await verifyPayment.execute(transactionId);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
    });

    it('should verify cash on delivery as pending', async () => {
      const transactionId = 'COD-1234567890';

      const result = await verifyPayment.execute(transactionId);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
    });

    it('should return transaction details', async () => {
      const transactionId = 'CARD-1234567890-abc123';

      const result = await verifyPayment.execute(transactionId);

      expect(result?.amount).toBeDefined();
      expect(result?.currency).toBeDefined();
      expect(result?.timestamp).toBeInstanceOf(Date);
    });

    it('should log verification start', async () => {
      const transactionId = 'CARD-1234567890-abc123';

      await verifyPayment.execute(transactionId);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Verifying payment'),
        expect.anything()
      );
    });

    it('should log verification completion', async () => {
      const transactionId = 'CARD-1234567890-abc123';

      await verifyPayment.execute(transactionId);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('verification completed'),
        expect.any(Object)
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should handle unknown transaction types', async () => {
      const transactionId = 'UNKNOWN-1234567890';

      const result = await verifyPayment.execute(transactionId);

      expect(result?.status).toBe('failed');
    });

    it('should return null on error', async () => {
      // Forzar un error mockeando logger para que lance excepción
      (logger.info as jest.Mock).mockImplementation(() => {
        throw new Error('Logger error');
      });

      const result = await verifyPayment.execute('CARD-123');

      expect(result).toBeNull();
    });

    it('should log errors', async () => {
      (logger.info as jest.Mock).mockImplementation(() => {
        throw new Error('Verification error');
      });

      await verifyPayment.execute('CARD-123');

      expect(logger.error).toHaveBeenCalledWith(
        'Payment verification error:',
        expect.any(Error)
      );
    });
  });

  describe('Validación de entrada', () => {
    it('should handle empty transaction id', async () => {
      const result = await verifyPayment.execute('');

      expect(result).not.toBeNull();
      expect(result?.verified).toBe(true);
      expect(result?.status).toBe('failed'); // Sin tipo, se considera failed
    });

    it('should handle malformed transaction id', async () => {
      const result = await verifyPayment.execute('invalid-format');

      expect(result).not.toBeNull();
      expect(result?.verified).toBe(true);
      expect(result?.status).toBe('failed'); // Tipo desconocido
    });

    it('should handle transaction id without dashes', async () => {
      const result = await verifyPayment.execute('CARD1234567890');

      expect(result).not.toBeNull();
      expect(result?.verified).toBe(true);
      // Sin guiones, el tipo es todo el string, que no coincide con ningún caso conocido
      expect(result?.status).toBe('failed');
    });
  });

  describe('Tipos de transacción', () => {
    it('should identify card transactions', async () => {
      const result = await verifyPayment.execute('CARD-123');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('completed');
    });

    it('should identify PayPal transactions', async () => {
      const result = await verifyPayment.execute('PP-123');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('completed');
    });

    it('should identify bank transfer transactions', async () => {
      const result = await verifyPayment.execute('BT-123');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
    });

    it('should identify cash on delivery transactions', async () => {
      const result = await verifyPayment.execute('COD-123');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
    });
  });
});
