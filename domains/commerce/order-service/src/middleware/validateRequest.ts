import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request data using express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    logger.warn('Request validation failed', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      body: req.body,
      params: req.params,
      query: req.query,
    });

    res.status(400).json({
      error: 'Validation failed',
      message: 'The request contains invalid data',
      details: errorMessages,
    });
    return;
  }

  next();
};