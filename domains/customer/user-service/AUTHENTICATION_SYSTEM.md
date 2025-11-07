# Authentication and Authorization System

## Overview

This document describes the comprehensive authentication and authorization system implemented for TechNovaStore, featuring JWT tokens with refresh tokens, Role-Based Access Control (RBAC), and password recovery functionality.

## Features Implemented

### 1. JWT Authentication with Refresh Tokens

- **Access Tokens**: Short-lived JWT tokens (24h default) for API authentication
- **Refresh Tokens**: Long-lived tokens (7d default) stored in database for token renewal
- **Token Rotation**: Refresh tokens are rotated on each use for enhanced security
- **Device Tracking**: Optional device info and IP address tracking for refresh tokens
- **Automatic Cleanup**: Expired and revoked tokens are automatically cleaned up

### 2. Role-Based Access Control (RBAC)

#### Roles Hierarchy

1. **Customer** (Level 1)
   - Basic user permissions
   - Can manage own profile and orders
   - Can browse products

2. **Admin** (Level 2)
   - All customer permissions
   - Can manage users and orders
   - Can manage products
   - Can view system logs

3. **Super Admin** (Level 3)
   - All admin permissions
   - Can manage system configuration
   - Can manage roles and permissions
   - Can delete any user

#### Permissions System

- Granular permissions for specific actions
- Permission inheritance through role hierarchy
- Resource ownership validation
- Middleware for permission checking

### 3. Password Recovery System

- **Secure Token Generation**: Cryptographically secure reset tokens
- **Time-Limited Tokens**: Reset tokens expire after 1 hour
- **One-Time Use**: Tokens are invalidated after use
- **Security Features**:
  - All refresh tokens revoked on password reset
  - No email enumeration (same response for valid/invalid emails)
  - Automatic cleanup of expired reset tokens

### 4. Enhanced Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Token Validation**: Database-backed token validation
- **Rate Limiting**: Protection against brute force attacks
- **Audit Logging**: Comprehensive logging of authentication events
- **Session Management**: Ability to revoke all user sessions

## API Endpoints

### Authentication Endpoints

```
POST /auth/register          - User registration
POST /auth/login             - User login
POST /auth/refresh           - Refresh access token
POST /auth/logout            - User logout
POST /auth/validate          - Validate access token
POST /auth/revoke            - Revoke refresh token
```

### Password Recovery Endpoints

```
POST /auth/password-reset/request  - Request password reset
POST /auth/password-reset/confirm  - Confirm password reset
```

### User Management Endpoints

```
GET  /auth/me               - Get current user info
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address JSONB,
  role VARCHAR(50) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT false,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Password Resets Table

```sql
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Examples

### Middleware Usage

```typescript
import {
  authMiddleware,
  requireRole,
  requirePermissions,
} from '../middleware/auth';
import { Role, Permission } from '../middleware/rbac';

// Require authentication
app.get('/protected', authMiddleware, handler);

// Require specific role
app.get('/admin', authMiddleware, requireRole(Role.ADMIN), handler);

// Require specific permissions
app.post(
  '/products',
  authMiddleware,
  requirePermissions([Permission.CREATE_PRODUCT]),
  handler
);

// Resource ownership or admin access
app.get(
  '/users/:userId',
  authMiddleware,
  requireOwnershipOrAdmin('userId'),
  handler
);
```

### Service Usage

```typescript
import { AuthService } from '../services/authService';

// Register user
const result = await AuthService.register({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  first_name: 'John',
  last_name: 'Doe',
});

// Login user
const loginResult = await AuthService.login({
  email: 'user@example.com',
  password: 'SecurePassword123!',
});

// Refresh token
const newTokens = await AuthService.refreshToken(refreshToken);

// Request password reset
const resetToken = await AuthService.requestPasswordReset('user@example.com');

// Reset password
await AuthService.resetPassword(resetToken, 'NewPassword123!');
```

## Security Considerations

1. **Token Security**
   - Access tokens are short-lived to minimize exposure
   - Refresh tokens are stored securely in database
   - Tokens are rotated on each refresh

2. **Password Security**
   - Strong password requirements enforced
   - bcrypt hashing with high salt rounds
   - Password reset tokens are cryptographically secure

3. **Session Management**
   - Ability to revoke individual or all user sessions
   - Device and IP tracking for audit purposes
   - Automatic cleanup of expired tokens

4. **API Security**
   - Rate limiting on authentication endpoints
   - No information leakage in error messages
   - Comprehensive audit logging

## Monitoring and Maintenance

### Automatic Cleanup

- Expired tokens are cleaned up every 24 hours
- Used password reset tokens are cleaned up after 7 days
- Revoked refresh tokens are cleaned up after 30 days

### Statistics and Monitoring

- Token usage statistics available
- Authentication event logging
- Failed login attempt tracking

### Health Checks

- Database connection monitoring
- Token validation performance metrics
- Authentication service availability

## Testing

The authentication system includes comprehensive tests covering:

- RBAC permission checking
- Password hashing functionality
- Token generation and validation
- Resource ownership validation
- Role hierarchy verification

Run tests with:

```bash
npm test
```

## Configuration

Key environment variables:

```
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=technovastore
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
2. **OAuth2/OpenID Connect integration**
3. **Advanced session management**
4. **Biometric authentication support**
5. **Advanced audit logging and analytics**
