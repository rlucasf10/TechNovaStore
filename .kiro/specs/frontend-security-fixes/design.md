# Design Document - Frontend Security Fixes

## Overview

Este documento describe el diseño para corregir vulnerabilidades de seguridad críticas en el frontend de TechNovaStore, específicamente relacionadas con el almacenamiento inseguro de tokens de autenticación y el logging de datos sensibles.

**Problema Principal**: Actualmente, el frontend almacena tokens JWT en localStorage, lo cual los expone a ataques XSS (Cross-Site Scripting). Un atacante que logre inyectar JavaScript malicioso puede robar estos tokens y suplantar la identidad de usuarios.

**Solución**: Migrar completamente a httpOnly cookies, que son manejadas exclusivamente por el navegador y no son accesibles desde JavaScript, eliminando el vector de ataque XSS para robo de tokens.

**Estado Actual del Backend**: El backend YA está configurado correctamente para usar httpOnly cookies con las siguientes características:
- Cookies con flag `httpOnly: true`
- Cookies con flag `secure: true` (solo HTTPS en producción)
- Cookies con `sameSite: 'strict'` (protección CSRF)
- Refresh token automático implementado

**Alcance**: Este proyecto se enfoca exclusivamente en el frontend. No se requieren cambios en el backend.

## Architecture

### Arquitectura Actual (Insegura)

```
┌─────────────┐
│   Browser   │
│             │
│ ┌─────────┐ │
│ │localStorage│ ◄── ❌ Token almacenado aquí (vulnerable a XSS)
│ └─────────┘ │
│             │
│ JavaScript  │
│   ↓         │
│ axios.get() │
│   + Header  │ ◄── ❌ Authorization: Bearer ${token}
│             │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │
│  (API GW)   │
└─────────────┘
```

### Arquitectura Nueva (Segura)

```
┌─────────────┐
│   Browser   │
│             │
│ ┌─────────┐ │
│ │ Cookies  │ ◄── ✅ httpOnly cookie (NO accesible desde JS)
│ │ (httpOnly)│
│ └─────────┘ │
│      ↑      │
│      │      │ ◄── Cookie enviada automáticamente
│ JavaScript  │     por el navegador
│   ↓         │
│ axios.get() │
│ withCreds   │ ◄── ✅ withCredentials: true
│             │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │
│  (API GW)   │
│             │
│ Valida      │
│ cookie      │
└─────────────┘
```

### Flujo de Autenticación con httpOnly Cookies

**Login:**
```
1. Usuario → POST /api/auth/login { email, password }
2. Backend valida credenciales
3. Backend genera JWT
4. Backend envía respuesta:
   - Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict
   - Body: { user: {...} }
5. Navegador almacena cookie automáticamente
6. Frontend actualiza store con datos de usuario (sin token)
```

**Peticiones Autenticadas:**
```
1. Frontend → GET /api/orders (con withCredentials: true)
2. Navegador adjunta automáticamente cookie httpOnly
3. Backend valida JWT de la cookie
4. Backend responde con datos
```

**Logout:**
```
1. Usuario → POST /api/auth/logout
2. Backend invalida cookie (Set-Cookie con maxAge=0)
3. Navegador elimina cookie automáticamente
4. Frontend limpia store de usuario
```

## Components and Interfaces

### 1. Configuración de Axios

**Archivos afectados:**
- `src/shared/lib/axios.ts` - Cliente HTTP principal
- `src/shared/lib/api.ts` - Cliente HTTP alternativo
- `src/features/customer/services/auth.service.ts` - Cliente específico de auth

**Cambios requeridos:**

```typescript
// ✅ CORRECTO - Configuración con httpOnly cookies
const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Permite envío automático de cookies
});

// ❌ ELIMINAR - No agregar Authorization header con token de localStorage
// interceptor.request.use(config => {
//   const token = localStorage.getItem('auth_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
// });
```

### 2. Servicio de Autenticación

**Archivo:** `src/features/customer/services/auth.service.ts`

**Cambios requeridos:**

```typescript
class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await authAxios.post(AUTH_ENDPOINTS.login, credentials);
    
    // ❌ ELIMINAR - No almacenar token en localStorage
    // localStorage.setItem('auth_token', response.data.token);
    
    // ✅ CORRECTO - Solo retornar datos de usuario
    // El token viene en httpOnly cookie automáticamente
    return transformUserFromBackend(response.data.data.user);
  }
  
  async logout(): Promise<void> {
    await authAxios.post(AUTH_ENDPOINTS.logout);
    
    // ❌ ELIMINAR - No hay token que eliminar
    // localStorage.removeItem('auth_token');
    
    // ✅ CORRECTO - Solo limpiar store
    // El backend invalida la cookie automáticamente
  }
  
  async getCurrentUser(): Promise<User | null> {
    // ❌ ELIMINAR - No verificar token en localStorage
    // const token = localStorage.getItem('auth_token');
    // if (!token) return null;
    
    // ✅ CORRECTO - Hacer petición directamente
    // Si hay cookie válida, el backend responde con usuario
    // Si no hay cookie o es inválida, el backend responde 401
    try {
      const response = await authAxios.get(AUTH_ENDPOINTS.me);
      return transformUserFromBackend(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return null; // No autenticado
      }
      throw error;
    }
  }
}
```

### 3. Store de Autenticación

**Archivo:** `src/features/customer/store/auth.store.ts`

**Cambios requeridos:**

```typescript
// ❌ ELIMINAR - No verificar token periódicamente
// setInterval(() => {
//   const token = localStorage.getItem('auth_token');
//   if (!token) state.logout();
// }, 5000);

// ❌ ELIMINAR - No verificar token en rehydrate
// onRehydrateStorage: () => (state) => {
//   const token = localStorage.getItem('auth_token');
//   if (!token) {
//     state.user = null;
//     state.isAuthenticated = false;
//   }
// }

// ✅ CORRECTO - Confiar en el backend
// Si el usuario está marcado como autenticado pero la cookie expiró,
// la próxima petición al backend retornará 401 y el interceptor
// de axios manejará el logout automáticamente
```

### 4. Servicios HTTP

**Archivos afectados:**
- `src/shared/services/wishlistService.ts`
- `src/shared/services/orderService.ts`
- `src/shared/services/shipmentService.ts`
- `src/shared/services/recommenderService.ts`
- `src/shared/services/campaignService.ts`
- `src/shared/services/ticket.service.ts`

**Patrón de cambio:**

```typescript
// ❌ ELIMINAR - Interceptor que agrega Authorization header
apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ CORRECTO - Solo configurar withCredentials
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ Suficiente para enviar cookies
  timeout: 30000,
});

// ✅ MANTENER - Interceptor de CSRF (no relacionado con auth)
apiClient.interceptors.request.use(async (config) => {
  if (!isSafeMethod) {
    const { token, sessionId } = await getCSRFToken();
    config.headers['X-CSRF-Token'] = token;
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});
```

### 5. Componentes y Páginas

**Archivos afectados:**
- `src/app/pedidos/[id]/page.tsx`
- `src/shared/components/ui/CookieConsent.tsx`

**Cambios requeridos:**

```typescript
// ❌ ELIMINAR - No verificar token en componentes
// const token = localStorage.getItem('auth_token');
// if (!token) {
//   redirect('/login');
// }

// ✅ CORRECTO - Usar store de autenticación
const { isAuthenticated, user } = useAuthStore();

useEffect(() => {
  if (!isAuthenticated) {
    redirect('/login');
  }
}, [isAuthenticated]);
```

### 6. Logging Seguro

**Archivos afectados:**
- `src/features/customer/services/auth.service.ts`
- `src/shared/services/orderService.ts`

**Cambios requeridos:**

```typescript
// ❌ ELIMINAR - console.log directo con datos sensibles
// console.log('Login response:', response.data);
// console.log('Order data:', orderData);

// ✅ CORRECTO - Usar secureLogger
import { secureLogger } from '@/shared/lib/security';

secureLogger.log('Login response:', response.data); // Sanitiza automáticamente
secureLogger.error('Order error:', error); // Sanitiza automáticamente
```

## Data Models

### User (sin cambios)

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  avatar?: string;
  authMethods?: Array<{
    type: 'password' | 'google' | 'github';
    providerId?: string;
    linkedAt: Date;
    lastUsed?: Date;
  }>;
}
```

**Nota**: El modelo de User NO incluye tokens. Los tokens nunca deben estar en el estado del frontend.

### AuthState (sin cambios significativos)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  reset: () => void;
}
```

**Cambio**: Eliminar lógica de verificación de tokens en localStorage.

## Performance Optimization

### Problema de Lentitud Identificado

**Síntoma**: Compilaciones extremadamente lentas en Next.js
- Primera compilación de `/`: 135.7 segundos (objetivo: < 30s)
- Compilación de `/login`: 16.9 segundos (objetivo: < 10s)

**Causa raíz**: Bundle size excesivo debido a:
1. Importaciones pesadas no optimizadas
2. Falta de code splitting en componentes grandes
3. Dependencias pesadas cargadas eagerly

**Solución**:

```typescript
// ❌ INCORRECTO - Importación eager de componente pesado
import { HeavyChart } from 'recharts';

// ✅ CORRECTO - Dynamic import con loading state
const HeavyChart = dynamic(() => import('recharts').then(mod => mod.HeavyChart), {
  loading: () => <Skeleton />,
  ssr: false, // Si no se necesita SSR
});
```

### Optimizaciones de Timeout

**Problema**: Timeouts de 30 segundos causan errores en compilaciones lentas

**Solución**: Incrementar timeouts durante desarrollo

```typescript
const axiosInstance = axios.create({
  timeout: process.env.NODE_ENV === 'development' ? 60000 : 30000,
  // 60s en desarrollo, 30s en producción
});
```

## Error Handling Improvements

### Manejo Silencioso de Errores Esperados

**Problema**: Errores 401 en `/api/auth/me` se muestran en consola para usuarios no autenticados

**Solución**: Flag `silent` para errores esperados

```typescript
async getCurrentUser(): Promise<User | null> {
  try {
    const response = await authAxios.get(AUTH_ENDPOINTS.me);
    return transformUserFromBackend(response.data.data);
  } catch (error) {
    // Pasar silent=true para no loguear errores 401 esperados
    const authError = handleAuthError(error, true);
    if (authError.code === 'unauthorized') {
      return null; // Usuario no autenticado - comportamiento esperado
    }
    return null;
  }
}

function handleAuthError(error: unknown, silent: boolean = false): AuthError {
  // Solo loguear si no es silencioso
  if (!silent) {
    secureLogger.log('🔍 Handling auth error:', error);
  }
  // ... resto del manejo de errores
}
```

### Manejo Graceful de Timeouts en DealsSection

**Problema**: Timeouts en carga de ofertas muestran stack traces en consola

**Solución**: Retry logic con backoff exponencial

```typescript
async function loadDealsWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await productService.getProducts({
        limit: 8,
        sortBy: 'popularity',
        inStock: true,
      });
      return response.data.slice(0, 8);
    } catch (error) {
      if (attempt === maxRetries) {
        // Último intento falló - loguear silenciosamente y retornar array vacío
        secureLogger.error('Failed to load deals after retries:', {
          attempts: maxRetries,
          error: error.message,
        });
        return [];
      }
      // Esperar antes de reintentar (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}
```

## Logging Security Improvements

### Eliminación de Logs de Credenciales

**Problema CRÍTICO**: El auth.service.ts loguea credenciales en texto plano

```typescript
// ❌ PELIGRO - Loguea email y password
secureLogger.log('🔐 Login attempt started');
secureLogger.log('   Email:', credentials.email);
// Si se loguea el objeto completo, expone la contraseña
```

**Solución**: Nunca loguear objetos de credenciales completos

```typescript
// ✅ CORRECTO - Solo loguear información no sensible
secureLogger.log('🔐 Login attempt started for user');
// NO loguear email ni password

// Si es absolutamente necesario loguear para debugging:
secureLogger.log('Login attempt:', {
  emailDomain: credentials.email.split('@')[1], // Solo el dominio
  // NO incluir password
});
```

### Mejoras al secureLogger

**Actualización**: Agregar detección específica de campos sensibles

```typescript
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'auth_token',
  'access_token',
  'refresh_token',
  'secret',
  'apiKey',
  'creditCard',
  'cvv',
  'ssn',
];

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    
    // Redactar campos sensibles completamente
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***REDACTED***';
      continue;
    }

    // Recursivamente sanitizar objetos anidados
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No localStorage token storage

*For any* operación de autenticación (login, register, OAuth callback), el sistema NO debe almacenar tokens en localStorage después de completar la operación.

**Validates: Requirements 1.1, 1.2**

**Implementación**: Verificar que después de login/register/OAuth, `localStorage.getItem('auth_token')` retorna `null`.

### Property 2: No localStorage token reads

*For any* petición HTTP autenticada, el sistema NO debe leer tokens desde localStorage para construir headers de autorización.

**Validates: Requirements 1.3, 2.2**

**Implementación**: Verificar que los interceptores de axios no contienen código que lea `localStorage.getItem('auth_token')`.

### Property 3: withCredentials configuration

*For any* cliente HTTP (axios instance), el sistema debe tener configurado `withCredentials: true` para permitir el envío automático de cookies.

**Validates: Requirements 2.1**

**Implementación**: Verificar que todas las instancias de axios tienen `withCredentials: true` en su configuración.

### Property 4: No Authorization headers with localStorage tokens

*For any* petición HTTP, el sistema NO debe agregar headers `Authorization: Bearer ${token}` donde el token proviene de localStorage.

**Validates: Requirements 2.2, 3.1-3.7**

**Implementación**: Buscar en el código patrones de `Authorization: Bearer ${localStorage.getItem(...)}` y verificar que no existen.

### Property 5: Authentication state from backend

*For any* verificación de estado de autenticación, el sistema debe consultar al backend (que valida la cookie httpOnly) en lugar de verificar tokens locales.

**Validates: Requirements 2.4, 6.3**

**Implementación**: Verificar que `getCurrentUser()` hace una petición HTTP al backend sin verificar localStorage primero.

### Property 6: Secure logging for auth operations

*For any* operación de autenticación que registra información, el sistema debe usar `secureLogger` en lugar de `console.log` para sanitizar datos sensibles.

**Validates: Requirements 5.1, 5.2, 5.5**

**Implementación**: Verificar que `auth.service.ts` usa `secureLogger.log()` y `secureLogger.error()` en lugar de `console.log()` y `console.error()`.

### Property 7: Secure logging for order operations

*For any* operación de pedidos que registra información, el sistema debe usar `secureLogger` en lugar de `console.log` para sanitizar datos sensibles.

**Validates: Requirements 5.3, 5.4**

**Implementación**: Verificar que `orderService.ts` usa `secureLogger.log()` y `secureLogger.error()` en lugar de `console.log()` y `console.error()`.

### Property 8: Store persistence without tokens

*For any* persistencia del store de autenticación, el sistema debe almacenar solo datos no sensibles (id, email, nombre, rol) y NO tokens.

**Validates: Requirements 6.4**

**Implementación**: Verificar que la función `partialize` del store NO incluye campos de tokens en el objeto persistido.

### Property 9: Logout cleanup

*For any* operación de logout, el sistema debe limpiar el estado local sin intentar eliminar tokens de localStorage.

**Validates: Requirements 6.5**

**Implementación**: Verificar que la función `logout()` NO contiene `localStorage.removeItem('auth_token')`.

### Property 10: Component auth check from store

*For any* componente o página que verifica autenticación, el sistema debe usar el store de autenticación en lugar de verificar tokens en localStorage.

**Validates: Requirements 4.1, 4.2, 4.3**

**Implementación**: Verificar que componentes usan `useAuthStore()` en lugar de `localStorage.getItem('auth_token')`.

### Property 11: No credential logging

*For any* operación de autenticación, el sistema NO debe loguear objetos que contengan passwords, tokens o datos sensibles en texto plano.

**Validates: Requirements 5.1, 5.7**

**Implementación**: Buscar en el código patrones de `console.log(credentials)` o `secureLogger.log(credentials)` donde credentials contiene password.

### Property 12: Silent error handling for expected errors

*For any* error HTTP esperado (401 en /auth/me, 404 en endpoints opcionales), el sistema debe manejar el error silenciosamente sin loguear en consola.

**Validates: Requirements 10.1, 10.2, 10.3**

**Implementación**: Verificar que `handleAuthError` acepta un parámetro `silent` y no loguea cuando es `true`.

### Property 13: Graceful degradation for timeouts

*For any* timeout en carga de datos no críticos (ofertas, recomendaciones), el sistema debe manejar el error gracefully retornando datos vacíos o contenido alternativo.

**Validates: Requirements 11.1, 11.4**

**Implementación**: Verificar que componentes como DealsSection retornan `null` o array vacío en caso de timeout, sin mostrar errores al usuario.

### Property 14: Compilation performance

*For any* página de la aplicación, el sistema debe completar la compilación en tiempo razonable (< 30s para página principal, < 10s para páginas simples).

**Validates: Requirements 8.1, 8.2**

**Implementación**: Medir tiempos de compilación y verificar que están dentro de los límites establecidos.

## Error Handling

### Manejo de Errores 401 (No Autenticado)

**Escenario**: Cookie httpOnly expirada o inválida

```typescript
// Interceptor de respuesta en axios
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh token automático
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        // Reintentar petición original
        return axiosInstance(error.config);
      } catch (refreshError) {
        // Refresh falló, limpiar estado y redirigir
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Manejo de Errores de Red

**Escenario**: Backend no disponible

```typescript
if (!error.response) {
  // Error de red (backend no responde)
  return {
    code: 'network-error',
    message: 'Error de conexión. Verifica tu internet.',
  };
}
```

### Manejo de Cookies Bloqueadas

**Escenario**: Usuario tiene cookies deshabilitadas

```typescript
// Detectar si las cookies están habilitadas
if (typeof navigator !== 'undefined' && !navigator.cookieEnabled) {
  throw new Error(
    'Las cookies están deshabilitadas. ' +
    'Por favor habilita las cookies para usar esta aplicación.'
  );
}
```

## Testing Strategy

### Unit Tests

**Objetivo**: Verificar comportamiento específico de funciones individuales.

**Archivos de test**:
- `auth.service.test.ts` - Tests del servicio de autenticación
- `auth.store.test.ts` - Tests del store de autenticación
- `axios.test.ts` - Tests de configuración de axios

**Ejemplos de tests unitarios**:

```typescript
describe('AuthService', () => {
  it('should not store token in localStorage after login', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'password123' };
    
    // Act
    await authService.login(credentials);
    
    // Assert
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
  
  it('should call backend without checking localStorage first', async () => {
    // Arrange
    localStorage.removeItem('auth_token');
    
    // Act
    const user = await authService.getCurrentUser();
    
    // Assert
    expect(mockAxios.get).toHaveBeenCalledWith('/api/auth/me');
  });
});

describe('Axios Configuration', () => {
  it('should have withCredentials enabled', () => {
    expect(axiosInstance.defaults.withCredentials).toBe(true);
  });
  
  it('should not add Authorization header from localStorage', async () => {
    // Arrange
    localStorage.setItem('auth_token', 'fake-token');
    
    // Act
    await axiosInstance.get('/api/test');
    
    // Assert
    expect(mockAxios.lastRequest.headers.Authorization).toBeUndefined();
  });
});
```

### Property-Based Tests

**Objetivo**: Verificar propiedades universales que deben cumplirse para todos los inputs.

**Framework**: fast-check (para TypeScript/JavaScript)

**Configuración**: Cada test debe ejecutar mínimo 100 iteraciones.

**Archivos de test**:
- `auth.properties.test.ts` - Property tests de autenticación
- `http-clients.properties.test.ts` - Property tests de clientes HTTP

**Ejemplos de property tests**:

```typescript
import fc from 'fast-check';

describe('Property Tests - Authentication', () => {
  /**
   * Feature: frontend-security-fixes, Property 1: No localStorage token storage
   */
  it('should never store tokens in localStorage for any auth operation', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
        }),
        async (credentials) => {
          // Arrange
          localStorage.clear();
          
          // Act
          try {
            await authService.login(credentials);
          } catch {
            // Ignorar errores de autenticación (credenciales inválidas)
          }
          
          // Assert
          const token = localStorage.getItem('auth_token');
          expect(token).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: frontend-security-fixes, Property 3: withCredentials configuration
   */
  it('should have withCredentials enabled for all axios instances', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          axiosInstance,
          authAxios,
          orderServiceClient,
          wishlistServiceClient
        ),
        (client) => {
          expect(client.defaults.withCredentials).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property Tests - Secure Logging', () => {
  /**
   * Feature: frontend-security-fixes, Property 6: Secure logging for auth operations
   */
  it('should sanitize sensitive data in all log calls', () => {
    fc.assert(
      fc.property(
        fc.record({
          user: fc.record({
            email: fc.emailAddress(),
            password: fc.string(),
            token: fc.string(),
          }),
        }),
        (data) => {
          // Arrange
          const logSpy = jest.spyOn(console, 'log');
          
          // Act
          secureLogger.log('User data:', data);
          
          // Assert
          const loggedData = logSpy.mock.calls[0][1];
          expect(loggedData.user.password).toBe('***REDACTED***');
          expect(loggedData.user.token).toMatch(/^.{3}\.\.\..{3}$/);
          
          logSpy.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

**Objetivo**: Verificar que los componentes funcionan correctamente juntos.

**Escenarios clave**:

1. **Flujo completo de login**:
   - Usuario ingresa credenciales
   - Frontend envía petición con `withCredentials: true`
   - Backend responde con httpOnly cookie
   - Store se actualiza con datos de usuario
   - localStorage NO contiene tokens

2. **Flujo de petición autenticada**:
   - Usuario autenticado hace petición
   - Navegador envía cookie automáticamente
   - Backend valida cookie y responde
   - Frontend recibe datos

3. **Flujo de logout**:
   - Usuario cierra sesión
   - Frontend envía petición de logout
   - Backend invalida cookie
   - Store se limpia
   - localStorage NO se modifica (no hay tokens que eliminar)

4. **Flujo de token expirado**:
   - Cookie expira
   - Usuario hace petición
   - Backend responde 401
   - Interceptor intenta refresh
   - Si refresh falla, redirige a login

### Manual Testing Checklist

**Antes de considerar completa la implementación**:

- [ ] Login exitoso NO almacena tokens en localStorage
- [ ] Peticiones autenticadas funcionan sin Authorization header
- [ ] DevTools → Application → Cookies muestra `auth_token` con flag HttpOnly
- [ ] DevTools → Application → Local Storage NO muestra `auth_token`
- [ ] Logout limpia la cookie (verificar en DevTools)
- [ ] Refresh de página mantiene sesión (cookie persiste)
- [ ] Token expirado redirige a login automáticamente
- [ ] Console NO muestra datos sensibles sin sanitizar
- [ ] Tests de TypeScript pasan sin errores (`npm run type-check`)
- [ ] Tests unitarios pasan (`npm test`)
- [ ] Tests de propiedades pasan (`npm test -- auth.properties`)

## Security Considerations

### Ventajas de httpOnly Cookies

1. **Protección contra XSS**: JavaScript malicioso NO puede leer la cookie
2. **Envío automático**: El navegador maneja el envío, reduciendo errores
3. **Protección CSRF**: Con `sameSite: 'strict'`, las cookies no se envían en requests cross-site
4. **Secure flag**: En producción, las cookies solo se envían por HTTPS

### Limitaciones y Mitigaciones

**Limitación 1**: Las cookies tienen límite de tamaño (4KB)
- **Mitigación**: Los JWT son pequeños (~200-500 bytes), suficiente espacio

**Limitación 2**: Las cookies se envían en TODAS las peticiones al mismo dominio
- **Mitigación**: Usar subdominios separados para assets estáticos si es necesario

**Limitación 3**: Debugging más difícil (no se puede ver el token en DevTools → Application)
- **Mitigación**: Usar endpoint `/api/auth/debug-token` en desarrollo para inspeccionar el token

### Consideraciones de CORS

**Configuración requerida en backend** (ya implementada):

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // ✅ Permite envío de cookies
}));
```

**Configuración requerida en frontend**:

```typescript
axios.create({
  withCredentials: true, // ✅ Permite recibir y enviar cookies
});
```

### Protección CSRF

**Estado actual**: El sistema ya implementa protección CSRF con tokens.

**Compatibilidad con httpOnly cookies**: La protección CSRF es COMPLEMENTARIA a httpOnly cookies:
- httpOnly cookies protegen contra XSS
- CSRF tokens protegen contra CSRF
- Ambos son necesarios para seguridad completa

**No requiere cambios**: La implementación de CSRF tokens se mantiene sin modificaciones.

## Migration Strategy

### Fase 1: Preparación (Sin Breaking Changes)

1. Actualizar configuración de axios para incluir `withCredentials: true`
2. Mantener temporalmente el código de localStorage (para compatibilidad)
3. Agregar logging para detectar uso de tokens de localStorage

### Fase 2: Eliminación de localStorage (Breaking Change)

1. Eliminar todas las líneas que escriben a localStorage
2. Eliminar todas las líneas que leen de localStorage
3. Eliminar verificaciones de tokens en componentes
4. Actualizar tests

### Fase 3: Limpieza de Logging

1. Reemplazar `console.log` con `secureLogger.log` en archivos sensibles
2. Reemplazar `console.error` con `secureLogger.error` en archivos sensibles
3. Verificar que no se loguean datos sensibles

### Fase 4: Verificación

1. Ejecutar tests unitarios
2. Ejecutar tests de propiedades
3. Ejecutar tests de integración
4. Testing manual completo
5. Actualizar documentación

### Rollback Plan

Si se detectan problemas críticos:

1. Revertir commits de eliminación de localStorage
2. Mantener `withCredentials: true` (no causa problemas)
3. Investigar y corregir el problema específico
4. Reintentar migración

**Nota**: El backend ya soporta httpOnly cookies, por lo que el rollback solo afecta al frontend.

## Documentation Updates

### Archivos a actualizar

1. **SECURITY_AUDIT.md**:
   - Marcar como resueltos los problemas de tokens en localStorage
   - Actualizar checklist de corrección
   - Documentar la nueva arquitectura

2. **SECURITY_GUIDELINES.md**:
   - Agregar sección sobre httpOnly cookies
   - Agregar ejemplos de código correcto e incorrecto
   - Documentar el uso de secureLogger

3. **README.md** (si existe sección de autenticación):
   - Actualizar documentación de autenticación
   - Explicar que se usan httpOnly cookies
   - Documentar que NO se deben almacenar tokens en localStorage

### Comentarios en Código

Agregar comentarios explicativos en puntos clave:

```typescript
// ✅ SEGURIDAD: Usamos httpOnly cookies para almacenar tokens
// Las cookies httpOnly NO son accesibles desde JavaScript,
// lo que previene ataques XSS. El navegador las envía automáticamente.
const axiosInstance = axios.create({
  withCredentials: true,
});

// ✅ SEGURIDAD: NO almacenar tokens en localStorage
// localStorage es vulnerable a ataques XSS. Los tokens se manejan
// exclusivamente mediante httpOnly cookies en el backend.
async login(credentials) {
  const response = await axios.post('/auth/login', credentials);
  // El token viene en una httpOnly cookie, no en el body
  return response.data.user;
}
```

## Performance Considerations

### Impacto en Performance

**Positivo**:
- Eliminación de operaciones de localStorage (más rápido)
- Menos código JavaScript (bundle más pequeño)
- Menos lógica de manejo de tokens en frontend

**Neutral**:
- El envío de cookies tiene overhead mínimo (~200 bytes por request)
- El navegador maneja las cookies de forma nativa (optimizado)

**Sin impacto negativo significativo**: La migración a httpOnly cookies NO afecta negativamente la performance.

### Optimizaciones

1. **Cache de estado de autenticación**: Mantener el store de Zustand para evitar peticiones innecesarias al backend
2. **Refresh token automático**: El interceptor de axios maneja refresh de forma transparente
3. **Lazy loading**: Cargar el servicio de autenticación solo cuando se necesita

## Deployment Considerations

### Requisitos de Despliegue

1. **Backend debe estar actualizado**: Verificar que el backend ya tiene httpOnly cookies implementadas (✅ ya está)
2. **HTTPS en producción**: Las cookies con flag `secure` solo funcionan en HTTPS
3. **Configuración de CORS**: Verificar que `credentials: true` está configurado en el backend
4. **Same-origin o CORS correcto**: Frontend y backend deben estar en el mismo dominio o tener CORS configurado correctamente

### Variables de Entorno

**No se requieren nuevas variables de entorno**. Las existentes son suficientes:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api  # Desarrollo
NEXT_PUBLIC_API_URL=https://api.technovastore.com/api  # Producción
```

### Verificación Post-Despliegue

1. Verificar que las cookies se envían con flag `HttpOnly` (DevTools → Network → Cookies)
2. Verificar que las cookies se envían con flag `Secure` en producción
3. Verificar que las cookies tienen `SameSite=Strict` o `SameSite=Lax`
4. Verificar que localStorage NO contiene `auth_token`
5. Verificar que el login funciona correctamente
6. Verificar que las peticiones autenticadas funcionan
7. Verificar que el logout funciona correctamente

## Conclusion

Esta migración a httpOnly cookies es una mejora crítica de seguridad que elimina el vector de ataque XSS más común para robo de tokens. El backend ya está preparado, por lo que solo se requieren cambios en el frontend.

La implementación es relativamente simple: eliminar código que usa localStorage y confiar en las cookies httpOnly que el navegador maneja automáticamente. Los beneficios de seguridad superan ampliamente el esfuerzo de implementación.
