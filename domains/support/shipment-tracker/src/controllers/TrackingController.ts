import { Request, Response } from 'express';
import { ShipmentTracker } from '../services/ShipmentTracker';

export class TrackingController {
  constructor(private shipmentTracker: ShipmentTracker) {}

  async getTrackingInfo(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      const trackingInfo = await this.shipmentTracker.getTrackingInfo(orderNumber);
      
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

  async updateTracking(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      const update = await this.shipmentTracker.updateTrackingInfo(orderNumber);
      
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

  async getShipmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      const status = await this.shipmentTracker.getShipmentStatus(orderNumber);
      
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

  async getEstimatedDelivery(req: Request, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({
          success: false,
          error: 'Order number is required'
        });
        return;
      }

      const estimate = await this.shipmentTracker.getEstimatedDelivery(orderNumber);
      
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