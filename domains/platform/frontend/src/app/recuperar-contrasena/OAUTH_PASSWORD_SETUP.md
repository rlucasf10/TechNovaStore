# Flujo de Establecimiento de Contraseña para Usuarios OAuth

## Descripción

Este documento describe la implementación del flujo modificado de "Olvidé mi contraseña" que detecta usuarios que solo tienen autenticación OAuth (Google/GitHub) sin contraseña establecida, y les permite establecer una contraseña local.

## Requisitos Implementados

- **Requisito 23.11**: Permitir a usuarios OAuth establecer contraseña mediante flujo de recuperación
- **Requisito 24.6**: Establecimiento de contraseña para usuarios OAuth

## Flujo de Usuario

### Caso 1: Usuario con Contraseña (Flujo Normal)

1. Usuario ingresa su email en "¿Olvidaste tu contraseña?"
2. Sistema envía email con token de recuperación
3. Usuario hace clic en el link del email
4. Usuario establece nueva contraseña
5. Usuario puede iniciar sesión con email/contraseña

### Caso 2: Usuario OAuth sin Contraseña (Flujo Nuevo)

1. Usuario ingresa su email en "¿Olvidaste tu contraseña?"
2. Backend detecta que el usuario solo tiene OAuth (sin contraseña)
3. Backend responde con error `oauth-user-no-password` y el proveedor OAuth
4. Frontend muestra pantalla especial:
   - Mensaje: "Tu cuenta usa {Provider} para iniciar sesión"
   - Explicación de beneficios de establecer contraseña
   - Botón "Establecer Contraseña"
5. Usuario hace clic en "Establecer Contraseña"
6. Sistema envía email con token (mismo flujo que recuperación)
7. Usuario hace clic en el link del email
8. Usuario establece su primera contraseña
9. Usuario ahora puede iniciar sesión con email/contraseña O con OAuth

## Implementación Frontend

### Cambios en `recuperar-contrasena/page.tsx`

#### Estados Agregados

```typescript
const [isOAuthUser, setIsOAuthUser] = useState(false);
const [oauthProvider, setOAuthProvider] = useState<string>('');
```

#### Detección de Usuario OAuth

```typescript
if (authError.code === 'oauth-user-no-password') {
  const provider = authError.provider || 'Google/GitHub';
  setIsOAuthUser(true);
  setOAuthProvider(provider);
  setSubmittedEmail(data.email);
  setAuthError(null);
}
```

#### Vista Especial para Usuario OAuth

- Icono informativo (azul)
- Mensaje claro sobre el estado de la cuenta
- Lista de beneficios de establecer contraseña
- Botón "Establecer Contraseña" que reutiliza el flujo de recuperación
- Opción de volver al login
- Nota de que puede seguir usando OAuth

### Cambios en `auth.types.ts`

#### Nuevo Código de Error

```typescript
export type AuthErrorCode =
  | ...
  | 'oauth-user-no-password'
  | ...
```

#### Campo Adicional en AuthError

```typescript
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
  provider?: string; // Proveedor OAuth (para oauth-user-no-password)
}
```

### Cambios en `auth.service.ts`

#### Mensaje de Error

```typescript
const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  ...
  'oauth-user-no-password': 'Tu cuenta usa OAuth y no tiene contraseña establecida',
  ...
};
```

#### Extracción del Proveedor

```typescript
if (errorCode === 'oauth-user-no-password' && (data as any)?.provider) {
  authError.provider = (data as any).provider;
}
```

## Implementación Backend (Requerida)

### Endpoint: POST /api/auth/forgot-password

El backend debe implementar la siguiente lógica:

```typescript
async forgotPassword(email: string) {
  // 1. Buscar usuario por email
  const user = await User.findOne({ email });
  
  if (!user) {
    // Por seguridad, no revelar si el email existe
    return { success: true, message: 'Email enviado si existe' };
  }
  
  // 2. Verificar si el usuario tiene contraseña
  const hasPassword = user.authMethods.some(m => m.type === 'password');
  
  if (!hasPassword) {
    // 3. Usuario solo tiene OAuth, devolver error especial
    const oauthMethod = user.authMethods.find(m => 
      m.type === 'google' || m.type === 'github'
    );
    
    throw {
      code: 'oauth-user-no-password',
      message: 'Tu cuenta usa OAuth y no tiene contraseña establecida',
      provider: oauthMethod?.type || 'OAuth',
      statusCode: 400
    };
  }
  
  // 4. Usuario tiene contraseña, continuar con flujo normal
  const token = generateResetToken();
  await saveResetToken(user.id, token, expiresIn1Hour);
  await sendPasswordResetEmail(user.email, token);
  
  return { success: true, message: 'Email enviado' };
}
```

### Respuesta de Error Esperada

```json
{
  "success": false,
  "code": "oauth-user-no-password",
  "message": "Tu cuenta usa OAuth y no tiene contraseña establecida",
  "provider": "google"
}
```

## Beneficios de la Implementación

### Para el Usuario

1. **Flexibilidad**: Puede elegir cómo iniciar sesión (OAuth o email/contraseña)
2. **Seguridad**: Múltiples métodos de autenticación aumentan la seguridad
3. **Claridad**: Mensaje claro sobre el estado de su cuenta
4. **Facilidad**: Proceso simple para establecer contraseña

### Para el Sistema

1. **Reutilización**: Usa el mismo flujo de recuperación de contraseña
2. **Seguridad**: No revela información sobre cuentas existentes
3. **Consistencia**: Mantiene la UX consistente con el resto del sistema
4. **Escalabilidad**: Fácil de extender a más proveedores OAuth

## Casos de Uso

### Caso 1: Usuario Registrado con Google

```
Usuario: juan@gmail.com (registrado con Google)
Acción: Va a "Olvidé mi contraseña"
Resultado: Ve mensaje "Tu cuenta usa Google" + botón "Establecer Contraseña"
Después: Puede iniciar sesión con Google O con email/contraseña
```

### Caso 2: Usuario Registrado con Email/Contraseña

```
Usuario: maria@example.com (registrado con email/contraseña)
Acción: Va a "Olvidé mi contraseña"
Resultado: Flujo normal de recuperación
Después: Recibe email con link para restablecer contraseña
```

### Caso 3: Usuario con Múltiples Métodos

```
Usuario: pedro@gmail.com (Google + contraseña)
Acción: Va a "Olvidé mi contraseña"
Resultado: Flujo normal de recuperación (tiene contraseña)
Después: Recibe email con link para restablecer contraseña
```

## Seguridad

### Consideraciones Implementadas

1. **No Revelación de Información**: El sistema no revela si un email existe o no
2. **Rate Limiting**: Se mantiene el rate limiting existente (3 intentos/hora)
3. **Mismo Flujo**: Usa el mismo flujo seguro de recuperación de contraseña
4. **Validación de Token**: El token de recuperación expira en 1 hora
5. **CSRF Protection**: Se mantiene la protección CSRF existente

### Consideraciones Adicionales

1. **Email Verificado**: El backend debe verificar que el email esté verificado
2. **Logging**: Registrar intentos de establecimiento de contraseña
3. **Notificación**: Enviar notificación al usuario cuando se establece contraseña
4. **Auditoría**: Registrar cambios en métodos de autenticación

## Testing

### Casos de Prueba Frontend

1. **Usuario OAuth sin contraseña**
   - Input: Email de usuario con solo Google
   - Esperado: Mostrar pantalla "Establecer Contraseña"

2. **Usuario con contraseña**
   - Input: Email de usuario con contraseña
   - Esperado: Flujo normal de recuperación

3. **Email no existente**
   - Input: Email que no existe
   - Esperado: Mensaje genérico (no revelar)

4. **Rate limiting**
   - Input: 3+ intentos en 1 hora
   - Esperado: Mensaje de rate limiting

5. **Establecer contraseña exitoso**
   - Input: Clic en "Establecer Contraseña"
   - Esperado: Mensaje de éxito + email enviado

### Casos de Prueba Backend

1. **Detectar usuario OAuth sin contraseña**
2. **Generar token de recuperación**
3. **Enviar email con instrucciones**
4. **Validar token de recuperación**
5. **Establecer contraseña por primera vez**
6. **Verificar que se agregue método 'password' a authMethods**

## Próximos Pasos

1. **Backend**: Implementar lógica de detección de usuarios OAuth sin contraseña
2. **Backend**: Implementar endpoint de establecimiento de contraseña
3. **Testing**: Crear tests E2E para el flujo completo
4. **Documentación**: Actualizar documentación de API
5. **Monitoreo**: Agregar métricas de uso del flujo

## Referencias

- Requisito 23.11: Sistema de Recuperación de Contraseña
- Requisito 24.6: Autenticación OAuth y Account Linking
- Diseño: `design.md` - Sistema de Autenticación OAuth
- Tareas: `tasks.md` - Tarea 9.11.1
