/**
 * Middleware de validación de requests para shipment-tracker
 * Utiliza express-validator para validar datos de entrada
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validationResult } = require('express-validator');
import { logger } from '../utils/logger';

/**
 * Middleware para validar datos de request usando express-validator
 * Retorna HTTP 400 Bad Request si la validación falla
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Formatear errores para respuesta clara sin exponer detalles internos
    const errorMessages = errors.array().map((error: any) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    // Loggear intento de validación fallida con contexto
    logger.warn('Validación de request fallida', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      errors: errorMessages,
      params: req.params,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'The request contains invalid data',
      details: errorMessages,
    });
    return;
  }

  next();
};
