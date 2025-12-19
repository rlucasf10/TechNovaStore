/**
 * Controlador HTTP para el servicio de seguimiento de envíos
 * Expone los casos de uso a través de endpoints REST
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { GetTrackingInfo } from '../get-tracking-info/GetTrackingInfo';
import { UpdateTrackingInfo } from '../update-tracking-info/UpdateTrackingInfo';
import { GetShipmentStatus } from '../get-shipment-status/GetShipmentStatus';
import { GetEstimatedDelivery } from '../get-estimated-delivery/GetEstimatedDelivery';
import { Order } from '../shared/models/Order';
import { logger } from '../shared/utils/logger';

export class TrackingController {
  constructor(
    private getTrackingInfo: GetTrackingInfo,
    private updateTrackingInfo: UpdateTrackingInfo,
    private getShipmentStatus: GetShipmentStatus,
    private getEstimatedDelivery: GetEstimatedDelivery
  ) {}

  /**
   * Verifica que el pedido pertenece al usuario autenticado
   * Los administradores pueden acceder a cualquier pedido
   */
  private async verifyOrderOwnership(
    orderNumber: string,
    userId: string,
    userRole: string,
    authToken?: string
  ): Promise<{ authorized: boolean; order?: Order }> {
    try {
      // Los administradores pueden acceder a cualquier pedido
      if (userRole === 'admin') {
        return { authorized: true };
      }

      // Consultar el pedido desde order-service
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';
      
      // Preparar headers con autenticación si está disponible
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${orderServiceUrl}/api/orders/number/${orderNumber}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { authorized: false };
        }
        throw new Error(`Order service returned ${response.status}`);
      }

      const orderData: any = await response.json();
      const order = orderData.data as Order;

      // Verificar que el pedido pertenece al usuario
      if (String(order.userId) !== String(userId)) {
        logger.warn('Intento de acceso no autorizado', {
          userId,
          orderNumber,
          orderOwnerId: order.userId,
          action: 'access_denied'
        });
        return { authorized: false, order };
      }

      return { authorized: true, order };
    } catch (error) {
      logger.error('Error verificando propiedad del pedido', {
        error: error instanceof Error ? error.message : String(error),
        orderNumber,
        userId
      });
      throw error;
    }
  }

  async getTrackingInfoHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

      // Verificar propiedad del pedido
      const { authorized } = await this.verifyOrderOwnership(
        orderNumber,
        req.user!.id,
        req.user!.role,
        token
      );

      if (!authorized) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to access this order'
        });
        return;
      }

      const trackingInfo = await this.getTrackingInfo.execute(orderNumber);
      
      if (!trackingInfo) {
        res.status(404).json({
          success: false,
          error: 'No tracking information found for this order'
        });
        return;
      }

      res.json({
        success: true,
        data: trackingInfo
      });
    } catch (error: any) {
      logger.error('Error obteniendo información de tracking', {
        error: error.message || String(error),
        orderNumber: req.params.orderNumber,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  async updateTrackingHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

      // Verificar propiedad del pedido
      const { authorized } = await this.verifyOrderOwnership(
        orderNumber,
        req.user!.id,
        req.user!.role,
        token
      );

      if (!authorized) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to access this order'
        });
        return;
      }

      const update = await this.updateTrackingInfo.execute(orderNumber);
      
      if (!update) {
        res.status(404).json({
          success: false,
          error: 'No tracking information found for this order'
        });
        return;
      }

      res.json({
        success: true,
        data: update,
        message: 'Tracking information updated successfully'
      });
    } catch (error: any) {
      logger.error('Error actualizando información de tracking', {
        error: error.message || String(error),
        orderNumber: req.params.orderNumber,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  async getShipmentStatusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

      // Verificar propiedad del pedido
      const { authorized } = await this.verifyOrderOwnership(
        orderNumber,
        req.user!.id,
        req.user!.role,
        token
      );

      if (!authorized) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to access this order'
        });
        return;
      }

      const status = await this.getShipmentStatus.execute(orderNumber);
      
      if (!status) {
        res.status(404).json({
          success: false,
          error: 'No shipment status found for this order'
        });
        return;
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      logger.error('Error obteniendo estado del envío', {
        error: error.message || String(error),
        orderNumber: req.params.orderNumber,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  async getEstimatedDeliveryHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

      // Verificar propiedad del pedido
      const { authorized } = await this.verifyOrderOwnership(
        orderNumber,
        req.user!.id,
        req.user!.role,
        token
      );

      if (!authorized) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to access this order'
        });
        return;
      }

      const estimate = await this.getEstimatedDelivery.execute(orderNumber);
      
      if (!estimate) {
        res.status(404).json({
          success: false,
          error: 'No delivery estimate available for this order'
        });
        return;
      }

      res.json({
        success: true,
        data: estimate
      });
    } catch (error: any) {
      logger.error('Error obteniendo estimación de entrega', {
        error: error.message || String(error),
        orderNumber: req.params.orderNumber,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
}
