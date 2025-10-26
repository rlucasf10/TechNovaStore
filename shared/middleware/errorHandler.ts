import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Log error with context
  console.error('Error occurred:', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Database validation error';
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  const response: any = {
    error: message,
    status: statusCode,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};