# Servicio de Autenticación (AuthService)

## Descripción

El `AuthService` es el servicio principal para manejar todas las operaciones de autenticación en el frontend de TechNovaStore. Incluye soporte completo para:

- Autenticación tradicional (email/password)
- Recuperación de contraseña
- OAuth 2.0 (Google, GitHub)
- Gestión de múltiples métodos de autenticación
- Rate limiting en cliente
- Refresh token automático

## Características Principales

### 1. Autenticación Básica

```typescript
import { authService } from '@/services';

// Login
const user = await authService.login({
  email: 'usuario@example.com',
  password: 'password123',
  rememberMe: true,
});

// Registro
const newUser = await authService.register({
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  acceptTerms: true,
});

// Logout
await authService.logout();

// Obtener usuario actual
const currentUser = await authService.getCurrentUser();
```

### 2. Recuperación de Contraseña

```typescript
// Paso 1: Solicitar recuperación
await authService.forgotPassword({
  email: 'usuario@example.com',
});

// Paso 2: Validar token (en página de reset)
const isValid = await authService.validateResetToken(token);

// Paso 3: Restablecer contraseña
await authService.resetPassword({
  token: token,
  password: 'NewSecurePass123!',
  confirmPassword: 'NewSecurePass123!',
});
```

### 3. OAuth 2.0

```typescript
// Iniciar flujo de OAuth
authService.oauthLogin('google', '/dashboard');
// Redirige automáticamente a Google para autorización

// Procesar callback (en página de callback)
const user = await authService.oauthCallback({
  provider: 'google',
  code: code,
  state: state,
});
```

### 4. Gestión de Métodos de Autenticación

```typescript
// Obtener métodos vinculados
const { authMethods } = await authService.getAuthMethods();

// Vincular método OAuth
await authService.linkAuthMethod({
  provider: 'github',
  code: code,
});

// Desvincular método
await authService.unlinkAuthMethod({
  type: 'github',
});

// Establecer contraseña (para usuarios OAuth)
await authService.setPassword({
  password: 'NewPassword123!',
  confirmPassword: 'NewPassword123!',
});

// Cambiar contraseña
await authService.changePassword({
  currentPassword: 'OldPassword123!',
  newPassword: 'NewPassword123!',
  confirmPassword: 'NewPassword123!',
});
```

## Configuración

### Variables de Entorno Requeridas

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# URL de la aplicación (para OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3011

# OAuth Providers
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

### Configuración de OAuth Providers

#### Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto o seleccionar uno existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Configurar redirect URI: `http://localhost:3011/auth/callback/google`
6. Copiar Client ID a `.env.local`

#### GitHub OAuth

1. Ir a [GitHub Developer Settings](https://github.com/settings/developers)
2. Crear una nueva OAuth App
3. Configurar:
   - Homepage URL: `http://localhost:3011`
   - Authorization callback URL: `http://localhost:3011/auth/callback/github`
4. Copiar Client ID a `.env.local`

## Rate Limiting

El servicio implementa rate limiting en cliente para prevenir abuso:

### Configuración de Límites

```typescript
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 15 * 60 * 1000, // 15 minutos
  },
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora
  },
};
```

### Comportamiento

- **Login**: Máximo 5 intentos en 15 minutos. Si se excede, bloqueo de 15 minutos.
- **Forgot Password**: Máximo 3 intentos en 1 hora. Si se excede, bloqueo de 1 hora.
- Los límites se almacenan en `localStorage` y persisten entre sesiones.
- Los límites se resetean automáticamente después del tiempo de bloqueo.

## Manejo de Errores

El servicio maneja errores de forma consistente y proporciona mensajes claros:

```typescript
try {
  await authService.login(credentials);
} catch (error) {
  const authError = error as AuthError;
  
  switch (authError.code) {
    case 'invalid-credentials':
      // Mostrar: "Email o contraseña incorrectos"
      break;
    case 'rate-limit-exceeded':
      // Mostrar: "Demasiados intentos. Intenta en X segundos"
      break;
    case 'network-error':
      // Mostrar: "Error de conexión. Verifica tu internet"
      break;
    // ... más casos
  }
}
```

### Códigos de Error

- `invalid-email`: Email no registrado
- `invalid-credentials`: Credenciales incorrectas
- `email-already-exists`: Email ya registrado
- `weak-password`: Contraseña no cumple requisitos
- `passwords-dont-match`: Contraseñas no coinciden
- `invalid-token`: Token inválido o expirado
- `token-expired`: Token expirado
- `network-error`: Error de conexión
- `server-error`: Error del servidor
- `rate-limit-exceeded`: Límite de intentos excedido
- `oauth-cancelled`: Usuario canceló OAuth
- `oauth-failed`: Error en OAuth
- `method-already-linked`: Método ya vinculado
- `cannot-unlink-only-method`: No puede desvincular único método
- `unauthorized`: Sin permisos

## Interceptores de Axios

### Refresh Token Automático

El servicio incluye un interceptor que maneja automáticamente la renovación de tokens:

```typescript
// Si una petición retorna 401 (no autorizado)
// El interceptor automáticamente:
// 1. Intenta refrescar el token
// 2. Reintenta la petición original
// 3. Si el refresh falla, redirige a login
```

### Cookies httpOnly

El servicio está configurado para trabajar con cookies httpOnly:

```typescript
const authAxios = axios.create({
  withCredentials: true, // Permite enviar cookies httpOnly
});
```

**Importante**: Los tokens JWT se envían automáticamente como cookies httpOnly desde el backend. No se almacenan en `localStorage` por seguridad.

## Seguridad

### Medidas Implementadas

1. **Cookies httpOnly**: Tokens almacenados en cookies httpOnly (no accesibles desde JavaScript)
2. **CSRF Protection**: State parameter en OAuth para prevenir CSRF
3. **Rate Limiting**: Límites de intentos para prevenir fuerza bruta
4. **Validación de Contraseñas**: Requisitos estrictos de seguridad
5. **HTTPS**: Requerido en producción
6. **Refresh Token**: Renovación automática de tokens

### Validación de Contraseñas

Las contraseñas deben cumplir con:

- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número
- Al menos 1 carácter especial
- No ser una contraseña común

Ver `password-validation.ts` para más detalles.

## Integración con React Query

El servicio está diseñado para integrarse fácilmente con React Query:

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services';

// Hook de login
const useLogin = () => {
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => {
      // Actualizar estado global
      // Redirigir a dashboard
    },
    onError: (error: AuthError) => {
      // Mostrar mensaje de error
    },
  });
};

// Hook de usuario actual
const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
```

## Flujos Completos

### Flujo de Login

```
1. Usuario ingresa email y password
2. Frontend valida formato
3. Frontend verifica rate limiting
4. Frontend envía POST /api/auth/login
5. Backend valida credenciales
6. Backend genera JWT y lo envía como cookie httpOnly
7. Backend retorna datos del usuario
8. Frontend almacena usuario en estado global
9. Frontend redirige a dashboard
```

### Flujo de Recuperación de Contraseña

```
1. Usuario hace clic en "Olvidé mi contraseña"
2. Usuario ingresa email
3. Frontend envía POST /api/auth/forgot-password
4. Backend genera token único y lo guarda con expiración de 1 hora
5. Backend envía email con link: /reset-password?token=xxx
6. Usuario hace clic en el link
7. Frontend valida token: GET /api/auth/validate-reset-token?token=xxx
8. Si válido, muestra formulario de nueva contraseña
9. Usuario ingresa nueva contraseña
10. Frontend envía POST /api/auth/reset-password
11. Backend actualiza contraseña
12. Frontend redirige a login con mensaje de éxito
```

### Flujo de OAuth

```
1. Usuario hace clic en "Continuar con Google"
2. Frontend genera state y lo guarda en sessionStorage
3. Frontend redirige a URL de autorización de Google
4. Usuario autoriza en Google
5. Google redirige a /auth/callback/google?code=xxx&state=yyy
6. Frontend valida state
7. Frontend envía code al backend: POST /api/auth/oauth/callback
8. Backend intercambia code por access token con Google
9. Backend obtiene datos del usuario de Google
10. Backend crea o vincula cuenta
11. Backend genera JWT y lo envía como cookie httpOnly
12. Backend retorna datos del usuario
13. Frontend redirige a dashboard
```

## Testing

```typescript
import { authService } from '@/services';

describe('AuthService', () => {
  it('should login successfully', async () => {
    const user = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('should handle rate limiting', async () => {
    // Simular 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login({
          email: 'test@example.com',
          password: 'wrong',
        });
      } catch (error) {
        // Ignorar errores
      }
    }

    // El 6to intento debe ser bloqueado
    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrong',
      })
    ).rejects.toMatchObject({
      code: 'rate-limit-exceeded',
    });
  });
});
```

## Próximas Mejoras

- [ ] Implementar PKCE completo para OAuth
- [ ] Agregar soporte para más proveedores OAuth (Facebook, Twitter)
- [ ] Implementar autenticación de dos factores (2FA)
- [ ] Agregar biometría (WebAuthn)
- [ ] Mejorar detección de bots
- [ ] Implementar análisis de riesgo de sesión

## Referencias

- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC](https://tools.ietf.org/html/rfc7636)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
