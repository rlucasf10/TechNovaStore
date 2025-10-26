import { Request, Response, NextFunction } from 'express';

export interface LoggingMiddlewareOptions {
  serviceName: string;
  skipPaths?: string[];
  logBody?: boolean;
  logHeaders?: boolean;
  sensitiveHeaders?: string[];
  sensitiveBodyFields?: string[];
}

export function createLoggingMiddleware(options: LoggingMiddlewareOptions) {
  const {
    skipPaths = ['/health', '/metrics'],
    logBody = false,
    logHeaders = false,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'],
    sensitiveBodyFields = ['password', 'token', 'secret', 'key']
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalUrl = req.originalUrl || req.url;

    // Skip logging for specified paths
    if (skipPaths.some(path => originalUrl.startsWith(path))) {
      return next();
    }

    // Log security events
    const suspiciousPatterns = [
      /\.\.\//,  // Path traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(originalUrl) || 
      pattern.test(JSON.stringify(req.body || {})) ||
      pattern.test(JSON.stringify(req.query || {}))
    );

    if (isSuspicious) {
      console.warn('Security Event: suspicious_request', {
        method: req.method,
        url: originalUrl,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
      });
    }

    // Sanitize sensitive data
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const sanitized = { ...obj };
      sensitiveBodyFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    };

    const sanitizeHeaders = (headers: any): any => {
      const sanitized = { ...headers };
      sensitiveHeaders.forEach(header => {
        if (sanitized[header]) {
          sanitized[header] = '[REDACTED]';
        }
      });
      return sanitized;
    };

    // Log request completion
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      // Prepare log data
      const logData: any = {
        method: req.method,
        url: originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
        sessionId: (req as any).sessionID,
      };

      // Add headers if requested
      if (logHeaders) {
        logData.requestHeaders = sanitizeHeaders(req.headers);
        logData.responseHeaders = sanitizeHeaders(res.getHeaders());
      }

      // Add body if requested
      if (logBody && req.body) {
        logData.requestBody = sanitizeObject(req.body);
      }

      // Add query parameters
      if (Object.keys(req.query).length > 0) {
        logData.query = req.query;
      }

      // Log the request
      console.log('HTTP Request', logData);

      // Log errors for 4xx and 5xx status codes
      if (res.statusCode >= 400) {
        const errorLevel = res.statusCode >= 500 ? 'error' : 'warn';
        console[errorLevel]('HTTP Error Response', {
          ...logData,
          errorType: res.statusCode >= 500 ? 'server_error' : 'client_error',
        });
      }
    });

    next();
  };
}

export function createErrorLoggingMiddleware(serviceName: string) {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    // Log the error with context
    console.error('Application Error', {
      service: serviceName,
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionID,
      body: req.body,
      query: req.query,
    });

    // Pass error to next middleware
    next(error);
  };
}

export function createPerformanceLoggingMiddleware(serviceName: string, thresholdMs: number = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > thresholdMs) {
        console.warn('Slow Request Detected', {
          service: serviceName,
          method: req.method,
          url: req.originalUrl || req.url,
          responseTime: `${responseTime}ms`,
          threshold: `${thresholdMs}ms`,
          statusCode: res.statusCode,
          critical: responseTime > thresholdMs * 2, // Mark as critical if 2x threshold
        });
      }
    });

    next();
  };
}