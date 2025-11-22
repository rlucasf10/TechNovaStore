/**
 * Rutas HTTP para el servicio de seguimiento de envíos
 */

import { Router } from 'express';
import { TrackingController } from './TrackingController';

export function createTrackingRoutes(controller: TrackingController): Router {
  const router = Router();

  // Endpoint para obtener información de seguimiento
  router.get('/:orderNumber', (req, res) => 
    controller.getTrackingInfoHandler(req, res)
  );

  // Endpoint para actualizar información de seguimiento
  router.post('/update/:orderNumber', (req, res) => 
    controller.updateTrackingHandler(req, res)
  );

  // Endpoint para obtener estado del envío
  router.get('/status/:orderNumber', (req, res) => 
    controller.getShipmentStatusHandler(req, res)
  );

  // Endpoint para obtener fecha estimada de entrega
  router.get('/estimate/:orderNumber', (req, res) => 
    controller.getEstimatedDeliveryHandler(req, res)
  );

  return router;
}
