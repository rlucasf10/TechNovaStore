import { config } from '@technovastore/shared-config';

export const securityConfig = {
  // HTTPS Configuration
  https: {
    enabled: process.env.HTTPS_ENABLED === 'true' || process.env.NODE_ENV === 'production',
    port: parseInt(process.env.HTTPS_PORT || '3443', 10),
    redirectHttp: process.env.HTTPS_REDIRECT === 'true' || process.env.NODE_ENV === 'production',
    certDir: process.env.SSL_CERT_DIR || './certs',
    keyFile: process.env.SSL_KEY_FILE || 'private.key',
    certFile: process.env.SSL_CERT_FILE || 'certificate.crt',
    caFile: process.env.SSL_CA_FILE || 'ca_bundle.crt',
    passphrase: process.env.SSL_PASSPHRASE,
  },

  // Rate Limiting Configuration
  rateLimit: {
    // General API rate limiting
    api: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    
    // Authentication endpoints
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
    },
    
    // Sensitive operations (password reset, etc.)
    strict: {
      windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS || '300000', 10), // 5 minutes
      max: parseInt(process.env.STRICT_RATE_LIMIT_MAX || '3', 10),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    
    // Search and catalog browsing
    search: {
      windowMs: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
      max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '30', 10),
      skipSuccessfulRequests: true,
      skipFailedRequests: true,
    },
    
    // Order placement
    order: {
      windowMs: parseInt(process.env.ORDER_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
      max: parseInt(process.env.ORDER_RATE_LIMIT_MAX || '10', 10),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    }
  },

  // Speed Limiting Configuration
  speedLimit: {
    windowMs: parseInt(process.env.SPEED_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    delayAfter: parseInt(process.env.SPEED_LIMIT_DELAY_AFTER || '50', 10),
    delayMs: parseInt(process.env.SPEED_LIMIT_DELAY_MS || '500', 10),
    maxDelayMs: parseInt(process.env.SPEED_LIMIT_MAX_DELAY_MS || '20000', 10),
  },

  // CSRF Configuration
  csrf: {
    enabled: process.env.CSRF_ENABLED !== 'false',
    tokenExpiry: parseInt(process.env.CSRF_TOKEN_EXPIRY || '86400000', 10), // 24 hours
    cookieName: process.env.CSRF_COOKIE_NAME || 'csrf-token',
    headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    sessionHeaderName: process.env.CSRF_SESSION_HEADER || 'x-session-id',
  },

  // XSS Protection Configuration
  xss: {
    enabled: process.env.XSS_PROTECTION_ENABLED !== 'false',
    sanitizeInput: process.env.XSS_SANITIZE_INPUT !== 'false',
    allowedTags: (process.env.XSS_ALLOWED_TAGS || '').split(',').filter(Boolean),
    allowedAttributes: (process.env.XSS_ALLOWED_ATTRIBUTES || '').split(',').filter(Boolean),
  },

  // Content Security Policy
  csp: {
    enabled: process.env.CSP_ENABLED !== 'false',
    directives: {
      defaultSrc: (process.env.CSP_DEFAULT_SRC || "'self'").split(','),
      styleSrc: (process.env.CSP_STYLE_SRC || "'self' 'unsafe-inline'").split(','),
      scriptSrc: (process.env.CSP_SCRIPT_SRC || "'self'").split(','),
      imgSrc: (process.env.CSP_IMG_SRC || "'self' data: https:").split(','),
      connectSrc: (process.env.CSP_CONNECT_SRC || "'self'").split(','),
      fontSrc: (process.env.CSP_FONT_SRC || "'self'").split(','),
      objectSrc: (process.env.CSP_OBJECT_SRC || "'none'").split(','),
      mediaSrc: (process.env.CSP_MEDIA_SRC || "'self'").split(','),
      frameSrc: (process.env.CSP_FRAME_SRC || "'none'").split(','),
    },
    reportUri: process.env.CSP_REPORT_URI,
    reportOnly: process.env.CSP_REPORT_ONLY === 'true',
  },

  // HSTS Configuration
  hsts: {
    enabled: process.env.HSTS_ENABLED !== 'false' && process.env.NODE_ENV === 'production',
    maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10), // 1 year
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    preload: process.env.HSTS_PRELOAD === 'true',
  },

  // Input Validation Configuration
  validation: {
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    maxFieldSize: parseInt(process.env.MAX_FIELD_SIZE || '1048576', 10), // 1MB
    maxFields: parseInt(process.env.MAX_FIELDS || '1000', 10),
    maxFiles: parseInt(process.env.MAX_FILES || '10', 10),
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx').split(','),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || config.jwt.secret,
    name: process.env.SESSION_NAME || 'technovastore.sid',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },

  // CORS Configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGINS || 'https://technovastore.com').split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3011'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Session-ID'
    ],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400, // 24 hours
  },

  // Security Headers Configuration
  headers: {
    xFrameOptions: process.env.X_FRAME_OPTIONS || 'DENY',
    xContentTypeOptions: process.env.X_CONTENT_TYPE_OPTIONS || 'nosniff',
    xXssProtection: process.env.X_XSS_PROTECTION || '1; mode=block',
    referrerPolicy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    permissionsPolicy: process.env.PERMISSIONS_POLICY || 'geolocation=(), microphone=(), camera=()',
  },

  // Monitoring and Alerting
  monitoring: {
    logSecurityEvents: process.env.LOG_SECURITY_EVENTS !== 'false',
    alertOnSuspiciousActivity: process.env.ALERT_SUSPICIOUS_ACTIVITY === 'true',
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutes
    suspiciousPatterns: [
      /\b(union|select|insert|delete|update|drop|create|alter)\b/i, // SQL injection patterns
      /<script[^>]*>.*?<\/script>/gi, // XSS patterns
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
    ],
  }
};

export default securityConfig;