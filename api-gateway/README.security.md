# TechNovaStore API Gateway - Security Implementation Guide

## Quick Start

### 1. Install Dependencies
```bash
cd api-gateway
npm install
```

### 2. Configure Security Settings
```bash
# Copy security configuration template
cp .env.security.example .env.security

# Edit configuration for your environment
nano .env.security
```

### 3. Generate SSL Certificates

#### For Development:
```bash
# Linux/macOS
chmod +x scripts/generate-ssl-certs.sh
./scripts/generate-ssl-certs.sh

# Windows
scripts/generate-ssl-certs.bat
```

#### For Production:
```bash
# Using Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./certs/private.key
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./certs/certificate.crt
```

### 4. Start the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Security Features Overview

### ✅ HTTPS/SSL Configuration
- **Automatic HTTPS**: Configurable SSL/TLS encryption
- **Certificate Management**: Automated loading and validation
- **Development Support**: Self-signed certificate generation
- **Production Ready**: Support for trusted CA certificates

### ✅ Advanced Rate Limiting
- **Multi-tier Limiting**: Different limits for different endpoints
- **Smart Throttling**: Progressive delays for excessive requests
- **IP-based Tracking**: Per-IP request monitoring
- **Bypass Configuration**: Flexible bypass options

### ✅ CSRF Protection
- **Token-based Security**: Secure CSRF token generation
- **Session Integration**: Tokens tied to session IDs
- **Automatic Cleanup**: Expired token management
- **Header Validation**: Custom header requirements

### ✅ XSS Protection
- **Input Sanitization**: Automatic data cleaning
- **Content Security Policy**: Configurable CSP headers
- **Output Encoding**: Safe content rendering
- **Security Headers**: Comprehensive header protection

### ✅ Data Validation & Sanitization
- **Input Validation**: Comprehensive validation rules
- **SQL Injection Prevention**: Pattern detection and blocking
- **File Upload Security**: Type and size validation
- **Request Size Limits**: Configurable payload limits

### ✅ Security Monitoring
- **Event Tracking**: Comprehensive security event logging
- **Threat Detection**: Automated suspicious activity detection
- **Real-time Alerts**: Configurable alerting system
- **Admin Dashboard**: Security statistics and monitoring

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTPS_ENABLED` | `true` | Enable HTTPS server |
| `HTTPS_PORT` | `3443` | HTTPS server port |
| `SSL_CERT_DIR` | `./certs` | SSL certificate directory |
| `RATE_LIMIT_MAX` | `100` | General API rate limit |
| `AUTH_RATE_LIMIT_MAX` | `5` | Authentication rate limit |
| `CSRF_ENABLED` | `true` | Enable CSRF protection |
| `XSS_PROTECTION_ENABLED` | `true` | Enable XSS protection |
| `LOG_SECURITY_EVENTS` | `true` | Enable security event logging |

### Rate Limiting Configuration

| Endpoint Type | Window | Max Requests | Description |
|---------------|--------|--------------|-------------|
| General API | 15 min | 100 | Standard API endpoints |
| Authentication | 15 min | 5 | Login/register attempts |
| Search | 1 min | 30 | Product search queries |
| Orders | 1 hour | 10 | Order creation |
| Payments | 5 min | 3 | Payment processing |

## API Endpoints

### Security Endpoints

#### Get CSRF Token
```http
GET /api/csrf-token
Headers:
  X-Session-ID: your-session-id

Response:
{
  "csrfToken": "abc123...",
  "sessionId": "session-id"
}
```

#### Security Statistics (Admin Only)
```http
GET /api/admin/security/stats
Headers:
  Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "totalEvents": 150,
    "eventsByType": {...},
    "suspiciousIPs": 3,
    "recentEvents": 25
  }
}
```

### Protected Endpoints

All state-changing operations require CSRF tokens:

```http
POST /api/orders/create
Headers:
  Authorization: Bearer <token>
  X-CSRF-Token: <csrf-token>
  X-Session-ID: <session-id>
  Content-Type: application/json

Body:
{
  "productId": "...",
  "quantity": 1
}
```

## Security Testing

### Manual Testing

#### Test Rate Limiting:
```bash
# Test authentication rate limit
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

#### Test CSRF Protection:
```bash
# This should fail without CSRF token
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","quantity":1}'
```

#### Test XSS Protection:
```bash
# This should be sanitized
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>Product"}'
```

### Automated Testing

```bash
# Run security tests
npm test -- --grep "security"

# Run vulnerability scan
npm audit

# Check for outdated packages
npm outdated
```

## Monitoring and Alerting

### Security Events

The system monitors and logs the following events:
- Rate limit violations
- CSRF token violations
- XSS attempts
- SQL injection attempts
- Authentication failures
- Suspicious request patterns

### Log Locations

```
logs/
├── error.log          # Error-level events
├── combined.log       # All events
└── security.log       # Security-specific events
```

### Alert Conditions

Alerts are triggered for:
- Critical security events
- Multiple high-severity events
- Suspicious IP activity
- Service unavailability

## Troubleshooting

### Common Issues

#### SSL Certificate Errors
```bash
# Check certificate validity
openssl x509 -in certs/certificate.crt -text -noout

# Verify certificate matches key
openssl x509 -noout -modulus -in certs/certificate.crt | openssl md5
openssl rsa -noout -modulus -in certs/private.key | openssl md5
```

#### Rate Limiting Issues
```bash
# Check current rate limit status
curl -I http://localhost:3000/api/products

# Look for rate limit headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1640995200
```

#### CSRF Token Issues
```bash
# Get CSRF token first
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r '.csrfToken')

# Use token in subsequent requests
curl -X POST http://localhost:3000/api/orders/create \
  -H "X-CSRF-Token: $TOKEN" \
  -H "X-Session-ID: session-123"
```

### Debug Mode

Enable debug logging:
```bash
export NODE_ENV=development
export DEBUG=security:*
npm start
```

## Security Checklist

### Pre-deployment Checklist

- [ ] SSL certificates configured and valid
- [ ] All security environment variables set
- [ ] Rate limits configured appropriately
- [ ] CSRF protection enabled
- [ ] XSS protection enabled
- [ ] Security monitoring enabled
- [ ] Log rotation configured
- [ ] Alert notifications configured
- [ ] Security tests passing
- [ ] Vulnerability scan completed

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Renew SSL certificates before expiry
- [ ] Review security logs weekly
- [ ] Update rate limits based on usage
- [ ] Test security measures quarterly
- [ ] Update incident response procedures

## Support

For security-related issues:
- **Documentation**: See `SECURITY.md` for detailed information
- **Issues**: Create GitHub issue with `security` label
- **Emergency**: Contact security team immediately

## Contributing

When contributing security-related changes:
1. Follow secure coding practices
2. Add appropriate tests
3. Update documentation
4. Request security review
5. Test in staging environment first