# Design Document - Backend HttpOnly Cookies

## Overview

Este documento describe el diseño para implementar autenticación basada en httpOnly cookies en el backend de TechNovaStore. El objetivo es establecer cookies httpOnly después del login y leer tokens desde cookies en peticiones autenticadas, eliminando la necesidad de que el frontend maneje tokens manualmente.

**Problema Actual**: El backend devuelve tokens JWT en el body de la respuesta, pero NO los establece como cookies httpOnly. El frontend ya está configurado para usar httpOnly cookies (`withCredentials: true`), pero el backend no las envía.

**Solución**: Configurar el backend para:
1. Establecer cookies httpOnly después del login exitoso
2. Leer tokens desde cookies en peticiones autenticadas
3. Invalidar cookies en logout
4. Mantener compatibilidad con Authorization headers como fallback

## Architecture

### Flujo Actual (Sin Cookies)

```
┌─────────────┐
│   Browser   │
│             │
│  POST /login│
│  {email,pwd}│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │
│             │
│  Response:  │
│  {          │
│    token: "jwt...",  ← Token en body
│    user: {...}      │
│  }          │
└─────────────┘

❌ Problema: Frontend debe guardar token manualmente
❌ Vulnerable a XSS si se guarda en localStorage
```

### Flujo Nuevo (Con HttpOnly Cookies)

```
┌─────────────┐
│   Browser   │
│             │
│  POST /login│
│  {email,pwd}│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │
│             │
│  Response:  │
│  Set-Cookie: auth_token=jwt...; HttpOnly; Secure; SameSite=Lax
│  {          │
│    user: {...}      │
│  }          │
└─────────────┘
       │
       ↓
┌─────────────┐
│   Browser   │
│             │
│  Cookie     │
│  almacenada │
│  automática │
└─────────────┘

✅ Cookie httpOnly (no accesible desde JS)
✅ Enviada automáticamente en peticiones
✅ Protegida contra XSS
```

### Flujo de Petición Autenticada

```
┌─────────────┐
│   Browser   │
│             │
│  GET /api/orders
│  Cookie: auth_token=jwt...  ← Enviada automáticamente
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │
│             │
│  1. Lee cookie
│  2. Valida JWT
│  3. Autentica
│  4. Responde
└─────────────┘
```

## Components and Interfaces

### 1. Cookie Configuration

**Ubicación**: `shared/infrastructure/middleware/auth.middleware.ts` o similar

```typescript
interface CookieConfig {
  name: string;           // 'auth_token'
  httpOnly: boolean;      // true
  secure: boolean;        // true en producción, false en desarrollo
  sameSite: 'strict' | 'lax' | 'none';  // 'lax' para permitir navegación
  maxAge: number;         // 24 horas en milisegundos
  domain?: string;        // 'localhost' en dev, dominio real en prod
  path: string;           // '/'
}

const getCookieConfig = (): CookieConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || 'localhost';
  
  return {
    name: 'auth_token',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    domain: isProduction ? domain : undefined,
    path: '/',
  };
};
```

### 2. Set Cookie Helper

**Ubicación**: `shared/infrastructure/utils/cookie.utils.ts`

```typescript
import { Response } from 'express';

/**
 * Establecer cookie httpOnly con el token JWT
 */
export const setAuthCookie = (res: Response, token: string): void => {
  const config = getCookieConfig();
  
  res.cookie(config.name, token, {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: config.maxAge,
    domain: config.domain,
    path: config.path,
  });
  
  // Logging (sin incluir el token)
  console.log('[Auth] Cookie establecida', {
    name: config.name,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: config.maxAge,
    domain: config.domain,
  });
};

/**
 * Invalidar cookie httpOnly
 */
export const clearAuthCookie = (res: Response): void => {
  const config = getCookieConfig();
  
  res.cookie(config.name, '', {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: 0, // Expira inmediatamente
    domain: config.domain,
    path: config.path,
  });
  
  console.log('[Auth] Cookie invalidada');
};
```

### 3. Read Cookie Helper

**Ubicación**: `shared/infrastructure/utils/cookie.utils.ts`

```typescript
import { Request } from 'express';

/**
 * Leer token desde cookie httpOnly
 */
export const getAuthToken = (req: Request): string | null => {
  const config = getCookieConfig();
  const token = req.cookies?.[config.name];
  
  if (token) {
    console.log('[Auth] Token encontrado en cookie');
    return token;
  }
  
  // Fallback: leer desde Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    console.log('[Auth] Token encontrado en Authorization header (fallback)');
    return authHeader.substring(7);
  }
  
  console.log('[Auth] No se encontró token');
  return null;
};
```

### 4. Update Login Endpoint

**Ubicación**: `domains/customer/user-service/authenticate-user/handler.ts`

```typescript
import { setAuthCookie } from '@/shared/infrastructure/utils/cookie.utils';

export const authenticateUser = async (req: Request, res: Response) => {
  try {
    // 1. Validar credenciales
    const { email, password } = req.body;
    const user = await validateCredentials(email, password);
    
    // 2. Generar JWT
    const token = generateJWT(user);
    
    // 3. ✅ NUEVO: Establecer cookie httpOnly
    setAuthCookie(res, token);
    
    // 4. Responder con datos de usuario
    // NOTA: Incluimos el token en el body temporalmente para compatibilidad
    // Una vez que el frontend esté completamente migrado, podemos removerlo
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: transformUser(user),
        token, // ← Temporal, para compatibilidad
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
```

### 5. Update Logout Endpoint

**Ubicación**: `domains/customer/user-service/logout-user/handler.ts`

```typescript
import { clearAuthCookie } from '@/shared/infrastructure/utils/cookie.utils';

export const logoutUser = async (req: Request, res: Response) => {
  try {
    // 1. ✅ NUEVO: Invalidar cookie httpOnly
    clearAuthCookie(res);
    
    // 2. Responder
    res.status(200).json({
      success: true,
      message: 'Logout exitoso',
    });
  } catch (error) {
    handleError(res, error);
  }
};
```

### 6. Update Auth Middleware

**Ubicación**: `shared/infrastructure/middleware/auth.middleware.ts`

```typescript
import { getAuthToken } from '@/shared/infrastructure/utils/cookie.utils';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. ✅ NUEVO: Leer token desde cookie (con fallback a header)
    const token = getAuthToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }
    
    // 2. Validar JWT
    const decoded = verifyJWT(token);
    
    // 3. Adjuntar usuario a request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
};
```

### 7. Update Refresh Token Endpoint

**Ubicación**: `domains/customer/user-service/refresh-token/handler.ts`

```typescript
import { getAuthToken, setAuthCookie } from '@/shared/infrastructure/utils/cookie.utils';

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // 1. ✅ NUEVO: Leer token actual desde cookie
    const currentToken = getAuthToken(req);
    
    if (!currentToken) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }
    
    // 2. Validar token actual (permitir expirado para refresh)
    const decoded = verifyJWT(currentToken, { ignoreExpiration: true });
    
    // 3. Generar nuevo JWT
    const newToken = generateJWT(decoded.user);
    
    // 4. ✅ NUEVO: Establecer nueva cookie httpOnly
    setAuthCookie(res, newToken);
    
    // 5. Responder
    res.status(200).json({
      success: true,
      message: 'Token renovado',
    });
  } catch (error) {
    handleError(res, error);
  }
};
```

### 8. Update OAuth Callback

**Ubicación**: `domains/customer/user-service/oauth-authentication/handler.ts`

```typescript
import { setAuthCookie } from '@/shared/infrastructure/utils/cookie.utils';

export const oauthCallback = async (req: Request, res: Response) => {
  try {
    // 1. Validar código OAuth
    const { provider, code, codeVerifier } = req.body;
    const oauthUser = await validateOAuthCode(provider, code, codeVerifier);
    
    // 2. Crear o actualizar usuario
    const user = await findOrCreateUser(oauthUser);
    
    // 3. Generar JWT
    const token = generateJWT(user);
    
    // 4. ✅ NUEVO: Establecer cookie httpOnly
    setAuthCookie(res, token);
    
    // 5. Responder
    res.status(200).json({
      success: true,
      message: 'OAuth exitoso',
      data: {
        user: transformUser(user),
        token, // ← Temporal, para compatibilidad
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
```

### 9. CORS Configuration

**Ubicación**: `domains/platform/api-gateway/index.ts` o `app.ts`

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3020',
  credentials: true, // ✅ CRÍTICO: Permite envío de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-ID'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// ✅ IMPORTANTE: cookie-parser debe estar configurado
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

## Data Models

No se requieren cambios en los modelos de datos. Los tokens JWT mantienen la misma estructura.

## Error Handling

### Manejo de Cookies Faltantes

```typescript
if (!token) {
  console.log('[Auth] Cookie auth_token no encontrada');
  return res.status(401).json({
    success: false,
    message: 'No autenticado',
    code: 'NO_AUTH_COOKIE',
  });
}
```

### Manejo de Tokens Expirados

```typescript
if (error.name === 'TokenExpiredError') {
  console.log('[Auth] Token expirado en cookie');
  // Invalidar cookie
  clearAuthCookie(res);
  return res.status(401).json({
    success: false,
    message: 'Token expirado',
    code: 'TOKEN_EXPIRED',
  });
}
```

### Manejo de Tokens Inválidos

```typescript
if (error.name === 'JsonWebTokenError') {
  console.log('[Auth] Token inválido en cookie');
  // Invalidar cookie
  clearAuthCookie(res);
  return res.status(401).json({
    success: false,
    message: 'Token inválido',
    code: 'INVALID_TOKEN',
  });
}
```

## Testing Strategy

### Unit Tests

**Objetivo**: Verificar funciones individuales de manejo de cookies.

```typescript
describe('Cookie Utils', () => {
  describe('setAuthCookie', () => {
    it('should set cookie with correct configuration', () => {
      const res = mockResponse();
      const token = 'fake-jwt-token';
      
      setAuthCookie(res, token);
      
      expect(res.cookie).toHaveBeenCalledWith('auth_token', token, {
        httpOnly: true,
        secure: false, // En test environment
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    });
  });
  
  describe('getAuthToken', () => {
    it('should read token from cookie', () => {
      const req = mockRequest({
        cookies: { auth_token: 'fake-jwt-token' },
      });
      
      const token = getAuthToken(req);
      
      expect(token).toBe('fake-jwt-token');
    });
    
    it('should fallback to Authorization header', () => {
      const req = mockRequest({
        cookies: {},
        headers: { authorization: 'Bearer fake-jwt-token' },
      });
      
      const token = getAuthToken(req);
      
      expect(token).toBe('fake-jwt-token');
    });
    
    it('should return null if no token found', () => {
      const req = mockRequest({
        cookies: {},
        headers: {},
      });
      
      const token = getAuthToken(req);
      
      expect(token).toBeNull();
    });
  });
});
```

### Integration Tests

**Objetivo**: Verificar flujo completo de autenticación con cookies.

```typescript
describe('Authentication with HttpOnly Cookies', () => {
  it('should set httpOnly cookie on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('auth_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });
  
  it('should authenticate request with cookie', async () => {
    // 1. Login para obtener cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const cookie = loginResponse.headers['set-cookie'][0];
    
    // 2. Hacer petición autenticada con cookie
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);
    
    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('test@example.com');
  });
  
  it('should clear cookie on logout', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const cookie = loginResponse.headers['set-cookie'][0];
    
    // 2. Logout
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);
    
    expect(logoutResponse.status).toBe(200);
    
    const clearedCookie = logoutResponse.headers['set-cookie'][0];
    expect(clearedCookie).toContain('auth_token=;');
    expect(clearedCookie).toContain('Max-Age=0');
  });
  
  it('should refresh token with cookie', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const oldCookie = loginResponse.headers['set-cookie'][0];
    
    // 2. Refresh
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie);
    
    expect(refreshResponse.status).toBe(200);
    
    const newCookie = refreshResponse.headers['set-cookie'][0];
    expect(newCookie).toContain('auth_token=');
    expect(newCookie).not.toBe(oldCookie);
  });
});
```

## Security Considerations

### 1. HttpOnly Flag

✅ **Protección contra XSS**: JavaScript no puede acceder a la cookie
- Incluso si un atacante inyecta código malicioso, no puede robar el token

### 2. Secure Flag

✅ **Protección en tránsito**: Cookie solo se envía por HTTPS en producción
- Previene interceptación en redes inseguras

### 3. SameSite Attribute

✅ **Protección contra CSRF**: Cookie no se envía en requests cross-site
- Usamos `lax` en lugar de `strict` para permitir navegación normal
- Combinado con CSRF tokens para protección completa

### 4. Domain Configuration

✅ **Aislamiento de dominio**: Cookie solo es válida para el dominio especificado
- En desarrollo: `localhost`
- En producción: dominio real (ej: `technovastore.com`)

### 5. Path Configuration

✅ **Alcance limitado**: Cookie solo se envía para rutas bajo `/`
- Podría restringirse a `/api` si es necesario

### 6. MaxAge Configuration

✅ **Expiración automática**: Cookie expira después de 24 horas
- Sincronizado con la expiración del JWT
- Reduce ventana de ataque si el token es comprometido

### 7. Fallback a Authorization Header

✅ **Compatibilidad**: Mantener soporte para Authorization header
- Permite migración gradual
- Útil para clientes que no soportan cookies (APIs, mobile apps)

## Environment Configuration

### Variables de Entorno Requeridas

```bash
# .env
NODE_ENV=development|production
COOKIE_DOMAIN=localhost  # En desarrollo
# COOKIE_DOMAIN=technovastore.com  # En producción
FRONTEND_URL=http://localhost:3020  # Para CORS
```

### Configuración por Entorno

**Desarrollo**:
```typescript
{
  httpOnly: true,
  secure: false,      // Permite HTTP
  sameSite: 'lax',
  domain: undefined,  // localhost por defecto
}
```

**Producción**:
```typescript
{
  httpOnly: true,
  secure: true,       // Requiere HTTPS
  sameSite: 'lax',
  domain: 'technovastore.com',
}
```

## Code Cleanup

### Eliminación de Referencias a localStorage

**Problema**: El backend NO debería tener referencias a localStorage ya que es una API del navegador, no del servidor. Sin embargo, puede haber comentarios, documentación o código legacy que lo mencione.

**Acción**: Buscar y eliminar/actualizar todas las referencias:

```bash
# Buscar referencias a localStorage
grep -r "localStorage" domains/customer/user-service/
grep -r "localStorage" domains/platform/api-gateway/
```

**Patrones a eliminar**:
- ❌ `localStorage.setItem('auth_token', token)`
- ❌ `localStorage.getItem('auth_token')`
- ❌ `localStorage.removeItem('auth_token')`
- ❌ Comentarios que mencionen "guardar en localStorage"
- ❌ Documentación que explique cómo usar localStorage

**Patrones a agregar**:
- ✅ Comentarios explicando que se usan httpOnly cookies
- ✅ Documentación sobre la arquitectura de cookies
- ✅ Ejemplos de cómo el frontend debe configurar `withCredentials: true`

## Migration Strategy

### Fase 0: Limpieza de Código

1. Buscar y eliminar referencias a localStorage en el backend
2. Actualizar comentarios y documentación
3. Agregar comentarios explicando el uso de httpOnly cookies

### Fase 1: Implementación (Sin Breaking Changes)

1. Agregar helpers de cookies (`setAuthCookie`, `getAuthToken`, `clearAuthCookie`)
2. Actualizar endpoints de login para establecer cookies
3. Actualizar middleware de auth para leer desde cookies (con fallback a header)
4. Mantener token en body de respuesta para compatibilidad

**Resultado**: Backend envía cookies Y tokens en body. Frontend puede usar cualquiera.

### Fase 2: Testing

1. Ejecutar tests de integración
2. Verificar que cookies se establecen correctamente
3. Verificar que autenticación funciona con cookies
4. Verificar que fallback a Authorization header funciona

### Fase 3: Deployment

1. Desplegar backend con soporte para cookies
2. Verificar que frontend existente sigue funcionando (usando tokens del body)
3. Verificar que nuevo frontend funciona (usando cookies)

### Fase 4: Limpieza (Opcional, Futuro)

1. Remover token del body de respuesta de login
2. Remover soporte para Authorization header (si ya no se necesita)

**Nota**: Esta fase es opcional y puede hacerse más adelante.

## Rollback Plan

Si algo falla después del deployment:

1. **Rollback de código**: Volver a versión anterior del backend
2. **Verificación**: Confirmar que frontend sigue funcionando con tokens en body
3. **Análisis**: Revisar logs para identificar el problema
4. **Fix**: Corregir el problema y volver a desplegar

**Ventaja de la estrategia de migración**: Como mantenemos compatibilidad con tokens en body, el rollback es seguro y no afecta a usuarios.
