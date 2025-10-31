# Manejo de Errores de Autenticación - Guía de Debugging

## Problemas Identificados

1. **Error genérico**: Aparecía "Ocurrió un error inesperado" en lugar de "Email o contraseña incorrectos"
2. **TypeError**: `errorMessage.toLowerCase is not a function` porque el backend enviaba arrays en lugar de strings
3. **VALIDATION_ERROR**: El backend enviaba código `VALIDATION_ERROR` que no estaba mapeado

## Solución Implementada

### 1. Mejorado `handleAuthError` en `auth.service.ts`

**Cambios principales:**
- ✅ Manejo específico para errores 400 (Bad Request)
- ✅ Detección inteligente de errores de credenciales
- ✅ Logging detallado para debugging
- ✅ Múltiples campos de error del backend (`code`, `error`, `message`, `details`)
- ✅ Análisis de texto del mensaje para detectar errores de credenciales
- ✅ **Normalización de mensajes**: Manejo de strings y arrays
- ✅ **Manejo de VALIDATION_ERROR**: Mapeo específico para errores de validación
- ✅ **Función auxiliar**: `normalizeErrorMessage()` para procesar diferentes formatos

### 2. Logging Mejorado

**En `auth.service.ts`:**
```typescript
console.log('🔍 Handling auth error:', error);
console.log('📊 Error response:', { status, data });
console.log('🔑 400 Error details:', { errorCode, errorMessage });
```

**En `login/page.tsx`:**
```typescript
console.log('🔍 Login page caught error:', error);
console.log('🔍 Processed auth error:', authError);
console.log('🔍 Setting error message:', errorMessage);
```

## Cómo Probar el Manejo de Errores

### 1. Abrir DevTools
```
F12 → Console tab
```

### 2. Intentar Login con Credenciales Incorrectas
```
Email: test@example.com
Password: wrongpassword
```

### 3. Verificar Logs en Consola
Deberías ver algo como:
```
🔐 Login attempt started
📤 Sending login request...
❌ Login error details: AxiosError: Request failed with status code 400
🔍 Handling auth error: [AxiosError object]
📊 Error response: { status: 400, data: {...} }
🔑 400 Error details: { errorCode: "invalid-credentials", errorMessage: "..." }
🚨 Processed auth error: { code: "invalid-credentials", message: "Email o contraseña incorrectos" }
🔍 Login page caught error: { code: "invalid-credentials", message: "Email o contraseña incorrectos" }
🔍 Setting error message: Email o contraseña incorrectos
```

### 4. Verificar Mensaje en UI
Debería aparecer: **"Email o contraseña incorrectos"**

## Casos de Error Manejados

### 1. Error 400 - Credenciales Incorrectas
```json
{
  "status": 400,
  "data": {
    "code": "invalid-credentials",
    "message": "Invalid email or password"
  }
}
```
**Resultado:** "Email o contraseña incorrectos"

### 1b. Error 400 - VALIDATION_ERROR (Formato del Backend)
```json
{
  "status": 400,
  "data": {
    "code": "VALIDATION_ERROR",
    "message": ["Invalid credentials"]
  }
}
```
**Resultado:** "Email o contraseña incorrectos" (mapeado automáticamente)

### 2. Error 400 - Sin Código Específico
```json
{
  "status": 400,
  "data": {
    "message": "Invalid credentials"
  }
}
```
**Resultado:** "Email o contraseña incorrectos" (detectado por análisis de texto)

### 3. Error 401 - No Autorizado
```json
{
  "status": 401,
  "data": {
    "code": "unauthorized"
  }
}
```
**Resultado:** "Email o contraseña incorrectos" (para login)

### 4. Error 429 - Rate Limiting
```json
{
  "status": 429
}
```
**Resultado:** Componente `RateLimitMessage` con countdown

### 5. Error 500 - Error del Servidor
```json
{
  "status": 500
}
```
**Resultado:** "Error del servidor. Intenta de nuevo más tarde."

### 6. Error de Red
```
No response (network error)
```
**Resultado:** "Error de conexión. Verifica tu internet."

## Estructura del Manejo de Errores

```typescript
// 1. Error capturado en authService.login()
catch (error) {
  const authError = handleAuthError(error); // Procesa el error
  throw authError; // Lanza error procesado
}

// 2. Error capturado en login/page.tsx
catch (error) {
  const authError = error as AuthError;
  setAuthError(authError.message); // Muestra en UI
}

// 3. Error mostrado en UI
{authError && (
  <div className="error-message">
    {authError}
  </div>
)}
```

## Debugging Tips

### Si el error sigue siendo genérico:

1. **Verificar logs en consola** - Buscar los emojis 🔍📊🔑🚨
2. **Verificar respuesta del backend** - ¿Qué código de estado y datos envía?
3. **Verificar estructura de datos** - ¿El backend usa `code`, `error`, `message`?

### Si no aparecen logs:

1. **Verificar que DevTools esté abierto**
2. **Refrescar la página** después de los cambios
3. **Verificar que el contenedor esté actualizado**

### Para limpiar logs de debugging:

Una vez que funcione correctamente, remover los `console.log` de producción.

## Códigos de Error Soportados

```typescript
type AuthErrorCode = 
  | 'invalid-email'           // Email no registrado
  | 'invalid-credentials'     // Email/contraseña incorrectos
  | 'email-already-exists'    // Email ya registrado
  | 'weak-password'           // Contraseña débil
  | 'passwords-dont-match'    // Contraseñas no coinciden
  | 'invalid-token'           // Token inválido
  | 'token-expired'           // Token expirado
  | 'network-error'           // Error de conexión
  | 'server-error'            // Error del servidor
  | 'rate-limit-exceeded'     // Demasiados intentos
  | 'oauth-cancelled'         // OAuth cancelado
  | 'oauth-failed'            // OAuth falló
  | 'unauthorized'            // No autorizado
```

## Próximos Pasos

1. **Probar con backend real** - Verificar que los códigos de error coincidan
2. **Remover logs de debugging** - Una vez confirmado que funciona
3. **Agregar tests** - Para verificar el manejo de errores
4. **Documentar API** - Asegurar que backend envíe códigos consistentes