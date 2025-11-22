/**
 * Controlador HTTP para el servicio de seguimiento de envíos
 * Expone los casos de uso a través de endpoints REST
 */

import { Request, Response } from 'express';
import { GetTrackingInfo } from '../get-tracking-info/GetTrackingInfo';
import { UpdateTrackingInfo } from '../update-tracking-info/UpdateTrackingInfo';
import { GetShipmentStatus } from '../get-shipment-status/GetShipmentStatus';
import { GetEstimatedDelivery } from '../get-estimated-delivery/GetEstimatedDelivery';

export class TrackingController {
  constructor(
    private getTrackingInfo: GetTrackingInfo,
    private updateTrackingInfo: UpdateTrackingInfo,
    private getShipmentStatus: GetShipmentStatus,
    private getEstimatedDelivery: GetEstimatedDelivery
  ) {}

  async getTrackingInfoHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
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
      console.error('Error getting tracking info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  async updateTrackingHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
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
      console.error('Error updating tracking info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  async getShipmentStatusHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
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
      console.error('Error getting shipment status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }

  async getEstimatedDeliveryHandler(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
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
      console.error('Error getting delivery estimate:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
}
