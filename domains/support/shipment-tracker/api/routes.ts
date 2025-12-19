/**
 * Rutas HTTP para el servicio de seguimiento de envíos
 * 
 * ✅ SEGURIDAD: Todos los endpoints requieren autenticación
 * ✅ SEGURIDAD: Validación de entrada con express-validator (Requirements: 6.1, 6.2, 6.3, 6.4)
 */

import { Router, Response } from 'express';
import { TrackingController } from './TrackingController';
import { authMiddleware } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import { validateOrderNumber, validateUpdateTracking } from '../shared/validators/trackingValidator';
import { AuthenticatedRequest } from '@technovastore/shared-types';

export function createTrackingRoutes(controller: TrackingController): Router {
  const router = Router();

  // ✅ SEGURIDAD: Todos los endpoints requieren autenticación y validación de entrada
  
  // Endpoint para obtener información de seguimiento
  // Valida que orderNumber tenga formato correcto antes de procesar
  router.get('/:orderNumber', 
    authMiddleware, 
    validateOrderNumber,
    validateRequest,
    (req: AuthenticatedRequest, res: Response) => controller.getTrackingInfoHandler(req, res)
  );

  // Endpoint para actualizar información de seguimiento
  // Valida orderNumber y campos opcionales del body
  router.post('/update/:orderNumber', 
    authMiddleware, 
    validateUpdateTracking,
    validateRequest,
    (req: AuthenticatedRequest, res: Response) => controller.updateTrackingHandler(req, res)
  );

  // Endpoint para obtener estado del envío
  // Valida que orderNumber tenga formato correcto antes de procesar
  router.get('/status/:orderNumber', 
    authMiddleware, 
    validateOrderNumber,
    validateRequest,
    (req: AuthenticatedRequest, res: Response) => controller.getShipmentStatusHandler(req, res)
  );

  // Endpoint para obtener fecha estimada de entrega
  // Valida que orderNumber tenga formato correcto antes de procesar
  router.get('/estimate/:orderNumber', 
    authMiddleware, 
    validateOrderNumber,
    validateRequest,
    (req: AuthenticatedRequest, res: Response) => controller.getEstimatedDeliveryHandler(req, res)
  );

  return router;
}
