/**
 * Controlador HTTP para el Payment Service
 */

import { Request, Response } from 'express';
import { ProcessPayment, PaymentRequest } from '../process-payment/ProcessPayment';
import { ProcessRefund } from '../process-refund/ProcessRefund';
import { GetPaymentStatus } from '../get-payment-status/GetPaymentStatus';
import { VerifyPayment } from '../verify-payment/VerifyPayment';
import { logger } from '../shared/utils/logger';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { OrderServiceClient } from '../shared/clients/OrderServiceClient';

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
   * Verifica que el usuario autenticado sea el dueño del order o sea admin
   */
  private async verifyOrderOwnership(
    orderId: number, 
    userId: string, 
    userRole: string,
    req: AuthenticatedRequest
  ): Promise<boolean> {
    // Los admins pueden acceder a cualquier order
    if (userRole === 'admin') {
      return true;
    }

    // Crear cliente con headers de autenticación para forwarding
    const authHeaders: Record<string, string> = {};
    
    // Prioridad 1: Pasar el Authorization header si existe (JWT)
    if (req.headers.authorization) {
      authHeaders['Authorization'] = req.headers.authorization as string;
    } else {
      // Prioridad 2: Pasar headers del API Gateway como fallback
      authHeaders['x-user-id'] = userId;
      authHeaders['x-user-role'] = userRole;
      
      if (req.user?.email) {
        authHeaders['x-user-email'] = req.user.email;
      }
    }
    
    const orderClient = new OrderServiceClient(undefined, authHeaders);

    // Verificar que el order pertenece al usuario
    const orderInfo = await orderClient.getOrderInfo(orderId);
    
    if (!orderInfo) {
      return false;
    }

    return orderInfo.user_id === userId;
  }

  /**
   * POST /api/payments/process
   * Procesar un pago
   */
  async processPaymentHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentRequest: PaymentRequest = req.body;

      // Validación básica
      if (!paymentRequest.orderId || !paymentRequest.amount || !paymentRequest.paymentMethod) {
        res.status(400).json({
          error: 'Missing required fields: orderId, amount, paymentMethod',
        });
        return;
      }

      // Verificar propiedad del order
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const isOwner = await this.verifyOrderOwnership(paymentRequest.orderId, userId, userRole, req);
      
      if (!isOwner) {
        logger.warn('Unauthorized payment attempt', {
          userId,
          orderId: paymentRequest.orderId,
          endpoint: req.path,
        });
        
        res.status(403).json({
          error: 'Access denied',
        });
        return;
      }

      // Crear cliente con autenticación para actualizar el order
      const authHeaders: Record<string, string> = {};
      if (req.headers.authorization) {
        authHeaders['Authorization'] = req.headers.authorization as string;
      } else {
        authHeaders['x-user-id'] = userId;
        authHeaders['x-user-role'] = userRole;
        if (req.user?.email) {
          authHeaders['x-user-email'] = req.user.email;
        }
      }

      const result = await this.processPayment.execute(paymentRequest, authHeaders);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Error processing payment', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
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
  async processRefundHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const { amount } = req.body;

      if (isNaN(orderId)) {
        res.status(400).json({ error: 'Invalid order ID' });
        return;
      }

      // Crear headers de autenticación para pasar al caso de uso
      const authHeaders: Record<string, string> = {};
      if (req.headers.authorization) {
        authHeaders['Authorization'] = req.headers.authorization as string;
      } else if (req.user) {
        authHeaders['x-user-id'] = req.user.id;
        authHeaders['x-user-role'] = req.user.role;
        if (req.user.email) {
          authHeaders['x-user-email'] = req.user.email;
        }
      }

      const result = await this.processRefund.execute(orderId, amount, authHeaders);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Error processing refund', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
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
  async getPaymentStatusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);

      if (isNaN(orderId)) {
        res.status(400).json({ error: 'Invalid order ID' });
        return;
      }

      // Verificar propiedad del order
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      // Crear headers de autenticación para pasar al caso de uso
      const authHeaders: Record<string, string> = {};
      if (req.headers.authorization) {
        authHeaders['Authorization'] = req.headers.authorization as string;
      } else {
        authHeaders['x-user-id'] = userId;
        authHeaders['x-user-role'] = userRole;
        if (req.user?.email) {
          authHeaders['x-user-email'] = req.user.email;
        }
      }

      // Primero verificar si el pedido existe y si el usuario tiene acceso
      try {
        const isOwner = await this.verifyOrderOwnership(orderId, userId, userRole, req);
        
        if (!isOwner) {
          logger.warn('Unauthorized payment status access attempt', {
            userId,
            orderId,
            endpoint: req.path,
          });
          
          res.status(403).json({
            error: 'Access denied',
          });
          return;
        }
      } catch (error: any) {
        // Si el pedido no existe o el usuario no tiene acceso, retornar el código apropiado
        if (error.response?.status === 404 || error.message?.includes('not found')) {
          res.status(404).json({ error: 'Order not found' });
          return;
        }
        if (error.response?.status === 403) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
        throw error;
      }

      const result = await this.getPaymentStatus.execute(orderId, authHeaders);

      if (!result) {
        res.status(404).json({ error: 'Payment status not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error getting payment status', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
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
      logger.error('Error verifying payment', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
