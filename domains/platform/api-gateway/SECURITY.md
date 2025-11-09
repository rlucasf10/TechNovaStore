# TechNovaStore API Gateway - Security Implementation

## Overview

This document outlines the comprehensive security measures implemented in the TechNovaStore API Gateway to protect against common web vulnerabilities and attacks.

## Security Features Implemented

### 1. HTTPS/SSL Configuration ✅

- **SSL/TLS Encryption**: Full HTTPS support with configurable certificates
- **Certificate Management**: Automated certificate loading and validation
- **Development Certificates**: Self-signed certificate generation for development
- **Production Ready**: Support for trusted CA certificates
- **HSTS Headers**: HTTP Strict Transport Security for production environments
- **Cipher Suite Configuration**: Strong cipher suites and protocol versions

**Configuration:**
```bash
HTTPS_ENABLED=true
HTTPS_PORT=3443
SSL_CERT_DIR=./certs
SSL_KEY_FILE=private.key
SSL_CERT_FILE=certificate.crt
```

### 2. Data Validation and Sanitization ✅

- **Input Validation**: Comprehensive validation using express-validator
- **XSS Prevention**: DOMPurify integration for HTML sanitization
- **SQL Injection Protection**: Pattern detection and input sanitization
- **Request Size Limits**: Configurable limits for request body and file uploads
- **Content Type Validation**: Strict content type checking for uploads

**Validation Rules:**
- Email validation with normalization
- Password strength requirements (8+ chars, mixed case, numbers, symbols)
- Name validation (letters only, 2-100 characters)
- Phone number validation (Spanish format)
- Product ID validation (MongoDB ObjectId format)
- Price and quantity validation with reasonable limits

### 3. XSS and CSRF Protection ✅

#### XSS Protection:
- **Content Security Policy (CSP)**: Configurable CSP headers
- **Input Sanitization**: Automatic sanitization of request data
- **Output Encoding**: Safe rendering of user content
- **Security Headers**: X-XSS-Protection, X-Content-Type-Options, X-Frame-Options

#### CSRF Protection:
- **Token-Based Protection**: Secure CSRF token generation and validation
- **Session Management**: Token tied to session IDs
- **Automatic Cleanup**: Expired token cleanup
- **Header Validation**: Custom header requirements for state-changing operations

**CSRF Usage:**
```javascript
// Get CSRF token
GET /api/csrf-token
// Include in requests
Headers: {
  'X-CSRF-Token': 'token-value',
  'X-Session-ID': 'session-id'
}
```

### 4. Advanced Rate Limiting ✅

- **Multiple Rate Limit Tiers**: Different limits for different endpoint types
- **IP-Based Limiting**: Per-IP request tracking
- **Speed Limiting**: Progressive delay for excessive requests
- **Endpoint-Specific Limits**: Customized limits based on endpoint sensitivity
- **Bypass Options**: Configurable bypass for successful/failed requests

**Rate Limit Configuration:**
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Search**: 30 requests per minute
- **Orders**: 10 orders per hour
- **Payments**: 3 attempts per 5 minutes (strict)

### 5. Security Headers ✅

Comprehensive security headers implementation:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

### 6. Security Monitoring and Alerting ✅

- **Event Logging**: Comprehensive security event tracking
- **Suspicious Activity Detection**: Pattern recognition for attacks
- **IP Tracking**: Failed attempt tracking and automatic blocking
- **Real-time Alerts**: Configurable alerting for critical events
- **Security Statistics**: Admin dashboard for security metrics

**Monitored Events:**
- Rate limit violations
- CSRF token violations
- XSS attempts
- SQL injection attempts
- Authentication failures
- Suspicious request patterns

### 7. Enhanced Authentication Security ✅

- **JWT Token Validation**: Secure token verification
- **Service-Level Validation**: Fallback validation mechanisms
- **Role-Based Access Control**: Granular permission system
- **Token Refresh**: Secure token renewal process
- **Session Management**: Secure session handling

## Security Middleware Stack

### Route-Specific Security:

1. **Public Endpoints** (`/api/products`, `/api/docs`):
   - IP security monitoring
   - Request timing analysis
   - Basic content security

2. **Authentication Endpoints** (`/api/auth/login`, `/api/auth/register`):
   - Strict rate limiting (5 attempts per 15 minutes)
   - Input validation and sanitization
   - Failed attempt tracking
   - Security event logging

3. **Order Creation** (`/api/orders/create`):
   - Enhanced rate limiting (10 orders per hour)
   - Authentication required
   - Input validation for products and quantities
   - Transaction logging

4. **Payment Endpoints** (`/api/payments`):
   - Strictest security measures
   - Critical event logging
   - Enhanced monitoring
   - Fraud detection patterns

5. **Admin Endpoints** (`/api/admin/*`):
   - Role-based access control
   - Strict rate limiting
   - Enhanced audit logging
   - IP whitelisting capability

## Configuration

### Environment Variables

Create a `.env.security` file based on `.env.security.example`:

```bash
# Copy example configuration
cp .env.security.example .env.security

# Edit configuration
nano .env.security
```

### SSL Certificate Setup

#### Development:
```bash
# Generate self-signed certificates
chmod +x scripts/generate-ssl-certs.sh
./scripts/generate-ssl-certs.sh

# Or on Windows
scripts/generate-ssl-certs.bat
```

#### Production:
```bash
# Using Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com

# Copy certificates to certs directory
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./certs/private.key
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./certs/certificate.crt
```

## Security Best Practices

### 1. Regular Security Updates
- Keep all dependencies updated
- Monitor security advisories
- Regular security audits

### 2. Environment-Specific Configuration
- Use strong secrets in production
- Enable all security features in production
- Regular certificate renewal

### 3. Monitoring and Alerting
- Monitor security logs regularly
- Set up automated alerts for critical events
- Regular security metric reviews

### 4. Incident Response
- Have an incident response plan
- Regular security drills
- Backup and recovery procedures

## Security Testing

### Manual Testing:
```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login; done

# Test CSRF protection
curl -X POST http://localhost:3000/api/orders/create -H "Content-Type: application/json" -d '{}'

# Test XSS protection
curl -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"<script>alert(1)</script>"}'
```

### Automated Security Testing:
- Use tools like OWASP ZAP for vulnerability scanning
- Regular penetration testing
- Automated security tests in CI/CD pipeline

## Compliance

This implementation addresses the following security standards:
- **OWASP Top 10**: Protection against common web vulnerabilities
- **GDPR**: Data protection and privacy requirements
- **PCI DSS**: Payment card industry security standards (for payment processing)
- **NIST Cybersecurity Framework**: Comprehensive security controls

## Security Incident Response

### Immediate Actions:
1. Identify and isolate the threat
2. Log all relevant information
3. Notify security team/administrator
4. Implement temporary countermeasures

### Investigation:
1. Analyze security logs
2. Determine scope of impact
3. Identify root cause
4. Document findings

### Recovery:
1. Implement permanent fixes
2. Update security measures
3. Monitor for recurring issues
4. Update incident response procedures

## Contact

For security-related issues or questions:
- Security Team: security@technovastore.com
- Emergency: +34-XXX-XXX-XXX
- Bug Bounty: security-bounty@technovastore.com

## Changelog

- **v1.0.0**: Initial security implementation
  - HTTPS/SSL configuration
  - Advanced rate limiting
  - CSRF and XSS protection
  - Security monitoring
  - Input validation and sanitization