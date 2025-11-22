/**
 * Controlador HTTP para el Payment Service
 */

import { Request, Response } from 'express';
import { ProcessPayment, PaymentRequest } from '../process-payment/ProcessPayment';
import { ProcessRefund } from '../process-refund/ProcessRefund';
import { GetPaymentStatus } from '../get-payment-status/GetPaymentStatus';
import { VerifyPayment } from '../verify-payment/VerifyPayment';
import { logger } from '../shared/utils/logger';

export class PaymentController {
  private processPayment: ProcessPayment;
  private processRefund: ProcessRefund;
  private getPaymentStatus: GetPaymentStatus;
  private verifyPayment: VerifyPayment;

  constructor() {
    this.processPayment = new ProcessPayment();
    this.processRefund = new ProcessRefund();
    this.getPaymentStatus = new GetPaymentStatus();
    this.verifyPayment = new VerifyPayment();
  }

  /**
   * POST /api/payments/process
   * Procesar un pago
   */
  async processPaymentHandler(req: Request, res: Response): Promise<void> {
    try {
      const paymentRequest: PaymentRequest = req.body;

      // Validación básica
      if (!paymentRequest.orderId || !paymentRequest.amount || !paymentRequest.paymentMethod) {
        res.status(400).json({
          error: 'Missing required fields: orderId, amount, paymentMethod',
        });
        return;
      }

      const result = await this.processPayment.execute(paymentRequest);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Error processing payment:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/payments/:orderId/refund
   * Procesar un reembolso
   */
  async processRefundHandler(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const { amount } = req.body;

      if (isNaN(orderId)) {
        res.status(400).json({ error: 'Invalid order ID' });
        return;
      }

      const result = await this.processRefund.execute(orderId, amount);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/payments/:orderId/status
   * Obtener estado de pago
   */
  async getPaymentStatusHandler(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);

      if (isNaN(orderId)) {
        res.status(400).json({ error: 'Invalid order ID' });
        return;
      }

      const result = await this.getPaymentStatus.execute(orderId);

      if (!result) {
        res.status(404).json({ error: 'Payment status not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error getting payment status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/payments/verify/:transactionId
   * Verificar un pago
   */
  async verifyPaymentHandler(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        res.status(400).json({ error: 'Transaction ID is required' });
        return;
      }

      const result = await this.verifyPayment.execute(transactionId);

      if (!result) {
        res.status(404).json({ error: 'Transaction not found or verification failed' });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error verifying payment:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
