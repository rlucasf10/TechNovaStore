import { Request, Response, NextFunction } from 'express';
import { 
  authRateLimit, 
  strictRateLimit, 
  validateInput, 
  validationRules,
  createAdvancedRateLimit
} from './security';
import { logger } from '../utils/logger';
import { securityConfig } from '../config/security';

/**
 * Security middleware for authentication endpoints
 */
export const authSecurity = [
  authRateLimit,
  validateInput([
    validationRules.email,
    validationRules.password
  ])
];

/**
 * Security middleware for user registration
 */
export const registrationSecurity = [
  authRateLimit,
  validateInput([
    validationRules.email,
    validationRules.password,
    validationRules.name
  ])
];

/**
 * Security middleware for password reset
 */
export const passwordResetSecurity = [
  strictRateLimit,
  validateInput([
    validationRules.email
  ])
];

/**
 * Security middleware for order placement
 */
export const orderSecurity = [
  createAdvancedRateLimit({
    windowMs: securityConfig.rateLimit.order.windowMs,
    max: securityConfig.rateLimit.order.max,
    message: 'Too many order attempts, please try again later.'
  }),
  validateInput([
    validationRules.productId,
    validationRules.quantity
  ])
];

/**
 * Security middleware for search endpoints
 */
export const searchSecurity = [
  createAdvancedRateLimit({
    windowMs: securityConfig.rateLimit.search.windowMs,
    max: securityConfig.rateLimit.search.max,
    message: 'Search rate limit exceeded.'
  })
];

/**
 * Security middleware for admin endpoints
 */
export const adminSecurity = [
  strictRateLimit,
  (req: Request, res: Response, next: NextFunction) => {
    // Additional admin-specific security checks
    const userRole = req.headers['x-user-role'] as string;
    
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      logger.warn('Unauthorized admin access attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        userRole
      });
      
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }
    
    next();
  }
];

/**
 * Security middleware for file upload endpoints
 */
export const uploadSecurity = [
  strictRateLimit,
  (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      return res.status(400).json({
        error: 'Invalid content type for file upload',
        code: 'INVALID_CONTENT_TYPE'
      });
    }
    
    // Check file size limit
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > securityConfig.validation.maxFileSize) {
      return res.status(413).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: securityConfig.validation.maxFileSize
      });
    }
    
    next();
  }
];

/**
 * Security middleware for payment endpoints
 */
export const paymentSecurity = [
  strictRateLimit,
  (req: Request, res: Response, next: NextFunction) => {
    // Additional payment security checks
    const userAgent = req.get('User-Agent');
    const origin = req.get('Origin');
    
    // Log payment attempts for monitoring
    logger.info('Payment endpoint access', {
      ip: req.ip,
      userAgent,
      origin,
      url: req.url,
      userId: req.headers['x-user-id']
    });
    
    // Check for suspicious patterns
    if (securityConfig.monitoring.suspiciousPatterns.some(pattern => 
      pattern.test(JSON.stringify(req.body) || ''))) {
      logger.warn('Suspicious payment request detected', {
        ip: req.ip,
        userAgent,
        body: req.body
      });
      
      return res.status(400).json({
        error: 'Invalid request format',
        code: 'INVALID_REQUEST'
      });
    }
    
    next();
  }
];

/**
 * IP-based security middleware
 */
export const ipSecurity = (req: Request, _res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  const forwardedFor = req.get('X-Forwarded-For');
  const realIP = req.get('X-Real-IP');
  
  // Log IP information for monitoring
  logger.debug('Request IP information', {
    clientIP,
    forwardedFor,
    realIP,
    url: req.url
  });
  
  // Check for private IP ranges in production
  if (process.env.NODE_ENV === 'production') {
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
    
    if (clientIP && privateIPRegex.test(clientIP)) {
      logger.warn('Private IP access in production', {
        clientIP,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
    }
  }
  
  next();
};

/**
 * Request timing security middleware
 */
export const timingSecurity = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        url: req.url,
        method: req.method,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Log very fast requests that might indicate automated attacks
    if (duration < 10 && req.method !== 'GET') {
      logger.warn('Suspiciously fast request', {
        url: req.url,
        method: req.method,
        duration,
        ip: req.ip
      });
    }
  });
  
  next();
};

/**
 * Content security middleware
 */
export const contentSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious content in request body
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body);
    
    // Check for SQL injection patterns
    const sqlInjectionPattern = /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)|('|(\\x27)|(\\x2D\\x2D))/gi;
    if (sqlInjectionPattern.test(bodyString)) {
      logger.warn('Potential SQL injection attempt', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
        body: req.body
      });
      
      return res.status(400).json({
        error: 'Invalid request content',
        code: 'INVALID_CONTENT'
      });
    }
    
    // Check for XSS patterns
    const xssPattern = /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/gi;
    if (xssPattern.test(bodyString)) {
      logger.warn('Potential XSS attempt', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        error: 'Invalid request content',
        code: 'INVALID_CONTENT'
      });
    }
  }
  
  next();
};

/**
 * Combined security middleware for general API endpoints
 */
export const apiSecurity = [
  ipSecurity,
  timingSecurity,
  contentSecurity
];

/**
 * Combined security middleware for public endpoints
 */
export const publicSecurity = [
  ipSecurity,
  timingSecurity
];